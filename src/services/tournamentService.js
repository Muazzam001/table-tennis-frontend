import api from '@/utils/api.js';

export const getTournamentOverview = async (division) => {
  const response = await api.get(`/tournament/overview?division=${encodeURIComponent(division)}`);
  return response.data;
};

export const getDivisionGroups = async (division) => {
  const response = await api.get(`/tournament/groups?division=${encodeURIComponent(division)}`);
  return response.data;
};

export const getTournamentSetup = async (division, options = {}) => {
  const params = new URLSearchParams({ division });
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.groupCount) params.append('groupCount', String(options.groupCount));
  if (options.timeSlotConfig?.startTime) params.append('startTime', options.timeSlotConfig.startTime);
  if (options.timeSlotConfig?.endTime) params.append('endTime', options.timeSlotConfig.endTime);
  if (options.timeSlotConfig?.intervalMinutes) {
    params.append('intervalMinutes', String(options.timeSlotConfig.intervalMinutes));
  }
  if (options.courtConfig?.courtCount) {
    params.append('courtCount', String(options.courtConfig.courtCount));
  }
  const response = await api.get(`/tournament/setup?${params.toString()}`);
  return response.data;
};
