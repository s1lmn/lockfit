export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRecentLocalDateKeys(days: number, now = new Date()): string[] {
  const safeDays = Math.max(1, Math.floor(days));

  return Array.from({ length: safeDays }, (_, index) => {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (safeDays - index - 1));
    return getLocalDateKey(date);
  });
}

export function formatDateTimeLabel(value: string): string {
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
