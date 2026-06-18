import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import GroupStandingsTable from '../GroupStandingsTable/GroupStandingsTable';
import KnockoutBracket from '../KnockoutBracket/KnockoutBracket';
import KnockoutResultsList from '../KnockoutResultsList';

const TournamentResultsPanel = ({
  overview,
  loading = false,
  error = null,
  showRefresh = true,
  onRefresh,
  matchesLink = '/matches',
  finalResult = null,
  teams = [],
}) => {
  const [activeTab, setActiveTab] = useState('standings');

  const qualifiersCount = overview?.config?.qualifiersPerGroup || 2;
  const isSingleGroup = overview?.config?.isSingleGroup || overview?.format === 'single-group';
  const teamCount = overview?.config?.participantCount || 0;
  const standings = overview?.standings || {};
  const groupIds = Object.keys(standings).sort();
  const allMatches = overview?.matches || [];
  const qualifyingMatches = allMatches.filter((m) => m.round_type === 'Qualifying');
  const knockoutMatches = allMatches.filter((m) =>
    ['Quarter Final', 'Semi Final', 'Final', 'Third Place'].includes(m.round_type)
  );
  const hasGroupStage = qualifyingMatches.length > 0;
  const hasKnockout = knockoutMatches.length > 0;

  const formatSummary = (() => {
    if (!overview?.config) return null;
    const { groupCount, groupSize, participantCount } = overview.config;
    if (isSingleGroup && teamCount === 4) {
      return `${participantCount} teams · single round-robin group · top 2 → Final · 3rd vs 4th → Third Place`;
    }
    if (isSingleGroup && teamCount === 6) {
      return `${participantCount} teams · single round-robin group · top 4 → Semi-finals → Final & Third Place`;
    }
    return `${participantCount} teams · ${groupCount} groups · ${groupSize} per group · top ${qualifiersCount} qualify`;
  })();

  const completedQualifying = qualifyingMatches.filter(
    (m) => m.status === 'Completed' && m.winner_team_id
  ).length;

  const champion = finalResult?.championTeamName;
  const runnerUp = finalResult?.runnerUpTeamName;

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading tournament data...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>
    );
  }

  if (!hasGroupStage && !hasKnockout) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-gray-600 text-lg mb-2">No tournament data available</p>
        {matchesLink && (
          <>
            <p className="text-gray-500 text-sm mb-4">
              Generate a match schedule from the Matches page to see standings and results here.
            </p>
            <Link to={matchesLink}>
              <Button variant="primary">Go to Matches</Button>
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
  <>
      {(champion || runnerUp) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-4">
          <h3 className="font-semibold text-amber-900 mb-2">Final result</h3>
          <div className="flex flex-wrap gap-6 text-sm">
            {champion && (
              <p>
                <span className="text-amber-800">Champion:</span>{' '}
                <span className="font-semibold text-amber-950">{champion}</span>
              </p>
            )}
            {runnerUp && (
              <p>
                <span className="text-amber-800">Runner-up:</span>{' '}
                <span className="font-semibold text-amber-950">{runnerUp}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {overview?.config && (
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          {formatSummary}
          {qualifyingMatches.length > 0 && (
            <span className="ml-2">
              · Group stage: {completedQualifying}/{qualifyingMatches.length} matches completed
            </span>
          )}
        </div>
      )}

      {teams.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Teams ({teams.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {teams.map((team) => (
              <div key={team.id} className="text-gray-700 border border-gray-100 rounded px-3 py-2">
                <span className="font-medium text-gray-900">{team.team_name}</span>
                <span className="text-gray-500">
                  {' '}
                  — {team.player1_name} & {team.player2_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
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
        {showRefresh && onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm" className="ml-auto">
            🔄 Refresh
          </Button>
        )}
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
              Knockout bracket will appear after knockout rounds are generated.
            </div>
          )}
        </>
      )}

      {activeTab === 'results' && <KnockoutResultsList matches={knockoutMatches} />}
  </>
  );
};

export default TournamentResultsPanel;
