import { useEffect, useMemo, useState } from "react";
import { play } from "../lib/audio";
import { WORDS } from "../lib/data";
import { courseStatus, currentDay, lessonForDay } from "../lib/course";
import { LESSONS, LESSON_ITEMS, PARTS, lessonById, nextLesson } from "../lib/lessons";
import { addToReview, finishLesson, markStudied } from "../lib/progress";
import { makeQuiz, shuffle } from "../lib/quiz";
import type { Go } from "../routes";
import { useStore } from "../store";
import { ItemRow, NavBar, PlayButton, QuestionView, SlowButton, Star, Vi, toneLabel } from "../ui";

/** 배우기 목차. 잠금 없이 모든 과를 열고, 추천 순서상 다음 과에 표시를 붙여요. */
export function LearnScreen({ go }: { go: Go }) {
  const { p, today } = useStore();
  // 커리큘럼을 시작했으면 오늘 Day의 과를, 아니면 끝내지 않은 첫 과를 안내해요.
  const todays = p.startedAt ? lessonForDay(currentDay(courseStatus(p, today))) : undefined;
  const next = todays && !p.doneLessons.includes(todays.id) ? todays : nextLesson(p.doneLessons);
  const [open, setOpen] = useState<number | null>(next?.part ?? 0);
  return (
    <main className="screen">
      <NavBar title="배우기" />
      <section className="box">
        <p className="h">
          배우기 <small>끝낸 과 {p.doneLessons.length} / {LESSONS.length}</small>
        </p>
        {next ? (
          <>
            <h2 className="big">
              {next.id} {next.title}
            </h2>
            <button type="button" className="btn" onClick={() => go({ s: "lesson", id: next.id })}>
              {todays?.id === next.id ? "오늘의 과 시작하기" : p.doneLessons.length ? "이어서 배우기" : "첫 과 시작하기"}
            </button>
          </>
        ) : (
          <h2 className="big">모든 과를 끝냈어요 🎉</h2>
        )}
        <div className="bar">
          <i style={{ width: `${(p.doneLessons.length / LESSONS.length) * 100}%` }} />
        </div>
        <button type="button" className="link left" onClick={() => go({ s: "curriculum" })}>
          100일 커리큘럼 보기
        </button>
      </section>
      {PARTS.map((part) => {
        const done = part.lessons.filter((l) => p.doneLessons.includes(l.id)).length;
        return (
          <section key={part.no} className="part">
            <button type="button" className="part-head" aria-expanded={open === part.no} onClick={() => setOpen(open === part.no ? null : part.no)}>
              <span className={`ico small-text${done === part.lessons.length ? " done" : ""}`}>{part.stage}단계</span>
              <span className="meta">
                <span className="ttl">{part.title}</span>
                <span className="sub">
                  {done} / {part.lessons.length}과
                </span>
              </span>
              <span className="chev">{open === part.no ? "⌃" : "⌄"}</span>
            </button>
            {open === part.no &&
              part.lessons.map((l) => {
                const isDone = p.doneLessons.includes(l.id);
                return (
                  <button key={l.id} type="button" className="lesson" onClick={() => go({ s: "lesson", id: l.id })}>
                    <span className="lesson-id">{isDone ? "✓" : l.id}</span>
                    <span className="meta">
                      <span className="ttl">
                        {l.title} {next?.id === l.id && <span className="tag-rec">{todays?.id === l.id ? "오늘" : "추천 순서"}</span>}
                      </span>
                      <span className="sub">{l.items.map((i) => i.vi).slice(0, 3).join(" · ")}</span>
                    </span>
                    <span className="chev">›</span>
                  </button>
                );
              })}
          </section>
        );
      })}
    </main>
  );
}

type Stage = "intro" | "cards" | "quiz" | "done";

