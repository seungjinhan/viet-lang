/** 기기 시간 기준 날짜 "YYYY-MM-DD"예요. 하루가 바뀌는 기준은 자정이에요. */
export function toDay(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return toDay(new Date(y, m - 1, d + n));
}

/** b에서 a까지 며칠인지 (a가 뒤면 양수) */
export function daysBetween(b: string, a: string): number {
  const [y1, m1, d1] = b.split("-").map(Number);
  const [y2, m2, d2] = a.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}
