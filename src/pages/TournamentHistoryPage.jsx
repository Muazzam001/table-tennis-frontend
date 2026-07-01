import Card from '@/components/atoms/Card';
import { DIVISIONS } from '@/constants/divisions';
import { getTournamentHistory } from '@/services/tournamentArchiveService';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const TournamentHistoryPage = () => {
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const division = selectedDivision === 'all' ? undefined : selectedDivision;
      const data = await getTournamentHistory(division);
      setArchives(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load tournament history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedDivision]);

  const divisionLabel = (division) =>
    DIVISIONS.find((l) => l.value === division)?.label || division;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Tournament History</h2>
        <p className="text-gray-600 mt-1">
          Completed tournaments archived in chronological order. View standings, brackets, and final
          results from past seasons.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => setSelectedDivision('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDivision === 'all'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          All divisions
        </button>
        {DIVISIONS.map((division) => (
          <button
            key={division.value}
            type="button"
            onClick={() => setSelectedDivision(division.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDivision === division.value
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {division.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading tournament history...</div>
      )}

      {!loading && archives.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">📜</div>
          <p className="text-gray-600 text-lg mb-2">No archived tournaments yet</p>
          <p className="text-gray-500 text-sm">
            When a division tournament is completed, results are archived here for future reference.
          </p>
        </div>
      )}

      {!loading && archives.length > 0 && (
        <div className="space-y-3">
          {archives.map((archive) => (
            <Link key={archive.id} to={`/history/${archive.id}`} className="block">
              <Card className="p-5 border border-gray-200 hover:shadow-md hover:border-red-200 transition-all">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">
                      {divisionLabel(archive.division)}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900">{archive.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Completed {formatDate(archive.completedAt)}
                      {archive.archivedAt && (
                        <span> · Archived {formatDate(archive.archivedAt)}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    {archive.championTeamName && (
                      <p className="font-semibold text-amber-800">
                        🏆 {archive.championTeamName}
                      </p>
                    )}
                    {archive.runnerUpTeamName && (
                      <p className="text-gray-600 mt-1">Runner-up: {archive.runnerUpTeamName}</p>
                    )}
                    <p className="text-gray-500 mt-1">
                      {archive.participantCount} team{archive.participantCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentHistoryPage;
