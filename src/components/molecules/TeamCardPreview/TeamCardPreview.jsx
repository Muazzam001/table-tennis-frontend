import Badge from '../../atoms/Badge';

// Component to display a team in preview mode (editable name, not saved yet)
const TeamCardPreview = ({ team, onNameChange, index }) => {
  // Determine which player is Intermediate and which is Expert
  const intermediatePlayer = team.player1_expertise === 'Intermediate' 
    ? { name: team.player1_name, id: team.player1_id }
    : { name: team.player2_name, id: team.player2_id };
  
  const expertPlayer = team.player1_expertise === 'Expert'
    ? { name: team.player1_name, id: team.player1_id }
    : { name: team.player2_name, id: team.player2_id };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors">
      <div className="flex flex-col gap-4">
        {/* Editable Team Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Team Name
          </label>
          <input
            type="text"
            value={team.team_name}
            onChange={(e) => onNameChange(index, e.target.value)}
            placeholder={`Team ${index + 1}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
          />
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
      </div>
    </div>
  );
};

export default TeamCardPreview;

