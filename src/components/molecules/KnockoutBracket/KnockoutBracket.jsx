const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const BracketMatch = ({ match, accent }) => {
  if (!match) return null;

  const team1Won = match.winner_team_id === match.team1_id;
  const team2Won = match.winner_team_id === match.team2_id;
  const winnerName =
    match.winner_team_id === match.team1_id
      ? match.team1_name
      : match.winner_team_id === match.team2_id
        ? match.team2_name
        : null;

  return (
    <div className={`border rounded-lg p-3 ${accent}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-500">{match.label}</span>
        {match.scheduled_date && (
          <span className="text-xs text-gray-400">{formatDate(match.scheduled_date)}</span>
        )}
      </div>
      <div className={`text-sm font-medium ${team1Won ? 'text-green-700' : 'text-gray-800'}`}>
        {match.team1_name || 'TBD'}
        {match.status === 'Completed' && (
          <span className="float-right">{match.score_team1 ?? ''}</span>
        )}
      </div>
      <div className="text-center text-xs text-gray-400 my-1">vs</div>
      <div className={`text-sm font-medium ${team2Won ? 'text-green-700' : 'text-gray-800'}`}>
        {match.team2_name || 'TBD'}
        {match.status === 'Completed' && (
          <span className="float-right">{match.score_team2 ?? ''}</span>
        )}
      </div>
      {match.status === 'Completed' && winnerName && (
        <div className="text-xs text-green-600 font-semibold mt-2 pt-2 border-t border-gray-200/80">
          Winner: {winnerName}
        </div>
      )}
    </div>
  );
};

const KnockoutBracket = ({ bracket }) => {
  if (!bracket) return null;

  return (
    <div className="space-y-6">
      {bracket.quarterFinals?.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Quarterfinals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {bracket.quarterFinals.map((match) => (
              <BracketMatch key={match.id || match.label} match={match} accent="border-orange-200 bg-orange-50/40" />
            ))}
          </div>
        </div>
      )}

      {bracket.semiFinals?.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Semifinals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            {bracket.semiFinals.map((match) => (
              <BracketMatch key={match.id || match.label} match={match} accent="border-blue-200 bg-blue-50/40" />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {bracket.final && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Final</h3>
            <BracketMatch match={bracket.final} accent="border-purple-300 bg-purple-50/50" />
          </div>
        )}
        {bracket.thirdPlace && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Third Place</h3>
            <BracketMatch match={bracket.thirdPlace} accent="border-amber-200 bg-amber-50/40" />
          </div>
        )}
      </div>
    </div>
  );
};

export default KnockoutBracket;
