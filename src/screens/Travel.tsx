import { useState } from "react";
import { PHRASES, SITUATIONS, itemByKey, searchPhrases, type Phrase } from "../lib/data";
import type { Go } from "../routes";
import { useStore } from "../store";
import { InfiniteList, NavBar, PlayButton, SlowButton, Star, Vi } from "../ui";

function PhraseCard({ phrase, go }: { phrase: Phrase; go: Go }) {
  const { p } = useStore();
  const showHint = p.settings.hint && p.settings.language === "ko";
  return (
    <article className="phrase-card">
      <div className="item-row">
        <PlayButton src={phrase.audio} />
        <div className="meta">
          <Vi text={phrase.vi} className="ttl wrap" />
        </div>
        <Star itemKey={phrase.key} />
      </div>
      {showHint && <p className="t">{phrase.pron}</p>}
      <p className="t3">{phrase.ko}</p>
      <div className="acts">
        <SlowButton src={phrase.audio} />
        <button type="button" className="chip-btn" onClick={() => go({ s: "big", key: phrase.key })}>
          ⤢ 크게 보기
        </button>
      </div>
    </article>
  );
}

/** 13 상황 목록 + 검색 */
export function TravelScreen({ go }: { go: Go }) {
  const [query, setQuery] = useState("");
  const results = searchPhrases(query);
  return (
    <main className="screen">
      <NavBar title="여행회화" />
      <input className="search" type="search" placeholder="🔍 문장이나 뜻으로 찾기 (예: 화장실)" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="문장 찾기" />
      {query.trim() ? (
        <InfiniteList items={results} render={(ph) => <PhraseCard key={ph.key} phrase={ph} go={go} />} empty={<p className="empty">"{query}"에 맞는 문장이 없어요. 다른 말로 찾아보세요.</p>} />
      ) : (
        <>
          <p className="t">여행에서 자주 쓰는 문장을 상황별로 모았어요. 발음은 북부(하노이) 기준이에요.</p>
          <div className="grid2">
            {SITUATIONS.map((s) => (
              <button key={s.no} type="button" className="stat left" onClick={() => go({ s: "situation", no: s.no })}>
                <b className="sit">{s.name}</b>
                <span className="t3">{s.count}문장</span>
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

/** 14 상황별 문장 */
export function SituationScreen({ no, go }: { no: number; go: Go }) {
  const situation = SITUATIONS.find((s) => s.no === no);
  const list = PHRASES.filter((p) => p.situationNo === no);
  return (
    <main className="screen">
      <NavBar title={situation?.name ?? "여행회화"} />
      <InfiniteList items={list} render={(ph) => <PhraseCard key={ph.key} phrase={ph} go={go} />} />
    </main>
  );
}

/** 크게 보기: 직원에게 화면을 보여줄 때 */
export function BigScreen({ itemKey }: { itemKey: string }) {
  const item = itemByKey(itemKey);
  if (!item) return null;
  return (
    <main className="screen focus big-view">
      <NavBar title="크게 보기" />
      <div className="spacer" />
      <Vi text={item.vi} className="giant" />
      <p className="t">{item.ko}</p>
      <div className="spacer" />
      <div className="acts center">
        <PlayButton src={item.audio} large />
        <SlowButton src={item.audio} />
      </div>
    </main>
  );
}
