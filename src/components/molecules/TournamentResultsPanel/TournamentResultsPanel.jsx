import Button from '@/components/atoms/Button';
import { isTierPyramidFormat } from '@/constants/tournamentFormats';
import { useAuth } from '@/contexts/AuthContext';
import { buildPyramidBracketView } from '@/utils/pyramidBracket';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import GroupStandingsTable from '../GroupStandingsTable/GroupStandingsTable';
import KnockoutBracket from '../KnockoutBracket/KnockoutBracket';
import KnockoutResultsList from '../KnockoutResultsList';
import Level1BBracketRound from '../Level1BBracketRound/Level1BBracketRound';
import ProgressionLogPanel from '../ProgressionLogPanel/ProgressionLogPanel';
import PyramidBracket from '../PyramidBracket/PyramidBracket';

const PYRAMID_RESULT_ROUNDS = [
  'S1',
  'S2',
  'Level 1B',
  'Level 2',
  'Level 3',
  'Semi Final',
  'Third Place',
  'Final',
];

const derivePodiumFromMatches = (matches) => {
  const finalMatch = matches.find(
    (m) => m.round_type === 'Final' && m.status === 'Completed' && m.winner_team_id
  );
  if (!finalMatch) return null;

  const champion =
    finalMatch.winner_team_id === finalMatch.team1_id
      ? finalMatch.team1_name
      : finalMatch.team2_name;
  const runnerUp =
    finalMatch.winner_team_id === finalMatch.team1_id
      ? finalMatch.team2_name
      : finalMatch.team1_name;

  const thirdMatch = matches.find(
    (m) => m.round_type === 'Third Place' && m.status === 'Completed' && m.winner_team_id
  );
  const thirdPlace = thirdMatch
    ? thirdMatch.winner_team_id === thirdMatch.team1_id
      ? thirdMatch.team1_name
      : thirdMatch.team2_name
    : null;

  return { championTeamName: champion, runnerUpTeamName: runnerUp, thirdPlaceTeamName: thirdPlace };
};

