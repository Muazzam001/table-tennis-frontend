import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';

// Component to display a single match card
const MatchCard = ({ match, onUpdateResult, showActions = true, isAdmin = false }) => {
  const isCompleted = match.status === 'Completed';
  const isAbandoned = match.is_abandoned;
  const winner = match.winner_team_id === match.team1_id ? match.team1_name : 
                 match.winner_team_id === match.team2_id ? match.team2_name : null;

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
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${
      isCompleted ? 'border-green-200' : 
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
              <Badge variant="default">Pool {match.pool}</Badge>
            )}
          </div>
          <Badge variant={match.status === 'Completed' ? 'success' : 'warning'}>
            {match.status}
          </Badge>
        </div>

        {/* Teams and Score */}
        <div className="space-y-3">
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            winner === match.team1_name ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50'
          }`}>
            <span className="font-semibold text-gray-900">{match.team1_name}</span>
            {isCompleted && (
              <span className="text-2xl font-bold text-gray-900">{match.score_team1}</span>
            )}
          </div>
          
          <div className="text-center text-gray-500">VS</div>
          
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            winner === match.team2_name ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50'
          }`}>
            <span className="font-semibold text-gray-900">{match.team2_name}</span>
            {isCompleted && (
              <span className="text-2xl font-bold text-gray-900">{match.score_team2}</span>
            )}
          </div>
        </div>

        {/* Match Info */}
        <div className="text-sm text-gray-600 space-y-1 pt-2 border-t border-gray-200">
          <p>📅 {formatDate(match.scheduled_date)}</p>
          {match.venue && <p>📍 {match.venue}</p>}
          {isAbandoned && (
            <p className="text-red-600">⚠️ Abandoned: {match.abandoned_reason || 'No reason provided'}</p>
          )}
          {isCompleted && winner && (
            <p className="text-green-600 font-semibold">🏆 Winner: {winner}</p>
          )}
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

