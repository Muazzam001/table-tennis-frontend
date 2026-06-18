import { useState } from 'react';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { getSetCountForRound } from '@/config/matchSetConfig';

// Form component for updating match result
const MatchResultForm = ({ match, onSubmit, onCancel, onWinnerChange, setConfig }) => {
  // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
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

  const [formData, setFormData] = useState({
    score_team1: match.score_team1 || 0,
    score_team2: match.score_team2 || 0,
    winner_team_id: match.winner_team_id || '',
    is_abandoned: match.is_abandoned || false,
    abandoned_reason: match.abandoned_reason || '',
    scheduled_date: formatDateForInput(match.scheduled_date),
    venue: match.venue || ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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
      }
    } else {
      // If abandoned, require reason
      if (!formData.abandoned_reason.trim()) {
        newErrors.abandoned_reason = 'Abandoned reason is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      // Convert datetime-local format to ISO string for backend
      let formattedDate = formData.scheduled_date;
      if (formData.scheduled_date) {
        formattedDate = new Date(formData.scheduled_date).toISOString();
      }

      const score1 = parseInt(formData.score_team1, 10) || 0;
      const score2 = parseInt(formData.score_team2, 10) || 0;
      const team1Won = score1 >= setsNeededToWin && score1 > score2;
      const team2Won = score2 >= setsNeededToWin && score2 > score1;
      const derivedWinner = team1Won ? match.team1_id : team2Won ? match.team2_id : null;

      // Determine status and winner
      let finalWinner = derivedWinner || match.winner_team_id;
      let finalStatus = match.status;

      if (formData.is_abandoned) {
        // Team 1 marked unavailable — team 2 wins walkover 0-1 in sets
        const walkoverWinnerId = match.team2_id;
        const team1Sets = 0;
        const team2Sets = 1;

        onSubmit({
          scheduled_date: formattedDate,
          venue: formData.venue,
          score_team1: team1Sets,
          score_team2: team2Sets,
          winner_team_id: walkoverWinnerId,
          status: 'Completed',
          is_abandoned: true,
          abandoned_reason: formData.abandoned_reason || null,
        });
        return;
      }

      if (derivedWinner) {
        finalWinner = derivedWinner;
        finalStatus = 'Completed';
      }
      // If no decisive score is entered, keep existing status (e.g. updating date/venue only)

      if (onWinnerChange) {
        onWinnerChange(finalWinner || null);
      }

      onSubmit({
        scheduled_date: formattedDate,
        venue: formData.venue,
        score_team1: score1,
        score_team2: score2,
        winner_team_id: finalWinner,
        status: finalStatus,
        is_abandoned: formData.is_abandoned,
        abandoned_reason: formData.abandoned_reason || null
      });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Match</h2>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="font-semibold text-gray-900">{match.team1_name} vs {match.team2_name}</p>
        <p className="text-sm text-gray-600">
          {match.round_type} {match.pool && `- Pool ${match.pool}`} - Best of {totalSets} sets
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Date & Time Editing */}
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
                type="number"
                min="0"
                max={totalSets}
                name="score_team1"
                value={formData.score_team1}
                onChange={handleChange}
              />
              <Input
                label={`${match.team2_name} sets won`}
                type="number"
                min="0"
                max={totalSets}
                name="score_team2"
                value={formData.score_team2}
                onChange={handleChange}
              />
            </div>
            {errors.score && <p className="text-sm text-red-600 mt-2">{errors.score}</p>}
            <p className="text-xs text-gray-500 mt-2">
              Enter final set wins. One team must reach {setsNeededToWin} sets to complete the match.
            </p>
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


        <div className="flex gap-3 mt-6">
          <Button type="submit" variant="primary">
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default MatchResultForm;

