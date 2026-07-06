import { memo, useState } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import TeamNameEditor from '../TeamNameEditor/TeamNameEditor';
import { getDivisionLabel, normalizeTeamName, resolveTeamDivision } from '@/utils/teamNaming';
import { getDivisionBadgeVariant, getExpertiseBadgeVariant } from '@/utils/divisionBadge';

const TeamCard = ({ team, groupId, onDelete, onSaveName, isAdmin = false, isSingles = false }) => {
  const division = resolveTeamDivision(team);
  const displayName = normalizeTeamName(team.team_name, division);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(displayName);
  const [saving, setSaving] = useState(false);

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
                isSingles={isSingles || team.player2_id == null}
              />
            </div>
          ) : (
            <h3 className="text-xl text-gray-900">
              <span className="font-medium">{isSingles || team.player2_id == null ? '' : 'Team'}</span>{' '}
              <span className="font-bold">{displayName}</span>
            </h3>
          )}
          <div className="flex flex-wrap gap-1.5 justify-end">
            {groupId && (
              <Badge variant="success">Group {groupId}</Badge>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-2 justify-end items-center flex-wrap">
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
          )}
        </div>

        <div className="space-y-3">
          {players.map((p, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2"
            >
              {!(isSingles || team.player2_id == null) && (
                <div className="flex-1 flex gap-2 justify-between items-center p-3 bg-gray-100 rounded-lg border border-gray-300">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-600">Player ID: {p.id}</p>
                </div>
              )}

              <div className="flex-1 flex gap-2 justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                <span>
                  {divisionBadge}
                </span>

                <Badge variant={getExpertiseBadgeVariant(p.expertise)}>
                  {p.expertise}
                </Badge>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default memo(TeamCard);
