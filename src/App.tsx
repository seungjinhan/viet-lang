import { useCallback, useEffect, useState } from "react";
import { LESSONS_READY } from "./lib/features";
import { WEB, logEvent } from "./lib/platform";
import { TABS, type Route, type Tab } from "./routes";
import { CurriculumScreen } from "./screens/Curriculum";
import { HomeScreen } from "./screens/Home";
import { LearnScreen, LessonScreen } from "./screens/Learn";
import { AboutScreen, LanguageScreen, MoreScreen, ReviewScreen, SavedScreen } from "./screens/More";
import { TestScreen, TestSetupScreen } from "./screens/Test";
import { BigScreen, SituationScreen, TravelScreen } from "./screens/Travel";
import { CheckScreen, StudyScreen, WordsScreen } from "./screens/Words";
import { useStore } from "./store";
import { Banner, TabBar } from "./ui";

const TAB_IDS = TABS.map((t) => t.tab) as string[];

function readRoute(): Route {
  return (history.state?.s ? history.state : { s: "home" }) as Route;
}

export function App() {
  const { saveFailed, retrySave } = useStore();
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const sync = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const go = useCallback((next: Route) => {
    history.pushState(next, "");
    setRoute(next);
    window.scrollTo(0, 0);
    logEvent("screen_view", { screen: next.s });
  }, []);

  const back = useCallback(() => history.back(), []);

  const selectTab = useCallback((tab: Tab) => {
    history.replaceState({ s: tab }, "");
    setRoute({ s: tab });
    window.scrollTo(0, 0);
    logEvent("tab_select", { tab });
  }, []);

  const isTab = TAB_IDS.includes(route.s);

  return (
    <div className={isTab ? "app has-tabs" : "app"}>
      {saveFailed && (
        <Banner tone="error" action={<button type="button" className="link" onClick={retrySave}>다시 시도</button>}>
          <strong>기록을 저장하지 못했어요.</strong> 휴대폰 저장 공간이 부족할 수 있어요. 공간을 확보한 뒤 다시 시도해 주세요.
        </Banner>
      )}
      {/* 웹 버전에는 토스 내비게이션 바가 없어서 뒤로 버튼을 둬요. 토스 빌드에는 들어가지 않아요. */}
      {(WEB || import.meta.env.DEV) && !isTab && (
        <button type="button" className="web-back" onClick={back}>
          ‹ 뒤로
        </button>
      )}
      {route.s === "home" && <HomeScreen go={go} selectTab={selectTab} />}
      {route.s === "learn" && LESSONS_READY && <LearnScreen go={go} />}
      {route.s === "lesson" && <LessonScreen id={route.id} go={go} back={back} />}
      {route.s === "curriculum" && <CurriculumScreen selectTab={selectTab} />}
      {route.s === "words" && <WordsScreen go={go} />}
      {route.s === "travel" && <TravelScreen go={go} />}
      {route.s === "more" && <MoreScreen go={go} />}
      {route.s === "study" && <StudyScreen day={route.day} go={go} back={back} />}
      {route.s === "check" && <CheckScreen day={route.day} back={back} selectTab={selectTab} />}
      {route.s === "situation" && <SituationScreen no={route.no} go={go} />}
      {route.s === "big" && <BigScreen itemKey={route.key} />}
      {route.s === "saved" && <SavedScreen go={go} />}
      {route.s === "review" && <ReviewScreen source={route.source} back={back} />}
      {route.s === "testSetup" && <TestSetupScreen kind={route.kind} go={go} selectTab={selectTab} />}
      {route.s === "test" && <TestScreen route={route} go={go} back={back} />}
      {route.s === "language" && <LanguageScreen back={back} />}
      {route.s === "about" && <AboutScreen />}
      {isTab && <TabBar current={route.s as Tab} onSelect={selectTab} />}
    </div>
  );
}
