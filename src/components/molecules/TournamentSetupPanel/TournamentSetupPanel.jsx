import Button from '../../atoms/Button';

const TournamentSetupPanel = ({
  setupOptions,
  selectedGroupCount,
  onGroupCountChange,
  onGenerate,
  generating,
  isAdmin,
}) => {
  if (!setupOptions) return null;

  const {
    teamCount,
    isValid,
    isEven,
    validGroupCounts,
    defaultGroupCount,
    rejectionReason,
    suggestedConfig,
    scheduling,
  } = setupOptions;

  const activeGroupCount = selectedGroupCount ?? defaultGroupCount;
  const groupSize = activeGroupCount ? teamCount / activeGroupCount : 0;
  const expectedQualifyingMatches =
    activeGroupCount && groupSize >= 2
      ? activeGroupCount * ((groupSize * (groupSize - 1)) / 2)
      : 0;
  const expectedPerGroup = groupSize >= 2 ? (groupSize * (groupSize - 1)) / 2 : 0;

  if (!isAdmin) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        {teamCount} teams in this league.
        {!isValid && rejectionReason && <p className="mt-2 text-amber-700">{rejectionReason}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Tournament setup</h3>
        <p className="text-sm text-gray-600 mt-1">
          Uses all <strong>{teamCount}</strong> teams in this league. Only even team counts are supported.
        </p>
      </div>

      {!isEven && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded text-sm">
          {rejectionReason}
        </div>
      )}

      {isEven && !isValid && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded text-sm">
          {rejectionReason}
        </div>
      )}

      {isValid && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of groups</label>
            <div className="flex flex-wrap gap-2">
              {validGroupCounts.map((count) => {
                const groupSize = teamCount / count;
                const isSelected = (selectedGroupCount ?? defaultGroupCount) === count;
                return (
                  <Button
                    key={count}
                    type="button"
                    onClick={() => onGroupCountChange(count)}
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                  >
                    {count} groups × {groupSize} teams
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Top 2 per group advance ({activeGroupCount * 2} knockout slots).
              {expectedQualifyingMatches > 0 && (
                <>
                  {' '}
                  Creates <strong>{expectedQualifyingMatches}</strong> qualifying matches (
                  {expectedPerGroup} per group). Needs{' '}
                  <strong>{scheduling?.minimumWeekdays ?? Math.ceil(expectedQualifyingMatches / 6)}</strong>{' '}
                  weekdays (6 slots/day, 7–10 PM).
                </>
              )}
              {suggestedConfig && (
                <> Default: {suggestedConfig.groupCount} groups of {suggestedConfig.groupSize}.</>
              )}
            </p>
          </div>

          <Button onClick={onGenerate} variant="primary" disabled={generating}>
            {generating ? 'Generating...' : 'Generate Group Stage'}
          </Button>
        </>
      )}
    </div>
  );
};

export default TournamentSetupPanel;
