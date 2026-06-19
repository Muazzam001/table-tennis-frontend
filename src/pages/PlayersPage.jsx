import { useState, useEffect } from 'react';
import Button from '@/components/atoms/Button';
import PlayerCard from '@/components/molecules/PlayerCard';
import PlayerForm from '@/components/molecules/PlayerForm';
import DivisionTabs from '@/components/molecules/DivisionTabs';
import { useAuth } from '@/contexts/AuthContext';
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '@/services/playerService';
import {
  DIVISIONS,
  DEFAULT_TOURNAMENT_DIVISION,
  countPlayersByDivision,
  filterPlayersForDivision,
} from '@/constants/divisions';
import { showConfirm } from '@/utils/sweetAlert';

const PlayersPage = () => {
  const { isAdmin } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(DEFAULT_TOURNAMENT_DIVISION);

  useEffect(() => {
    loadPlayers();
  }, []);

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

  const handleSubmit = async (formData) => {
    try {
      if (editingPlayer) {
        await updatePlayer(editingPlayer.id, formData);
      } else {
        await createPlayer(formData);
      }

      setShowForm(false);
      setEditingPlayer(null);
      loadPlayers();
    } catch (err) {
      setError(err.message || 'Failed to save player');
      console.error('Error saving player:', err);
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleDelete = async (playerId) => {
    const confirmed = await showConfirm({
      title: 'Delete player?',
      text: 'Are you sure you want to delete this player?',
      confirmText: 'Delete',
      icon: 'warning',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deletePlayer(playerId);
      loadPlayers();
    } catch (err) {
      setError(err.message || 'Failed to delete player');
      console.error('Error deleting player:', err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlayer(null);
    setError(null);
  };

  const handleAddNew = () => {
    setEditingPlayer(null);
    setShowForm(true);
  };

  const divisionCounts = countPlayersByDivision(players);
  const activePlayers = filterPlayersForDivision(players, selectedDivision);
  const selectedDivisionMeta = DIVISIONS.find((d) => d.value === selectedDivision);

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Total Players</div>
          <div className="text-2xl font-bold text-gray-900">{players.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">{selectedDivisionMeta?.label || selectedDivision}</div>
          <div className="text-2xl font-bold text-purple-600">{divisionCounts[selectedDivision] || 0}</div>
        </div>
      </div>

      {players.length > 0 && (
        <DivisionTabs
          selected={selectedDivision}
          onChange={setSelectedDivision}
          counts={divisionCounts}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <strong>Error</strong>
        </div>
      )}

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

      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading players...</div>
        </div>
      )}

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

      {!loading && players.length > 0 && activePlayers.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600 text-lg mb-2">
            No players in {selectedDivisionMeta?.label || selectedDivision} yet.
          </p>
          {isAdmin && (
            <Button onClick={handleAddNew} variant="primary" className="mt-4">
              Add Player
            </Button>
          )}
        </div>
      )}

      {!loading && activePlayers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activePlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayersPage;
