import Badge from '@/components/atoms/Badge';
import TeamNameEditor from '../TeamNameEditor/TeamNameEditor';
import { getDivisionLabel, resolveTeamDivision } from '@/utils/teamNaming';
import { getDivisionBadgeVariant, getExpertiseBadgeVariant } from '@/utils/divisionBadge';

const TeamCardPreview = ({ team, onNameChange, index, isSingles = false }) => {
  const division = resolveTeamDivision(team);
  const teamNumber = index + 1;

  const divisionBadge = (() => {
    const label = getDivisionLabel(division);
    return <Badge variant={getDivisionBadgeVariant(division)}>{label}</Badge>;
  })();

  const players = isSingles || team.player2_id == null
    ? [{ name: team.player1_name, id: team.player1_id, expertise: team.player1_expertise }]
    : [
        { name: team.player1_name, id: team.player1_id, expertise: team.player1_expertise },
        { name: team.player2_name, id: team.player2_id, expertise: team.player2_expertise },
      ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <TeamNameEditor
              id={`preview-team-name-${index}`}
              teamName={team.team_name}
              fallbackNumber={teamNumber}
              onChange={(name) => onNameChange(index, name)}
            />
          </div>
          {divisionBadge}
        </div>

        <div className="space-y-3">
          {players.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-600">Player ID: {p.id}</p>
              </div>
              <Badge variant={getExpertiseBadgeVariant(p.expertise)}>
                {p.expertise}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamCardPreview;
