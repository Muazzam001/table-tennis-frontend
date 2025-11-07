import { useState } from 'react';
import Input from '../../atoms/Input';
import Select from '../../atoms/Select';
import Button from '../../atoms/Button';
import Card from '../../atoms/Card';

// Form component for updating match result
const MatchResultForm = ({ match, onSubmit, onCancel, onWinnerChange }) => {
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

    // When winner is selected, automatically update scores
    if (name === 'winner_team_id') {
      if (value) {
        const winnerId = parseInt(value);
        // Winner gets score 1, loser gets score 0
        if (winnerId === match.team1_id) {
          setFormData(prev => ({
            ...prev,
            winner_team_id: value,
            score_team1: 1,
            score_team2: 0
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            winner_team_id: value,
            score_team1: 0,
            score_team2: 1
          }));
        }
        // Notify parent component that winner changed (for real-time standings update)
        if (onWinnerChange) {
          onWinnerChange(winnerId);
        }
      } else {
        // Clear winner, reset scores
        setFormData(prev => ({
          ...prev,
          winner_team_id: '',
          score_team1: 0,
          score_team2: 0
        }));
        if (onWinnerChange) {
          onWinnerChange(null);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.is_abandoned) {
      // Winner must be selected to award points
      if (!formData.winner_team_id) {
        // Allow saving without winner if just updating date/venue
        // Only require winner if user is trying to complete the match
        const hasDateChange = formData.scheduled_date !== formatDateForInput(match.scheduled_date);
        const hasVenueChange = formData.venue !== (match.venue || '');
        const hasOtherChanges = hasDateChange || hasVenueChange;

        // If only date/venue changed, allow it. Otherwise require winner for completion
        if (!hasOtherChanges) {
          // User might want to just update other info, so don't require winner
        }
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

      const score1 = parseInt(formData.score_team1) || 0;
      const score2 = parseInt(formData.score_team2) || 0;

      // Determine status and winner
      let finalWinner = formData.winner_team_id || match.winner_team_id;
      let finalStatus = match.status;

      if (formData.is_abandoned) {
        // If abandoned, the other team gets 1 point
        // Set winner to team that didn't abandon
        finalWinner = match.team2_id;
        finalStatus = 'Completed';
      } else if (formData.winner_team_id) {
        // If winner is selected, mark as completed
        finalWinner = formData.winner_team_id;
        finalStatus = 'Completed';
      }
      // If no winner selected, keep existing status (just updating date/venue)

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
        <p className="text-sm text-gray-600">{match.round_type} {match.pool && `- Pool ${match.pool}`}</p>
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

        {/* Winner Selection - This determines points, scores are auto-updated */}
        {!formData.is_abandoned && (
          <div className="mb-4">
            <Select
              label="Winner (Select to award 2 points)"
              name="winner_team_id"
              value={formData.winner_team_id}
              onChange={handleChange}
              options={[
                { value: match.team1_id, label: match.team1_name },
                { value: match.team2_id, label: match.team2_name }
              ]}
              error={errors.winner_team_id}
            />
            {formData.winner_team_id && (
              <p className="text-sm text-green-600 mt-1">
                ✓ 2 points will be automatically awarded to {parseInt(formData.winner_team_id) === match.team1_id ? match.team1_name : match.team2_name}
              </p>
            )}
          </div>
        )}

        {/* Scores - Display only (auto-updated when winner is selected) */}
        {formData.winner_team_id && !formData.is_abandoned && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Scores (Auto-updated):</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">{match.team1_name}</label>
                <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg font-semibold">
                  {formData.score_team1}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">{match.team2_name}</label>
                <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg font-semibold">
                  {formData.score_team2}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Scores are automatically set when winner is selected (Winner: 1, Loser: 0)
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