const TournamentResultsPanel = ({
  overview,
  loading = false,
  error = null,
  showRefresh = true,
  onRefresh,
  matchesLink = '/matches',
  finalResult = null,
  teams = [],
  readOnly = false,
}) => {
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('standings');
  const [bracketView, setBracketView] = useState('full');

  const isPyramid = isTierPyramidFormat(overview?.format || overview?.tournament_format);
  const qualifiersCount =
    overview?.config?.qualifiersPerGroup ||
    (isPyramid ? overview?.config?.s1QualifiersPerGroup || 4 : 2);
  const isSingleGroup = overview?.config?.isSingleGroup || overview?.format === 'single-group';
  const teamCount = overview?.config?.participantCount || overview?.config?.tier1Count + overview?.config?.tier2Count + overview?.config?.tier3Count || 0;
  const standings = overview?.standings || {};
  const groupIds = Object.keys(standings).sort();
  const allMatches = overview?.matches || [];
  const qualifyingMatches = allMatches.filter((m) => m.round_type === 'Qualifying');
  const pyramidMatches = allMatches.filter((m) => PYRAMID_RESULT_ROUNDS.includes(m.round_type));
  const knockoutMatches = allMatches.filter((m) =>
    ['Quarter Final', 'Semi Final', 'Final', 'Third Place'].includes(m.round_type)
  );
  const hasGroupStage = isPyramid ? pyramidMatches.some((m) => m.round_type === 'S1') : qualifyingMatches.length > 0;
  const hasKnockout = isPyramid ? pyramidMatches.length > 0 : knockoutMatches.length > 0;
  const s2Standings =
    overview?.pyramid?.s2OverallStandings || overview?.pyramid?.s2Standings || [];
  const s1OverallStandings = overview?.pyramid?.s1OverallStandings || [];
  const level1Standings =
    overview?.pyramid?.level1Standings || overview?.pyramid?.l1bStandings || [];
  const level2Standings = overview?.pyramid?.level2Standings || [];
  const level3Standings = overview?.pyramid?.level3Standings || [];
  const flowRankings = overview?.pyramid?.flowRankings || [];
  const overallPerformance = overview?.pyramid?.overallPerformance || [];
  const level1bStatus = overview?.pyramid?.level1bStatus || '';
  const progressionLog = overview?.pyramid?.progressionLog || [];
  const pyramidBracketView = isPyramid ? buildPyramidBracketView(overview) : null;

  const formatSummary = (() => {
    if (isPyramid && overview?.config) {
      const c = overview.config;
      return `Tier Pyramid · T1: ${c.tier1Count} · T2: ${c.tier2Count} · T3: ${c.tier3Count} · ${c.s1GroupCount} S1 groups · optional Third Place after semi-finals`;
    }
    if (!overview?.config) return null;
    const { groupCount, groupSize, participantCount } = overview.config;
    if (isSingleGroup && teamCount === 4) {
      return `${participantCount} teams · Single round-robin group · Top 2 → Final · 3rd vs 4th → Third Place`;
    }
    if (isSingleGroup && teamCount === 6) {
      return `${participantCount} teams · Single round-robin group · Top 4 → Semi-finals → Final & Third Place`;
    }
    return `${participantCount} teams · ${groupCount} groups · ${groupSize} per group · Top ${qualifiersCount} qualify`;
  })();

  const completedQualifying = qualifyingMatches.filter(
    (m) => m.status === 'Completed' && m.winner_team_id
  ).length;

  const livePodium = derivePodiumFromMatches(allMatches);
  const podium = finalResult || livePodium;
  const champion = podium?.championTeamName;
  const runnerUp = podium?.runnerUpTeamName;
  const thirdPlace = podium?.thirdPlaceTeamName;

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
              {readOnly
                ? isPyramid
                  ? 'Standings and bracket will appear here once the Tier Pyramid schedule is published.'
                  : 'Standings and bracket will appear here once matches are scheduled.'
                : isPyramid
                  ? 'Assign tiers and generate the Level 1 schedule from the Matches page.'
                  : 'Generate a match schedule from the Matches page to see standings and results here.'}
            </p>
            <Link to={matchesLink}>
              <Button variant="primary">{readOnly ? 'Browse matches' : 'Go to Matches'}</Button>
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {(champion || runnerUp || thirdPlace) && (
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
            {thirdPlace && (
              <p>
                <span className="text-amber-800">Third place:</span>{' '}
                <span className="font-semibold text-amber-950">{thirdPlace}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {formatSummary && (
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          {formatSummary}
          {!isPyramid && qualifyingMatches.length > 0 && (
            <span className="ml-2">
              · Group stage: {completedQualifying}/{qualifyingMatches.length} matches completed
            </span>
          )}
          {isPyramid && overview?.status && (
            <span className="ml-2">· Status: {overview.status}</span>
          )}
          {isPyramid && level1bStatus && (
            <span className="ml-2">· Level 1B: {level1bStatus}</span>
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
                  - {team.player1_name} & {team.player2_name}
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
            {isPyramid ? 'S1 Pool Standings' : 'Group Standings'}
          </Button>
        )}

        {isPyramid && s1OverallStandings.length > 0 && (
          <Button
            onClick={() => setActiveTab('s1-overall')}
            variant={activeTab === 's1-overall' ? 'primary' : 'outline'}
            size="sm"
          >
            S1 Overall
          </Button>
        )}

        {isPyramid && s2Standings.length > 0 && (
          <Button
            onClick={() => setActiveTab('s2')}
            variant={activeTab === 's2' ? 'primary' : 'outline'}
            size="sm"
          >
            S2 Overall
          </Button>
        )}

        {isPyramid && level1Standings.length > 0 && (
          <Button
            onClick={() => setActiveTab('level1')}
            variant={activeTab === 'level1' ? 'primary' : 'outline'}
            size="sm"
          >
            Level 1 Ranking
          </Button>
        )}

        {isPyramid && level2Standings.length > 0 && (
          <Button
            onClick={() => setActiveTab('level2')}
            variant={activeTab === 'level2' ? 'primary' : 'outline'}
            size="sm"
          >
            Level 2 Ranking
          </Button>
        )}

        {isPyramid && level3Standings.length > 0 && (
          <Button
            onClick={() => setActiveTab('level3')}
            variant={activeTab === 'level3' ? 'primary' : 'outline'}
            size="sm"
          >
            Level 3 Ranking
          </Button>
        )}

        {isPyramid && flowRankings.length > 0 && (
          <Button
            onClick={() => setActiveTab('flow')}
            variant={activeTab === 'flow' ? 'primary' : 'outline'}
            size="sm"
          >
            Flow Ranking
          </Button>
        )}

        {isPyramid && overallPerformance.length > 0 && (
          <Button
            onClick={() => setActiveTab('overall-performance')}
            variant={activeTab === 'overall-performance' ? 'primary' : 'outline'}
            size="sm"
          >
            Overall Performance
          </Button>
        )}

        <Button
          onClick={() => setActiveTab('bracket')}
          variant={activeTab === 'bracket' ? 'primary' : 'outline'}
          size="sm"
        >
          {isPyramid ? 'Pyramid Bracket' : 'Knockout Bracket'}
        </Button>

        <Button
          onClick={() => setActiveTab('results')}
          variant={activeTab === 'results' ? 'primary' : 'outline'}
          size="sm"
        >
          {isPyramid ? 'Match Results' : 'Knockout Results'}
        </Button>

        {isAdmin && isPyramid && progressionLog.length > 0 && (
          <Button
            onClick={() => setActiveTab('progression')}
            variant={activeTab === 'progression' ? 'primary' : 'outline'}
            size="sm"
          >
            Progression Log
          </Button>
        )}

        {showRefresh && onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm" className="ml-auto">
            🔄 Refresh
          </Button>
        )}
      </div>

      {activeTab === 'standings' && hasGroupStage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupIds.map((groupId) => (
            <GroupStandingsTable
              key={groupId}
              groupId={groupId}
              standings={standings[groupId] || []}
              qualifiersCount={qualifiersCount}
              qualifierLabel={isPyramid ? 'Top 4 → Level 1B' : undefined}
            />
          ))}
        </div>
      )}

      {activeTab === 's1-overall' && isPyramid && (
        <GroupStandingsTable
          groupId="S1"
          title="S1 Overall Ranking"
          standings={s1OverallStandings}
          qualifiersCount={0}
          qualifierLabel="All S1 teams ranked across pools (pool tables unchanged)"
          showSourceGroup
        />
      )}

      {activeTab === 's2' && isPyramid && (
        <GroupStandingsTable
          groupId="S2"
          title="S2 Overall Ranking"
          standings={s2Standings}
          qualifiersCount={4}
          qualifierLabel="Top 4 → Level 3 · Bottom 4 → Level 2"
        />
      )}

      {activeTab === 'level1' && isPyramid && (
        <GroupStandingsTable
          groupId="Level 1"
          title="Level 1 Ranking"
          standings={level1Standings}
          qualifiersCount={4}
          qualifierLabel="Level 1B field · Top 4 → Level 2"
          showSourceGroup
        />
      )}

      {activeTab === 'level2' && isPyramid && (
        <GroupStandingsTable
          groupId="Level 2"
          title="Level 2 Ranking"
          standings={level2Standings}
          qualifiersCount={4}
          qualifierLabel="Level 2 entrants · Winners → Level 3"
          showSourceGroup
        />
      )}

      {activeTab === 'level3' && isPyramid && (
        <GroupStandingsTable
          groupId="Level 3"
          title="Level 3 Ranking"
          standings={level3Standings}
          qualifiersCount={4}
          qualifierLabel="Level 3 field through semis / finals path"
          showSourceGroup
        />
      )}

      {activeTab === 'flow' && isPyramid && (
        <GroupStandingsTable
          groupId="Flow"
          title="Correct Flow Ranking"
          standings={flowRankings}
          qualifiersCount={0}
          qualifierLabel="Ordered by deepest tournament progress, then overall record"
          showExitStage
          showSourceGroup
        />
      )}

      {activeTab === 'overall-performance' && isPyramid && (
        <GroupStandingsTable
          groupId="Overall"
          title="Overall Match Performance"
          standings={overallPerformance}
          qualifiersCount={0}
          qualifierLabel="All players ranked by overall match statistics (Wins → Points → Set Diff → Point Diff), regardless of tier/band"
        />
      )}

      {activeTab === 'bracket' && (
        <>
          {isPyramid ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setBracketView('l1b-r1')}
                  variant={bracketView === 'l1b-r1' ? 'primary' : 'outline'}
                  size="sm"
                >
                  L1B Round 1
                </Button>
                <Button
                  onClick={() => setBracketView('l1b-r2')}
                  variant={bracketView === 'l1b-r2' ? 'primary' : 'outline'}
                  size="sm"
                >
                  L1B Round 2
                </Button>
                <Button
                  onClick={() => setBracketView('full')}
                  variant={bracketView === 'full' ? 'primary' : 'outline'}
                  size="sm"
                >
                  Full Pyramid
                </Button>
              </div>

              {bracketView === 'l1b-r1' && (
                <Level1BBracketRound
                  round={pyramidBracketView?.l1b?.rounds?.[0]}
                  emptyMessage="Level 1B Round 1 will appear after Level 1B is activated."
                />
              )}
              {bracketView === 'l1b-r2' && (
                <Level1BBracketRound
                  round={pyramidBracketView?.l1b?.rounds?.[1]}
                  emptyMessage="Round 2 crossover pairings appear after all Round 1 matches are completed."
                />
              )}
              {bracketView === 'full' && (
                <PyramidBracket overview={overview} readOnly={readOnly} />
              )}

            </div>
          ) : hasKnockout ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <KnockoutBracket bracket={overview?.bracket} />
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg border border-gray-200 text-gray-600">
              Knockout bracket will appear after knockout rounds are generated.
            </div>
          )}
        </>
      )}

      {activeTab === 'results' && !isPyramid && (
        <KnockoutResultsList matches={isPyramid ? pyramidMatches : knockoutMatches} />
      )}

      {activeTab === 'progression' && isPyramid && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <ProgressionLogPanel entries={progressionLog} />
        </div>
      )}
    </>
  );
};

export default TournamentResultsPanel;
