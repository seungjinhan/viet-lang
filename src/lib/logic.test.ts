import { describe, expect, it } from "vitest";
import { addDays, daysBetween } from "./date";
import { PHRASES, WORDS, fold, searchPhrases, wordsOfDay } from "./data";
import { courseStatus, lessonForDay, settleDay, tasksFor } from "./course";
import { EMPTY, addToReview, dueKeys, finishLesson, lessonDoneOn, passDay, restore, reviewAnswer, startCourse, streak, toggleSaved } from "./progress";
import { makeQuestion, makeQuiz } from "./quiz";
import { syllableTone, toneSpans } from "./tones";

const seq = (...xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length];
};

describe("data", () => {
  it("단어 500개 · 100일 · 하루 5개, 문장 49개", () => {
    expect(WORDS).toHaveLength(500);
    expect(new Set(WORDS.map((w) => w.day)).size).toBe(100);
    for (let d = 1; d <= 100; d += 1) expect(wordsOfDay(d)).toHaveLength(5);
    expect(PHRASES).toHaveLength(49);
    expect(WORDS[0].audio).toMatch(/audio\/words\/w001\.mp3$/);
    expect(PHRASES[0].audio).toMatch(/audio\/phrases\/p1-01\.mp3$/);
  });
  it("쉼표가 든 뜻도 읽어요 (1,000)", () => {
    expect(WORDS.find((w) => w.vi === "nghìn")?.ko).toBe("1,000");
  });
  it("성조 기호 없이 검색해요", () => {
    expect(fold("Nhà vệ sinh")).toBe("nha ve sinh");
    expect(searchPhrases("nha ve sinh").map((p) => p.id)).toContain("2-07");
    expect(searchPhrases("화장실").length).toBeGreaterThan(0);
  });
});

describe("tones", () => {
  it("음절 성조", () => {
    expect(["ma", "mà", "má", "mả", "mã", "mạ"].map(syllableTone)).toEqual(["ngang", "huyen", "sac", "hoi", "nga", "nang"]);
    expect(syllableTone("người")).toBe("huyen");
    expect(syllableTone("Việt")).toBe("nang");
  });
  it("성조 기호가 붙은 모음만 색을 줘요 (모음 모양 기호는 성조가 아니에요)", () => {
    expect(toneSpans("cơm").every((s) => !s.tone)).toBe(true);
    expect(toneSpans("phở").find((s) => s.tone)?.text).toBe("ở");
  });
});

describe("100일 과정", () => {
  const today = "2026-11-17";
  const tomorrow = addDays(today, 1);
  it("처음엔 Day 1이 열려 있어요", () => {
    expect(courseStatus(EMPTY, today)).toEqual({ kind: "open", day: 1 });
  });
  it("과와 단어를 모두 끝내야 그날이 통과돼요", () => {
    const wordsOnly = settleDay(passDay(EMPTY, 1, []), today);
    expect(courseStatus(wordsOnly, today)).toEqual({ kind: "open", day: 1 });
    expect(tasksFor(wordsOnly, 1)).toMatchObject({ wordsDone: true, lessonDone: false, allDone: false });
    const both = settleDay(finishLesson(wordsOnly, "0-1", today), today);
    expect(courseStatus(both, today)).toEqual({ kind: "doneToday", day: 1, next: 2 });
    expect(courseStatus(both, tomorrow)).toEqual({ kind: "open", day: 2 });
  });
  it("통과하지 못하면 다음 날에도 같은 Day예요", () => {
    const p = settleDay(passDay(EMPTY, 1, ["w3"]), today);
    expect(courseStatus(p, tomorrow)).toEqual({ kind: "open", day: 1 });
    expect(p.carry).toEqual(["w3"]);
    const done = settleDay(finishLesson(p, "0-1", tomorrow), tomorrow);
    expect(courseStatus(done, tomorrow)).toEqual({ kind: "doneToday", day: 1, next: 2 });
  });
  it("며칠 빠져도 멈춘 Day부터 이어요", () => {
    const p = settleDay(finishLesson(passDay(EMPTY, 1, []), "0-1", today), today);
    expect(courseStatus(p, addDays(today, 5))).toEqual({ kind: "open", day: 2 });
  });
  it("매일 1과: Day 37은 6-1과, Day 100은 11-12과", () => {
    expect(lessonForDay(36)?.id).toBe("5-4");
    expect(lessonForDay(37)?.id).toBe("6-1");
    expect(lessonForDay(100)?.id).toBe("11-12");
    const p = { ...EMPTY, completedDays: Array.from({ length: 36 }, (_, i) => i + 1), dayDoneDate: "2026-01-01" };
    expect(tasksFor(p, 37)).toMatchObject({ needsTest: false, allDone: false });
    const done = settleDay(finishLesson(passDay(p, 37, []), "6-1", today), today);
    expect(courseStatus(done, today)).toEqual({ kind: "doneToday", day: 37, next: 38 });
  });
  it("Day 100을 통과하면 끝", () => {
    const p = { ...EMPTY, completedDays: Array.from({ length: 100 }, (_, i) => i + 1), dayDoneDate: "2026-01-01" };
    expect(courseStatus(p, today)).toEqual({ kind: "finished" });
  });
});

