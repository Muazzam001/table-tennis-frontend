import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import MatchResultIcon, { getTeamRowClass } from '@/components/atoms/MatchResultIcon';
import MatchStageBadge from '@/components/atoms/MatchStageBadge/MatchStageBadge';
import TierBadge from '@/components/atoms/TierBadge/TierBadge';
import { getSetCountForRound } from '@/config/matchSetConfig';
import { memo } from 'react';

// Component to display a single match card
const MatchCard = ({
  match,
  onUpdateResult,
  onViewDetails,
  showActions = true,
  isAdmin = false,
  teamTiers = {},
  setConfig = null,
  pairingHint = null,
}) => {
  const isCompleted = match.status === 'Completed';
  const isAbandoned = Boolean(match.is_abandoned);
  const team1Won = match.winner_team_id === match.team1_id;
  const team2Won = match.winner_team_id === match.team2_id;
  const hasResult = isCompleted && match.winner_team_id;
  const totalSets = getSetCountForRound(match.round_type, setConfig);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-5 border ${isCompleted ? 'border-green-200' : isAbandoned ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex flex-col gap-2.5 justify-between">
        {/* Round and Pool Info */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <MatchStageBadge match={match} />
            {pairingHint ? (
              <p className="text-xs font-semibold text-teal-800">{pairingHint}</p>
            ) : null}
          </div>
          <Badge variant={match.status === 'Completed' ? 'success' : 'warning'}>
            {match.status}
          </Badge>
        </div>

        {/* Teams and Score */}
        <div className="flex gap-2 justify-between items-center mt-1">
          <div className={`flex items-center justify-between gap-1.5 p-2 rounded-lg relative border ${getTeamRowClass(team1Won, hasResult && team2Won)
            }`}>
            <TierBadge className="absolute -end-3 -top-2" tier={teamTiers[match.team1_id]} />
            <span className="font-semibold text-gray-900">{match.team1_name}</span>
            {hasResult && <MatchResultIcon won={team1Won} lost={team2Won} />}
          </div>

          <div className="text-center text-gray-500">VS</div>

          <div className={`flex items-center justify-between gap-1.5 p-2 rounded-lg relative border ${getTeamRowClass(team2Won, hasResult && team1Won)}`}>
            <TierBadge className="absolute -end-3 -top-2" tier={teamTiers[match.team2_id]} />
            <span className="font-semibold text-gray-900">{match.team2_name}</span>
            {hasResult && <MatchResultIcon won={team2Won} lost={team1Won} />}
          </div>
        </div>

        {/* Match Info */}
        <div className="text-sm text-gray-600 space-y-1 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <p>Best of {totalSets} sets</p>

            {hasResult && (
              <p className="font-medium">
                Set score: {match.score_team1 ?? 0} - {match.score_team2 ?? 0}
              </p>
            )}
          </div>

          {isAbandoned && (
            <p className="text-red-600">⚠️ Abandoned: {match.abandoned_reason || 'No reason provided'}</p>
          )}
          {/* {hasResult && (
            <p className="text-green-600 font-medium">
              🏆 Winner:{' '}
              <span className="font-bold">
                {team1Won ? match.team1_name : match.team2_name}
              </span>
            </p>
          )} */}

          {isAdmin && (
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <p>📅 {formatDate(match.scheduled_date)}</p>
              {match.venue && <p>📍 {match.venue}</p>}
            </div>
          )}
        </div>

        <div className="mt-auto">
          {/* Action Button */}
          {showActions && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateResult(match)}
              className="w-full"
            >
              {isCompleted ? 'Edit Match' : 'Update Match'}
            </Button>
          )}
          {showActions && !isAdmin && onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(match)}
              className="w-full"
            >
              View details
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};

export default memo(MatchCard);

