import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';

// Component to display a single team card
const TeamCard = ({ team, onEdit, onDelete, isAdmin = false }) => {
  // Determine which player is Intermediate and which is Expert
  const intermediatePlayer = team.player1_expertise === 'Intermediate' 
    ? { name: team.player1_name, id: team.player1_id }
    : { name: team.player2_name, id: team.player2_id };
  
  const expertPlayer = team.player1_expertise === 'Expert'
    ? { name: team.player1_name, id: team.player1_id }
    : { name: team.player2_name, id: team.player2_id };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex flex-col gap-4">
        {/* Team Name */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{team.team_name}</h3>
          <Badge variant="primary">Team</Badge>
        </div>
        
        {/* Players */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{intermediatePlayer.name}</p>
              <p className="text-xs text-gray-600">Player ID: {intermediatePlayer.id}</p>
            </div>
            <Badge variant="intermediate">Intermediate</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{expertPlayer.name}</p>
              <p className="text-xs text-gray-600">Player ID: {expertPlayer.id}</p>
            </div>
            <Badge variant="expert">Expert</Badge>
          </div>
        </div>
        
        {/* Action Buttons */}
        {isAdmin && (
          <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(team.id)}
              >
                Delete
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(team)}
              >
                Edit
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCard;


