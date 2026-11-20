import { isPhrase, type Item } from "./data";

export type QuestionKind = "meaning" | "reverse" | "listen";

export interface Question {
  item: Item;
  kind: QuestionKind;
  options: Item[];
}

export type Rng = () => number;

export function shuffle<T>(list: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 정답 하나와 오답 셋으로 4지선다를 만들어요.
 * 오답은 같은 분류(단어) · 같은 상황(문장)에서 먼저 고르고, 뜻이나 베트남어가 정답과 같은 것은 빼요.
 */
export function makeQuestion(item: Item, pool: readonly Item[], kinds: readonly QuestionKind[], rng: Rng = Math.random): Question {
  const kind = kinds[Math.floor(rng() * kinds.length)];
  const group = (x: Item) => (isPhrase(x) ? x.situationNo : x.category);
  const usable = pool.filter((x) => x.key !== item.key && x.ko !== item.ko && x.vi !== item.vi);
  const near = shuffle(usable.filter((x) => group(x) === group(item)), rng);
  const far = shuffle(usable.filter((x) => group(x) !== group(item)), rng);
  const picked: Item[] = [];
  for (const x of [...near, ...far]) {
    if (picked.length === 3) break;
    if (picked.some((y) => y.ko === x.ko || y.vi === x.vi)) continue;
    picked.push(x);
  }
  return { item, kind, options: shuffle([item, ...picked], rng) };
}

export function makeQuiz(targets: readonly Item[], pool: readonly Item[], kinds: readonly QuestionKind[], rng: Rng = Math.random): Question[] {
  return shuffle(targets, rng).map((item) => makeQuestion(item, pool, kinds, rng));
}
