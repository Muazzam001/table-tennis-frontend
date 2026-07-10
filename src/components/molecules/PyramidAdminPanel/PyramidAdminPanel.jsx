import { useState } from 'react';
import Button from '@/components/atoms/Button';
import ProgressionLogPanel from '@/components/molecules/ProgressionLogPanel/ProgressionLogPanel';
import { showConfirm } from '@/utils/sweetAlert';

const PYRAMID_STAGES = [
  { value: 'registered', label: 'Registered' },
  { value: 'S1', label: 'S1' },
  { value: 'S2', label: 'S2' },
  { value: 'L1B', label: 'Level 1B' },
  { value: 'L2', label: 'Level 2' },
  { value: 'L3', label: 'Level 3' },
  { value: 'final', label: 'Final' },
  { value: 'champion', label: 'Champion' },
  { value: 'eliminated', label: 'Eliminated' },
];

const PYRAMID_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'eliminated', label: 'Eliminated' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const REGENERATE_STAGES = [
  { value: 'Level 1', label: 'Level 1 (S1 + S3)' },
  { value: 'Level 1B', label: 'Level 1B' },
  { value: 'Level 2', label: 'Level 2' },
  { value: 'Level 3', label: 'Level 3' },
  { value: 'Final', label: 'Final' },
];

const PyramidAdminPanel = ({
  teams = [],
  progressionLog = [],
  logLoading = false,
  onOverrideAdvancement,
  onRegenerateStage,
  onRefreshLog,
  divisionLabel = '',
  tournamentStatus = '',
  level1bStatus = '',
  saving = false,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [replaceWithTeamId, setReplaceWithTeamId] = useState('');
  const [toStage, setToStage] = useState('L2');
  const [toStatus, setToStatus] = useState('advanced');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [regenerateFrom, setRegenerateFrom] = useState('Level 2');
  const [showLog, setShowLog] = useState(false);

  const isTeamReplace = Boolean(replaceWithTeamId);
  const replacementOptions = teams.filter((t) => String(t.id) !== String(selectedTeamId));

  const handleOverride = async () => {
    if (!selectedTeamId) return;
    if (isTeamReplace && String(replaceWithTeamId) === String(selectedTeamId)) return;

    const team = teams.find((t) => String(t.id) === String(selectedTeamId));
    const replacement = teams.find((t) => String(t.id) === String(replaceWithTeamId));

    const confirmed = await showConfirm({
      title: isTeamReplace ? 'Replace team in tournament?' : 'Override advancement?',
      text: isTeamReplace
        ? `Swap ${team?.team_name || 'team'} with ${replacement?.team_name || 'replacement'} (stage, status, seeding source, and unfinished match slots)?`
        : `Set ${team?.team_name || 'team'} to stage "${toStage}" with status "${toStatus}"?`,
      confirmText: isTeamReplace ? 'Replace team' : 'Apply override',
      icon: 'warning',
    });
    if (!confirmed) return;

    const update = isTeamReplace
      ? {
          teamId: Number(selectedTeamId),
          replaceWithTeamId: Number(replaceWithTeamId),
        }
      : {
          teamId: Number(selectedTeamId),
          toStage,
          toStatus,
        };

    await onOverrideAdvancement({
      updates: [update],
      notes: overrideNotes || null,
    });
    setOverrideNotes('');
    setReplaceWithTeamId('');
  };

  const handleRegenerate = async () => {
    const confirmed = await showConfirm({
      title: `Regenerate from ${regenerateFrom}?`,
      text:
        'This removes downstream matches and re-applies automatic progression. Use after correcting scores. This cannot be undone.',
      confirmText: 'Regenerate',
      icon: 'warning',
    });
    if (!confirmed) return;
    await onRegenerateStage(regenerateFrom);
  };

  const canApply =
    Boolean(selectedTeamId) && (!isTeamReplace || Boolean(replaceWithTeamId));

  return (
    <div className="bg-white border border-amber-200 rounded-lg p-4 space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900">Pyramid admin - {divisionLabel}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Override entrant stages, replace one team with another at the current stage, or regenerate
          downstream brackets after score corrections.
          {tournamentStatus && (
            <span className="ml-2 text-gray-500">Current status: {tournamentStatus}</span>
          )}
          {level1bStatus && (
            <span className="ml-2 text-gray-500">Level 1B gate: {level1bStatus}</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3 border border-gray-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800">Manual advancement override</h4>
          <div className="flex flex-col gap-3">
            <label className="text-sm">
              <span className="text-gray-600 block mb-1">Team</span>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={selectedTeamId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedTeamId(nextId);
                  if (String(replaceWithTeamId) === String(nextId)) {
                    setReplaceWithTeamId('');
                  }
                }}
              >
                <option value="">Select team…</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.team_name}
                    {team.tier != null ? ` · T${team.tier}` : ''}
                    {team.pyramid_stage ? ` (${team.pyramid_stage})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-gray-600 block mb-1">Replace with team</span>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={replaceWithTeamId}
                onChange={(e) => setReplaceWithTeamId(e.target.value)}
                disabled={!selectedTeamId}
              >
                <option value="">None — set stage/status instead</option>
                {replacementOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.team_name}
                    {team.tier != null ? ` · T${team.tier}` : ''}
                    {team.pyramid_stage ? ` (${team.pyramid_stage})` : ''}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500 mt-1 block">
                Swaps tournament position (stage, status, seeding source) and unfinished match slots
                between the two teams at any stage.
              </span>
            </label>

            <label className="text-sm">
              <span className="text-gray-600 block mb-1">To stage</span>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                value={toStage}
                onChange={(e) => setToStage(e.target.value)}
                disabled={isTeamReplace}
              >
                {PYRAMID_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-gray-600 block mb-1">To status</span>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                value={toStatus}
                onChange={(e) => setToStatus(e.target.value)}
                disabled={isTeamReplace}
              >
                {PYRAMID_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm sm:col-span-2">
              <span className="text-gray-600 block mb-1">Notes (optional)</span>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                placeholder="Reason for override"
              />
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOverride}
              disabled={saving || !canApply}
            >
              {saving ? 'Saving…' : isTeamReplace ? 'Replace team' : 'Apply override'}
            </Button>
          </div>
        </div>

        <div className="space-y-3 border border-gray-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800">Regenerate downstream</h4>
          <p className="text-xs text-gray-500">
            After fixing match scores, pick the stage to reset from. Downstream matches are deleted and
            progression re-runs automatically.
          </p>

          <label className="text-sm block">
            <span className="text-gray-600 block mb-1">From stage</span>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={regenerateFrom}
              onChange={(e) => setRegenerateFrom(e.target.value)}
            >
              {REGENERATE_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2 justify-end">
            <Button variant="primary" size="sm" onClick={handleRegenerate} disabled={saving}>
              {saving ? 'Regenerating…' : 'Regenerate stage'}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between gap-2 mt-auto mb">
          <h4 className="text-sm font-semibold text-gray-800">Progression log</h4>
          <div className="flex gap-2 flex-row-reverse">
            {onRefreshLog && (
              <Button size="sm" onClick={onRefreshLog} disabled={logLoading}>
                Refresh
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowLog((v) => !v)}>
              {showLog ? 'Hide log' : `Show log (${progressionLog.length})`}
            </Button>
          </div>
        </div>
        {showLog && <ProgressionLogPanel entries={progressionLog} loading={logLoading} />}
      </div>
    </div>
  );
};

export default PyramidAdminPanel;
