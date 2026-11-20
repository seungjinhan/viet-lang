import { LESSONS_READY } from "./lib/features";
import type { TestKind } from "./lib/progress";

export type Tab = "home" | "learn" | "words" | "travel" | "more";

export type Route =
  | { s: Tab }
  | { s: "curriculum" }
  | { s: "lesson"; id: string }
  | { s: "study"; day: number }
  | { s: "check"; day: number }
  | { s: "situation"; no: number }
  | { s: "big"; key: string }
  | { s: "saved" }
  | { s: "review"; source: "due" | "saved" }
  | { s: "testSetup"; kind: TestKind }
  | { s: "test"; kind: TestKind; count: number; keys?: string[] }
  | { s: "language" }
  | { s: "about" };

export type Go = (route: Route) => void;

const ALL_TABS: { tab: Tab; label: string }[] = [
  { tab: "home", label: "홈" },
  { tab: "learn", label: "배우기" },
  { tab: "words", label: "단어" },
  { tab: "travel", label: "여행회화" },
  { tab: "more", label: "더보기" },
];

export const TABS = ALL_TABS.filter((t) => t.tab !== "learn" || LESSONS_READY);
