import { useMemo, useRef, useState } from "react";
import { PHRASES, WORDS, itemByKey, type Item } from "../lib/data";
import { LESSONS_READY } from "../lib/features";
import { LESSON_ITEMS } from "../lib/lessons";
import { courseStatus, lessonForDay } from "../lib/course";
import { addTest, markStudied, markTested, type TestKind } from "../lib/progress";
import { makeQuiz, shuffle, type QuestionKind } from "../lib/quiz";
import type { Go, Route, Tab } from "../routes";
import { useStore } from "../store";
import { NavBar, PlayButton, QuestionView, Star, Vi } from "../ui";

const KIND_NAMES: Record<TestKind, string> = { word: "단어", phrase: "회화", lesson: "배우기" };

function usePool(kind: TestKind): Item[] {
  const { p } = useStore();
  if (kind === "word") return WORDS.filter((w) => p.passedDays.includes(w.day));
  if (kind === "phrase") return PHRASES;
  return LESSON_ITEMS.filter((i) => p.doneLessons.includes(i.lessonId));
}

const KINDS: Record<TestKind, QuestionKind[]> = { word: ["meaning", "reverse", "listen"], phrase: ["meaning", "listen"], lesson: ["meaning", "listen"] };

/** 15 시험보기 */
export function TestSetupScreen({ kind, go, selectTab }: { kind: TestKind; go: Go; selectTab: (tab: Tab) => void }) {
  const { p } = useStore();
  const [current, setCurrent] = useState(kind);
  const [count, setCount] = useState(10);
  const pool = usePool(current);
  const last = p.tests.filter((t) => t.kind === current).slice(0, 3);
  const desc =
    current === "word"
      ? pool.length
        ? `Day 1~${Math.max(...p.passedDays)}에서 외운 단어 ${pool.length}개 중 랜덤으로 내요.`
        : "Day 1을 먼저 끝내면 단어 시험을 볼 수 있어요."
      : current === "phrase"
        ? `여행회화 ${pool.length}문장 중 랜덤으로 내요.`
        : pool.length
          ? `끝낸 과 ${p.doneLessons.length}개의 단어 · 문장 ${pool.length}개 중 랜덤으로 내요.`
          : "과를 하나 끝내면 배우기 시험을 볼 수 있어요.";
  return (
    <main className="screen">
      <NavBar title="시험보기" />
      <div className="seg" role="tablist">
        {(LESSONS_READY ? (["word", "phrase", "lesson"] as TestKind[]) : (["word", "phrase"] as TestKind[])).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={current === k} className={current === k ? "on" : ""} onClick={() => setCurrent(k)}>
            {KIND_NAMES[k]}
          </button>
        ))}
      </div>
      <section className="box">
        <h2 className="h">{KIND_NAMES[current]} 시험</h2>
        <p className="t">{desc}</p>
        <p className="t3">문제와 보기 순서는 볼 때마다 바뀌어요. 정답은 끝나고 한꺼번에 보여줘요.</p>
      </section>
      {pool.length > 0 ? (
        <>
          <h2 className="h">문제 수</h2>
          <div className="seg">
            {[10, 20, 30].map((c) => (
              <button key={c} type="button" className={count === c ? "on" : ""} aria-pressed={count === c} onClick={() => setCount(c)}>
                {Math.min(c, pool.length) === c ? c : `${c} (${pool.length})`}
              </button>
            ))}
          </div>
          {last.length > 0 && (
            <>
              <h2 className="h">지난 시험</h2>
              {last.map((t, i) => (
                <div key={i} className="row static">
                  <span>
                    {t.date.slice(5).replace("-", "/")} · {t.total}문제
                  </span>
                  <span className="v">
                    {t.score} / {t.total}
                  </span>
                </div>
              ))}
            </>
          )}
          <button type="button" className="btn sticky" onClick={() => go({ s: "test", kind: current, count })}>
            랜덤 시험 시작
          </button>
        </>
      ) : current === "word" ? (
        <button type="button" className="btn ghost" onClick={() => selectTab("words")}>
          단어 탭으로 가기
        </button>
      ) : (
        <button type="button" className="btn ghost" onClick={() => selectTab("learn")}>
          배우기 탭으로 가기
        </button>
      )}
    </main>
  );
}

