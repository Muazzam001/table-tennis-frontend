import MatchResultIcon, { getTeamRowClass } from '@/components/atoms/MatchResultIcon';
import { getSetCountForRound } from '@/config/matchSetConfig';

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
  const hasResult = match.status === 'Completed' && match.winner_team_id;
  const totalSets = getSetCountForRound(match.round_type);

  return (
    <div className={`border rounded-lg p-3 ${accent}`}>
      <div
        className={`flex items-center justify-between gap-2 text-sm font-medium p-2 rounded-lg ${getTeamRowClass(
          team1Won,
          hasResult && team2Won
        )}`}
      >
        <span>{match.team1_name || 'TBD'}</span>
        {hasResult && <MatchResultIcon won={team1Won} lost={team2Won} size="sm" />}
      </div>
      
      <div className="text-center text-xs text-gray-400 my-1">vs</div>
      
      <div
        className={`flex items-center justify-between gap-2 text-sm font-medium p-2 rounded-lg ${getTeamRowClass(
          team2Won,
          hasResult && team1Won
        )}`}
      >
        <span>{match.team2_name || 'TBD'}</span>
        {hasResult && <MatchResultIcon won={team2Won} lost={team1Won} size="sm" />}
      </div>

      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="mt-2 text-xs text-gray-500">
          Best of {totalSets} {hasResult ? `· (${match.score_team1 ?? 0} - ${match.score_team2 ?? 0}` : ''})
        </div>
        {match.scheduled_date && (
          <span className="text-xs text-gray-400">{formatDate(match.scheduled_date)}</span>
        )}
      </div>
      {/* {hasResult && (
        <div className="text-xs text-green-600 font-semibold mt-2 pt-2 border-t border-gray-200/80">
          🏆 Winner: {team1Won ? match.team1_name : match.team2_name}
        </div>
      )} */}
    </div>
  );
};

const KnockoutBracket = ({ bracket }) => {
  if (!bracket) return null;

  const hasTraditionalRounds =
    (bracket.quarterFinals?.length || 0) > 0 || (bracket.semiFinals?.length || 0) > 0;

  return (
    <div className="space-y-6">
      {bracket.hasDirectFinal && (bracket.final || bracket.thirdPlace) && (
        <p className="text-sm text-gray-600 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
          Single-group format: teams played a full round-robin, then advanced directly to the Final
          and Third Place matches.
        </p>
      )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3/5">
            {bracket.semiFinals.map((match) => (
              <BracketMatch key={match.id || match.label} match={match} accent="border-blue-200 bg-blue-50/40" />
            ))}
          </div>
        </div>
      )}

      {bracket.final && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Final</h3>
          <div className="grid grid-cols-1 gap-4 max-w-3xl">
            <BracketMatch match={bracket.final} accent="border-purple-300 bg-purple-50/50" />
          </div>
        </div>
      )}

      {bracket.thirdPlace && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Third Place</h3>
          <div className="grid grid-cols-1 gap-4 max-w-xl">
            <BracketMatch match={bracket.thirdPlace} accent="border-amber-200 bg-amber-50/40" />
          </div>
        </div>
      )}

      {!hasTraditionalRounds && !bracket.final && !bracket.thirdPlace && (
        <div className="text-center py-8 text-gray-600">
          Knockout matches will appear here after they are generated on the Matches page.
        </div>
      )}
    </div>
  );
};

export default KnockoutBracket;
