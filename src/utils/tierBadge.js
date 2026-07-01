export const getTierBadgeVariant = (tier) => {
  if (tier === 1) return 'tier1';
  if (tier === 2) return 'tier2';
  if (tier === 3) return 'tier3';
  return 'default';
};

export const getTierLabel = (tier) => {
  if (tier === 1) return 'Tier 1';
  if (tier === 2) return 'Tier 2';
  if (tier === 3) return 'Tier 3';
  return '—';
};

export const getTierShortLabel = (tier) => {
  if (tier === 1) return 'T1';
  if (tier === 2) return 'T2';
  if (tier === 3) return 'T3';
  return '?';
};
