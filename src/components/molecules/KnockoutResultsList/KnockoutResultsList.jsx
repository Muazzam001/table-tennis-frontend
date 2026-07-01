import MatchResultIcon, { getTeamRowClass } from '@/components/atoms/MatchResultIcon';
import { getSetCountForRound } from '@/config/matchSetConfig';

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
  Final: {
    badge: 'text-purple-600 bg-purple-50',
    title: '🏆 Final',
    sectionClass: 'border-purple-200',
    gridClass: 'grid grid-cols-1 gap-4 max-w-3xl mx-auto w-full',
  },
  'Third Place': {
    badge: 'text-amber-700 bg-amber-50',
    title: '🥉 Third Place',
    sectionClass: 'border-amber-200',
    gridClass: 'grid grid-cols-1 gap-3 max-w-lg mx-auto w-full',
  },
  'Semi Final': {
    badge: 'text-blue-600 bg-blue-50',
    title: '🥈 Semi Finals',
    sectionClass: 'border-blue-200',
    gridClass: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  },
  'Quarter Final': {
    badge: 'text-orange-600 bg-orange-50',
    title: 'Quarter Finals',
    sectionClass: 'border-orange-200',
    gridClass: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  },
};

const KnockoutMatchCard = ({ match }) => {
  const style = ROUND_STYLES[match.round_type] || ROUND_STYLES['Quarter Final'];
  const team1Won = match.winner_team_id === match.team1_id;
  const team2Won = match.winner_team_id === match.team2_id;
  const hasResult = match.status === 'Completed' && match.winner_team_id;
  const totalSets = getSetCountForRound(match.round_type);

  return (
    <div className="border border-gray-200 rounded-lg p-4">

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          Best of {totalSets} {hasResult ? `· (${match.score_team1 ?? 0} - ${match.score_team2 ?? 0})` : ''}
        </p>

        <span className="text-xs text-gray-500">{formatDate(match.scheduled_date)}</span>
      </div>

      {match.status === 'Completed' ? (
        <div className="space-y-2">
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${getTeamRowClass(
              team1Won,
              hasResult && team2Won
            )}`}
          >
            <span className="font-medium text-gray-900">{match.team1_name}</span>
            {hasResult && <MatchResultIcon won={team1Won} lost={team2Won} />}
          </div>
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${getTeamRowClass(
              team2Won,
              hasResult && team1Won
            )}`}
          >
            <span className="font-medium text-gray-900">{match.team2_name}</span>
            {hasResult && <MatchResultIcon won={team2Won} lost={team1Won} />}
          </div>
          {/* {hasResult && (
            <p className="text-sm text-green-600 font-medium pt-1">
              🏆 Winner:{' '}
              <span className="font-bold">{team1Won ? match.team1_name : match.team2_name}</span>
            </p>
          )} */}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="font-medium text-gray-900 p-3 rounded-lg bg-gray-50">{match.team1_name}</div>
          <div className="font-medium text-gray-900 p-3 rounded-lg bg-gray-50">{match.team2_name}</div>
          <div className="text-gray-400 text-sm pt-1">{match.status || 'Scheduled'}</div>
        </div>
      )}
    </div>
  );
};

const KnockoutRoundSection = ({ title, matches, roundType }) => {
  if (!matches?.length) return null;

  const style = ROUND_STYLES[roundType] || ROUND_STYLES['Quarter Final'];

  return (
    <div className={`bg-white rounded-lg shadow border p-5 ${style.sectionClass}`}>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <div className={style.gridClass}>
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
    matches.filter((m) => m.round_type === roundType).sort(
      (a, b) => new Date(b.scheduled_date || b.created_at) - new Date(a.scheduled_date || a.created_at)
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
        No knockout-style matches yet. Complete earlier stages and generate semi-finals on the
        Matches page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KnockoutRoundSection
        title={ROUND_STYLES.Final.title}
        matches={finalMatches}
        roundType="Final"
      />

      <KnockoutRoundSection
        title={ROUND_STYLES['Third Place'].title}
        matches={thirdPlaceMatches}
        roundType="Third Place"
      />

      <KnockoutRoundSection
        title={ROUND_STYLES['Semi Final'].title}
        matches={semiFinalMatches}
        roundType="Semi Final"
      />

      <KnockoutRoundSection
        title={ROUND_STYLES['Quarter Final'].title}
        matches={quarterFinalMatches}
        roundType="Quarter Final"
      />
    </div>
  );
};

export default KnockoutResultsList;
