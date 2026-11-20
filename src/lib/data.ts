import phrasesCsv from "../../content/phrases_49.csv?raw";
import wordsCsv from "../../content/words_500.csv?raw";
import { parseCsv } from "./csv";

export interface Word {
  key: string; // "w12"
  no: number;
  day: number;
  category: string;
  vi: string;
  pron: string;
  ko: string;
  audio: string;
}

export interface Phrase {
  key: string; // "p2-03"
  id: string;
  situationNo: number;
  situation: string;
  vi: string;
  pron: string;
  ko: string;
  audio: string;
}

export interface LessonLike {
  key: string;
  lessonId: string;
  category: string;
  vi: string;
  pron: string;
  ko: string;
  audio: string;
}

export type Item = Word | Phrase | LessonLike;

const BASE = import.meta.env.BASE_URL;

function rows(text: string): Record<string, string>[] {
  const [head, ...body] = parseCsv(text).filter((r) => r.length > 1);
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

export const WORDS: Word[] = rows(wordsCsv).map((r) => {
  const no = Number(r.no);
  return { key: `w${no}`, no, day: Number(r.day), category: r.category, vi: r.vi, pron: r.pron_ko, ko: r.meaning_ko, audio: `${BASE}audio/words/w${String(no).padStart(3, "0")}.mp3` };
});

export const PHRASES: Phrase[] = rows(phrasesCsv).map((r) => ({
  key: `p${r.id}`,
  id: r.id,
  situationNo: Number(r.situation_no),
  situation: r.situation,
  vi: r.vi,
  pron: r.pron_ko,
  ko: r.meaning_ko,
  audio: `${BASE}audio/phrases/p${r.id}.mp3`,
}));

export const TOTAL_DAYS = 100;
export const WORDS_PER_DAY = 5;

export const SITUATIONS: { no: number; name: string; count: number }[] = [...new Map(PHRASES.map((p) => [p.situationNo, p.situation])).entries()].map(([no, name]) => ({ no, name, count: PHRASES.filter((p) => p.situationNo === no).length }));

const ITEMS = new Map<string, Item>([...WORDS, ...PHRASES].map((item) => [item.key, item]));

/** 배우기 과의 항목은 lessons.ts가 불러올 때 여기에 더해요. */
export function registerItems(items: readonly Item[]): void {
  for (const item of items) ITEMS.set(item.key, item);
}

export function itemByKey(key: string): Item | undefined {
  return ITEMS.get(key);
}

export function wordsOfDay(day: number): Word[] {
  return WORDS.filter((w) => w.day === day);
}

export function isPhrase(item: Item): item is Phrase {
  return item.key.startsWith("p");
}

export function isWord(item: Item): item is Word {
  return item.key.startsWith("w");
}

/** 성조 기호를 빼고 소문자로 바꿔 검색해요. "nha ve sinh"로도 찾아져요. */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
}

export function searchPhrases(query: string): Phrase[] {
  const q = fold(query.trim());
  if (!q) return [];
  return PHRASES.filter((p) => fold(p.vi).includes(q) || p.ko.includes(query.trim()) || p.pron.includes(query.trim()));
}
