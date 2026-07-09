import MatchResultIcon, { getTeamRowClass } from '@/components/atoms/MatchResultIcon';
import TierBadge from '@/components/atoms/TierBadge/TierBadge';

const BracketMatchCard = ({ match, accent }) => {
  if (!match) return null;
  const team1Won = match.winner_team_id === match.team1_id;
  const team2Won = match.winner_team_id === match.team2_id;
  const hasResult = match.status === 'Completed' && match.winner_team_id;

  return (
    <div className={`border rounded-lg p-3 ${accent}`}>
      {match.pairingHint ? (
        <div className="text-xs font-semibold text-teal-800 mb-2">{match.pairingHint}</div>
      ) : (
        <div className="text-xs text-gray-500 mb-2">{match.label || match.round_type}</div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <div
          className={`flex items-center justify-between gap-2 text-sm font-medium p-2 rounded-lg ${getTeamRowClass(
            team1Won,
            hasResult && team2Won
          )}`}
        >
          <span className="flex items-center gap-1.5 min-w-0 relative">
            <span className="truncate">{match.team1_name || 'TBD'}</span>
            <TierBadge className="absolute -end-5 -top-5" tier={match.team1_tier} />
          </span>
          {hasResult && <MatchResultIcon won={team1Won} lost={team2Won} size="sm" />}
        </div>
        <div className="text-center text-xs text-gray-400 my-1">vs</div>
        <div
          className={`flex items-center justify-between gap-2 text-sm font-medium p-2 rounded-lg ${getTeamRowClass(
            team2Won,
            hasResult && team1Won
          )}`}
        >
          <span className="flex items-center gap-1.5 min-w-0 relative">
            <span className="truncate">{match.team2_name || 'TBD'}</span>
            <TierBadge className="absolute -end-5 -top-5" tier={match.team2_tier} />
          </span>
          {hasResult && <MatchResultIcon won={team2Won} lost={team1Won} size="sm" />}
        </div>
      </div>
    </div>
  );
};

/**
 * Focused bracket panel for one Level 1B knockout round.
 * @param {{ round: { title: string, subtitle: string, matches: object[] } | null, emptyMessage?: string }} props
 */
const Level1BBracketRound = ({ round, emptyMessage = 'No matches in this round yet.' }) => {
  if (!round || round.matches.length === 0) {
    return (
      <div className="text-center py-10 text-gray-600 bg-teal-50/50 rounded-lg border border-teal-100">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-bold text-gray-900">{round.title}</h4>
        <p className="text-sm text-gray-600">{round.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {round.matches.map((m) => (
          <BracketMatchCard key={m.id} match={m} accent="bg-white/80 border-teal-100" />
        ))}
      </div>
    </div>
  );
};

export default Level1BBracketRound;
