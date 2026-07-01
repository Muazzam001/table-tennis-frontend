import { useEffect, useMemo, useState } from 'react';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { getSetCountForRound, getGamePointsPerSet } from '@/config/matchSetConfig';
import { parseSetGameScores } from '@shared/tournament/standings.js';
import {
  classifySetMargin,
  getGamePointRules,
  getSetMarginLabel,
  getSetScoreValidationMessage,
  normalizeGamePointsPerSet,
  sanitizeIntegerInput,
} from '@shared/tournament/gamePointRules.js';

const parseInitialSetScores = (match) => {
  const parsed = parseSetGameScores(match) || [];
  const mapped = parsed.map((set) => ({
    team1: String(set.team1),
    team2: String(set.team2),
  }));

  const playedSets = (Number(match.score_team1) || 0) + (Number(match.score_team2) || 0);
  if (playedSets <= mapped.length) {
    return mapped.slice(0, playedSets);
  }

  return [
    ...mapped,
    ...Array.from({ length: playedSets - mapped.length }, () => ({ team1: '', team2: '' })),
  ];
};

const marginLabel = (team1Points, team2Points, format) => {
  const p1 = parseInt(team1Points, 10);
  const p2 = parseInt(team2Points, 10);
  if (!Number.isFinite(p1) || !Number.isFinite(p2) || p1 === p2) return null;
  const winnerPoints = Math.max(p1, p2);
  const loserPoints = Math.min(p1, p2);
  const tier = classifySetMargin(winnerPoints, loserPoints, format);
  return getSetMarginLabel(tier);
};

