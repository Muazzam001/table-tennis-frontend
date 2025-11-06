import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';

// Component to display a single player card
const PlayerCard = ({ player, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{player.name}</h3>
          <div className="flex items-center gap-2">
            <Badge variant={player.expertise_level === 'Expert' ? 'expert' : 'intermediate'}>
              {player.expertise_level}
            </Badge>
            {!player.is_active && (
              <Badge variant="default">Inactive</Badge>
            )}
          </div>
        </div>
        <p className="text-gray-600 text-sm">{player.email}</p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(player.id)}
          >
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(player)}
          >
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;


