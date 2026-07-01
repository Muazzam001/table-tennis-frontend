import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import TournamentStatusBadge from '@/components/atoms/TournamentStatusBadge/TournamentStatusBadge';
import { DIVISIONS } from '@/constants/divisions';
import { Link } from 'react-router-dom';

import { isTierPyramidFormat } from '@/constants/tournamentFormats';

const getNextStep = (overview, teamCount) => {
  const pyramid = isTierPyramidFormat(overview?.format || overview?.tournament_format);
  if (!teamCount || teamCount === 0) {
    return { label: 'Generate teams', href: '/teams' };
  }
  if (pyramid && overview?.pyramid && !overview.pyramid.tierAssignments?.length) {
    return { label: 'Assign tiers', href: '/matches' };
  }
  if (!overview?.matches?.length) {
    return { label: pyramid ? 'Create Tier Pyramid schedule' : 'Create group-stage schedule', href: '/matches' };
  }
  if (overview?.status !== 'Completed') {
    return { label: 'Manage matches & scores', href: '/matches' };
  }
  return { label: 'View results', href: '/tournament' };
};

const getGuestBrowseLink = (overview, teamCount) => {
  const matchCount = overview?.matches?.length || 0;
  if (matchCount > 0) {
    return { label: 'View standings & results', href: '/tournament' };
  }
  if (teamCount > 0) {
    return { label: 'View teams', href: '/teams' };
  }
  return { label: 'View players', href: '/players' };
};

const DivisionWorkflowCards = ({
  overviews = {},
  teamCounts = {},
  loading = false,
  isAdmin = false,
  archivingDivision = null,
  onArchive,
}) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Division tournaments</h2>
      <p className="text-gray-600 mt-1">
        {isAdmin
          ? 'Each division runs independently — teams, schedules, and knockouts are managed per division.'
          : 'Each division runs independently — browse teams, matches, and results per division.'}
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {DIVISIONS.map((division) => {
        const overview = overviews[division.value];
        const teamCount = teamCounts[division.value] || 0;
        const matchCount = overview?.matches?.length || 0;
        const nextStep = getNextStep(overview, teamCount);
        const guestLink = getGuestBrowseLink(overview, teamCount);
        const isCompleted = overview?.status === 'Completed';
        const isArchiving = archivingDivision === division.value;

        return (
          <Card key={division.value} className="p-4 border space-y-3 border-gray-200">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900">{division.label}</h3>
              {overview?.status && overview.status !== 'Draft' && (
                <TournamentStatusBadge status={overview.status} />
              )}
            </div>
            {loading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : (
              <ul className="text-sm text-gray-600 space-y-1">
                <li>{teamCount} team{teamCount !== 1 ? 's' : ''}</li>
                <li>{matchCount} match{matchCount !== 1 ? 'es' : ''}</li>
                <li>
                  Status:{' '}
                  <span className="font-medium text-gray-800">
                    {teamCount === 0 ? 'No teams yet' : overview?.status || 'Draft'}
                  </span>
                </li>
              </ul>
            )}
            {isAdmin ? (
              <div className="flex flex-col gap-2">
                <Link
                  to={nextStep.href}
                  className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                >
                  {nextStep.label} →
                </Link>
                {isCompleted && onArchive && (
                  <Button
                    onClick={() => onArchive(division.value)}
                    variant="outline"
                    size="sm"
                    disabled={isArchiving || loading}
                    className="w-full"
                  >
                    {isArchiving ? 'Archiving...' : '📦 Archive & start new season'}
                  </Button>
                )}
              </div>
            ) : (
              <Link
                to={guestLink.href}
                className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
              >
                {guestLink.label} →
              </Link>
            )}
          </Card>
        );
      })}
    </div>
  </div>
);

export default DivisionWorkflowCards;
