export const getTeamRowClass = (won, lost) => {
  if (won) return 'bg-green-50 border-2 border-green-300';
  if (lost) return 'bg-red-50 border-2 border-red-200';
  return 'bg-gray-50 border-2 border-transparent';
};

const MatchResultIcon = ({ won, lost, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'text-lg' : 'text-2xl';
  const lostSizeClass = size === 'sm' ? 'text-base' : 'text-xl';

  if (won) {
    return (
      <span className={sizeClass} aria-label="Winner" title="Winner">
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
