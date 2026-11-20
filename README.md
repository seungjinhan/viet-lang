# 베트남어 배우기

처음 시작하는 베트남어를 100일 커리큘럼으로 배우는 웹 앱이에요. 북부(하노이) 발음을 기준으로 해요.

- **배우기**: 문자와 성조부터 회화, 문법, 생활, 문화까지 100과
- **단어**: 필수 단어 500개를 하루 5개씩
- **여행회화**: 8가지 상황, 49문장
- **복습 · 시험**: 1 · 3 · 7 · 14 · 30일 간격 복습, 단어 · 회화 · 배우기 랜덤 시험

학습 기록은 이 브라우저(`localStorage`)에만 저장돼요. 기기를 바꾸거나 사이트 데이터를 지우면 사라져요.

## 음성

단어 · 문장 음성은 [VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS) (Apache 2.0)로 만들었어요. 기계 음성이라 성조(특히 hỏi · nặng)가 실제 발음과 다를 수 있어요.

## 개발

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:5193)
npm test
npm run build:web  # 웹 버전 → dist-web/
```

`main`에 올리면 GitHub Actions가 테스트 · 빌드 후 GitHub Pages에 배포해요. 같은 소스로 앱인토스 미니앱(`npm run build`)도 만들어요.
