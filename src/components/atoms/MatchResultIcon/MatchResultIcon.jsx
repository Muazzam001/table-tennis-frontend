export const getTeamRowClass = (won, lost) => {
  if (won) return 'bg-green-50 border-green-300';
  if (lost) return 'bg-red-50 border-red-200';
  return 'bg-gray-100 border-transparent';
};

const MatchResultIcon = ({ won, lost, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'text-lg' : 'text-xl';
  const lostSizeClass = size === 'sm' ? 'text-base' : 'text-xl';

  if (won) {
    return (
      <span className={`${sizeClass}`} aria-label="Winner" title="Winner">
        🏆
      </span>
    );
  }
  if (lost) {
    return (
      <span className={`${lostSizeClass} font-bold text-red-400`} aria-label="Lost" title="Lost">
        ✗
      </span>
    );
  }
  return null;
};

export default MatchResultIcon;
