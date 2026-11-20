import { createContext, useContext, useMemo, useState } from "react";
import { PHRASES, WORDS, itemByKey, isPhrase, isWord, type Item } from "../lib/data";
import "../lib/lessons";
import { LANGUAGES_READY, LESSONS_READY } from "../lib/features";
import { WEB } from "../lib/platform";
import { EMPTY, dueKeys, markStudied, reviewAnswer } from "../lib/progress";
import { makeQuiz } from "../lib/quiz";
import type { Go } from "../routes";
import { useStore } from "../store";
import { AppOnlySheet, InfiniteList, ItemRow, NavBar, QuestionView, Vi } from "../ui";

export const LANGUAGES: { code: string; name: string }[] = [
  { code: "ko", name: "한국어" },
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
  { code: "zh-Hant", name: "繁體中文" },
  { code: "zh-Hans", name: "简体中文" },
  { code: "th", name: "ภาษาไทย" },
  { code: "es", name: "Español" },
  { code: "id", name: "Bahasa Indonesia" },
];

function Row({ label, value, onClick, strong = false }: { label: string; value?: string; onClick?: () => void; strong?: boolean }) {
  const onLocked = useLocked();
  // 웹 버전은 앱 정보만 열고, 나머지는 잠가서 앱으로 안내해요.
  if (WEB && onLocked) {
    return (
      <button type="button" className="row locked" onClick={onLocked}>
        <span className={strong ? "strong" : ""}>{label}</span>
        <span className="v">🔒 앱에서</span>
      </button>
    );
  }
  return (
    <button type="button" className="row" onClick={onClick} disabled={!onClick}>
      <span className={strong ? "strong" : ""}>{label}</span>
      <span className="v">
        {value}
        {onClick ? " ›" : ""}
      </span>
    </button>
  );
}

const LockedContext = createContext<(() => void) | null>(null);
const useLocked = () => useContext(LockedContext);


/** 11 더보기 */
export function MoreScreen({ go }: { go: Go }) {
  const { p, today, update } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const due = dueKeys(p, today).length;
  const lang = LANGUAGES.find((l) => l.code === p.settings.language)?.name ?? "한국어";
  const [appOnly, setAppOnly] = useState(false);
  return (
    <LockedContext.Provider value={WEB ? () => setAppOnly(true) : null}>
    <main className="screen">
      <NavBar title="더보기" />
      <p className="group-title">공부</p>
      <Row label="복습" value={due ? `오늘 ${due}장` : "오늘 없음"} onClick={() => go({ s: "review", source: "due" })} strong />
      <Row label="저장한 단어" value={`${p.saved.length}개`} onClick={() => go({ s: "saved" })} />
      <p className="group-title">시험보기 (랜덤)</p>
      <Row label="단어 시험" value={`외운 단어 ${p.passedDays.length * 5}개`} onClick={() => go({ s: "testSetup", kind: "word" })} />
      <Row label="회화 시험" value={`여행회화 ${PHRASES.length}문장`} onClick={() => go({ s: "testSetup", kind: "phrase" })} />
      {LESSONS_READY && <Row label="배우기 시험" value={`끝낸 과 ${p.doneLessons.length}개`} onClick={() => go({ s: "testSetup", kind: "lesson" })} />}
      <p className="group-title">설정</p>
      {LANGUAGES.filter((l) => LANGUAGES_READY.includes(l.code)).length > 1 && <Row label="언어" value={lang} onClick={() => go({ s: "language" })} />}
      <Row label="음성 속도" value={p.settings.slow ? "느리게 (0.75배)" : "보통"} onClick={() => update((x) => ({ ...x, settings: { ...x.settings, slow: !x.settings.slow } }))} />
      {p.settings.language === "ko" && <Row label="한글 발음 힌트" value={p.settings.hint ? "보이기" : "숨기기"} onClick={() => update((x) => ({ ...x, settings: { ...x.settings, hint: !x.settings.hint } }))} />}
      <Row label="기준 발음" value="북부(하노이)" />
      <Row label="학습 기록 지우기" onClick={() => setConfirmReset(true)} />
      <LockedContext.Provider value={null}>
        <Row label="앱 정보" value="버전 0.1.0" onClick={() => go({ s: "about" })} />
      </LockedContext.Provider>
      {confirmReset && (
        <div className="sheet-backdrop" onClick={() => setConfirmReset(false)}>
          <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="big">학습 기록을 모두 지울까요?</h2>
            <p className="t">100일 진도, 복습, 저장한 단어, 시험 기록이 지워지고 되돌릴 수 없어요.</p>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                update((x) => ({ ...EMPTY, settings: x.settings }));
                setConfirmReset(false);
              }}
            >
              지우기
            </button>
            <button type="button" className="btn ghost" onClick={() => setConfirmReset(false)}>
              그대로 두기
            </button>
          </div>
        </div>
      )}
      {WEB && appOnly && <AppOnlySheet onClose={() => setAppOnly(false)} />}
    </main>
    </LockedContext.Provider>
  );
}