// Form component for updating match result
const MatchResultForm = ({
  match,
  onSubmit,
  onCancel,
  onWinnerChange,
  setConfig,
  embedded = false,
  formId,
}) => {
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const totalSets = getSetCountForRound(match.round_type, setConfig);
  const setsNeededToWin = Math.floor(totalSets / 2) + 1;
  const gamePointFormat = normalizeGamePointsPerSet(
    match.game_point_format ?? getGamePointsPerSet(setConfig)
  );
  const gamePointRules = getGamePointRules(gamePointFormat);

  const [formData, setFormData] = useState({
    score_team1: match.score_team1 || 0,
    score_team2: match.score_team2 || 0,
    winner_team_id: match.winner_team_id || '',
    is_abandoned: match.is_abandoned || false,
    abandoned_reason: match.abandoned_reason || '',
    scheduled_date: formatDateForInput(match.scheduled_date),
    venue: match.venue || '',
  });
  const [setGameScores, setSetGameScores] = useState(parseInitialSetScores(match));
  const [errors, setErrors] = useState({});

  const playedSetCount = useMemo(() => {
    const score1 = parseInt(formData.score_team1, 10) || 0;
    const score2 = parseInt(formData.score_team2, 10) || 0;
    return score1 + score2;
  }, [formData.score_team1, formData.score_team2]);

  const syncSetRows = (count) => {
    setSetGameScores((prev) => {
      if (count === prev.length) return prev;
      if (count > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: count - prev.length }, () => ({ team1: '', team2: '' })),
        ];
      }
      return prev.slice(0, count);
    });
  };

  useEffect(() => {
    syncSetRows(playedSetCount);
  }, [playedSetCount]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSetWinChange = (e) => {
    const { name, value } = e.target;
    const sanitized = sanitizeIntegerInput(value, { min: 0, max: totalSets });

    setFormData((prev) => ({
      ...prev,
      [name]: sanitized,
    }));

    if (errors.score) {
      setErrors((prev) => ({ ...prev, score: '' }));
    }
  };

  const handleSetScoreChange = (index, side, rawValue) => {
    const sanitized = sanitizeIntegerInput(rawValue, {
      min: 0,
      max: gamePointRules.maxSetScore,
    });

    setSetGameScores((prev) => {
      const next = [...prev];
      while (next.length <= index) {
        next.push({ team1: '', team2: '' });
      }
      next[index] = { ...next[index], [side]: sanitized };
      return next;
    });
    if (errors.set_game_scores) {
      setErrors((prev) => ({ ...prev, set_game_scores: '' }));
    }
  };

  const validateSetGameScores = () => {
    if (playedSetCount === 0) {
      return { error: null, payload: null };
    }

    const normalized = [];
    let hasAny = false;

    for (let i = 0; i < playedSetCount; i += 1) {
      const row = setGameScores[i] || { team1: '', team2: '' };
      const team1 = row.team1 === '' ? null : parseInt(row.team1, 10);
      const team2 = row.team2 === '' ? null : parseInt(row.team2, 10);

      if (team1 == null && team2 == null) continue;

      hasAny = true;

      if (team1 == null || team2 == null) {
        return {
          error: `Set ${i + 1}: enter both scores for this set.`,
          payload: null,
        };
      }

      const validationMessage = getSetScoreValidationMessage(team1, team2, gamePointFormat);
      if (validationMessage) {
        return {
          error: `Set ${i + 1}: ${validationMessage}`,
          payload: null,
        };
      }

      normalized.push({ team1, team2 });
    }

    if (hasAny && normalized.length !== playedSetCount) {
      return {
        error: `Enter game points for all ${playedSetCount} sets, or leave every set blank.`,
        payload: null,
      };
    }

    return { error: null, payload: hasAny ? normalized : null };
  };

  const validate = () => {
    const newErrors = {};
    const score1 = parseInt(formData.score_team1, 10) || 0;
    const score2 = parseInt(formData.score_team2, 10) || 0;
    const totalPlayedSets = score1 + score2;
    const hasWinnerFromScore =
      (score1 >= setsNeededToWin && score1 > score2) ||
      (score2 >= setsNeededToWin && score2 > score1);

    if (!formData.is_abandoned) {
      if (score1 < 0 || score2 < 0) {
        newErrors.score = 'Set wins cannot be negative';
      } else if (score1 > totalSets || score2 > totalSets) {
        newErrors.score = `Set wins cannot exceed ${totalSets} in this round`;
      } else if (totalPlayedSets > totalSets) {
        newErrors.score = `Total played sets cannot exceed ${totalSets}`;
      } else if ((score1 > 0 || score2 > 0) && !hasWinnerFromScore) {
        newErrors.score = `Enter a valid completed score. One team must reach ${setsNeededToWin} sets.`;
      } else if (hasWinnerFromScore) {
        const { error: setScoreError } = validateSetGameScores();
        if (setScoreError) {
          newErrors.set_game_scores = setScoreError;
        }
      }
    } else if (!formData.abandoned_reason.trim()) {
      newErrors.abandoned_reason = 'Abandoned reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildSetGameScoresPayload = () => validateSetGameScores().payload;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    let formattedDate = formData.scheduled_date;
    if (formData.scheduled_date) {
      formattedDate = new Date(formData.scheduled_date).toISOString();
    }

    const score1 = parseInt(formData.score_team1, 10) || 0;
    const score2 = parseInt(formData.score_team2, 10) || 0;
    const team1Won = score1 >= setsNeededToWin && score1 > score2;
    const team2Won = score2 >= setsNeededToWin && score2 > score1;
    const derivedWinner = team1Won ? match.team1_id : team2Won ? match.team2_id : null;

    if (formData.is_abandoned) {
      onSubmit({
        scheduled_date: formattedDate,
        venue: formData.venue,
        score_team1: 0,
        score_team2: 1,
        set_game_scores: null,
        game_point_format: gamePointFormat,
        winner_team_id: match.team2_id,
        status: 'Completed',
        is_abandoned: true,
        abandoned_reason: formData.abandoned_reason || null,
      });
      return;
    }

    let finalWinner = derivedWinner || match.winner_team_id;
    let finalStatus = match.status;

    if (derivedWinner) {
      finalWinner = derivedWinner;
      finalStatus = 'Completed';
    }

    if (onWinnerChange) {
      onWinnerChange(finalWinner || null);
    }

    onSubmit({
      scheduled_date: formattedDate,
      venue: formData.venue,
      score_team1: score1,
      score_team2: score2,
      set_game_scores: buildSetGameScoresPayload(),
      game_point_format: gamePointFormat,
      winner_team_id: finalWinner,
      status: finalStatus,
      is_abandoned: formData.is_abandoned,
      abandoned_reason: formData.abandoned_reason || null,
    });
  };

  const form = (
    <>
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="font-semibold text-gray-900">{match.team1_name} vs {match.team2_name}</p>
        <p className="text-sm text-gray-600">
          {match.round_type} {match.pool && `- Pool ${match.pool}`} - Best of {totalSets} sets ({gamePointFormat}-point games)
        </p>
      </div>

      <form id={formId} onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            />
          </div>
          <Input
            label="Venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            placeholder="Match venue"
          />
        </div>

        {!formData.is_abandoned && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Set Score (first to {setsNeededToWin})
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={`${match.team1_name} sets won`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="score_team1"
                value={formData.score_team1}
                onChange={handleSetWinChange}
                placeholder="0"
              />
              <Input
                label={`${match.team2_name} sets won`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="score_team2"
                value={formData.score_team2}
                onChange={handleSetWinChange}
                placeholder="0"
              />
            </div>
            {errors.score && <p className="text-sm text-red-600 mt-2">{errors.score}</p>}
            <p className="text-xs text-gray-500 mt-2">
              Enter final set wins. One team must reach {setsNeededToWin} sets to complete the match.
            </p>

            {playedSetCount > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Game points per set (optional — enter all {playedSetCount} sets or leave all blank)
                </p>
                <div className="space-y-3 border-b border-gray-300">
                  {Array.from({ length: playedSetCount }, (_, index) => {
                    const row = setGameScores[index] || { team1: '', team2: '' };
                    const margin = marginLabel(row.team1, row.team2, gamePointFormat);
                    return (
                      <div key={index} className="grid grid-cols-[auto_1fr_1fr] gap-3 items-center pt-4 border-b border-gray-300 ">
                        <span className="text-xs font-semibold text-gray-500 px-2 align-middle self-stretch border-e border-gray-300">Set {index + 1}</span>
                        <Input
                          label={match.team1_name}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={row.team1}
                          onChange={(e) => handleSetScoreChange(index, 'team1', e.target.value)}
                          placeholder="0"
                        />
                        <Input
                          label={match.team2_name}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={row.team2}
                          onChange={(e) => handleSetScoreChange(index, 'team2', e.target.value)}
                          placeholder="0"
                        />
                        {margin && (
                          <span className="col-span-3 text-xs text-gray-500 -mt-1">{margin}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {errors.set_game_scores && (
                  <p className="text-sm text-red-600 mt-2">{errors.set_game_scores}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Max {gamePointRules.maxSetScore} points per side.{' '} 
                  <br /> {gamePointFormat === 21
                    ? 'Deuce at 20-20 - enter final score (e.g. 21-19). Knockout: 7-0, 11-1.'
                    : 'Deuce at 10-10 - enter final score (e.g. 11-9, 11-6). Knockout: 6-0.'}{' '}
                  <br /> Counts toward NRR/GD tie-breaks.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="is_abandoned"
              checked={formData.is_abandoned}
              onChange={handleChange}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">Match Abandoned/Unavailable</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            If checked, the opponent team will be awarded 1 point
          </p>
        </div>

        {formData.is_abandoned && (
          <Input
            label="Abandoned Reason"
            name="abandoned_reason"
            value={formData.abandoned_reason}
            onChange={handleChange}
            placeholder="e.g., Team unavailable, weather conditions, etc."
            error={errors.abandoned_reason}
            required
          />
        )}

        {!embedded && (
          <div className="flex gap-3 flex-row-reverse">
            <Button type="submit" variant="primary">
              Save Changes
            </Button>

            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </form>
    </>
  );

  if (embedded) {
    return form;
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Match</h2>
      {form}
    </Card>
  );
};

export default MatchResultForm;
