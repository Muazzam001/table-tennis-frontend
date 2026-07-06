const STATUS_STYLES = {
  Draft: 'bg-gray-100 text-gray-700',
  'Group Stage Active': 'bg-blue-100 text-blue-800',
  'Group Stage Completed': 'bg-indigo-100 text-indigo-800',
  'Quarterfinals Active': 'bg-orange-100 text-orange-800',
  'Semifinals Active': 'bg-cyan-100 text-cyan-800',
  'Final Active': 'bg-purple-100 text-purple-800',
  Completed: 'bg-green-100 text-green-800',
  'Level 1 Active': 'bg-green-100 text-green-800',
  'Level 1A Active': 'bg-green-100 text-green-800',
  'Level 1A Complete': 'bg-teal-50 text-teal-800',
  'Level 1B Waiting': 'bg-slate-100 text-slate-700',
  'Level 1B Ready': 'bg-sky-100 text-sky-800',
  'Level 1B Active': 'bg-sky-200 text-sky-900',
  'Level 1B Complete': 'bg-teal-100 text-teal-800',
  'Level 1 Complete': 'bg-teal-100 text-teal-800',
  'Level 2 Active': 'bg-amber-100 text-amber-900',
  'Level 2 Complete': 'bg-amber-50 text-amber-800',
  'Level 3 Active': 'bg-red-100 text-red-800',
  'Level 3 Complete': 'bg-red-50 text-red-700',
  'Semifinals Complete': 'bg-cyan-50 text-cyan-700',
};

const TournamentStatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.Draft}`}>
    {status || 'Draft'}
  </span>
);

export default TournamentStatusBadge;
