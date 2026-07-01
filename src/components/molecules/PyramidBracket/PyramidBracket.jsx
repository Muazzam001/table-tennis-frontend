import MatchResultIcon, { getTeamRowClass } from '@/components/atoms/MatchResultIcon';
import TierBadge from '@/components/atoms/TierBadge/TierBadge';
import { buildPyramidBracketView } from '@/utils/pyramidBracket';

const BracketMatchCard = ({ match, accent }) => {
  if (!match) return null;
  const team1Won = match.winner_team_id === match.team1_id;
  const team2Won = match.winner_team_id === match.team2_id;
  const hasResult = match.status === 'Completed' && match.winner_team_id;

  return (
    <div className={`border rounded-lg p-3 ${accent}`}>
      <div className="text-xs text-gray-500 mb-2">{match.label || match.round_type}</div>
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
      {match.advancement_source && (
        <p className="text-[10px] text-gray-400 mt-1 truncate" title={match.advancement_source}>
          via {match.advancement_source}
        </p>
      )}
    </div>
  );
};

const StageColumn = ({ title, subtitle, accent, children, locked }) => (
  <div className={`rounded-xl border-2 p-4 min-w-[220px] flex-1 ${accent} ${locked ? 'opacity-60' : ''}`}>
    <div className="mb-3">
      <h4 className="font-bold text-gray-900">{title}</h4>
      <p className="text-xs text-gray-600">{subtitle}</p>
      {locked && <p className="text-xs text-amber-700 mt-1 font-medium">Awaiting prior stage</p>}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const PyramidBracket = ({ overview, readOnly = false }) => {
  const view = buildPyramidBracketView(overview);
  const { stages } = view;
  const hasL1 = view.s1.matches.length > 0 || view.s2.matches.length > 0;
  const hasL2 = view.l2.matches.length > 0;
  const hasL3 = view.l3.matches.length > 0;
  const hasSemiFinals = view.semiFinals.length > 0;
  const hasThirdPlace = Boolean(view.thirdPlace);
  const hasFinal = Boolean(view.final);

  if (!hasL1) {
    return (
      <p className="text-center text-gray-500 py-8">
        {readOnly
          ? 'The pyramid bracket will appear once Level 1 matches are scheduled.'
          : 'Generate the Tier Pyramid Level 1 schedule to see the bracket.'}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Parallel Level 1: S1 (Tier 2/3 groups) and S2 (Tier 1). Winners converge at Level 2 and Level 3.
      </p>
      <div className="overflow-x-auto pb-2 space-y-4">
        <StageColumn
          title={stages.S1.label}
          subtitle={stages.S1.subtitle}
          accent={stages.S1.accent}
        >
          {view.s1.groups.map((group) => (
            <div key={group.id}>
              <p className="text-xs font-semibold text-green-800 mb-1">Group {group.id}</p>
              <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-2">
                {group.matches.map((m) => (
                  <BracketMatchCard key={m.id} match={m} accent="bg-white/80 border-green-100" />
                ))}
                {/* {group.matches.length > 3 && (
                  <p className="text-xs text-gray-500">+{group.matches.length - 3} more matches</p>
                )} */}
              </div>
            </div>
          ))}
        </StageColumn>

        <StageColumn
          title={stages.S2.label}
          subtitle={stages.S2.subtitle}
          accent={stages.S2.accent}
        >
          {view.s2.standings.length > 0 && (
            <>
              <div className="bg-white/80 rounded-lg p-2 text-xs space-y-1 mb-2">
                <p className="font-semibold text-blue-900">Standings (Top 4 → L3)</p>
                {view.s2.standings.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-4">
                    {view.s2.standings.map((row) => (
                      <div key={row.id} className="flex justify-between gap-2">
                        <span>#{row.rank} {row.team_name}</span>
                        <span className="text-gray-500">{row.matches_won}W</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {view.s2.matches.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-2">
              {view.s2.matches.map((m) => (
                <BracketMatchCard key={m.id} match={m} accent="bg-white/80 border-blue-100" />
              ))}
            </div>
          )}

          {/* {view.s2.matches.length > 2 && (
            <p className="text-xs text-gray-500">+{view.s2.matches.length - 2} round-robin matches</p>
          )} */}
        </StageColumn>

        <StageColumn
          title={stages.L2.label}
          subtitle={stages.L2.subtitle}
          accent={stages.L2.accent}
          locked={!hasL2}
        >
          {
            hasL2 ? (
              <>
                {view.l2.matches.length > 0 && (
                  <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-2">
                    {view.l2.matches.map((m) => (
                      <BracketMatchCard
                        key={m.id}
                        match={m}
                        accent="bg-white/80 border-amber-100"
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-600">
                S1 + S2 must complete first
              </p>
            )
          }
        </StageColumn>

        <StageColumn
          title={stages.L3.label}
          subtitle={stages.L3.subtitle}
          accent={stages.L3.accent}
          locked={!hasL3}
        >
          {hasL3 ? (
            <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
              {view.l3.matches.map((m) => (
                <BracketMatchCard key={m.id} match={m} accent="bg-white/80 border-red-100" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600">Level 2 must complete first</p>
          )}
        </StageColumn>

        <StageColumn
          title={stages.SF.label}
          subtitle={stages.SF.subtitle}
          accent={stages.SF.accent}
          locked={!hasSemiFinals}
        >
          {hasSemiFinals ? (
            <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {view.semiFinals.map((m) => (
                <BracketMatchCard key={m.id} match={m} accent="bg-white/80 border-orange-100" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600">Level 3 must complete first</p>
          )}
        </StageColumn>

        <StageColumn
          title={stages.ThirdPlace.label}
          subtitle={stages.ThirdPlace.subtitle}
          accent={stages.ThirdPlace.accent}
          locked={!hasThirdPlace}
        >
          {hasThirdPlace ? (
            <BracketMatchCard match={view.thirdPlace} accent="bg-white/80 border-amber-200" />
          ) : (
            <p className="text-xs text-gray-600">
              Created automatically after semi-finals when available (optional)
            </p>
          )}
        </StageColumn>

        <StageColumn
          title={stages.Final.label}
          subtitle={stages.Final.subtitle}
          accent={stages.Final.accent}
          locked={!hasFinal}
        >
          {hasFinal ? (
            <BracketMatchCard match={view.final} accent="bg-white/80 border-purple-200" />
          ) : (
            <p className="text-xs text-gray-600">Semi-finals must complete first</p>
          )}
        </StageColumn>
      </div>

      {view.entrants.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Entrant paths</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-xs">
            {view.entrants.filter((e) => e.pyramid_stage && e.pyramid_stage !== 'registered').map((e) => (
              <div key={e.id} className="flex justify-between items-center gap-2 text-gray-700 relative">
                <span className="font-medium truncate">{e.team_name}</span>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400 truncate">{e.advancement_source || e.pyramid_stage}</span>
                  <TierBadge tier={e.tier} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PyramidBracket;
