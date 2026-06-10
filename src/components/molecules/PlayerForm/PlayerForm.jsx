import { useState, useEffect } from 'react';
import Input from '../../atoms/Input';
import Select from '../../atoms/Select';
import Button from '../../atoms/Button';
import Card from '../../atoms/Card';
import {
  PLAYER_DIVISIONS,
  divisionToPlayerFields,
  playerToDivision,
} from '../../../utils/playerDivision';

const PlayerForm = ({ player = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    division: '',
  });

  const [errors, setErrors] = useState({});
  const isEditing = !!player;

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        email: player.email || '',
        division: playerToDivision(player),
      });
    }
  }, [player]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.division) {
      newErrors.division = 'League is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const { expertise_level, category } = divisionToPlayerFields(formData.division);
    onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim(),
      expertise_level,
      category,
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Player' : 'Add New Player'}
      </h2>

      <form onSubmit={handleSubmit}>
        <Input
          label="Player Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter player name"
          error={errors.name}
          required
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="player@company.com"
          error={errors.email}
          required
        />

        <Select
          label="League"
          name="division"
          value={formData.division}
          onChange={handleChange}
          options={PLAYER_DIVISIONS.map((d) => ({ value: d.value, label: d.label }))}
          error={errors.division}
          placeholder="Select league"
          required
        />

        <div className="flex gap-3 mt-6">
          <Button type="submit" variant="primary">
            {isEditing ? 'Update Player' : 'Add Player'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PlayerForm;
