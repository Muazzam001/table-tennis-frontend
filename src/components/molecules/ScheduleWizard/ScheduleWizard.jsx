import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import Input from '@/components/atoms/Input';
import {
  getTimeSlotConfig,
  getTimeSlotSummary,
  saveTimeSlotConfig,
  validateTimeSlotConfig,
} from '@/config/timeSlotConfig';
import {
  getCourtConfig,
  getCourtSummary,
  saveCourtConfig,
  validateCourtConfig,
} from '@/config/courtConfig';
import { getTournamentSetup } from '@/services/tournamentService';

const STEPS = {
  TIME_SLOTS: 'time-slots',
  COURTS: 'courts',
  DATES: 'dates',
  REVIEW: 'review',
};

const STEP_LABELS = {
  [STEPS.TIME_SLOTS]: 'Time slots',
  [STEPS.COURTS]: 'Courts & venue',
  [STEPS.DATES]: 'Dates',
  [STEPS.REVIEW]: 'Review',
};

const todayIso = () => new Date().toISOString().split('T')[0];

const ScheduleWizard = ({
  open,
  mode = 'group-stage',
  title = 'Create schedule',
  division,
  divisionLabel,
  groupCount,
  matchCount,
  existingQualifyingCount = 0,
  teamCount,
  onCancel,
  onSubmit,
  submitting = false,
}) => {
  const stepOrder = useMemo(() => Object.values(STEPS), []);
  const [stepIndex, setStepIndex] = useState(0);
  const step = stepOrder[stepIndex];

  const [timeSlotForm, setTimeSlotForm] = useState(getTimeSlotConfig);
  const [courtForm, setCourtForm] = useState(getCourtConfig);
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [suggestedEndDate, setSuggestedEndDate] = useState(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [stepErrors, setStepErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!open) return;

    setStepIndex(0);
    setTimeSlotForm(getTimeSlotConfig());
    setCourtForm(getCourtConfig());
    setStartDate(todayIso());
    setEndDate('');
    setReplaceExisting(existingQualifyingCount > 0);
    setSuggestedEndDate(null);
    setStepErrors({});
    setSubmitError(null);
  }, [open, existingQualifyingCount]);

  const timeSlotSummary = getTimeSlotSummary(timeSlotForm);
  const courtSummary = getCourtSummary(courtForm);
  const matchesPerDay = timeSlotSummary.slotsPerWeekday * (parseInt(courtForm.courtCount, 10) || 1);

  useEffect(() => {
    if (!open || step !== STEPS.DATES || mode !== 'group-stage' || !startDate || !division) {
      return;
    }

    let cancelled = false;
    const loadHint = async () => {
      setLoadingHint(true);
      try {
        const timeValidation = validateTimeSlotConfig(timeSlotForm);
        const courtValidation = validateCourtConfig(courtForm);
        if (!timeValidation.valid || !courtValidation.valid) {
          if (!cancelled) setSuggestedEndDate(null);
          return;
        }

        const setup = await getTournamentSetup(division, {
          startDate,
          groupCount,
          timeSlotConfig: timeValidation.config,
          courtConfig: courtValidation.config,
        });
        if (!cancelled) {
          setSuggestedEndDate(setup.scheduling?.suggestedEndDate ?? null);
        }
      } catch {
        if (!cancelled) setSuggestedEndDate(null);
      } finally {
        if (!cancelled) setLoadingHint(false);
      }
    };

    loadHint();
    return () => {
      cancelled = true;
    };
  }, [open, step, mode, startDate, division, groupCount, timeSlotForm, courtForm]);

  if (!open) return null;

  const validateTimeStep = () => {
    const result = validateTimeSlotConfig(timeSlotForm);
    setStepErrors(result.errors);
    return result;
  };

  const validateCourtsStep = () => {
    const result = validateCourtConfig(courtForm);
    setStepErrors(result.errors);
    return result;
  };

  const validateDatesStep = () => {
    const errors = {};
    if (!startDate) {
      errors.startDate = 'Start date is required.';
    }
    if (mode === 'group-stage' && endDate && endDate < startDate) {
      errors.endDate = 'End date must be on or after the start date.';
    }
    setStepErrors(errors);
    return { valid: Object.keys(errors).length === 0, errors };
  };

  const goNext = () => {
    setSubmitError(null);

    if (step === STEPS.TIME_SLOTS) {
      const result = validateTimeStep();
      if (!result.valid) return;
      setStepIndex((i) => i + 1);
      setStepErrors({});
      return;
    }

    if (step === STEPS.COURTS) {
      const result = validateCourtsStep();
      if (!result.valid) return;
      setStepIndex((i) => i + 1);
      setStepErrors({});
      return;
    }

    if (step === STEPS.DATES) {
      const result = validateDatesStep();
      if (!result.valid) return;
      setStepIndex((i) => i + 1);
      setStepErrors({});
    }
  };

  const goBack = () => {
    setSubmitError(null);
    setStepErrors({});
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    const timeResult = validateTimeSlotConfig(timeSlotForm);
    const courtResult = validateCourtConfig(courtForm);
    const datesResult = validateDatesStep();

    if (!timeResult.valid || !courtResult.valid || !datesResult.valid) {
      setSubmitError('Please fix the errors before creating the schedule.');
      return;
    }

    if (mode === 'group-stage' && existingQualifyingCount > 0 && !replaceExisting) {
      setSubmitError('Confirm that you want to replace the existing qualifying schedule.');
      return;
    }

    const savedTimeSlots = saveTimeSlotConfig(timeResult.config);
    const savedCourts = saveCourtConfig(courtResult.config);

    try {
      await onSubmit({
        timeSlotConfig: savedTimeSlots,
        courtConfig: savedCourts,
        startDate,
        endDate: mode === 'group-stage' && endDate.trim() ? endDate.trim() : null,
        venue: savedCourts.venueBase,
        replaceExisting: mode === 'group-stage' ? replaceExisting : false,
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to create schedule.');
    }
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setTimeSlotForm((prev) => ({ ...prev, [name]: value }));
    if (stepErrors[name]) {
      setStepErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCourtChange = (e) => {
    const { name, value } = e.target;
    setCourtForm((prev) => ({ ...prev, [name]: value }));
    if (stepErrors[name]) {
      setStepErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const applySuggestedEndDate = () => {
    if (suggestedEndDate) {
      setEndDate(suggestedEndDate);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      subtitle={divisionLabel || undefined}
      footer={
        <div className="flex flex-wrap gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          {stepIndex > 0 && (
            <Button type="button" variant="ghost" onClick={goBack} disabled={submitting}>
              Back
            </Button>
          )}

          {step !== STEPS.REVIEW ? (
            <Button type="button" variant="primary" onClick={goNext} disabled={submitting}>
              Next
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create schedule'}
            </Button>
          )}
        </div>
      }
    >
      <nav className="flex flex-wrap gap-2 mb-6" aria-label="Schedule wizard steps">
            {stepOrder.map((stepId, index) => {
              const isActive = index === stepIndex;
              const isComplete = index < stepIndex;
              return (
                <div
                  key={stepId}
                  className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${
                    isActive
                      ? 'border-red-600 bg-red-50 text-red-700 font-medium'
                      : isComplete
                        ? 'border-green-300 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  <span className="font-semibold">{index + 1}.</span>
                  <span>{STEP_LABELS[stepId]}</span>
                </div>
              );
            })}
          </nav>

          {step === STEPS.TIME_SLOTS && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Set the weekday evening window and interval for each match slot (Monday–Friday only).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start time"
                  name="startTime"
                  type="time"
                  value={timeSlotForm.startTime}
                  onChange={handleTimeChange}
                  error={stepErrors.startTime}
                  required
                />
                <Input
                  label="End time"
                  name="endTime"
                  type="time"
                  value={timeSlotForm.endTime}
                  onChange={handleTimeChange}
                  error={stepErrors.endTime}
                  required
                />
              </div>
              <Input
                label="Minutes per match slot"
                name="intervalMinutes"
                type="number"
                min="15"
                max="180"
                value={timeSlotForm.intervalMinutes}
                onChange={handleTimeChange}
                error={stepErrors.intervalMinutes}
                required
              />
              <p className="text-sm text-gray-500">
                {timeSlotSummary.slotsPerWeekday} time slot(s) per weekday ({timeSlotSummary.timeRangeLabel})
              </p>
            </div>
          )}

          {step === STEPS.COURTS && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Matches run in parallel across courts at the same time slot to finish sooner.
              </p>
              <Input
                label="Number of playing courts"
                name="courtCount"
                type="number"
                min="1"
                max="16"
                value={courtForm.courtCount}
                onChange={handleCourtChange}
                error={stepErrors.courtCount}
                required
              />
              <Input
                label="Venue name"
                name="venueBase"
                value={courtForm.venueBase}
                onChange={handleCourtChange}
                placeholder="Main Court"
                error={stepErrors.venueBase}
                required
              />
              <p className="text-sm text-gray-500">
                {courtSummary.courtLabel}
                {parseInt(courtForm.courtCount, 10) > 1 && (
                  <> — e.g. {courtForm.venueBase} 1, {courtForm.venueBase} 2</>
                )}
              </p>
            </div>
          )}

          {step === STEPS.DATES && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {mode === 'group-stage'
                  ? 'Choose when the group stage begins. End date is optional — leave blank to schedule indefinitely.'
                  : 'Choose when this knockout round begins.'}
              </p>
              <Input
                label="Start date"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (stepErrors.startDate) {
                    setStepErrors((prev) => ({ ...prev, startDate: undefined }));
                  }
                }}
                error={stepErrors.startDate}
                required
              />
              {mode === 'group-stage' && (
                <>
                  <Input
                    label="End date (optional)"
                    name="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (stepErrors.endDate) {
                        setStepErrors((prev) => ({ ...prev, endDate: undefined }));
                      }
                    }}
                    error={stepErrors.endDate}
                  />
                  {matchCount > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                      <p>
                        <strong>{matchCount}</strong> qualifying matches need{' '}
                        <strong>{matchCount}</strong> match slots (
                        <strong>{matchesPerDay}</strong> per weekday across{' '}
                        {courtForm.courtCount} court(s)).
                      </p>
                      {loadingHint && <p className="mt-2 text-blue-700">Calculating suggested end date…</p>}
                      {!loadingHint && suggestedEndDate && (
                        <p className="mt-2">
                          Suggested minimum end date:{' '}
                          <strong>{suggestedEndDate}</strong>
                          {' '}
                          <button
                            type="button"
                            className="underline font-medium hover:text-blue-950"
                            onClick={applySuggestedEndDate}
                          >
                            Use this date
                          </button>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === STEPS.REVIEW && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Review your settings before creating the schedule.
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <dt className="text-gray-500">Time window</dt>
                  <dd className="font-medium text-gray-900">{timeSlotSummary.timeRangeLabel}</dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <dt className="text-gray-500">Slot interval</dt>
                  <dd className="font-medium text-gray-900">{timeSlotForm.intervalMinutes} minutes</dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <dt className="text-gray-500">Courts</dt>
                  <dd className="font-medium text-gray-900">{courtSummary.courtLabel}</dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <dt className="text-gray-500">Capacity</dt>
                  <dd className="font-medium text-gray-900">
                    {matchesPerDay} matches per weekday
                  </dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <dt className="text-gray-500">Start date</dt>
                  <dd className="font-medium text-gray-900">{startDate}</dd>
                </div>
                {mode === 'group-stage' && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <dt className="text-gray-500">End date</dt>
                    <dd className="font-medium text-gray-900">{endDate || 'None (open-ended)'}</dd>
                  </div>
                )}
              </dl>

              {mode === 'group-stage' && existingQualifyingCount > 0 && (
                <label className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-amber-900">
                    Replace <strong>{existingQualifyingCount}</strong> existing qualifying match(es)
                    with a fresh schedule for all <strong>{teamCount}</strong> teams.
                  </span>
                </label>
              )}
            </div>
          )}

          {submitError && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}
    </Modal>
  );
};

export default ScheduleWizard;
