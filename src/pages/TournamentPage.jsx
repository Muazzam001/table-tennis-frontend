import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import DivisionTabs from '@/components/molecules/DivisionTabs';
import TournamentStatusBadge from '@/components/atoms/TournamentStatusBadge/TournamentStatusBadge';
import TournamentResultsPanel from '@/components/molecules/TournamentResultsPanel/TournamentResultsPanel';
import { useAuth } from '@/contexts/AuthContext';
import { getTournamentOverview } from '@/services/tournamentService';
import { archiveTournament } from '@/services/tournamentArchiveService';
import { showConfirm, showSuccess } from '@/utils/sweetAlert';

const TournamentPage = () => {
  const { isAdmin } = useAuth();
  const [selectedDivision, setSelectedDivision] = useState('Expert');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [archiving, setArchiving] = useState(false);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTournamentOverview(selectedDivision);
      setOverview(data);
    } catch (err) {
      setError(err.message || 'Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [selectedDivision]);

  const handleArchive = async () => {
    const confirmed = await showConfirm({
      title: `Archive ${selectedDivision} tournament?`,
      text:
        `Archive the completed ${selectedDivision} tournament?\n\nThis saves all teams, matches, standings, and final results to history, then clears this division so a new season can begin. Players are kept.`,
      confirmText: 'Archive',
      icon: 'warning',
    });
    if (!confirmed) {
      return;
    }

    try {
      setArchiving(true);
      setError(null);
      await archiveTournament(selectedDivision);
      await loadOverview();
      await showSuccess(
        'Tournament archived',
        `${selectedDivision} tournament archived successfully. View it in Tournament History, then create new teams and schedule for the next season.`
      );
    } catch (err) {
      setError(err.message || 'Failed to archive tournament');
    } finally {
      setArchiving(false);
    }
  };

  const hasData =
    (overview?.matches?.length || 0) > 0 ||
    Object.keys(overview?.standings || {}).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tournament</h2>
          <p className="text-gray-600 mt-1">
            Standings, knockout bracket, and match results — schedule and update scores on the{' '}
            <Link to="/matches" className="text-red-600 font-medium hover:underline">
              Matches page
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {overview?.status && <TournamentStatusBadge status={overview.status} />}
          {isAdmin && overview?.status === 'Completed' && (
            <Button
              onClick={handleArchive}
              variant="primary"
              size="sm"
              disabled={archiving || loading}
            >
              {archiving ? 'Archiving...' : '📦 Archive & start new season'}
            </Button>
          )}
          {hasData && (
            <Button onClick={loadOverview} variant="outline" size="sm" disabled={loading}>
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </Button>
          )}
        </div>
      </div>

      <DivisionTabs selected={selectedDivision} onChange={setSelectedDivision} />

      <TournamentResultsPanel
        overview={overview}
        loading={loading}
        error={error}
        onRefresh={loadOverview}
        showRefresh={false}
      />
    </div>
  );
};

export default TournamentPage;
