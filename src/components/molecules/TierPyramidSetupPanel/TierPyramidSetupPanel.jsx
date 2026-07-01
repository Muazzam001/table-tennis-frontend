import Button from '@/components/atoms/Button';

const TierPyramidSetupPanel = ({
  setupOptions,
  onGenerate,
  generating = false,
  isAdmin = false,
  divisionLabel = '',
  tiersComplete = false,
  level1MatchCount = 0,
  timeSlotSummary,
  courtSummary,
  matchesPerWeekday,
}) => {
  if (!isAdmin || !setupOptions) return null;

  const { isValid, matchCounts, tierRequirements, errors, rejectionReason } = setupOptions;
  const counts = matchCounts || {};

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Tier Pyramid — {divisionLabel}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Level 1 runs S1 (Tier 2/3 group play) and S2 (Tier 1 round-robin) in parallel. Later levels
          are generated automatically as matches complete.
        </p>
      </div>

      {tierRequirements && (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-900">{tierRequirements.tier1}</div>
            <div className="text-amber-800">Tier 1</div>
          </div>
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-800">{tierRequirements.tier2}</div>
            <div className="text-gray-600">Tier 2</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-900">{tierRequirements.tier3}</div>
            <div className="text-orange-800">Tier 3</div>
          </div>
        </div>
      )}

      {isValid && (
        <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <p>
            Level 1: <strong>{counts.level1Total ?? counts.s1 + counts.s2}</strong> matches (S1:{' '}
            {counts.s1}, S2: {counts.s2}) · Knockout: L2 {counts.level2}, L3 QF {counts.level3}, SF{' '}
          {counts.semifinals ?? 2}, Final + Third · Total: <strong>{counts.total}</strong>
          </p>
          {timeSlotSummary && courtSummary && matchesPerWeekday > 0 && (
            <p className="mt-1 text-gray-500">
              ~{Math.ceil((counts.level1Total || level1MatchCount) / matchesPerWeekday)} weekdays at{' '}
              {matchesPerWeekday} matches/day ({timeSlotSummary.timeRangeLabel}, {courtSummary.label})
            </p>
          )}
        </div>
      )}

      {!tiersComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900">
          Assign tiers to all entrants above before generating the schedule.
        </div>
      )}

      {!isValid && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-900">
          {rejectionReason || errors?.[0] || 'Invalid team count for Tier Pyramid configuration.'}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button
          onClick={onGenerate}
          variant="primary"
          disabled={generating || !isValid || !tiersComplete}
        >
          {generating ? 'Generating…' : 'Generate Level 1 schedule (S1 + S2)'}
        </Button>
      </div>
    </div>
  );
};

export default TierPyramidSetupPanel;
