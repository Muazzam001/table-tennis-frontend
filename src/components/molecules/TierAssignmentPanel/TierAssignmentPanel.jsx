import Button from '@/components/atoms/Button';
import TierBadge from '@/components/atoms/TierBadge/TierBadge';
import { resolveSinglesEntrantName } from '@/utils/singlesEntrant';

const TierAssignmentPanel = ({
  teams = [],
  tierRequirements = { tier1: 8, tier2: 12, tier3: 12 },
  assignments = {},
  onTierChange,
  onTeamNameChange,
  onSave,
  saving = false,
  isComplete = false,
  errors = [],
  isAdmin = false,
  divisionLabel = '',
  isSingles = false,
  nameSavingId = null,
}) => {
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const team of teams) {
    const tier = assignments[team.id] ?? team.tier;
    if (tier >= 1 && tier <= 3) counts[tier] += 1;
  }

  if (!isAdmin || teams.length === 0) return null;

  return (
    <div className="bg-white border border-indigo-200 rounded-lg p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Tier assignments - {divisionLabel}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Assign each entrant to Tier 1 (highest), Tier 2, or Tier 3. The pyramid layout is derived from your actual tier split (unequal T2/T3 counts are supported).
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <span>
          Tier 1: <strong>{counts[1]}</strong> / {tierRequirements.tier1}
        </span>
        <span>
          Tier 2: <strong>{counts[2]}</strong> / {tierRequirements.tier2}
        </span>
        <span>
          Tier 3: <strong>{counts[3]}</strong> / {tierRequirements.tier3}
        </span>
        {isComplete && (
          <span className="text-green-700 font-medium">✓ Assignments complete</span>
        )}
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-800">
          {errors[0]}
        </div>
      )}

      <div className="overflow-x-auto max-h-80 overflow-y-auto border border-gray-100 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left p-2">{isSingles ? 'Entrant' : 'Team'}</th>
              <th className="text-left p-2 w-32">Tier</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const tier = assignments[team.id] ?? team.tier ?? '';
              const displayName = isSingles ? resolveSinglesEntrantName(team) : team.team_name;
              return (
                <tr key={team.id} className="border-t border-gray-100">
                  <td className="p-2">
                    {isSingles && onTeamNameChange ? (
                      <input
                        type="text"
                        defaultValue={displayName}
                        key={`${team.id}-${displayName}`}
                        onBlur={(e) => {
                          const next = e.target.value.trim();
                          if (next && next !== team.team_name) {
                            onTeamNameChange(team.id, next);
                          }
                        }}
                        className="w-full text-sm font-medium text-gray-900 border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label={`Entrant name for ${displayName}`}
                        disabled={nameSavingId === team.id}
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{displayName}</span>
                    )}
                    {isSingles && team.player1_name && displayName !== team.player1_name && (
                      <p className="text-xs text-gray-500 mt-0.5">Player: {team.player1_name}</p>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={tier}
                        onChange={(e) => onTierChange(team.id, Number(e.target.value))}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                        aria-label={`Tier for ${team.team_name}`}
                      >
                        <option value="">—</option>
                        <option value={1}>Tier 1</option>
                        <option value={2}>Tier 2</option>
                        <option value={3}>Tier 3</option>
                      </select>
                      {tier ? <TierBadge tier={Number(tier)} /> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button onClick={onSave} variant="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save tier assignments'}
        </Button>
      </div>
    </div>
  );
};

export default TierAssignmentPanel;
