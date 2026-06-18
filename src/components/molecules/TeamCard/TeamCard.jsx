import { useState } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import TeamNameEditor from '../TeamNameEditor/TeamNameEditor';
import { getDivisionLabel, normalizeTeamName, resolveTeamDivision } from '@/utils/teamNaming';

const TeamCard = ({ team, groupId, onDelete, onSaveName, isAdmin = false, isSingles = false }) => {
  const division = resolveTeamDivision(team);
  const displayName = normalizeTeamName(team.team_name, division);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(displayName);
  const [saving, setSaving] = useState(false);

  const divisionBadge = (() => {
    const label = getDivisionLabel(division);
    if (division === 'Expert') return <Badge variant="expert">{label}</Badge>;
    if (division === 'Intermediate') return <Badge variant="intermediate">{label}</Badge>;
    if (division === 'Women') return <Badge variant="secondary">{label}</Badge>;
    return <Badge variant="primary">{label}</Badge>;
  })();

  const players = isSingles || team.player2_id == null
    ? [{ name: team.player1_name, id: team.player1_id, expertise: team.player1_expertise }]
    : [
        { name: team.player1_name, id: team.player1_id, expertise: team.player1_expertise },
        { name: team.player2_name, id: team.player2_id, expertise: team.player2_expertise },
      ];

  const handleStartEdit = () => {
    setDraftName(displayName);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraftName(displayName);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!onSaveName) return;
    const trimmed = draftName.trim();
    if (!trimmed) return;
    try {
      setSaving(true);
      await onSaveName(team.id, trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-start justify-between gap-3">
          {editing ? (
            <div className="flex-1">
              <TeamNameEditor
                id={`team-name-${team.id}`}
                teamName={draftName}
                fallbackNumber={team.id}
                onChange={setDraftName}
              />
            </div>
          ) : (
            <h3 className="text-xl text-gray-900">
              <span className="font-medium">{isSingles || team.player2_id == null ? 'Player' : 'Team'}</span>{' '}
              <span className="font-bold">{displayName}</span>
            </h3>
          )}
          <div className="flex flex-wrap gap-1.5 justify-end">
            {groupId && (
              <Badge variant="success">Group {groupId}</Badge>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {players.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{p.name}</p>
                {/* <p className="text-xs text-gray-600">Player ID: {p.id}</p> */}
              </div>
              <Badge variant={p.expertise === 'Expert' ? 'expert' : 'intermediate'}>
                {p.expertise}
              </Badge>
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="flex gap-2 justify-between items-center flex-wrap pt-2 border-t border-gray-200 mt-auto">
            <span>
              {divisionBadge}
            </span>

            <div className="flex gap-2 justify-end">
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !draftName.trim()}
                  >
                    {saving ? 'Saving...' : 'Save name'}
                  </Button>
                </>
              ) : (
                <>
                  {onDelete && (
                    <Button variant="danger" size="sm" onClick={() => onDelete(team.id)}>
                      Delete
                    </Button>
                  )}
                  {onSaveName && (
                    <Button variant="outline" size="sm" onClick={handleStartEdit}>
                      Edit Name
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCard;
