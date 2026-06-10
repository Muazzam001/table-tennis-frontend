const STATUS_STYLES = {
  Draft: 'bg-gray-100 text-gray-700',
  'Group Stage Active': 'bg-blue-100 text-blue-800',
  'Group Stage Completed': 'bg-indigo-100 text-indigo-800',
  'Quarterfinals Active': 'bg-orange-100 text-orange-800',
  'Semifinals Active': 'bg-cyan-100 text-cyan-800',
  'Final Active': 'bg-purple-100 text-purple-800',
  Completed: 'bg-green-100 text-green-800',
};

const TournamentStatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.Draft}`}>
    {status || 'Draft'}
  </span>
);

export default TournamentStatusBadge;
