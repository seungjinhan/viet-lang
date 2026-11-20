import { useEffect, useRef, useState, type ReactNode } from "react";
import { play, usePlaying } from "./lib/audio";
import { isPhrase, type Item } from "./lib/data";
import { toggleSaved } from "./lib/progress";
import type { Question } from "./lib/quiz";
import { TONE_NAMES, syllableTone, toneSpans } from "./lib/tones";
import { TABS, type Tab } from "./routes";
import { useStore } from "./store";

const ICONS: Record<Tab, ReactNode> = {
  home: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
  learn: <path d="M4 5h7a2 2 0 012 2v13a2 2 0 00-2-2H4zM20 5h-7a2 2 0 00-2 2v13a2 2 0 012-2h7z" />,
  words: <path d="M6 4h12v16H6zM9 9h6M9 13h6M9 17h3" />,
  travel: <path d="M4 6h16v10H9l-5 4zM8 10h8M8 13h5" />,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
};

export function TabBar({ current, onSelect }: { current: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <nav className="tab-bar" aria-label="하단 메뉴" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
      {TABS.map(({ tab, label }) => (
        <button key={tab} type="button" className={`tab${current === tab ? " is-active" : ""}`} aria-current={current === tab ? "page" : undefined} onClick={() => onSelect(tab)}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "more" ? 3.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
            {ICONS[tab]}
          </svg>
          {label}
        </button>
      ))}
    </nav>
  );
}

/**
 * 화면 제목이에요. 뒤로 가기는 앱인토스 내비게이션 바가 맡아서, 자체 뒤로 · 닫기 버튼은 두지 않아요.
 * (내비게이션 바의 뒤로가기와 겹치면 검토에서 반려돼요.)
 */
export function NavBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header className="page-title">
      <h1>{title}</h1>
      {right && <span className="nav-right">{right}</span>}
    </header>
  );
}

/** 베트남어를 성조 색으로 보여줘요. 성조 기호가 붙은 모음만 색이 들어가요. */
export function Vi({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`vi ${className}`} lang="vi">
      {toneSpans(text).map((s, i) => (s.tone ? <span key={i} className={`t-${s.tone}`}>{s.text}</span> : s.text))}
    </span>
  );
}

export function toneLabel(vi: string): string {
  const words = vi.split(/\s+/);
  return words.length === 1 ? `${TONE_NAMES[syllableTone(vi)]} 성조` : "";
}

export function PlayButton({ src, slow, large = false, label = "듣기" }: { src: string; slow?: boolean; large?: boolean; label?: string }) {
  const { p } = useStore();
  const playing = usePlaying();
  const [failed, setFailed] = useState(false);
  const rate = slow ?? p.settings.slow;
  const on = playing === src;
  return (
    <button
      type="button"
      className={`play${large ? " lg" : ""}${on ? " on" : ""}`}
      aria-label={on ? "멈춤" : failed ? "다시 듣기" : label}
      onClick={(e) => {
        e.stopPropagation();
        void play(src, rate).then((r) => setFailed(r === "failed"));
      }}
    >
      {on ? "■" : failed ? "↻" : "▶"}
    </button>
  );
}

export function SlowButton({ src }: { src: string }) {
  const playing = usePlaying();
  return (
    <button type="button" className="chip-btn" onClick={() => void play(src, true)} aria-pressed={playing === src}>
      🐢 느리게
    </button>
  );
}

export function Star({ itemKey }: { itemKey: string }) {
  const { p, update } = useStore();
  const on = p.saved.includes(itemKey);
  return (
    <button type="button" className={`star${on ? " on" : ""}`} aria-label={on ? "저장 빼기" : "저장하기"} aria-pressed={on} onClick={(e) => {
      e.stopPropagation();
      update((x) => toggleSaved(x, itemKey));
    }}>
      {on ? "★" : "☆"}
    </button>
  );
}

/** 한 줄 단어 · 문장 행 */
export function ItemRow({ item, extra }: { item: Item; extra?: ReactNode }) {
  const { p } = useStore();
  return (
    <div className="item-row">
      <PlayButton src={item.audio} />
      <div className="meta">
        <Vi text={item.vi} className="ttl" />
        <span className="sub">
          {item.ko}
          {p.settings.hint && p.settings.language === "ko" ? ` · ${item.pron}` : ""}
          {extra}
        </span>
      </div>
      <Star itemKey={item.key} />
    </div>
  );
}

/** 목록은 10개씩 보여주고, 끝까지 내리면 다음 10개를 이어 붙여요. */
export function InfiniteList<T>({ items, render, empty }: { items: readonly T[]; render: (item: T) => ReactNode; empty?: ReactNode }) {
  const [shown, setShown] = useState(10);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setShown((n) => n + 10);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [items.length]);
  if (!items.length) return <>{empty}</>;
  return (
    <>
      {items.slice(0, shown).map(render)}
      {shown < items.length && <div ref={sentinel} className="sentinel" aria-hidden="true" />}
    </>
  );
}

export function Banner({ children, tone = "info", action }: { children: ReactNode; tone?: "info" | "error"; action?: ReactNode }) {
  return (
    <div className={`banner ${tone}`} role={tone === "error" ? "alert" : "status"}>
      <div>{children}</div>
      {action}
    </div>
  );
}

/** 4지선다 한 문제. reveal이면 정답 · 고른 답을 색과 글로 보여줘요. */
export function QuestionView({ q, picked, reveal, onPick }: { q: Question; picked: string | null; reveal: boolean; onPick: (key: string) => void }) {
  const prompt = q.kind === "meaning" ? "뜻을 고르세요" : q.kind === "reverse" ? "베트남어를 고르세요" : "들은 말을 고르세요";
  return (
    <div className="question">
      <p className="q-kind">{prompt}</p>
      <div className="q-stem">
        {q.kind === "meaning" && (
          <>
            <Vi text={q.item.vi} className={isPhrase(q.item) ? "big-vi phrase" : "big-vi"} />
            <PlayButton src={q.item.audio} />
          </>
        )}
        {q.kind === "reverse" && <span className="big-ko">{q.item.ko}</span>}
        {q.kind === "listen" && <PlayButton key={q.item.key} src={q.item.audio} large label="문제 듣기" />}
      </div>
      <div className="options">
        {q.options.map((o) => {
          const isAnswer = o.key === q.item.key;
          const isPicked = o.key === picked;
          const state = reveal ? (isAnswer ? " ok" : isPicked ? " ng" : "") : isPicked ? " picked" : "";
          return (
            <button key={o.key} type="button" className={`opt${state}`} disabled={reveal} onClick={() => onPick(o.key)}>
              {q.kind === "meaning" ? o.ko : <Vi text={o.vi} />}
              {reveal && isAnswer && <span className="opt-tag">정답</span>}
              {reveal && isPicked && !isAnswer && <span className="opt-tag">내가 고른 답</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
