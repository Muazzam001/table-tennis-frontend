import { useState, useEffect } from 'react';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { GENDERS, EXPERTISE_LEVELS } from '@/utils/playerDivision';

const PlayerForm = ({ player = null, onSubmit, onCancel, embedded = false, formId }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Men',
    expertise_level: 'Beginner',
    pyramid_tier: '',
  });

  const [errors, setErrors] = useState({});
  const isEditing = !!player;

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        email: player.email || '',
        category: player.category === 'Women' ? 'Women' : 'Men',
        expertise_level: EXPERTISE_LEVELS.includes(player.expertise_level)
          ? player.expertise_level
          : 'Beginner',
        pyramid_tier:
          player.pyramid_tier != null && player.pyramid_tier !== ''
            ? String(player.pyramid_tier)
            : '',
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

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!GENDERS.includes(formData.category)) {
      newErrors.category = 'Gender division is required';
    }

    if (!EXPERTISE_LEVELS.includes(formData.expertise_level)) {
      newErrors.expertise_level = 'Expertise level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      expertise_level: formData.expertise_level,
      category: formData.category,
      pyramid_tier:
        formData.category === 'Men' && formData.pyramid_tier
          ? Number(formData.pyramid_tier)
          : null,
    });
  };

  const form = (
      <form id={formId} onSubmit={handleSubmit}>
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
          label="Email Address (optional)"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="player@company.com"
          error={errors.email}
        />

        <Select
          label="Gender Division"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={GENDERS.map((g) => ({ value: g, label: g }))}
          error={errors.category}
          required
        />

        <Select
          label="Expertise Level"
          name="expertise_level"
          value={formData.expertise_level}
          onChange={handleChange}
          options={EXPERTISE_LEVELS.map((level) => ({ value: level, label: level }))}
          error={errors.expertise_level}
          required
        />

        {formData.category === 'Men' && (
          <Select
            label="Pyramid Tier (optional)"
            name="pyramid_tier"
            value={formData.pyramid_tier}
            onChange={handleChange}
            options={[
              { value: '', label: 'Not in tier pyramid' },
              { value: '1', label: 'Tier 1 (top)' },
              { value: '2', label: 'Tier 2' },
              { value: '3', label: 'Tier 3' },
            ]}
            error={errors.pyramid_tier}
          />
        )}

        {!embedded && (
          <div className="flex gap-3 flex-row-reverse">
            <Button type="submit" variant="primary">
              {isEditing ? 'Update Player' : 'Add Player'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </form>
  );

  if (embedded) {
    return form;
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Player' : 'Add New Player'}
      </h2>
      {form}
    </Card>
  );
};

export default PlayerForm;
