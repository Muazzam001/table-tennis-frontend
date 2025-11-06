import { useState, useEffect } from 'react';
import Input from '../../atoms/Input';
import Select from '../../atoms/Select';
import Button from '../../atoms/Button';
import Card from '../../atoms/Card';

// Form component for adding or editing a player
const PlayerForm = ({ player = null, onSubmit, onCancel }) => {
  // Form state - holds the current form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    expertise_level: ''
  });
  
  // Form validation errors
  const [errors, setErrors] = useState({});
  
  // Check if we're editing (player exists) or adding new
  const isEditing = !!player;
  
  // When player data changes (for editing), update form
  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        email: player.email || '',
        expertise_level: player.expertise_level || ''
      });
    }
  }, [player]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate form before submitting
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
    
    if (!formData.expertise_level) {
      newErrors.expertise_level = 'Expertise level is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
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
          label="Expertise Level"
          name="expertise_level"
          value={formData.expertise_level}
          onChange={handleChange}
          options={[
            { value: 'Intermediate', label: 'Intermediate' },
            { value: 'Expert', label: 'Expert' }
          ]}
          error={errors.expertise_level}
          placeholder="Select expertise level"
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


