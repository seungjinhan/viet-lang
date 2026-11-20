import type { ReactNode } from "react";
import { courseStatus, currentDay, tasksFor } from "../lib/course";
import { daysBetween } from "../lib/date";
import { PHRASES, TOTAL_DAYS, wordsOfDay } from "../lib/data";
import { BASIC_DAYS, LESSONS, partOf } from "../lib/lessons";
import { dueKeys, streak } from "../lib/progress";
import type { Go, Tab } from "../routes";
import { useStore } from "../store";
import { ItemRow, NavBar, Vi } from "../ui";

function Todo({ done, title, sub, onClick }: { done: boolean; title: ReactNode; sub: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className={`todo${done ? " done" : ""}`} onClick={onClick} disabled={!onClick}>
      <span className="check" aria-hidden="true">
        {done ? "✓" : ""}
      </span>
      <span className="meta">
        <span className="ttl">{title}</span>
        <span className="sub">{sub}</span>
      </span>
      {!done && onClick && <span className="todo-go">시작 ›</span>}
    </button>
  );
}

export function HomeScreen({ go, selectTab }: { go: Go; selectTab: (tab: Tab) => void }) {
  const { p, today } = useStore();
  const phrase = PHRASES[Math.abs(daysBetween("2026-01-01", today)) % PHRASES.length];

  // 시작 전: 커리큘럼을 먼저 소개해요.
  if (!p.startedAt) {
    return (
      <main className="screen">
        <NavBar title="베트남어 배우기" />
        <section className="box hero">
          <p className="t3">처음 시작하는 베트남어</p>
          <h2 className="big">100일 커리큘럼으로 배워요</h2>
          <p className="t">
            매일 1과와 필수 단어 5개. 1~{BASIC_DAYS}일은 문자 · 성조 · 첫 대화 · 기초 문법을, {BASIC_DAYS + 1}~{TOTAL_DAYS}일은 회화 · 문법 심화 · 생활 · 문화로 넓혀 실전까지 가요.
          </p>
          <button type="button" className="btn" onClick={() => go({ s: "curriculum" })}>
            커리큘럼 보고 시작하기
          </button>
        </section>
        <section className="box">
          <h2 className="h">여행이 코앞이라면</h2>
          <p className="t">인사, 주문, 흥정 문장을 바로 듣고 따라 해요.</p>
          <button type="button" className="btn ghost" onClick={() => selectTab("travel")}>
            여행 문장 바로 보기
          </button>
        </section>
        <h2 className="h">오늘의 한 마디</h2>
        <ItemRow item={phrase} />
      </main>
    );
  }

  const status = courseStatus(p, today);
  const day = currentDay(status);
  const tasks = tasksFor(p, day);
  const due = dueKeys(p, today).length;
  const doneDays = p.completedDays.length;
  const stage = tasks.lesson ? partOf(tasks.lesson.id) : undefined;
  const words = wordsOfDay(day);
  const behind = status.kind === "open" && p.dayDoneDate !== null && daysBetween(p.dayDoneDate, today) > 1;

  return (
    <main className="screen">
      <NavBar title="베트남어 배우기" />
      <section className="box hero">
        <p className="h">
          100일 커리큘럼 <small>{doneDays}일 통과</small>
        </p>
        <h2 className="big">
          Day {day} <span className="of">/ {TOTAL_DAYS}</span>
        </h2>
        <div className="bar">
          <i style={{ width: `${(doneDays / TOTAL_DAYS) * 100}%` }} />
        </div>
        <p className="t">
          {status.kind === "finished"
            ? "100일 커리큘럼을 모두 마쳤어요 🎉"
            : stage
              ? `지금 ${stage.stage}단계 · ${stage.title} (${LESSONS.indexOf(tasks.lesson!) + 1} / ${LESSONS.length}과)`
              : `지금 단어 늘리기와 실전`}
        </p>
        <button type="button" className="link left" onClick={() => go({ s: "curriculum" })}>
          커리큘럼 보기
        </button>
      </section>

      {status.kind === "doneToday" && (
        <section className="box done-box">
          <h2 className="big">오늘 할 일 끝! 🎉</h2>
          <p className="t">Day {status.day} 통과예요. 다음 Day는 내일 열려요. 그동안 복습이나 여행회화를 해 보세요.</p>
        </section>
      )}
      {behind && <p className="note">지난번 할 일을 다 끝내지 못해서 오늘도 Day {day}예요. 오늘 마저 끝내면 내일 다음 Day가 열려요.</p>}

      {status.kind !== "finished" && (
        <>
          <h2 className="h">
            {status.kind === "doneToday" ? `Day ${day}에 한 일` : "오늘 할 일"} <small>모두 끝내면 Day {day} 통과</small>
          </h2>
          {tasks.lesson && (
            <Todo
              done={tasks.lessonDone}
              title={`오늘의 과 · ${tasks.lesson.id} ${tasks.lesson.title}`}
              sub="설명 · 듣기 · 카드 · 퀴즈 (약 5분)"
              onClick={tasks.lessonDone ? undefined : () => go({ s: "lesson", id: tasks.lesson!.id })}
            />
          )}
          <Todo
            done={tasks.wordsDone}
            title={`오늘의 단어 5개 · Day ${day} ${words[0].category}`}
            sub={
              <>
                {words.map((w, i) => (
                  <span key={w.key}>
                    {i > 0 && " · "}
                    <Vi text={w.vi} />
                  </span>
                ))}
              </>
            }
            onClick={tasks.wordsDone ? undefined : () => go({ s: "study", day })}
          />
          {tasks.needsTest && (
            <Todo
              done={tasks.testDone}
              title="랜덤 시험 1회"
              sub="단어 · 회화 · 배우기 중 하나 (10문제)"
              onClick={tasks.testDone ? undefined : () => go({ s: "testSetup", kind: "word" })}
            />
          )}
        </>
      )}

      <h2 className="h">
        복습 <small>할 일과 따로, 하면 좋아요</small>
      </h2>
      <div className="grid2">
        <button type="button" className="stat" onClick={() => go({ s: "review", source: "due" })} disabled={!due}>
          <b>{due}</b>
          <span className="t3">오늘 복습할 카드</span>
        </button>
        <div className="stat">
          <b>{streak(p, today)}일</b>
          <span className="t3">연속 학습</span>
        </div>
      </div>
      <h2 className="h">오늘의 한 마디</h2>
      <ItemRow item={phrase} />
    </main>
  );
}