/** 12 저장한 단어 */
export function SavedScreen({ go }: { go: Go }) {
  const { p } = useStore();
  const items = p.saved.map(itemByKey).filter((x): x is Item => !!x);
  return (
    <main className="screen">
      <NavBar title="저장한 단어" />
      <InfiniteList
        items={items}
        render={(item) => <ItemRow key={item.key} item={item} extra={isPhrase(item) ? " · 여행회화" : isWord(item) ? ` · Day ${item.day}` : " · 배우기"} />}
        empty={<p className="empty">단어 카드나 여행회화에서 ☆를 누르면 여기에 모여요.</p>}
      />
      {items.length >= 2 && (
        <button type="button" className="btn sticky" onClick={() => go({ s: "review", source: "saved" })}>
          저장한 단어 복습
        </button>
      )}
    </main>
  );
}

/** 09 복습: 오늘 복습할 카드(간격 반복) 또는 저장한 단어 */
export function ReviewScreen({ source, back }: { source: "due" | "saved"; back: () => void }) {
  const { p, today, update } = useStore();
  const quiz = useMemo(() => {
    const keys = source === "due" ? dueKeys(p, today) : p.saved;
    const items = keys.map(itemByKey).filter((x): x is Item => !!x).slice(0, 20);
    return makeQuiz(items, [...WORDS, ...PHRASES], ["meaning", "reverse", "listen"]);
    // 복습을 시작할 때 한 번만 만들어요.
  }, [source]);
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const title = source === "due" ? "복습" : "저장한 단어 복습";

  if (!quiz.length) {
    return (
      <main className="screen">
        <NavBar title={title} />
        <section className="box center">
          <h2 className="big">{p.passedDays.length ? "오늘 복습은 끝났어요" : "아직 복습할 카드가 없어요"}</h2>
          <p className="t">{p.passedDays.length ? "내일 다시 나올 카드를 기다려요." : "Day를 하나 통과하면 외운 단어가 여기에 모여요. 내일 다시 보면 더 오래 기억해요."}</p>
        </section>
      </main>
    );
  }

  if (n >= quiz.length) {
    return (
      <main className="screen focus center">
        <NavBar title={title} />
        <div className="spacer" />
        <h2 className="big">복습 끝!</h2>
        <p className="huge-num">
          {score} / {quiz.length}
        </p>
        <p className="t">{source === "due" ? "맞힌 카드는 더 나중에, 틀린 카드는 내일 다시 나와요." : "저장한 단어는 원할 때 언제든 다시 복습해요."}</p>
        <div className="spacer" />
        <button type="button" className="btn" onClick={back}>
          돌아가기
        </button>
      </main>
    );
  }

  const q = quiz[n];
  return (
    <main className="screen focus">
      <NavBar title={title} right={`${n + 1}/${quiz.length}`} />
      <QuestionView
        q={q}
        picked={picked}
        reveal={!!picked}
        onPick={(key) => {
          if (picked) return;
          setPicked(key);
          const ok = key === q.item.key;
          if (ok) setScore((s) => s + 1);
          if (source === "due") update((x) => markStudied(reviewAnswer(x, q.item.key, ok, today), today));
        }}
      />
      {picked && (
        <p className="note">
          <Vi text={q.item.vi} /> = {q.item.ko}
        </p>
      )}
      <div className="spacer" />
      <button
        type="button"
        className="btn"
        disabled={!picked}
        onClick={() => {
          setN(n + 1);
          setPicked(null);
        }}
      >
        {n + 1 < quiz.length ? "다음" : "결과 보기"}
      </button>
    </main>
  );
}

/** 18 언어 */
export function LanguageScreen({ back }: { back: () => void }) {
  const { p, update } = useStore();
  return (
    <main className="screen">
      <NavBar title="언어" />
      <p className="t">화면 글자와 단어 뜻이 이 언어로 나와요. 배우는 말은 늘 베트남어예요.</p>
      {p.settings.language !== "ko" && <p className="note">이 언어는 번역을 준비 중이에요. 지금은 한국어로 보여요.</p>}
      {LANGUAGES.filter((l) => LANGUAGES_READY.includes(l.code)).map((l) => (
        <button
          key={l.code}
          type="button"
          className="row"
          aria-pressed={p.settings.language === l.code}
          onClick={() => {
            update((x) => ({ ...x, settings: { ...x.settings, language: l.code } }));
            back();
          }}
        >
          <span className={p.settings.language === l.code ? "strong" : ""} lang={l.code}>
            {l.name}
          </span>
          <span className="v">{p.settings.language === l.code ? "✓" : ""}</span>
        </button>
      ))}
    </main>
  );
}

export function AboutScreen() {
  return (
    <main className="screen">
      <NavBar title="앱 정보" />
      <section className="box">
        <p className="t">베트남어 배우기 · 버전 0.1.0</p>
        <p className="t">필수 단어 {WORDS.length}개 · 여행회화 {PHRASES.length}문장 · 북부(하노이) 발음</p>
        <p className="t">음성: VieNeu-TTS (Apache 2.0)로 만든 합성 음성이에요.</p>
        <p className="t3">학습 기록은 이 기기에만 저장돼요.</p>
      </section>
    </main>
  );
}
