import { useEffect, useMemo, useState } from "react";
import { play } from "../lib/audio";
import { WORDS, itemByKey, wordsOfDay, type Word } from "../lib/data";
import { courseStatus, currentDay, tasksFor } from "../lib/course";
import { PASS_SCORE, addToReview, markStudied, passDay } from "../lib/progress";
import { makeQuiz, type Question } from "../lib/quiz";
import type { Go, Tab } from "../routes";
import { useStore } from "../store";
import { ItemRow, NavBar, PlayButton, QuestionView, SlowButton, Star, Vi, toneLabel } from "../ui";

/** 22 단어 홈: 오늘 Day, 5단어, 100칸 진도 */
export function WordsScreen({ go }: { go: Go }) {
  const { p, today } = useStore();
  const status = courseStatus(p, today);
  const day = currentDay(status);
  const words = wordsOfDay(day);
  const passed = new Set(p.completedDays);
  const wordsDone = p.passedDays.includes(day);
  return (
    <main className="screen">
      <NavBar title="단어" />
      <section className="box">
        <p className="h">
          100일 필수 단어 <small>외운 단어 {p.passedDays.length * 5} / 500</small>
        </p>
        <h2 className="big">
          Day {day} · {words[0].category}
        </h2>
        <div className="bar">
          <i style={{ width: `${p.passedDays.length}%` }} />
        </div>
        {status.kind === "doneToday" && <p className="t">오늘 Day {status.day} 통과! 다음 단어(Day {status.next})는 내일 열려요.</p>}
        {status.kind === "open" && wordsDone && <p className="t">단어는 통과했어요. 홈의 오늘 할 일을 마저 끝내면 Day {day} 통과예요.</p>}
        {status.kind === "finished" && <p className="t">100일 과정을 모두 마쳤어요. 지난 Day를 눌러 다시 볼 수 있어요.</p>}
      </section>
      <h2 className="h">{status.kind === "open" ? "오늘의 5단어" : `Day ${day}의 5단어`}</h2>
      {words.map((w) => (
        <ItemRow key={w.key} item={w} />
      ))}
      <div className="grid2">
        <button type="button" className="btn" onClick={() => go({ s: "study", day })}>
          {status.kind === "open" ? "외우기" : "다시 보기"}
        </button>
        <button type="button" className="btn ghost" onClick={() => go({ s: "check", day })}>
          확인 테스트
        </button>
      </div>
      <h2 className="h">
        100일 <small>■ 통과 · □ 오늘</small>
      </h2>
      <div className="daygrid" role="list">
        {Array.from({ length: 100 }, (_, i) => i + 1).map((d) => {
          const isPassed = passed.has(d);
          const isToday = status.kind === "open" && d === status.day;
          return (
            <button
              key={d}
              type="button"
              role="listitem"
              className={isPassed ? "done" : isToday ? "today" : ""}
              disabled={!isPassed && !isToday}
              aria-label={`Day ${d}${isPassed ? " 통과" : isToday ? " 오늘" : ""}`}
              onClick={() => go({ s: "study", day: d })}
            >
              {d}
            </button>
          );
        })}
      </div>
    </main>
  );
}

/** 23 외우기: 카드 5장. 카드가 열리면 소리가 한 번 나요. */
export function StudyScreen({ day, go, back }: { day: number; go: Go; back: () => void }) {
  const { p, today, update } = useStore();
  const words = wordsOfDay(day);
  const [i, setI] = useState(0);
  const [hide, setHide] = useState(false);
  const w = words[i];
  const status = courseStatus(p, today);
  const canTest = (status.kind === "open" && status.day === day) || p.passedDays.includes(day);

  useEffect(() => {
    void play(w.audio, p.settings.slow);
  }, [w.audio, p.settings.slow]);

  const last = i === words.length - 1;
  return (
    <main className="screen focus">
      <NavBar title={`Day ${day} 외우기`} right={`${i + 1}/5`} />
      <div className="dots" aria-hidden="true">
        {words.map((x, k) => (
          <i key={x.key} className={k <= i ? "on" : ""} />
        ))}
      </div>
      <section className="card-big">
        <div className="card-star">
          <Star itemKey={w.key} />
        </div>
        <Vi text={w.vi} className="huge" />
        <p className="t">
          {p.settings.hint && p.settings.language === "ko" ? `${w.pron} · ` : ""}
          {toneLabel(w.vi) || w.category}
        </p>
        <PlayButton src={w.audio} large />
        <p className={`big meaning${hide ? " hidden" : ""}`} onClick={() => setHide(false)}>
          {hide ? "눌러서 뜻 보기" : w.ko}
        </p>
      </section>
      <div className="acts">
        <SlowButton src={w.audio} />
        <button type="button" className="chip-btn" aria-pressed={hide} onClick={() => setHide((h) => !h)}>
          🙈 뜻 가리기
        </button>
      </div>
      <div className="spacer" />
      <div className="grid2">
        <button type="button" className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>
          ‹ 이전
        </button>
        {!last ? (
          <button type="button" className="btn" onClick={() => setI(i + 1)}>
            다음 ›
          </button>
        ) : canTest ? (
          <button
            type="button"
            className="btn"
            onClick={() => {
              update((x) => markStudied(x, today));
              go({ s: "check", day });
            }}
          >
            확인 테스트 하기
          </button>
        ) : (
          <button type="button" className="btn" onClick={back}>
            다 봤어요
          </button>
        )}
      </div>
    </main>
  );
}

