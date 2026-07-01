import Badge from '@/components/atoms/Badge';
import { getTierBadgeVariant, getTierShortLabel } from '@/utils/tierBadge';

const TierBadge = ({ tier, className = '' }) => {
  if (tier == null) return null;
  return (
    <Badge variant={getTierBadgeVariant(tier)} className={className} title={`Tier ${tier}`}>
      {getTierShortLabel(tier)}
    </Badge>
  );
};

export default TierBadge;
