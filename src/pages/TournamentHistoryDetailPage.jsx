import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import TournamentStatusBadge from '@/components/atoms/TournamentStatusBadge/TournamentStatusBadge';
import TournamentResultsPanel from '@/components/molecules/TournamentResultsPanel/TournamentResultsPanel';
import { getTournamentHistoryDetail } from '@/services/tournamentArchiveService';
import { DIVISIONS } from '@/constants/divisions';

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TournamentHistoryDetailPage = () => {
  const { id } = useParams();
  const [archive, setArchive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTournamentHistoryDetail(id);
        setArchive(data);
      } catch (err) {
        setError(err.message || 'Failed to load archived tournament');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const divisionLabel =
    DIVISIONS.find((l) => l.value === archive?.division)?.label || archive?.division;
  const overview = archive?.snapshot;
  const finalResult = overview?.finalResult || {
    championTeamName: archive?.championTeamName,
    runnerUpTeamName: archive?.runnerUpTeamName,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/history"
            className="text-sm text-red-600 hover:text-red-700 hover:underline mb-2 inline-block"
          >
            ← Back to history
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            {archive?.name || 'Archived tournament'}
          </h2>
          {archive && (
            <p className="text-gray-600 mt-1">
              {divisionLabel} · Completed {formatDateTime(archive.completedAt)}
              {archive.archivedAt && (
                <span> · Archived {formatDateTime(archive.archivedAt)}</span>
              )}
            </p>
          )}
        </div>
        {overview?.status && <TournamentStatusBadge status={overview.status} />}
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading archived tournament...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>
      )}

      {!loading && !error && archive && (
        <TournamentResultsPanel
          overview={overview}
          finalResult={finalResult}
          teams={overview?.teams || []}
          showRefresh={false}
          matchesLink={null}
        />
      )}

      {!loading && !error && !archive && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">Archived tournament not found.</p>
          <Link to="/history">
            <Button variant="primary">Back to history</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default TournamentHistoryDetailPage;
