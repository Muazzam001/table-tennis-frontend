import Badge from '@/components/atoms/Badge';
import { normalizeTeamName } from '@/utils/teamNaming';

const GroupAssignmentsTable = ({ groups = [], division, compact = false }) => {
  if (!groups.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900">
          Group assignments{division ? ` — ${division} Division` : ''}
        </h3>
        {!compact && (
          <p className="text-sm text-gray-600 mt-0.5">
            Teams are placed into groups when the group-stage schedule is generated on the Matches page.
          </p>
        )}
      </div>
      <div className={`grid gap-4 p-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {groups.map((group) => (
          <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <span className="font-semibold text-green-900">Group {group.id}</span>
              <Badge variant="success">{group.teams?.length || 0} teams</Badge>
            </div>
            <ul className="divide-y divide-gray-100">
              {(group.teams || []).map((team) => (
                <li key={team.id} className="px-3 py-2 text-sm text-gray-800">
                  {normalizeTeamName(team.team_name, division)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupAssignmentsTable;
