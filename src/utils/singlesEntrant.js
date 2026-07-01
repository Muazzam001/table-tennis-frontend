/**
 * Display name for a singles entrant (team row with one player).
 * Uses player name when team_name is missing or a generic numeric label.
 */
export function resolveSinglesEntrantName(team) {
  if (!team) return '';
  const playerName = String(team.player1_name || '').trim();
  const teamName = String(team.team_name || '').trim();
  if (!playerName) return teamName;
  if (!teamName || /^\d+$/.test(teamName)) return playerName;
  return teamName;
}

export function isGenericSinglesTeamName(teamName) {
  const name = String(teamName || '').trim();
  return !name || /^\d+$/.test(name);
}
