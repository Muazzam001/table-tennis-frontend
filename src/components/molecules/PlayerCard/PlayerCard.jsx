import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { getPlayerDivisionLabel } from '@/utils/playerDivision';

const PlayerCard = ({ player, onEdit, onDelete, isAdmin = false }) => {
  const isWomen = player.category === 'Women';
  const divisionLabel = getPlayerDivisionLabel(player);
  const badgeVariant = isWomen ? 'secondary' : player.expertise_level === 'Expert' ? 'expert' : 'intermediate';

  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{player.name}</h3>
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariant}>{divisionLabel}</Badge>
            {!player.is_active && <Badge variant="default">Inactive</Badge>}
          </div>
        </div>
        {/* <p className="text-gray-600 text-sm">{player.email}</p> */}
        {isAdmin && (
          <div className="flex gap-2 justify-end mt-auto">
            <Button variant="danger" size="sm" onClick={() => onDelete(player.id)}>
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(player)}>
              Edit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
