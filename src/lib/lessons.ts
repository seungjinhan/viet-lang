import raw from "../../content/lessons.json";
import { PHRASES, WORDS, registerItems, type Phrase, type Word } from "./data";

export interface LessonItem {
  key: string; // "l1-4-02"
  lessonId: string;
  category: string; // 문제의 오답을 같은 과에서 먼저 고르려고 써요.
  vi: string;
  ko: string;
  pron: string;
  audio: string;
}

export interface Lesson {
  id: string;
  part: number;
  title: string;
  intro: string[];
  items: LessonItem[];
}

export interface Part {
  no: number;
  stage: number; // 사용자에게 보여주는 단계 번호 (1부터)
  title: string;
  learn: string;
  can: string;
  lessons: Lesson[];
}

interface RawLesson {
  id: string;
  title: string;
  intro: string[];
  items: string[][];
}

const BASE = import.meta.env.BASE_URL;

/** 끝의 마침표 · 물음표를 빼고 소문자로 맞춰, 단어 500개 · 여행회화와 같은 말을 찾아요. */
export function normVi(text: string): string {
  return text.normalize("NFC").trim().toLowerCase().replace(/[\s.!?]+$/, "");
}

const PHRASE_BY_VI = new Map<string, Phrase>(PHRASES.map((p) => [normVi(p.vi), p]));
const WORD_BY_VI = new Map<string, Word>(WORDS.map((w) => [normVi(w.vi), w]));

export const PARTS: Part[] = (raw.parts as { no: number; title: string; learn: string; can: string; lessons: RawLesson[] }[]).map((part) => ({
  no: part.no,
  stage: part.no + 1,
  title: part.title,
  learn: part.learn,
  can: part.can,
  lessons: part.lessons.map((l) => ({
    id: l.id,
    part: part.no,
    title: l.title,
    intro: l.intro,
    items: l.items.map(([vi, ko, pron], i) => {
      // 문장(마침표 · 물음표로 끝남)은 여행회화를, 단어는 단어 500개를 먼저 찾아요.
      const isSentence = /[.!?]$/.test(vi.trim());
      const found = isSentence ? (PHRASE_BY_VI.get(normVi(vi)) ?? WORD_BY_VI.get(normVi(vi))) : (WORD_BY_VI.get(normVi(vi)) ?? PHRASE_BY_VI.get(normVi(vi)));
      const n = String(i + 1).padStart(2, "0");
      return {
        key: `l${l.id}-${n}`,
        lessonId: l.id,
        category: `lesson ${l.id}`,
        vi,
        ko: ko || found?.ko || "",
        pron: pron || found?.pron || "",
        audio: found ? found.audio : `${BASE}audio/lessons/l${l.id}-${n}.mp3`,
      };
    }),
  })),
}));

export const LESSONS: Lesson[] = PARTS.flatMap((p) => p.lessons);
export const LESSON_ITEMS: LessonItem[] = LESSONS.flatMap((l) => l.items);
registerItems(LESSON_ITEMS);

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** 추천 순서상 다음에 할 과 (끝내지 않은 첫 과) */
export function nextLesson(done: readonly string[]): Lesson | undefined {
  return LESSONS.find((l) => !done.includes(l.id));
}

/** 1~36일은 기초 다지기(0~5부), 37일부터는 넓히고 실전으로(6~11부)예요. */
export const BASIC_DAYS = PARTS.filter((p) => p.no <= 5).reduce((n, p) => n + p.lessons.length, 0);

export function partOf(lessonId: string): Part | undefined {
  return PARTS.find((p) => p.lessons.some((l) => l.id === lessonId));
}

/** 하루 1과 기준 단계별 날짜 범위. 0부(시작하기)는 Day 1~2예요. */
export const STAGE_DAYS: { part: Part; from: number; to: number }[] = (() => {
  let day = 1;
  return PARTS.map((part) => {
    const from = day;
    day += part.lessons.length;
    return { part, from, to: day - 1 };
  });
})();

/** 단어 500개의 분류를 날짜 범위로 묶어요. 예: 인사 · 기본 Day 1~4 */
export function wordBlocks(): { category: string; from: number; to: number }[] {
  const blocks: { category: string; from: number; to: number }[] = [];
  for (const w of WORDS) {
    const last = blocks[blocks.length - 1];
    if (last && last.category === w.category) last.to = w.day;
    else blocks.push({ category: w.category, from: w.day, to: w.day });
  }
  return blocks;
}
