import Badge from '@/components/atoms/Badge';
import MatchResultIcon, { getTeamRowClass } from '@/components/atoms/MatchResultIcon';
import MatchStageBadge from '@/components/atoms/MatchStageBadge/MatchStageBadge';
import { getGamePointsPerSet, getSetCountForRound } from '@/config/matchSetConfig';
import { normalizeGamePointsPerSet } from '@shared/tournament/gamePointRules.js';
import { parseSetGameScores } from '@shared/tournament/standings.js';

const formatDate = (dateString) => {
  if (!dateString) return 'Not scheduled';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MatchDetailPanel = ({ match, setConfig = null }) => {
  const isCompleted = match.status === 'Completed';
  const isAbandoned = Boolean(match.is_abandoned);
  const team1Won = match.winner_team_id === match.team1_id;
  const team2Won = match.winner_team_id === match.team2_id;
  const hasResult = isCompleted && match.winner_team_id;
  const totalSets = getSetCountForRound(match.round_type, setConfig);
  const gamePointFormat = normalizeGamePointsPerSet(
    match.game_point_format ?? getGamePointsPerSet(setConfig)
  );
  const setScores = parseSetGameScores(match) || [];
  const playedSets = (Number(match.score_team1) || 0) + (Number(match.score_team2) || 0);
  const visibleSetScores = setScores.slice(0, playedSets);

  return (
    <div className="space-y-5">
      <div className="p-4 bg-gray-100 rounded-lg flex flex-wrap items-center justify-between gap-2">
        <div className="w-full flex flex-wrap items-center justify-between gap-2">
          <MatchStageBadge match={match} />
          <Badge variant={isCompleted ? 'success' : 'warning'}>{match.status}</Badge>
        </div>

        <p className="text-lg font-semibold text-gray-900">
          {match.team1_name} vs {match.team2_name}
        </p>
        <p className="text-sm text-gray-600">
          Best of {totalSets} sets · {gamePointFormat}-point games
        </p>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {/* 
        <div>
          <dt className="text-gray-500">Scheduled</dt>
          <dd className="font-medium text-gray-900">{formatDate(match.scheduled_date)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Venue</dt>
          <dd className="font-medium text-gray-900">{match.venue || 'TBD'}</dd>
        </div> 
        */}
        {match.pool && (
          <div className="flex items-center justify-between gap-2 p-2 bg-gray-100 rounded-lg">
            <dt className="text-gray-500">Group</dt>
            <dd className="font-medium text-gray-900">Pool {match.pool}</dd>
          </div>
        )}
        {match.division && (
          <div className="flex items-center justify-between gap-2 p-2 bg-gray-100 rounded-lg">
            <dt className="text-gray-500">Division</dt>
            <dd className="font-medium text-gray-900">{match.division}</dd>
          </div>
        )}
      </dl>

      {isAbandoned && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">Match abandoned</p>
          <p className="mt-1">{match.abandoned_reason || 'No reason provided'}</p>
        </div>
      )}

      {hasResult && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div
              className={`flex items-center justify-between gap-2 p-3 rounded-lg border ${getTeamRowClass(
                team1Won,
                hasResult && team2Won
              )}`}
            >
              <span className="font-medium text-gray-900">{match.team1_name}</span>
              <MatchResultIcon won={team1Won} lost={team2Won} />
            </div>

            <div className="flex flex-col items-center justify-between">
              <h4 className="font-semibold text-gray-900">Result</h4>
              <p className="text-sm font-medium text-gray-700">
                Sets: {match.score_team1 ?? 0} - {match.score_team2 ?? 0}
              </p>
            </div>

            <div
              className={`flex items-center justify-between gap-2 p-3 rounded-lg border ${getTeamRowClass(
                team2Won,
                hasResult && team1Won
              )}`}
            >
              <span className="font-medium text-gray-900">{match.team2_name}</span>
              <MatchResultIcon won={team2Won} lost={team1Won} />
            </div>
          </div>

          {visibleSetScores.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700 border-b border-gray-200">
                Game scores by set
              </div>
              <div className="divide-y divide-gray-200">
                {visibleSetScores.map((set, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[auto_1fr_1fr] gap-3 items-center px-4 py-3 text-sm"
                  >
                    <span className="text-gray-500 font-medium">Set {index + 1}</span>
                    <span className="text-gray-900">{set.team1}</span>
                    <span className="text-gray-900">{set.team2}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!hasResult && !isAbandoned && (
        <p className="text-sm text-gray-600">This match has not been played yet.</p>
      )}
    </div>
  );
};

export default MatchDetailPanel;
