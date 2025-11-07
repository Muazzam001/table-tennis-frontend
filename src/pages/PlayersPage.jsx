import { useState, useEffect } from 'react';
import Button from '../components/atoms/Button';
import PlayerCard from '../components/molecules/PlayerCard';
import PlayerForm from '../components/molecules/PlayerForm';
import { useAuth } from '../contexts/AuthContext';
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../services/playerService';

const PlayersPage = () => {
  const { isAdmin } = useAuth();
  // State for managing players list
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for form modal
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  // Load players when component mounts
  useEffect(() => {
    loadPlayers();
  }, []);

  // Function to fetch all players from API
  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlayers();
      setPlayers(data);
    } catch (err) {
      setError(err.message || 'Failed to load players');
      console.error('Error loading players:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission (both add and edit)
  const handleSubmit = async (formData) => {
    try {
      if (editingPlayer) {
        // Update existing player
        await updatePlayer(editingPlayer.id, formData);
      } else {
        // Create new player
        await createPlayer(formData);
      }

      // Close form and reload players
      setShowForm(false);
      setEditingPlayer(null);
      loadPlayers();
    } catch (err) {
      setError(err.message || 'Failed to save player');
      console.error('Error saving player:', err);
    }
  };

  // Handle edit button click
  const handleEdit = (player) => {
    setEditingPlayer(player);
    setShowForm(true);
  };

  // Handle delete button click
  const handleDelete = async (playerId) => {
    // Confirm before deleting
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await deletePlayer(playerId);
        loadPlayers(); // Reload list after deletion
      } catch (err) {
        setError(err.message || 'Failed to delete player');
        console.error('Error deleting player:', err);
      }
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    setShowForm(false);
    setEditingPlayer(null);
    setError(null);
  };

  // Handle add new player button
  const handleAddNew = () => {
    setEditingPlayer(null);
    setShowForm(true);
  };

  // Count players by expertise level for display
  const intermediateCount = players.filter(p => p.expertise_level === 'Intermediate').length;
  const expertCount = players.filter(p => p.expertise_level === 'Expert').length;

  // Separate players by expertise level
  const intermediatePlayers = players.filter(p => p.expertise_level === 'Intermediate');
  const expertPlayers = players.filter(p => p.expertise_level === 'Expert');

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Players</h2>
          <p className="text-gray-600 mt-1">
            Manage tournament players ({players.length} total)
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddNew} variant="primary">
            + Add New Player
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Total Players</div>
          <div className="text-2xl font-bold text-gray-900">{players.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Intermediate</div>
          <div className="text-2xl font-bold text-blue-600">{intermediateCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Expert</div>
          <div className="text-2xl font-bold text-purple-600">{expertCount}</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <strong>Error</strong>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <PlayerForm
                player={editingPlayer}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading players...</div>
        </div>
      )}

      {/* Empty State - No players at all */}
      {!loading && players.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 text-lg mb-4">No players found</p>
          {isAdmin && (
            <Button onClick={handleAddNew} variant="primary">
              Add Your First Player
            </Button>
          )}
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Expert Players Section */}
        <div>
          {!loading && expertPlayers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-gray-900">Expert Players</h3>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                  {expertCount}
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {expertPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isAdmin={isAdmin}
                />
                ))}
              </div>
            </div>
          )}

          {!loading && players.length > 0 && expertPlayers.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600 text-lg mb-2">No Expert players yet</p>
              <p className="text-gray-500 text-sm">Add Expert players to get started</p>
            </div>
          )}
        </div>

        {/* Intermediate Players Section */}
        <div>
          {!loading && intermediatePlayers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-gray-900">Intermediate Players</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {intermediateCount}
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {intermediatePlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isAdmin={isAdmin}
                />
                ))}
              </div>
            </div>
          )}


          {!loading && players.length > 0 && intermediatePlayers.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600 text-lg mb-2">No Intermediate players yet</p>
              <p className="text-gray-500 text-sm">Add Intermediate players to get started</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PlayersPage;
