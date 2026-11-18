export function storedDate(value: Date | string | number | { toDate(): Date }): Date {
  if (typeof value === 'object' && value !== null && 'toDate' in value) return value.toDate();
  return new Date(value as Date | string | number);
}
