import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import MatchResultIcon, { getTeamRowClass } from '@/components/atoms/MatchResultIcon';
import { getSetCountForRound } from '@/config/matchSetConfig';

// Component to display a single match card
const MatchCard = ({ match, onUpdateResult, showActions = true, isAdmin = false }) => {
  const isCompleted = match.status === 'Completed';
  const isAbandoned = Boolean(match.is_abandoned);
  const team1Won = match.winner_team_id === match.team1_id;
  const team2Won = match.winner_team_id === match.team2_id;
  const hasResult = isCompleted && match.winner_team_id;
  const totalSets = getSetCountForRound(match.round_type);

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
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${isCompleted ? 'border-green-200' :
        isAbandoned ? 'border-red-200' :
          'border-gray-200'
      }`}>
      <div className="flex flex-col gap-4">
        {/* Round and Pool Info */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant={match.round_type === 'Final' ? 'primary' : 'secondary'}>
              {match.round_type}
            </Badge>
            {match.pool && (
              <Badge variant="default">Group {match.pool}</Badge>
            )}
          </div>
          <Badge variant={match.status === 'Completed' ? 'success' : 'warning'}>
            {match.status}
          </Badge>
        </div>

        {/* Teams and Score */}
        <div className="space-y-3">
          <div className={`flex items-center justify-between p-3 rounded-lg ${getTeamRowClass(team1Won, hasResult && team2Won)
            }`}>
            <span className="font-semibold text-gray-900">{match.team1_name}</span>
            {hasResult && <MatchResultIcon won={team1Won} lost={team2Won} />}
          </div>

          <div className="text-center text-gray-500">VS</div>

          <div className={`flex items-center justify-between p-3 rounded-lg ${getTeamRowClass(team2Won, hasResult && team1Won)
            }`}>
            <span className="font-semibold text-gray-900">{match.team2_name}</span>
            {hasResult && <MatchResultIcon won={team2Won} lost={team1Won} />}
          </div>
        </div>

        {/* Match Info */}
        <div className="text-sm text-gray-600 space-y-1 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p>Best of {totalSets} sets</p>

            {hasResult && (
              <p className="font-medium">
                Set score: {match.score_team1 ?? 0} - {match.score_team2 ?? 0}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between">
            <p>📅 {formatDate(match.scheduled_date)}</p>
            {match.venue && <p>📍 {match.venue}</p>}
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
        </div>

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
      </div>
    </div>
  );
};

export default MatchCard;

