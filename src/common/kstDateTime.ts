export const KST_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;

export function getKstDbDate(now: Date) {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MILLISECONDS);

  return new Date(
    Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate(),
    ),
  );
}

export function getKstSlotStartMilliseconds(date: Date, startTime: Date) {
  return (
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      startTime.getUTCHours(),
      startTime.getUTCMinutes(),
      startTime.getUTCSeconds(),
      startTime.getUTCMilliseconds(),
    ) - KST_OFFSET_MILLISECONDS
  );
}

export function isPastKstTimeSlot(
  date: Date,
  startTime: Date,
  now: Date = new Date(),
) {
  return getKstSlotStartMilliseconds(date, startTime) < now.getTime();
}

export function isSameKstDate(date: Date, now: Date = new Date()) {
  const kstToday = getKstDbDate(now);

  return (
    date.getUTCFullYear() === kstToday.getUTCFullYear() &&
    date.getUTCMonth() === kstToday.getUTCMonth() &&
    date.getUTCDate() === kstToday.getUTCDate()
  );
}