/** 한 과: 설명 · 듣기 → 카드(따라 하기) → 퀴즈 → 끝 */
export function LessonScreen({ id, go, back }: { id: string; go: Go; back: () => void }) {
  const { p, today, update } = useStore();
  const lesson = lessonById(id);
  const [stage, setStage] = useState<Stage>("intro");
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const quiz = useMemo(() => {
    if (!lesson) return [];
    const targets = shuffle(lesson.items).slice(0, 5);
    return makeQuiz(targets, [...lesson.items, ...LESSON_ITEMS, ...WORDS], ["meaning", "reverse", "listen"]);
  }, [lesson]);

  const card = lesson?.items[i];
  useEffect(() => {
    if (stage === "cards" && card) void play(card.audio, p.settings.slow);
  }, [stage, card, p.settings.slow]);

  if (!lesson) return null;
  const steps: Stage[] = ["intro", "cards", "quiz", "done"];
  const header = (
    <>
      <NavBar title={`${lesson.id} ${lesson.title}`} right={`${steps.indexOf(stage) + 1}/4`} />
      <div className="steps" aria-hidden="true">
        {steps.map((s, k) => (
          <i key={s} className={k <= steps.indexOf(stage) ? "on" : ""} />
        ))}
      </div>
    </>
  );

  if (stage === "intro") {
    return (
      <main className="screen focus">
        {header}
        <section className="box">
          {lesson.intro.map((line, k) => (
            <p key={k} className="t">
              {line}
            </p>
          ))}
        </section>
        <h2 className="h">듣기</h2>
        {lesson.items.map((item) => (
          <ItemRow key={item.key} item={item} />
        ))}
        <div className="spacer" />
        <button type="button" className="btn" onClick={() => setStage("cards")}>
          카드로 따라 하기
        </button>
      </main>
    );
  }

  if (stage === "cards" && card) {
    const last = i === lesson.items.length - 1;
    return (
      <main className="screen focus">
        {header}
        <p className="t3 center">
          {i + 1} / {lesson.items.length} · 듣고 소리 내서 세 번 따라 해 보세요
        </p>
        <section className="card-big">
          <div className="card-star">
            <Star itemKey={card.key} />
          </div>
          <Vi text={card.vi} className={card.vi.length > 14 ? "big-vi phrase" : "huge"} />
          <p className="t">
            {p.settings.hint && p.settings.language === "ko" ? card.pron : ""}
            {toneLabel(card.vi) ? ` · ${toneLabel(card.vi)}` : ""}
          </p>
          <PlayButton src={card.audio} large />
          <p className="big meaning">{card.ko}</p>
        </section>
        <div className="acts">
          <SlowButton src={card.audio} />
        </div>
        <div className="spacer" />
        <div className="grid2">
          <button type="button" className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>
            ‹ 이전
          </button>
          <button type="button" className="btn" onClick={() => (last ? setStage("quiz") : setI(i + 1))}>
            {last ? "퀴즈 풀기" : "다음 ›"}
          </button>
        </div>
      </main>
    );
  }

  if (stage === "quiz") {
    const q = quiz[n];
    return (
      <main className="screen focus">
        {header}
        <p className="t3 center">
          문제 {n + 1} / {quiz.length}
        </p>
        <QuestionView
          q={q}
          picked={picked}
          reveal={!!picked}
          onPick={(key) => {
            if (picked) return;
            setPicked(key);
            if (key === q.item.key) setScore((s) => s + 1);
          }}
        />
        {picked && (
          <p className="note">
            {picked === q.item.key ? "맞았어요! " : "아쉬워요. "}
            <Vi text={q.item.vi} /> = {q.item.ko}
          </p>
        )}
        <div className="spacer" />
        <button
          type="button"
          className="btn"
          disabled={!picked}
          onClick={() => {
            setPicked(null);
            if (n + 1 < quiz.length) {
              setN(n + 1);
              return;
            }
            update((x) => markStudied(addToReview(finishLesson(x, lesson.id, today), lesson.items.map((it) => it.key), today), today));
            setStage("done");
          }}
        >
          {n + 1 < quiz.length ? "다음 문제" : "결과 보기"}
        </button>
      </main>
    );
  }

  const following = nextLesson(p.doneLessons);
  return (
    <main className="screen focus center">
      {header}
      <div className="spacer" />
      <h2 className="big">{lesson.id} 과를 끝냈어요</h2>
      <p className="huge-num">
        {score} / {quiz.length}
      </p>
      <p className="t">이 과의 단어 · 문장은 내일부터 복습에 나와요.</p>
      <div className="spacer" />
      {following && (
        <button type="button" className="btn" onClick={() => go({ s: "lesson", id: following.id })}>
          다음 과: {following.id} {following.title}
        </button>
      )}
      <button type="button" className="btn ghost" onClick={back}>
        목차로
      </button>
    </main>
  );
}

