import Button from '@/components/atoms/Button';

const TournamentSetupPanel = ({
  setupOptions,
  selectedGroupCount,
  onGroupCountChange,
  onGenerate,
  generating,
  isAdmin,
  divisionLabel = 'this division',
  timeSlotSummary = null,
  courtSummary = null,
  matchesPerWeekday = null,
}) => {
  if (!setupOptions) return null;

  const {
    teamCount,
    playerCount,
    isValid,
    isEven,
    isSingleGroup,
    validGroupCounts,
    defaultGroupCount,
    rejectionReason,
    suggestedConfig,
    scheduling,
  } = setupOptions;

  const activeGroupCount = selectedGroupCount ?? defaultGroupCount;
  const groupSize = activeGroupCount ? teamCount / activeGroupCount : 0;
  const expectedQualifyingMatches = activeGroupCount && groupSize >= 2 ? activeGroupCount * ((groupSize * (groupSize - 1)) / 2) : 0;
  const expectedPerGroup = groupSize >= 2 ? (groupSize * (groupSize - 1)) / 2 : 0;
  const slotsPerDay = scheduling?.slotsPerWeekday ?? timeSlotSummary?.slotsPerWeekday ?? 6;
  const courtCount = scheduling?.courtConfig?.courtCount ?? courtSummary?.courtCount ?? 1;
  const matchesPerDay =
    scheduling?.matchesPerWeekday ?? matchesPerWeekday ?? slotsPerDay * courtCount;
  const timeRangeLabel = scheduling?.timeRangeLabel ?? timeSlotSummary?.timeRangeLabel ?? '19:00–22:00';
  const intervalMinutes = scheduling?.timeSlotConfig?.intervalMinutes ?? timeSlotSummary?.intervalMinutes ?? 30;
  const courtLabel = courtCount > 1 ? `${courtCount} courts` : '1 court';
  const knockoutHint = (() => {
    if (!isSingleGroup) return null;
    if (teamCount === 4) return 'Top 2 after round-robin advance directly to the Final.';
    if (teamCount === 6) return 'Top 4 after round-robin advance to Semi-finals, then Final.';
    return null;
  })();

  if (!isAdmin) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        {teamCount} teams in this division.
        {playerCount != null && <span> ({playerCount} players)</span>}
        {!isValid && rejectionReason && <p className="mt-2 text-amber-700">{rejectionReason}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">{divisionLabel} — Tournament setup</h3>

        <p className="text-sm text-gray-600 mt-1">
          Uses all <strong>{teamCount}</strong> teams in {divisionLabel} only.
          {playerCount != null && (
            <span> ({playerCount} players — single group when ≤14 players or ≤7 teams)</span>
          )}
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

      {isValid && isSingleGroup && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
          <p className="font-medium">Single group (no split)</p>

          <p className="mt-1">
            All {teamCount} teams play each other once in one group ({expectedQualifyingMatches}{' '}
            qualifying matches).
            {expectedQualifyingMatches > 0 && (
              <>
                {' '}
                {scheduling?.minimumWeekdays ?? Math.ceil(expectedQualifyingMatches / matchesPerDay)} weekdays needed
                ({matchesPerDay} matches/day across {courtLabel}, {timeRangeLabel}).
              </>
            )}
          </p>

          {knockoutHint && <p className="mt-1">{knockoutHint}</p>}
        </div>
      )}

      {isValid && !isSingleGroup && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of groups</label>

            <div className="flex flex-wrap gap-2">

              {validGroupCounts.map((count) => {
                const size = teamCount / count;
                const isSelected = (selectedGroupCount ?? defaultGroupCount) === count;

                return (
                  <Button
                    key={count}
                    type="button"
                    onClick={() => onGroupCountChange(count)}
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                  >
                    {count} groups × {size} teams
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
                  <strong>{scheduling?.minimumWeekdays ?? Math.ceil(expectedQualifyingMatches / matchesPerDay)}</strong>{' '}
                  weekdays ({matchesPerDay} matches/day across {courtLabel}, {timeRangeLabel}, {intervalMinutes}-min intervals).
                </>
              )}

              {suggestedConfig && (
                <> Default: {suggestedConfig.groupCount} groups of {suggestedConfig.groupSize}.</>
              )}
            </p>
          </div>
        </>
      )}

      {isValid && (
        <Button onClick={onGenerate} variant="primary" disabled={generating}>
          {generating ? 'Generating...' : isSingleGroup ? `Generate ${divisionLabel} Schedule (Single Group)` : `Generate ${divisionLabel} Group Stage`}
        </Button>
      )}
    </div>
  );
};

export default TournamentSetupPanel;