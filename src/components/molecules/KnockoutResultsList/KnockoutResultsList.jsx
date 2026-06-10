const formatDate = (dateString) => {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ROUND_STYLES = {
  Final: { badge: 'text-purple-600 bg-purple-50', title: '🏆 Final' },
  'Third Place': { badge: 'text-amber-700 bg-amber-50', title: '🥉 Third Place' },
  'Semi Final': { badge: 'text-blue-600 bg-blue-50', title: '🥈 Semi Finals' },
  'Quarter Final': { badge: 'text-orange-600 bg-orange-50', title: 'Quarter Finals' },
};

const KnockoutMatchCard = ({ match }) => {
  const style = ROUND_STYLES[match.round_type] || ROUND_STYLES['Quarter Final'];
  const winnerName =
    match.winner_team_id === match.team1_id ? match.team1_name : match.team2_name;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded ${style.badge}`}>
          {match.round_type}
        </span>
        <span className="text-xs text-gray-500">{formatDate(match.scheduled_date)}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div
            className={`font-medium ${match.winner_team_id === match.team1_id ? 'text-green-600' : ''}`}
          >
            {match.team1_name}
          </div>
          <div
            className={`font-medium mt-1 ${match.winner_team_id === match.team2_id ? 'text-green-600' : ''}`}
          >
            {match.team2_name}
          </div>
        </div>
        <div className="text-right">
          {match.status === 'Completed' ? (
            <>
              <div className="font-bold text-lg">{match.score_team1 ?? 0}</div>
              <div className="font-bold text-lg mt-1">{match.score_team2 ?? 0}</div>
              {match.winner_team_id && (
                <div className="text-xs text-green-600 font-semibold mt-1">
                  Winner: {winnerName}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-400 text-sm">{match.status || 'Scheduled'}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const KnockoutRoundSection = ({ title, matches }) => {
  if (!matches?.length) return null;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {matches.map((match) => (
          <KnockoutMatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};

/**
 * Detailed knockout results (reverse progression order), from the former Statistics page.
 */
const KnockoutResultsList = ({ matches = [] }) => {
  const byRound = (roundType) =>
    matches
      .filter((m) => m.round_type === roundType)
      .sort(
        (a, b) =>
          new Date(b.scheduled_date || b.created_at) - new Date(a.scheduled_date || a.created_at)
      );

  const finalMatches = byRound('Final');
  const thirdPlaceMatches = byRound('Third Place');
  const semiFinalMatches = byRound('Semi Final');
  const quarterFinalMatches = byRound('Quarter Final');

  const hasAny =
    finalMatches.length > 0 ||
    thirdPlaceMatches.length > 0 ||
    semiFinalMatches.length > 0 ||
    quarterFinalMatches.length > 0;

  if (!hasAny) {
    return (
      <div className="text-center py-8 text-gray-600 bg-white rounded-lg border border-gray-200">
        No knockout matches yet. Complete the group stage and generate knockout rounds on the
        Matches page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KnockoutRoundSection title={ROUND_STYLES.Final.title} matches={finalMatches} />
      <KnockoutRoundSection title={ROUND_STYLES['Third Place'].title} matches={thirdPlaceMatches} />
      <KnockoutRoundSection title={ROUND_STYLES['Semi Final'].title} matches={semiFinalMatches} />
      <KnockoutRoundSection title={ROUND_STYLES['Quarter Final'].title} matches={quarterFinalMatches} />
    </div>
  );
};

export default KnockoutResultsList;
