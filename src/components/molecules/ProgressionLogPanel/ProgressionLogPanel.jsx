const REASON_LABELS = {
  auto: 'Auto',
  manual_override: 'Manual override',
  withdrawal: 'Withdrawal',
  regeneration: 'Regeneration',
};

const formatTimestamp = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ProgressionLogPanel = ({ entries = [], loading = false, compact = false }) => {
  if (loading) {
    return <p className="text-sm text-gray-500">Loading progression log…</p>;
  }

  if (!entries.length) {
    return (
      <p className="text-sm text-gray-500">
        No advancement events recorded yet. Progression is logged when stages complete or admins override.
      </p>
    );
  }

  return (
    <div className={`overflow-x-auto ${compact ? '' : 'border border-gray-200 rounded-lg'}`}>
      <table className="min-w-full text-sm">
        <thead className={compact ? 'text-left text-gray-500' : 'bg-gray-50 text-left text-gray-600'}>
          <tr>
            <th className="px-3 py-2 font-medium">When</th>
            <th className="px-3 py-2 font-medium">Team</th>
            <th className="px-3 py-2 font-medium">Change</th>
            <th className="px-3 py-2 font-medium">Reason</th>
            {!compact && <th className="px-3 py-2 font-medium">Notes</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <tr key={entry.id} className="text-gray-800">
              <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                {formatTimestamp(entry.created_at)}
              </td>
              <td className="px-3 py-2 font-medium">{entry.team_name}</td>
              <td className="px-3 py-2">
                <span className="text-gray-500">{entry.from_stage}</span>
                <span className="mx-1">→</span>
                <span className="font-medium">{entry.to_stage}</span>
                <span className="text-gray-400 text-xs ml-1">
                  ({entry.from_status} → {entry.to_status})
                </span>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    entry.reason === 'manual_override'
                      ? 'bg-purple-100 text-purple-800'
                      : entry.reason === 'regeneration'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {REASON_LABELS[entry.reason] || entry.reason}
                </span>
              </td>
              {!compact && (
                <td className="px-3 py-2 text-gray-500 max-w-xs truncate" title={entry.notes || ''}>
                  {entry.notes || '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProgressionLogPanel;
