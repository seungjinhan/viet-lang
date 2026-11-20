import { TOTAL_DAYS } from "./data";
import { LESSONS, type Lesson } from "./lessons";
import type { Progress } from "./progress";

/**
 * 100일 커리큘럼의 하루.
 * 매일 오늘의 과 1개 + 단어 5개 (배우기 100과 = 100일). 과가 없는 날이 생기면 랜덤 시험 1회가 그 자리를 채워요.
 * 할 일을 모두 끝내야 그날이 통과돼요. 통과하지 못하면 다음 날에도 같은 Day를 이어서 해요.
 */
export interface DayTasks {
  day: number;
  lesson: Lesson | undefined;
  lessonDone: boolean;
  wordsDone: boolean;
  needsTest: boolean;
  testDone: boolean;
  allDone: boolean;
}

export function lessonForDay(day: number): Lesson | undefined {
  return LESSONS[day - 1];
}

export function tasksFor(p: Progress, day: number): DayTasks {
  const lesson = lessonForDay(day);
  const lessonDone = !lesson || p.doneLessons.includes(lesson.id);
  const wordsDone = p.passedDays.includes(day);
  const needsTest = !lesson;
  const testDone = !needsTest || p.testedDays.includes(day);
  return { day, lesson, lessonDone, wordsDone, needsTest, testDone, allDone: lessonDone && wordsDone && testDone };
}

export type CourseStatus = { kind: "open"; day: number } | { kind: "doneToday"; day: number; next: number } | { kind: "finished" };

/** Day 1은 바로 열려요. Day N을 통과하면 Day N+1은 다음 날 열려요. 빠진 날이 있어도 멈춘 Day부터 이어요. */
export function courseStatus(p: Progress, today: string): CourseStatus {
  const last = p.completedDays.length ? Math.max(...p.completedDays) : 0;
  if (last > 0 && p.dayDoneDate === today) return last >= TOTAL_DAYS ? { kind: "finished" } : { kind: "doneToday", day: last, next: last + 1 };
  if (last >= TOTAL_DAYS) return { kind: "finished" };
  return { kind: "open", day: last + 1 };
}

/** 지금 Day의 할 일이 모두 끝났으면 그 Day를 통과로 기록해요. 기록을 바꿀 때마다 불러요. */
export function settleDay(p: Progress, today: string): Progress {
  const status = courseStatus(p, today);
  if (status.kind !== "open") return p;
  if (!tasksFor(p, status.day).allDone) return p;
  return { ...p, completedDays: [...p.completedDays, status.day], dayDoneDate: today };
}

/** 지금 하고 있는 Day (오늘 끝냈으면 그 Day) */
export function currentDay(status: CourseStatus): number {
  return status.kind === "finished" ? TOTAL_DAYS : status.day;
}
