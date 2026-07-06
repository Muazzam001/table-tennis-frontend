const formatGD = (value) => {
  const n = Number(value ?? 0);
  const formatted = Math.abs(n).toFixed(3);
  if (n > 0) return `+${formatted}`;
  if (n < 0) return `-${formatted}`;
  return formatted;
};

const GroupStandingsTable = ({
  groupId,
  standings,
  qualifiersCount = 2,
  qualifierLabel,
  showSourceGroup = false,
}) => (
  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">Group {groupId} Standings</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left p-2">Rank</th>
            {showSourceGroup && <th className="text-left p-2">Source</th>}
            <th className="text-left p-2">Team</th>
            <th className="text-center p-2">P</th>
            <th className="text-center p-2">W</th>
            <th className="text-center p-2">L</th>
            <th className="text-center p-2">Pts</th>
            <th className="text-center p-2" title="Set GD — NRR-style: (sets won per match) − (sets lost per match)">
              GD / NRR
            </th>
          </tr>
        </thead>
        <tbody>
          {standings?.length > 0 ? (
            standings.map((team) => (
              <tr
                key={team.id}
                className={(team.matches_played > 0 && team.rank <= qualifiersCount) ? 'bg-green-50' : ''}
              >
                <td className="p-2 font-semibold">{team.rank}</td>
                {showSourceGroup && (
                  <td className="p-2 text-gray-600">
                    {team.sourceGroup
                      ? `G${team.sourceGroup}-${team.groupRank ?? ''}`
                      : '—'}
                  </td>
                )}
                <td className="p-2 font-medium">{team.team_name}</td>
                <td className="p-2 text-center">{team.matches_played || 0}</td>
                <td className="p-2 text-center">{team.matches_won || 0}</td>
                <td className="p-2 text-center">{team.matches_lost || 0}</td>
                <td className="p-2 text-center font-bold">{team.points || 0}</td>
                <td className="p-2 text-center font-medium tabular-nums">
                  {formatGD(team.set_difference ?? team.game_difference)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={showSourceGroup ? 8 : 7} className="p-4 text-center text-gray-500">
                No standings yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">
        Top {qualifiersCount} {qualifierLabel || 'teams qualify for knockout stage'}. GD uses NRR-style set rates
        (sets won per match − sets lost per match). Tie-break order: points → set GD → game-point GD → margin
        quality (knockout/shutout) → dominance → mini-league → head-to-head. Game length (11 or 21) is set on
        the Matches page; enter per-set scores for accurate tie-breaks.
      </p>
    </div>
  </div>
);

export default GroupStandingsTable;
