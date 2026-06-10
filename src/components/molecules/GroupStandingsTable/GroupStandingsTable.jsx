const GroupStandingsTable = ({ groupId, standings, qualifiersCount = 2 }) => (
  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">Group {groupId} Standings</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left p-2">Rank</th>
            <th className="text-left p-2">Team</th>
            <th className="text-center p-2">P</th>
            <th className="text-center p-2">W</th>
            <th className="text-center p-2">L</th>
            <th className="text-center p-2">Pts</th>
            <th className="text-center p-2">GD</th>
          </tr>
        </thead>
        <tbody>
          {standings?.length > 0 ? (
            standings.map((team) => (
              <tr
                key={team.id}
                className={team.rank <= qualifiersCount ? 'bg-green-50' : ''}
              >
                <td className="p-2 font-semibold">{team.rank}</td>
                <td className="p-2 font-medium">{team.team_name}</td>
                <td className="p-2 text-center">{team.matches_played || 0}</td>
                <td className="p-2 text-center">{team.matches_won || 0}</td>
                <td className="p-2 text-center">{team.matches_lost || 0}</td>
                <td className="p-2 text-center font-bold">{team.points || 0}</td>
                <td className="p-2 text-center">{team.game_difference ?? 0}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="p-4 text-center text-gray-500">
                No standings yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">
        Top {qualifiersCount} teams qualify for knockout stage
      </p>
    </div>
  </div>
);

export default GroupStandingsTable;
