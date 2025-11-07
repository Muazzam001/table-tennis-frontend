import { useState, useEffect } from 'react';
import Button from '../components/atoms/Button';
import MatchCard from '../components/molecules/MatchCard';
import MatchResultForm from '../components/molecules/MatchResultForm';
import { useAuth } from '../contexts/AuthContext';
import {
  getMatches,
  getMatchesByRound,
  generateMatchSchedule,
  createMultipleMatches,
  updateMatchResult,
  generateQuarterFinals,
  generateSemiFinals,
  generateFinal
} from '../services/matchService';
import { getTeams } from '../services/teamService';

const MatchesPage = () => {
  const { isAdmin } = useAuth();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRound, setSelectedRound] = useState('Qualifying');
  const [showResultForm, setShowResultForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatingQF, setGeneratingQF] = useState(false);
  const [generatingSF, setGeneratingSF] = useState(false);
  const [generatingFinal, setGeneratingFinal] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [matchesData, teamsData] = await Promise.all([
        getMatches(),
        getTeams()
      ]);
      setMatches(matchesData);
      setTeams(teamsData);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };


  // Generate match schedule
  const handleGenerateSchedule = async () => {
    if (teams.length < 8) {
      setError('Need at least 8 teams to generate schedule');
      return;
    }

    const startDate = prompt('Enter start date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!startDate) return;

    const endDateInput = prompt('Enter end date (YYYY-MM-DD) - Leave empty for no end date:', '');
    const endDate = endDateInput && endDateInput.trim() !== '' ? endDateInput.trim() : null;

    if (endDate && new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    const venue = prompt('Enter venue name:', 'Main Court') || 'Main Court';

    try {
      setGenerating(true);
      setError(null);

      const schedule = await generateMatchSchedule(startDate, endDate, venue);

      // Save matches to database
      await createMultipleMatches(schedule.matches);

      // Reload matches
      await loadData();

      let message = `Schedule generated! ${schedule.matches.length} qualifying matches created.`;
      if (schedule.data?.dateRange?.totalDays) {
        message += `\n\nDate range: ${startDate} to ${endDate} (${schedule.data.dateRange.totalDays} day(s))`;
      } else if (endDate) {
        message += `\n\nDate range: ${startDate} to ${endDate}`;
      } else {
        message += `\n\nStarting from: ${startDate}`;
      }
      if (schedule.data?.additionalMatch) {
        message += `\n\n${schedule.data.additionalMatch.message}`;
      }
      if (schedule.data?.poolDifference > 1) {
        message += `\n\nNote: Pools have been redistributed to ensure equal team counts (${schedule.data.poolA.length} teams in Pool A, ${schedule.data.poolB.length} teams in Pool B).`;
      }
      alert(message);
    } catch (err) {
      setError(err.message || 'Failed to generate schedule');
      console.error('Error generating schedule:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Filter matches by round
  const filteredMatches = selectedRound === 'all'
    ? matches
    : matches.filter(m => m.round_type === selectedRound);

  // Group matches by pool for qualifying round
  const qualifyingMatches = {
    poolA: filteredMatches.filter(m => m.round_type === 'Qualifying' && m.pool === 'A'),
    poolB: filteredMatches.filter(m => m.round_type === 'Qualifying' && m.pool === 'B')
  };

  // Handle update result
  const handleUpdateResult = (match) => {
    setSelectedMatch(match);
    setShowResultForm(true);
  };

  // Handle winner change (for future use - standings update after save)
  const handleWinnerChange = (winnerId) => {
    // This is called when winner is selected in the form
    // Standings will update automatically after save via handleSaveResult
    // No need to reload here since data isn't saved yet
  };

  // Generate Quarter Finals
  const handleGenerateQuarterFinals = async () => {
    const qualifyingMatches = matches.filter(m => m.round_type === 'Qualifying');
    const completedQualifying = qualifyingMatches.filter(m => m.status === 'Completed');

    if (qualifyingMatches.length === 0) {
      setError('No qualifying matches found. Please generate schedule first.');
      return;
    }

    if (completedQualifying.length < qualifyingMatches.length) {
      setError(`Please complete all qualifying matches first. ${completedQualifying.length}/${qualifyingMatches.length} completed.`);
      return;
    }

    const existingQF = matches.filter(m => m.round_type === 'Quarter Final');
    if (existingQF.length > 0) {
      setError('Quarter Finals already generated. Delete existing Quarter Final matches to regenerate.');
      return;
    }

    const startDate = prompt('Enter start date for Quarter Finals (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!startDate) return;

    const venue = prompt('Enter venue name:', 'Main Court') || 'Main Court';

    try {
      setGeneratingQF(true);
      setError(null);

      const result = await generateQuarterFinals(startDate, venue);
      console.log('Quarter Finals generation result:', result);

      // Reload matches
      await loadData();

      // Handle response structure - API interceptor returns response.data
      // Backend sends: { success: true, data: { matches: [...] } }
      // Interceptor returns: response.data = { success: true, data: { matches: [...] } }
      const matchesCreated = result?.data?.matches?.length || result?.matches?.length || 0;
      alert(`Quarter Finals generated! ${matchesCreated} matches created.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate Quarter Finals');
      console.error('Error generating Quarter Finals:', err);
    } finally {
      setGeneratingQF(false);
    }
  };

  // Generate Semi Finals
  const handleGenerateSemiFinals = async () => {
    const quarterFinals = matches.filter(m => m.round_type === 'Quarter Final');
    const completedQF = quarterFinals.filter(m => m.status === 'Completed');

    if (quarterFinals.length === 0) {
      setError('No Quarter Final matches found. Please generate Quarter Finals first.');
      return;
    }

    if (completedQF.length < quarterFinals.length) {
      setError(`Please complete all Quarter Final matches first. ${completedQF.length}/${quarterFinals.length} completed.`);
      return;
    }

    const existingSF = matches.filter(m => m.round_type === 'Semi Final');
    if (existingSF.length > 0) {
      setError('Semi Finals already generated. Delete existing Semi Final matches to regenerate.');
      return;
    }

    const startDate = prompt('Enter start date for Semi Finals (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!startDate) return;

    const venue = prompt('Enter venue name:', 'Main Court') || 'Main Court';

    try {
      setGeneratingSF(true);
      setError(null);

      const result = await generateSemiFinals(startDate, venue);

      // Reload matches
      await loadData();

      // Handle response structure - API interceptor returns response.data
      const matchesCreated = result?.data?.matches?.length || result?.matches?.length || 0;
      alert(`Semi Finals generated! ${matchesCreated} matches created.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate Semi Finals');
      console.error('Error generating Semi Finals:', err);
    } finally {
      setGeneratingSF(false);
    }
  };

  // Generate Final
  const handleGenerateFinal = async () => {
    const semiFinals = matches.filter(m => m.round_type === 'Semi Final');
    const completedSF = semiFinals.filter(m => m.status === 'Completed');

    if (semiFinals.length === 0) {
      setError('No Semi Final matches found. Please generate Semi Finals first.');
      return;
    }

    if (completedSF.length < semiFinals.length) {
      setError(`Please complete all Semi Final matches first. ${completedSF.length}/${semiFinals.length} completed.`);
      return;
    }

    const existingFinal = matches.filter(m => m.round_type === 'Final');
    if (existingFinal.length > 0) {
      setError('Final already generated. Delete existing Final match to regenerate.');
      return;
    }

    const startDate = prompt('Enter start date for Final (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!startDate) return;

    const venue = prompt('Enter venue name:', 'Main Court') || 'Main Court';

    try {
      setGeneratingFinal(true);
      setError(null);

      const result = await generateFinal(startDate, venue);

      // Reload matches
      await loadData();

      alert(`Final generated! The championship match is ready.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate Final');
      console.error('Error generating Final:', err);
    } finally {
      setGeneratingFinal(false);
    }
  };

  const handleSaveResult = async (resultData) => {
    try {
      // Update match result in database
      await updateMatchResult(selectedMatch.id, resultData);

      // Close the form
      setShowResultForm(false);
      setSelectedMatch(null);

      // Wait a brief moment to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reload matches to show updated results
      const [matchesData, teamsData] = await Promise.all([
        getMatches(),
        getTeams()
      ]);

      // Update matches and teams state
      setMatches(matchesData);
      setTeams(teamsData);

      // Log for debugging
      console.log('Match result saved');
    } catch (err) {
      setError(err.message || 'Failed to update match result');
      console.error('Error updating result:', err);
    }
  };

  const rounds = [
    { value: 'Qualifying', label: 'Qualifying Round' },
    { value: 'Quarter Final', label: 'Quarter Finals' },
    { value: 'Semi Final', label: 'Semi Finals' },
    { value: 'Final', label: 'Final' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Matches</h2>
          <p className="text-gray-600 mt-1">
            Tournament match schedule and results
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleGenerateSchedule}
            variant="primary"
            disabled={generating || teams.length < 8}
          >
            {generating ? 'Generating...' : '📅 Generate Schedule'}
          </Button>
        )}
      </div>

      {/* Requirements */}
      {teams.length < 8 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Note:</strong> You need at least 8 teams to generate a schedule. Currently you have {teams.length} teams.
          </p>
        </div>
      )}

      {/* Round Filter */}
      {matches.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {rounds.map(round => (
            <Button
              key={round.value}
              onClick={() => setSelectedRound(round.value)}
              variant={selectedRound === round.value ? 'primary' : 'outline'}
              size="sm"
            >
              {round.label}
            </Button>
          ))}
        </div>
      )}


      {/* Generate Quarter Finals Button */}
      {selectedRound === 'Qualifying' &&
        matches.filter(m => m.round_type === 'Qualifying').length > 0 &&
        matches.filter(m => m.round_type === 'Qualifying').every(m => m.status === 'Completed') &&
        matches.filter(m => m.round_type === 'Quarter Final').length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">
                  ✅ All qualifying matches completed!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Top 4 teams from each pool are ready. Generate Quarter Finals to proceed.
                </p>
              </div>
              {isAdmin && (
                <Button
                  onClick={handleGenerateQuarterFinals}
                  variant="primary"
                  disabled={generatingQF}
                >
                  {generatingQF ? 'Generating...' : '🏆 Generate Quarter Finals'}
                </Button>
              )}
            </div>
          </div>
        )}

      {/* Generate Semi Finals Button */}
      {selectedRound === 'Quarter Final' &&
        matches.filter(m => m.round_type === 'Quarter Final').length > 0 &&
        matches.filter(m => m.round_type === 'Quarter Final').every(m => m.status === 'Completed') &&
        matches.filter(m => m.round_type === 'Semi Final').length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">
                  ✅ All Quarter Final matches completed!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Top 4 teams are ready. Generate Semi Finals to proceed.
                </p>
              </div>
              {isAdmin && (
                <Button
                  onClick={handleGenerateSemiFinals}
                  variant="primary"
                  disabled={generatingSF}
                >
                  {generatingSF ? 'Generating...' : '🏆 Generate Semi Finals'}
                </Button>
              )}
            </div>
          </div>
        )}

      {/* Generate Final Button */}
      {selectedRound === 'Semi Final' &&
        matches.filter(m => m.round_type === 'Semi Final').length > 0 &&
        matches.filter(m => m.round_type === 'Semi Final').every(m => m.status === 'Completed') &&
        matches.filter(m => m.round_type === 'Final').length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">
                  ✅ All Semi Final matches completed!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Top 2 teams are ready. Generate Final to determine the champion.
                </p>
              </div>
              {isAdmin && (
                <Button
                  onClick={handleGenerateFinal}
                  variant="primary"
                  disabled={generatingFinal}
                >
                  {generatingFinal ? 'Generating...' : '🏆 Generate Final'}
                </Button>
              )}
            </div>
          </div>
        )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <strong>Error</strong>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading matches...</div>
        </div>
      )}

      {/* Matches Display */}
      {!loading && matches.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">🏓</div>
          <p className="text-gray-600 text-lg mb-2">No matches scheduled yet</p>
          <p className="text-gray-500 text-sm mb-6">
            Click "Generate Schedule" to create the tournament schedule
          </p>
        </div>
      )}

      {/* Qualifying Round - Show by Pool */}
      {!loading && selectedRound === 'Qualifying' && (
        <div className="space-y-6">
          {!loading && qualifyingMatches.poolA.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pool A Matches</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-6">
                {qualifyingMatches.poolA.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onUpdateResult={handleUpdateResult}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && qualifyingMatches.poolB.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pool B Matches</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-6">
                {qualifyingMatches.poolB.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onUpdateResult={handleUpdateResult}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quarter Finals, Semi Finals, and Final - Show all matches */}
      {!loading && ['Quarter Final', 'Semi Final', 'Final'].includes(selectedRound) && filteredMatches.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {selectedRound === 'Quarter Final' && 'Quarter Final Matches'}
            {selectedRound === 'Semi Final' && 'Semi Final Matches'}
            {selectedRound === 'Final' && 'Final Match'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-6">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onUpdateResult={handleUpdateResult}
              />
            ))}
          </div>
        </div>
      )}

      {/* No matches for selected round */}
      {!loading && ['Quarter Final', 'Semi Final', 'Final'].includes(selectedRound) && filteredMatches.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">🏓</div>
          <p className="text-gray-600 text-lg mb-2">No {selectedRound.toLowerCase()} matches yet</p>
          <p className="text-gray-500 text-sm">
            {selectedRound === 'Quarter Final' && 'Complete all qualifying matches to generate Quarter Finals.'}
            {selectedRound === 'Semi Final' && 'Complete all Quarter Final matches to generate Semi Finals.'}
            {selectedRound === 'Final' && 'Complete all Semi Final matches to generate the Final.'}
          </p>
        </div>
      )}

      {/* Result Form Modal */}
      {showResultForm && selectedMatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <MatchResultForm
                match={selectedMatch}
                onSubmit={handleSaveResult}
                onCancel={() => {
                  setShowResultForm(false);
                  setSelectedMatch(null);
                }}
                onWinnerChange={handleWinnerChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage;


