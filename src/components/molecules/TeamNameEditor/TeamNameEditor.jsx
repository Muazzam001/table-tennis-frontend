/**
 * Editable team name only (division is shown separately on the card badge).
 */
const TeamNameEditor = ({
  teamName,
  fallbackNumber,
  onChange,
  disabled = false,
  id,
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">
      Team name
    </label>
    <input
      id={id}
      type="text"
      value={teamName}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={fallbackNumber != null ? String(fallbackNumber) : 'Team name'}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
    />
  </div>
);

export default TeamNameEditor;