describe("복습 · 저장", () => {
  const today = "2026-11-17";
  it("간격 반복: 맞히면 1 → 3 → 7일, 틀리면 다음 날", () => {
    let p = addToReview(EMPTY, ["w1"], today);
    expect(dueKeys(p, today)).toEqual([]);
    expect(dueKeys(p, addDays(today, 1))).toEqual(["w1"]);
    p = reviewAnswer(p, "w1", true, addDays(today, 1));
    expect(daysBetween(addDays(today, 1), p.srs.w1.due)).toBe(3);
    p = reviewAnswer(p, "w1", false, addDays(today, 4));
    expect(p.srs.w1).toEqual({ box: 0, due: addDays(today, 5) });
  });
  it("☆ 저장은 다시 누르면 빠져요", () => {
    const p = toggleSaved(toggleSaved(EMPTY, "w1"), "p2-03");
    expect(p.saved).toEqual(["p2-03", "w1"]);
    expect(toggleSaved(p, "w1").saved).toEqual(["p2-03"]);
  });
  it("연속 학습 일수", () => {
    const p = { ...EMPTY, studyDates: ["2026-11-14", "2026-11-15", "2026-11-16"] };
    expect(streak(p, today)).toBe(3);
    expect(streak(p, "2026-11-18")).toBe(0);
  });
  it("망가진 기록은 빈 값으로 읽어요", () => {
    expect(restore("x").passedDays).toEqual([]);
    expect(restore({ passedDays: [1, "a"], settings: { slow: true } }).passedDays).toEqual([1]);
    expect(restore({ settings: { slow: true } }).settings).toEqual({ language: "ko", slow: true, hint: true });
    expect(restore({ startedAt: 3, lessonDates: null }).startedAt).toBeNull();
  });
});

describe("문제 만들기", () => {
  it("보기 4개, 정답 포함, 뜻 · 베트남어가 겹치지 않아요", () => {
    for (const w of WORDS.slice(0, 100)) {
      const q = makeQuestion(w, WORDS, ["meaning", "reverse", "listen"]);
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(w);
      expect(new Set(q.options.map((o) => o.ko)).size).toBe(4);
      expect(new Set(q.options.map((o) => o.vi)).size).toBe(4);
    }
  });
  it("문장도 4지선다", () => {
    const q = makeQuestion(PHRASES[0], PHRASES, ["meaning"]);
    expect(q.options).toHaveLength(4);
  });
  it("문제 순서는 섞여요", () => {
    const targets = wordsOfDay(1);
    const a = makeQuiz(targets, WORDS, ["meaning"], seq(0.9, 0.1, 0.5, 0.3, 0.7));
    expect(a.map((q) => q.item.key).sort()).toEqual(targets.map((w) => w.key).sort());
  });
});

describe("100일 커리큘럼", () => {
  it("시작한 날은 한 번만 기록해요", () => {
    const p = startCourse(EMPTY, "2026-11-18");
    expect(startCourse(p, "2026-11-20").startedAt).toBe("2026-11-18");
  });
  it("오늘 끝낸 과를 알아요", () => {
    const p = finishLesson(EMPTY, "0-1", "2026-11-18");
    expect(lessonDoneOn(p, "2026-11-18")).toBe("0-1");
    expect(lessonDoneOn(p, "2026-11-19")).toBeUndefined();
    expect(finishLesson(p, "0-1", "2026-11-19").lessonDates["0-1"]).toBe("2026-11-18");
  });
});
