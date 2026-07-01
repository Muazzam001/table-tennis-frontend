import Badge from '@/components/atoms/Badge';
import { getPyramidMatchStageLabel } from '@/utils/level1Matches';

const MatchStageBadge = ({ match }) => {
  const { primary, secondary } = getPyramidMatchStageLabel(match);

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={match.round_type === 'Final' ? 'primary' : 'secondary'}>{primary}</Badge>
      {secondary ? <Badge variant="default">{secondary}</Badge> : null}
      {match.pool && match.round_type !== 'S1' ? (
        <Badge variant="default">Group {match.pool}</Badge>
      ) : null}
    </div>
  );
};

export default MatchStageBadge;
