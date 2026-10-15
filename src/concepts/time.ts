/** Times cross the boundary as ISO strings; `now` arrives from the engine as a Date. */
export function instant(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new InvalidInstant(`Not a time: ${String(value)}`);
  return date.toISOString();
}

export function isAfter(a: string, b: string): boolean {
  return new Date(a).getTime() > new Date(b).getTime();
}

export class InvalidInstant extends Error {}
