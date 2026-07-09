import Button from '@/components/atoms/Button';
import { updateDivisionTournamentFormat } from '@/services/divisionService';

const TierPyramidConfigPanel = ({
  setupOptions,
  divisionLabel = '',
  onConfigSaved,
  saving = false,
  setSaving,
}) => {
  if (!setupOptions?.config) return null;

  const { config, isDerived, isValid, matchCounts, suggestedConfigs = [], allowImbalancedTiers } =
    setupOptions;

  const handleSaveConfig = async () => {
    if (!setupOptions?.division || !config) return;
    setSaving?.(true);
    try {
      await updateDivisionTournamentFormat(setupOptions.division, 'tier-pyramid', config);
      onConfigSaved?.();
    } finally {
      setSaving?.(false);
    }
  };

  return (
    <div className="bg-white border border-violet-200 rounded-lg p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-gray-900">Pyramid configuration - {divisionLabel}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {isDerived
            ? 'Configuration auto-derived from your roster tier counts.'
            : 'Using saved division configuration.'}
          {allowImbalancedTiers && ' Unequal Tier 2/3 counts are supported.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div className="bg-gray-50 rounded px-3 py-2">
          <div className="text-gray-500">Tiers</div>
          <div className="font-medium">
            {config.tier1Count} / {config.tier2Count} / {config.tier3Count}
          </div>
        </div>
        <div className="bg-gray-50 rounded px-3 py-2">
          <div className="text-gray-500">S1 groups</div>
          <div className="font-medium">
            {config.s1GroupCount} × ~{config.s1GroupSize}
          </div>
        </div>
        <div className="bg-gray-50 rounded px-3 py-2">
          <div className="text-gray-500">S1 → L1B</div>
          <div className="font-medium">Top {config.s1QualifiersPerGroup} per group</div>
        </div>
        <div className="bg-gray-50 rounded px-3 py-2">
          <div className="text-gray-500">L2 bracket</div>
          <div className="font-medium">{matchCounts?.level2Entrants ?? '-'} entrants</div>
        </div>
        <div className="bg-gray-50 rounded px-3 py-2">
          <div className="text-gray-500">Semi-finals</div>
          <div className="font-medium">4 teams (fixed)</div>
        </div>
      </div>

      {isValid && matchCounts && (
        <p className="text-sm text-gray-700">
          Level 1: <strong>{matchCounts.level1Total}</strong> matches · Full event:{' '}
          <strong>{matchCounts.total}</strong> matches
          {matchCounts.level3Entrants > 4 && matchCounts.level3Entrants <= 8 && (
            <span className="text-gray-500"> (Level 3 may use byes before the four-team semi-finals)</span>
          )}
        </p>
      )}

      {suggestedConfigs.length > 1 && (
        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded px-3 py-2">
          <span className="font-medium">Alternative layouts: </span>
          {suggestedConfigs.slice(1, 3).map((entry, index) => (
            <span key={index}>
              {index > 0 ? ' · ' : ''}
              {entry.config.s1GroupCount} groups ({entry.config.tier1Count}/
              {entry.config.tier2Count}/{entry.config.tier3Count})
            </span>
          ))}
        </div>
      )}

      {isDerived && isValid && (
        <div className="flex justify-end">
          <Button onClick={handleSaveConfig} variant="outline" size="sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save derived config'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TierPyramidConfigPanel;
