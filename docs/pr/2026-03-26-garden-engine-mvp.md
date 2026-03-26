# PR 기록: Garden Engine MVP 구현

- 날짜: 2026-03-26
- 브랜치: westkite1201/add-green-ref
- 변경 파일 수: 31
- 요약:
  - GitHub 잔디(contribution graph)를 정원 애니메이션 SVG로 변환하는 엔진 구현
  - green-movement 레퍼런스 기반, 파괴(양이 풀 뜯기)가 아닌 성장(벌이 꽃 피우기) 모델
  - 엔진/테마 분리 아키텍처 (ThemePack 시스템)
  - Spring Garden 테마 MVP: 픽셀아트 벌 + 6색 꽃 + 4단계 성장 애니메이션
  - GitHub Actions 워크플로우 포함 (daily cron + manual dispatch)

## 진행상황 (Done)
- GitHub GraphQL API 연동 (contribution 데이터 fetch)
- 그리드 매핑 (weeks[][] → GridCell[])
- 분위수 기반 contribution 레벨 계산 (GitHub 다크 모드 색상 정확히 매칭)
- 테마 시스템: ThemePack 인터페이스 + Spring Garden 테마
- 시뮬레이션 엔진: BFS 기반 1-3 actor 이동 + 물주기 사이클
- 타임라인: 절대 시간 계산 + bloom wave
- SVG 렌더링 레이어: soil → growth → effect → actor → border
- 성장 애니메이션: 흙 → contribution 색상 단계적 전환
- 픽셀아트 꽃 (6색 랜덤, 셀 위치 기반 결정론적 해시)
- 픽셀아트 벌 (1px rect 도트 스타일)
- 테스트 생성기 (더미 데이터 기반)
- GitHub Actions 워크플로우

## 할 일 (Next)
- [ ] 실제 GitHub 토큰으로 end-to-end 테스트
- [ ] 추가 테마 구현 (가을, 겨울 등)
- [ ] 벌/꽃 커스텀 도트 디자인 적용 (사용자 피드백 반영)

## 우리가 검토한 것 / 결정 사항
- 성장 모델: subtractive(풀 뜯기) vs additive(꽃 피우기) → additive 채택
  - 이유: "1년간의 커밋이 살아 있는 정원으로 피어남" 컨셉에 부합
- 캐릭터: 정원사 → 나비 → 벌로 변경
  - 이유: 10px 스케일에서 정원사는 디테일 표현 불가, 픽셀아트 벌이 가장 깔끔
- SVG 스타일: 벡터(ellipse/circle) → 픽셀아트(1px rect 도트)
  - 이유: 레퍼런스 수준의 도트 느낌 통일성 확보
- soilLayer: 처음부터 GitHub 색상 표시 → 흙색으로 시작 후 성장
  - 이유: 정원 컨셉상 성장 과정이 보여야 함

## 참고 아티클 / 레퍼런스
- 제목: green-movement (SeoNaRu)
  - 링크: https://github.com/SeoNaRu/green-movement
  - 한줄 요약: GitHub 잔디를 양이 뜯어먹는 SVG 애니메이션 — 구조/BFS/레이아웃 참고

## research.md 업데이트
- 상태: NO
- 근거:
  - 순수 신규 프로젝트, DB/마이그레이션/비동기 흐름 없음
- 액션:
  - [x] 생략

## 변경 파일(참고)
- `src/engine/` — 시뮬레이션 엔진 (types, context, planner, simulate, timeline)
- `src/svg/layers/` — SVG 레이어 (soil, growth, actor, effect, border)
- `src/svg/render/composeSvg.ts` — SVG 조립
- `src/theme/` — 테마 시스템 (types, registry, spring)
- `src/github/` — GitHub API (query, fetchGrid)
- `src/grid/` — 그리드 유틸 (mapGrid, contribution)
- `src/config/` — 상수/기본값 (constants, defaults)
- `src/app/` — 오케스트레이터 (generate, testGenerate)
- `src/index.ts` — CLI 엔트리
- `package.json`, `tsconfig.json`, `.gitignore`, `.env.sample`
- `.github/workflows/update-garden.yml` — GitHub Actions
- `assets/garden.svg` — 생성된 SVG 출력물
