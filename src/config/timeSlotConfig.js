const STORAGE_KEY = 'tournamentTimeSlotConfig';

export const DEFAULT_TIME_SLOT_CONFIG = {
  startTime: '19:00',
  endTime: '22:00',
  intervalMinutes: 30,
};

const normalizeInterval = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 15 || parsed > 180) return fallback;
  return parsed;
};

const normalizeTime = (value, fallback) => {
  const trimmed = String(value ?? '').trim();
  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) return fallback;
  const [hour, minute] = trimmed.split(':').map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const getDefaultTimeSlotConfig = () => ({ ...DEFAULT_TIME_SLOT_CONFIG });

export const getTimeSlotConfig = () => {
  if (typeof window === 'undefined') return getDefaultTimeSlotConfig();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultTimeSlotConfig();

    const parsed = JSON.parse(raw);
    return {
      startTime: normalizeTime(parsed?.startTime, DEFAULT_TIME_SLOT_CONFIG.startTime),
      endTime: normalizeTime(parsed?.endTime, DEFAULT_TIME_SLOT_CONFIG.endTime),
      intervalMinutes: normalizeInterval(parsed?.intervalMinutes, DEFAULT_TIME_SLOT_CONFIG.intervalMinutes),
    };
  } catch {
    return getDefaultTimeSlotConfig();
  }
};

export const saveTimeSlotConfig = (config) => {
  const sanitized = {
    startTime: normalizeTime(config?.startTime, DEFAULT_TIME_SLOT_CONFIG.startTime),
    endTime: normalizeTime(config?.endTime, DEFAULT_TIME_SLOT_CONFIG.endTime),
    intervalMinutes: normalizeInterval(config?.intervalMinutes, DEFAULT_TIME_SLOT_CONFIG.intervalMinutes),
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  }

  return sanitized;
};

export const resetTimeSlotConfig = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return getDefaultTimeSlotConfig();
};

const computeSlotsPerWeekday = (config) => {
  const [startHour, startMinute] = config.startTime.split(':').map(Number);
  const [endHour, endMinute] = config.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const interval = config.intervalMinutes;

  let count = 0;
  let cursor = startMinutes;
  while (cursor + interval <= endMinutes) {
    count += 1;
    cursor += interval;
  }
  return count;
};

export const getTimeSlotSummary = (config = null) => {
  const active = config || getTimeSlotConfig();
  const slotsPerWeekday = computeSlotsPerWeekday(active);
  return {
    ...active,
    slotsPerWeekday,
    timeRangeLabel: `${active.startTime}–${active.endTime}`,
  };
};

export const sanitizeTimeSlotConfig = (config) => ({
  startTime: normalizeTime(config?.startTime, DEFAULT_TIME_SLOT_CONFIG.startTime),
  endTime: normalizeTime(config?.endTime, DEFAULT_TIME_SLOT_CONFIG.endTime),
  intervalMinutes: normalizeInterval(config?.intervalMinutes, DEFAULT_TIME_SLOT_CONFIG.intervalMinutes),
});

export const validateTimeSlotConfig = (config) => {
  const errors = {};
  const rawStart = String(config?.startTime ?? '').trim();
  const rawEnd = String(config?.endTime ?? '').trim();
  const rawInterval = config?.intervalMinutes;

  if (!/^\d{1,2}:\d{2}$/.test(rawStart)) {
    errors.startTime = 'Enter a valid start time (HH:MM, 24-hour).';
  }
  if (!/^\d{1,2}:\d{2}$/.test(rawEnd)) {
    errors.endTime = 'Enter a valid end time (HH:MM, 24-hour).';
  }

  const interval = parseInt(rawInterval, 10);
  if (Number.isNaN(interval) || interval < 15 || interval > 180) {
    errors.intervalMinutes = 'Interval must be between 15 and 180 minutes.';
  }

  const sanitized = sanitizeTimeSlotConfig(config);
  const summary = getTimeSlotSummary(sanitized);

  if (!errors.startTime && !errors.endTime && !errors.intervalMinutes && summary.slotsPerWeekday < 1) {
    errors.endTime = 'This time window does not fit any match slots with the chosen interval.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    config: sanitized,
    summary,
  };
};