/** 16 시험 중 → 답안 확인 → 17 결과 */
export function TestScreen({ route, go, back }: { route: Extract<Route, { s: "test" }>; go: Go; back: () => void }) {
  const { today, update } = useStore();
  const pool = usePool(route.kind);
  const quiz = useMemo(() => {
    const targets = route.keys ? route.keys.map(itemByKey).filter((x): x is Item => !!x) : shuffle(pool).slice(0, route.count);
    return makeQuiz(targets, route.kind === "phrase" ? PHRASES : route.kind === "lesson" ? [...pool, ...WORDS] : WORDS, KINDS[route.kind]);
    // 시험을 시작할 때 한 번만 만들어요.
  }, [route]);
  const [n, setN] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [stage, setStage] = useState<"run" | "check" | "result">("run");
  const timer = useRef<number>();

  const answered = Object.keys(answers).length;
  const wrong = quiz.filter((q, i) => answers[i] !== q.item.key);
  const score = quiz.length - wrong.length;

  if (stage === "result") {
    return (
      <main className="screen">
        <NavBar title="시험 결과" />
        <section className="center">
          <p className="t3">
            {KIND_NAMES[route.kind]} · {quiz.length}문제
          </p>
          <p className="huge-num">
            {score} / {quiz.length}
          </p>
        </section>
        {wrong.length > 0 ? (
          <>
            <h2 className="h">틀린 문제 {wrong.length}</h2>
            {wrong.map((q) => {
              const mine = q.options.find((o) => o.key === answers[quiz.indexOf(q)]);
              return (
                <div key={q.item.key} className="item-row">
                  <PlayButton src={q.item.audio} />
                  <div className="meta">
                    <Vi text={q.item.vi} className="ttl wrap" />
                    <span className="sub">
                      {q.item.ko} · 내 답: {mine ? (q.kind === "meaning" ? mine.ko : mine.vi) : "안 풂"}
                    </span>
                  </div>
                  <Star itemKey={q.item.key} />
                </div>
              );
            })}
            <p className="t3">☆를 누르면 저장한 단어에 들어가요.</p>
            <button type="button" className="btn" onClick={() => go({ s: "test", kind: route.kind, count: wrong.length, keys: wrong.map((q) => q.item.key) })}>
              틀린 것만 다시 시험
            </button>
          </>
        ) : (
          <p className="t center">모두 맞혔어요!</p>
        )}
        <button type="button" className="btn ghost" onClick={back}>
          시험보기로 돌아가기
        </button>
      </main>
    );
  }

  if (stage === "check") {
    const unanswered = quiz.map((_, i) => i).filter((i) => !answers[i]);
    return (
      <main className="screen focus center">
        <NavBar title="답안 확인" />
        <div className="spacer" />
        <h2 className="big">
          {quiz.length}문제 중 {answered}문제 풀었어요
        </h2>
        <div className="spacer" />
        {unanswered.length > 0 && (
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setN(unanswered[0]);
              setStage("run");
            }}
          >
            안 푼 문제 보기
          </button>
        )}
        <button
          type="button"
          className="btn"
          onClick={() => {
            update((x) => {
              // 37일부터는 랜덤 시험 1회가 오늘 할 일이에요.
              const status = courseStatus(x, today);
              const tested = status.kind === "open" && !lessonForDay(status.day) ? markTested(x, status.day) : x;
              return markStudied(addTest(tested, { date: today, kind: route.kind, score, total: quiz.length }), today);
            });
            setStage("result");
          }}
        >
          제출
        </button>
      </main>
    );
  }

  const q = quiz[n];
  return (
    <main className="screen focus">
      <NavBar title={`${KIND_NAMES[route.kind]} 시험`} right={`${n + 1}/${quiz.length}`} />
      <div className="bar">
        <i style={{ width: `${((n + 1) / quiz.length) * 100}%` }} />
      </div>
      <QuestionView
        q={q}
        picked={answers[n] ?? null}
        reveal={false}
        onPick={(key) => {
          setAnswers((a) => ({ ...a, [n]: key }));
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => {
            if (n + 1 < quiz.length) setN(n + 1);
            else setStage("check");
          }, 300);
        }}
      />
      <p className="note">보기를 누르면 바로 다음 문제로 넘어가요. 정답은 끝나고 한꺼번에 보여줘요.</p>
      <div className="spacer" />
      <button type="button" className="btn ghost" disabled={n === 0} onClick={() => setN(n - 1)}>
        ‹ 이전 문제
      </button>
    </main>
  );
}
