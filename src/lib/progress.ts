import { addDays, daysBetween } from "./date";

/** 기기에 저장하는 학습 기록 전부예요. */
export interface Progress {
  passedDays: number[];
  doneLessons: string[];
  lessonDates: Record<string, string>; // 과를 끝낸 날
  startedAt: string | null; // 100일 커리큘럼을 시작한 날
  completedDays: number[]; // 할 일을 모두 끝낸 커리큘럼 Day
  dayDoneDate: string | null; // 마지막으로 Day를 끝낸 날
  testedDays: number[]; // 랜덤 시험을 본 Day (37일부터 할 일)
  carry: string[]; // 다음 확인 테스트에 다시 낼 단어 (틀린 단어)
  srs: Record<string, { box: number; due: string }>;
  saved: string[];
  studyDates: string[];
  tests: { date: string; kind: TestKind; score: number; total: number }[];
  settings: { language: string; slow: boolean; hint: boolean };
}

export type TestKind = "word" | "phrase" | "lesson";

export const EMPTY: Progress = {
  passedDays: [],
  doneLessons: [],
  lessonDates: {},
  startedAt: null,
  completedDays: [],
  dayDoneDate: null,
  testedDays: [],
  carry: [],
  srs: {},
  saved: [],
  studyDates: [],
  tests: [],
  settings: { language: "ko", slow: false, hint: true },
};

export function restore(value: unknown): Progress {
  const v = (value ?? {}) as Partial<Progress>;
  const arr = <T,>(x: unknown, ok: (y: unknown) => boolean): T[] => (Array.isArray(x) ? (x.filter(ok) as T[]) : []);
  return {
    passedDays: arr<number>(v.passedDays, (x) => Number.isInteger(x)),
    doneLessons: arr<string>(v.doneLessons, (x) => typeof x === "string"),
    lessonDates: typeof v.lessonDates === "object" && v.lessonDates ? v.lessonDates : {},
    startedAt: typeof v.startedAt === "string" ? v.startedAt : null,
    completedDays: arr<number>(v.completedDays, (x) => Number.isInteger(x)),
    dayDoneDate: typeof v.dayDoneDate === "string" ? v.dayDoneDate : null,
    testedDays: arr<number>(v.testedDays, (x) => Number.isInteger(x)),
    carry: arr<string>(v.carry, (x) => typeof x === "string"),
    srs: typeof v.srs === "object" && v.srs ? v.srs : {},
    saved: arr<string>(v.saved, (x) => typeof x === "string"),
    studyDates: arr<string>(v.studyDates, (x) => typeof x === "string"),
    tests: arr(v.tests, (x) => typeof x === "object" && x !== null),
    settings: { ...EMPTY.settings, ...(typeof v.settings === "object" ? v.settings : {}) },
  };
}

/** 확인 테스트에서 오늘 5개 중 4개 이상 맞히면 통과예요. */
export const PASS_SCORE = 4;

/** 단어 확인 테스트 통과. 하루가 끝나는지는 course.ts의 settleDay가 정해요. */
export function passDay(p: Progress, day: number, wrongToday: string[]): Progress {
  const passedDays = p.passedDays.includes(day) ? p.passedDays : [...p.passedDays, day].sort((a, b) => a - b);
  return { ...p, passedDays, carry: wrongToday };
}

export function markTested(p: Progress, day: number): Progress {
  return p.testedDays.includes(day) ? p : { ...p, testedDays: [...p.testedDays, day] };
}

/** 간격 반복: 맞히면 1 → 3 → 7 → 14 → 30일 뒤, 틀리면 다음 날 다시 나와요. */
export const INTERVALS = [1, 3, 7, 14, 30];

export function addToReview(p: Progress, keys: string[], today: string): Progress {
  const srs = { ...p.srs };
  for (const key of keys) if (!srs[key]) srs[key] = { box: 0, due: addDays(today, 1) };
  return { ...p, srs };
}

export function reviewAnswer(p: Progress, key: string, correct: boolean, today: string): Progress {
  const cur = p.srs[key] ?? { box: 0, due: today };
  const box = correct ? Math.min(cur.box + 1, INTERVALS.length - 1) : 0;
  return { ...p, srs: { ...p.srs, [key]: { box, due: addDays(today, correct ? INTERVALS[box] : 1) } } };
}

export function dueKeys(p: Progress, today: string): string[] {
  return Object.entries(p.srs)
    .filter(([, v]) => daysBetween(v.due, today) >= 0)
    .map(([k]) => k);
}

export function toggleSaved(p: Progress, key: string): Progress {
  return { ...p, saved: p.saved.includes(key) ? p.saved.filter((k) => k !== key) : [key, ...p.saved] };
}

export function markStudied(p: Progress, today: string): Progress {
  return p.studyDates.includes(today) ? p : { ...p, studyDates: [...p.studyDates, today].slice(-120) };
}

/** 오늘 또는 어제까지 이어진 연속 학습 일수 */
export function streak(p: Progress, today: string): number {
  const set = new Set(p.studyDates);
  let day = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(day)) {
    n += 1;
    day = addDays(day, -1);
  }
  return n;
}

export function addTest(p: Progress, entry: Progress["tests"][number]): Progress {
  return { ...p, tests: [entry, ...p.tests].slice(0, 10) };
}

export function finishLesson(p: Progress, id: string, today: string): Progress {
  if (p.doneLessons.includes(id)) return p;
  return { ...p, doneLessons: [...p.doneLessons, id], lessonDates: { ...p.lessonDates, [id]: today } };
}

export function startCourse(p: Progress, today: string): Progress {
  return p.startedAt ? p : { ...p, startedAt: today };
}

/** 오늘 끝낸 과 (없으면 undefined) */
export function lessonDoneOn(p: Progress, today: string): string | undefined {
  return Object.entries(p.lessonDates).find(([, d]) => d === today)?.[0];
}
