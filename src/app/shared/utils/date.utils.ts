export function toISODateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function isValidDate(d: any): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}
