import { PHRASES, TOTAL_DAYS, WORDS } from "../lib/data";
import { BASIC_DAYS, LESSONS, STAGE_DAYS, wordBlocks } from "../lib/lessons";
import { startCourse } from "../lib/progress";
import type { Tab } from "../routes";
import { useStore } from "../store";
import { NavBar } from "../ui";

/** 100일 커리큘럼 소개. [시작하기]를 누르면 홈에서 매일 할 일을 안내해요. */
export function CurriculumScreen({ selectTab }: { selectTab: (tab: Tab) => void }) {
  const { p, today, update } = useStore();
  const blocks = wordBlocks();
  return (
    <main className="screen">
      <NavBar title="100일 커리큘럼" />
      <section className="box hero">
        <p className="t3">처음 시작하는 베트남어</p>
        <h2 className="big">하루 10분, 100일이면 여행 회화까지</h2>
        <p className="t">문자와 성조부터 배우고, 매일 필수 단어 5개를 외워요. 북부(하노이) 발음 기준이에요.</p>
        <div className="grid3">
          <div className="stat">
            <b>{LESSONS.length}과</b>
            <span className="t3">배우기</span>
          </div>
          <div className="stat">
            <b>{WORDS.length}개</b>
            <span className="t3">필수 단어</span>
          </div>
          <div className="stat">
            <b>{PHRASES.length}문장</b>
            <span className="t3">여행회화</span>
          </div>
        </div>
      </section>

      <h2 className="h">하루에 하는 일</h2>
      <ol className="daily">
        <li>
          <b>오늘의 과</b> 설명을 읽고, 듣고, 카드로 따라 하고, 퀴즈로 확인해요. (약 5분)
        </li>
        <li>
          <b>오늘의 단어 5개</b> 외우고 확인 테스트에서 4개 이상 맞히면 통과예요. (약 3분)
        </li>
        <li>
          <b>복습</b> 지난 단어가 1 · 3 · 7 · 14 · 30일 간격으로 다시 나와요. (약 2분)
        </li>
      </ol>
      <p className="note">오늘의 과와 단어를 모두 끝내야 그날이 통과되고, 다음 Day는 다음 날 열려요. 끝내지 못하면 다음 날에도 같은 Day를 이어서 해요.</p>

      <h2 className="h">
        1~{BASIC_DAYS}일: 기초 다지기 <small>하루 1과 + 단어 5개</small>
      </h2>
      <div className="timeline">
        {STAGE_DAYS.filter(({ part }) => part.no <= 5).map(({ part, from, to }) => (
          <section key={part.no} className="stage">
            <div className="stage-head">
              <span className="ico small-text">{part.stage}단계</span>
              <span className="meta">
                <span className="ttl">{part.title}</span>
                <span className="sub">
                  Day {from}
                  {to > from ? `~${to}` : ""} · {part.lessons.length}과
                </span>
              </span>
            </div>
            <p className="t">{part.learn}</p>
            <p className="can">✓ {part.can}</p>
          </section>
        ))}
      </div>

      <h2 className="h">
        {BASIC_DAYS + 1}~{TOTAL_DAYS}일: 넓히고 실전으로 <small>하루 1과 + 단어 5개</small>
      </h2>
      <div className="timeline">
        {STAGE_DAYS.filter(({ part }) => part.no > 5).map(({ part, from, to }) => (
          <section key={part.no} className="stage">
            <div className="stage-head">
              <span className="ico small-text">{part.stage}단계</span>
              <span className="meta">
                <span className="ttl">{part.title}</span>
                <span className="sub">
                  Day {from}
                  {to > from ? `~${to}` : ""} · {part.lessons.length}과
                </span>
              </span>
            </div>
            <p className="t">{part.learn}</p>
            <p className="can">✓ {part.can}</p>
          </section>
        ))}
      </div>
      <p className="can">✓ 100일을 마치면 필수 단어 500개와 100과의 문장으로 여행과 일상 대화를 해요.</p>

      <h2 className="h">필수 단어 500개 순서</h2>
      <div className="word-blocks">
        {blocks.map((b) => (
          <span key={b.category} className="wb">
            <b>
              Day {b.from}~{b.to}
            </b>{" "}
            {b.category}
          </span>
        ))}
      </div>

      <button
        type="button"
        className="btn sticky"
        onClick={() => {
          update((x) => startCourse(x, today));
          selectTab("home");
        }}
      >
        {p.startedAt ? "오늘 할 일 보기" : "100일 커리큘럼 시작하기"}
      </button>
    </main>
  );
}