/** 24 확인 테스트 → 25 결과. 오늘 5단어 + 어제 틀린 단어, 바로 정답을 알려줘요. */
export function CheckScreen({ day, back, selectTab }: { day: number; back: () => void; selectTab: (tab: Tab) => void }) {
  const { p, today, update } = useStore();
  // 테스트를 시작할 때 오늘 Day인지 정해 둬요. 통과하면 상태가 "오늘 완료"로 바뀌기 때문이에요.
  const [isCurrent] = useState(() => {
    const status = courseStatus(p, today);
    return status.kind === "open" && status.day === day && !p.passedDays.includes(day);
  });
  const todays = wordsOfDay(day);
  const quiz = useMemo<Question[]>(() => {
    const carry = isCurrent ? p.carry.map(itemByKey).filter((x): x is Word => !!x && "day" in x && x.day !== day) : [];
    return makeQuiz([...todays, ...carry], WORDS, ["meaning", "reverse", "listen"]);
    // 테스트를 시작할 때 한 번만 만들어요.
  }, [day]);
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<null | { score: number; wrong: Word[]; passed: boolean }>(null);
  const q = quiz[n];

  function pick(key: string) {
    if (picked) return;
    setPicked(key);
    setAnswers((a) => ({ ...a, [q.item.key]: key === q.item.key }));
  }

  function next() {
    if (n + 1 < quiz.length) {
      setN(n + 1);
      setPicked(null);
      return;
    }
    const score = todays.filter((w) => answers[w.key]).length;
    const wrong = todays.filter((w) => !answers[w.key]);
    const passed = score >= PASS_SCORE;
    if (isCurrent && passed) {
      update((x) => markStudied(addToReview(passDay(x, day, wrong.map((w) => w.key)), todays.map((w) => w.key), today), today));
    } else {
      update((x) => markStudied(x, today));
    }
    setDone({ score, wrong, passed });
  }

  if (done) {
    return (
      <main className="screen focus center">
        <NavBar title={`Day ${day} 결과`} />
        <div className="spacer" />
        <h2 className="big">{!isCurrent ? `Day ${day} 연습 결과` : done.passed ? `Day ${day} 단어 통과!` : "아쉬워요! 다시 외우고 테스트해요"}</h2>
        <p className="huge-num">
          {done.score} / {todays.length}
        </p>
        {isCurrent && done.passed && <p className="t">{p.completedDays.includes(day) ? `오늘 할 일을 모두 끝냈어요. Day ${day} 통과! 다음 Day는 내일 열려요.` : `남은 할 일: ${tasksFor(p, day).lesson && !tasksFor(p, day).lessonDone ? `오늘의 과 ${tasksFor(p, day).lesson?.id}` : "랜덤 시험"}. 끝내면 Day ${day} 통과예요.`}</p>}
        {!isCurrent && <p className="t">연습이라 진도에는 들어가지 않아요.</p>}
        {done.wrong.length > 0 && (
          <>
            <h3 className="h left">틀린 단어</h3>
            {done.wrong.map((w) => (
              <div key={w.key} className="item-row">
                <PlayButton src={w.audio} />
                <div className="meta">
                  <Vi text={w.vi} className="ttl" />
                  <span className="sub">{w.ko}</span>
                </div>
                <Star itemKey={w.key} />
              </div>
            ))}
            {isCurrent && done.passed && <p className="note">틀린 단어는 다음 확인 테스트에 다시 나와요.</p>}
          </>
        )}
        <div className="spacer" />
        <button type="button" className="btn" onClick={() => selectTab("words")}>
          단어 홈으로
        </button>
        <button type="button" className="btn ghost" onClick={back}>
          5개 다시 외우기
        </button>
      </main>
    );
  }

  return (
    <main className="screen focus">
      <NavBar title={`Day ${day} 확인`} right={`${n + 1}/${quiz.length}`} />
      <div className="dots" aria-hidden="true">
        {quiz.map((x, k) => (
          <i key={x.item.key} className={k <= n ? "on" : ""} />
        ))}
      </div>
      <QuestionView q={q} picked={picked} reveal={!!picked} onPick={pick} />
      {picked && (
        <p className="note">
          {picked === q.item.key ? "맞았어요! " : "아쉬워요. "}
          <Vi text={q.item.vi} /> = {q.item.ko}
        </p>
      )}
      <div className="spacer" />
      <button type="button" className="btn" disabled={!picked} onClick={next}>
        {n + 1 < quiz.length ? "다음 문제" : "결과 보기"}
      </button>
    </main>
  );
}
