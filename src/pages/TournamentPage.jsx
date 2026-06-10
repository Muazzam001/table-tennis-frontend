import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/atoms/Button';
import GroupStandingsTable from '../components/molecules/GroupStandingsTable/GroupStandingsTable';
import KnockoutBracket from '../components/molecules/KnockoutBracket/KnockoutBracket';
import KnockoutResultsList from '../components/molecules/KnockoutResultsList';
import TournamentStatusBadge from '../components/atoms/TournamentStatusBadge/TournamentStatusBadge';
import { getTournamentOverview } from '../services/tournamentService';

const LEAGUES = [
  { value: 'Expert', label: 'Expert League' },
  { value: 'Intermediate', label: 'Intermediate League' },
  { value: 'Women', label: 'Women League' },
];

const TournamentPage = () => {
  const [selectedLeague, setSelectedLeague] = useState('Expert');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('standings');

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTournamentOverview(selectedLeague);
      setOverview(data);
    } catch (err) {
      setError(err.message || 'Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [selectedLeague]);

  const qualifiersCount = overview?.config?.qualifiersPerGroup || 2;
  const standings = overview?.standings || {};
  const groupIds = Object.keys(standings).sort();
  const allMatches = overview?.matches || [];
  const qualifyingMatches = allMatches.filter((m) => m.round_type === 'Qualifying');
  const knockoutMatches = allMatches.filter((m) =>
    ['Quarter Final', 'Semi Final', 'Final', 'Third Place'].includes(m.round_type)
  );
  const hasGroupStage = qualifyingMatches.length > 0;
  const hasKnockout = knockoutMatches.length > 0;

  const completedQualifying = qualifyingMatches.filter(
    (m) => m.status === 'Completed' && m.winner_team_id
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tournament</h2>
          <p className="text-gray-600 mt-1">
            Standings, knockout bracket, and match results — schedule and update scores on the{' '}
            <Link to="/matches" className="text-red-600 font-medium hover:underline">
              Matches page
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overview?.status && <TournamentStatusBadge status={overview.status} />}
          {hasGroupStage && (
            <Button onClick={loadOverview} variant="outline" size="sm" disabled={loading}>
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {LEAGUES.map((league) => (
          <Button
            key={league.value}
            onClick={() => setSelectedLeague(league.value)}
            variant={selectedLeague === league.value ? 'primary' : 'outline'}
            size="sm"
          >
            {league.label}
          </Button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>
      )}

      {loading && <div className="text-center py-12 text-gray-600">Loading tournament data...</div>}

      {!loading && !hasGroupStage && !hasKnockout && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-600 text-lg mb-2">No tournament data yet for {selectedLeague} league</p>
          <p className="text-gray-500 text-sm mb-4">
            Generate a match schedule from the Matches page to see standings and results here.
          </p>
          <Link to="/matches">
            <Button variant="primary">Go to Matches</Button>
          </Link>
        </div>
      )}

      {!loading && (hasGroupStage || hasKnockout) && (
        <>
          {overview?.config && (
            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              {overview.config.participantCount} teams · {overview.config.groupCount} groups ·{' '}
              {overview.config.groupSize} per group · top {qualifiersCount} qualify
              {qualifyingMatches.length > 0 && (
                <span className="ml-2">
                  · Group stage: {completedQualifying}/{qualifyingMatches.length} matches completed
                </span>
              )}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {hasGroupStage && (
              <Button
                onClick={() => setActiveTab('standings')}
                variant={activeTab === 'standings' ? 'primary' : 'outline'}
                size="sm"
              >
                Group Standings
              </Button>
            )}
            <Button
              onClick={() => setActiveTab('bracket')}
              variant={activeTab === 'bracket' ? 'primary' : 'outline'}
              size="sm"
            >
              Knockout Bracket
            </Button>
            <Button
              onClick={() => setActiveTab('results')}
              variant={activeTab === 'results' ? 'primary' : 'outline'}
              size="sm"
            >
              Knockout Results
            </Button>
          </div>

          {activeTab === 'standings' && hasGroupStage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupIds.map((groupId) => (
                <GroupStandingsTable
                  key={groupId}
                  groupId={groupId}
                  standings={standings[groupId] || []}
                  qualifiersCount={qualifiersCount}
                />
              ))}
            </div>
          )}

          {activeTab === 'bracket' && (
            <>
              {hasKnockout ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <KnockoutBracket bracket={overview?.bracket} />
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 text-gray-600">
                  Knockout bracket will appear after the group stage is complete and knockout
                  rounds are generated on the Matches page.
                </div>
              )}
            </>
          )}

          {activeTab === 'results' && <KnockoutResultsList matches={knockoutMatches} />}
        </>
      )}
    </div>
  );
};

export default TournamentPage;
