# PR 기록: README + GitHub Action + 정원 장식 추가

- 날짜: 2026-03-27
- 브랜치: westkite1201/add-readme-svg
- 변경 파일 수: 7
- 요약:
  - GitHub Action(composite) 배포 방식 추가 — `uses: westkite1201/garden-engine@v1`로 사용 가능
  - README를 Action 설치 가이드 중심으로 전면 개편
  - 픽셀아트 나무 2종(활엽수/침엽수) 추가 — Lv4 셀 ~20%에 랜덤 배치
  - 빈 셀(Lv0) 장식 추가 — 그루터기 ~10%, 버섯 ~5%
  - `generate.ts`에 `OUTPUT_PATH` 환경변수 지원 (Action에서 출력 경로 지정용)
  - 예제 워크플로우 `.github/workflows/update-garden.yml` 추가

## 진행상황 (Done)

- [x] `action.yml` composite action 정의 (4개 input: github_token, username, theme, output_path)
- [x] `.github/workflows/update-garden.yml` 예제 워크플로우 (daily cron + manual dispatch)
- [x] `generate.ts` OUTPUT_PATH 환경변수 지원
- [x] `growthLayer.ts` 나무 2종 (roundTree, pineTree) 픽셀아트 구현
- [x] `growthLayer.ts` 빈 셀 장식 (stump, mushroom) 픽셀아트 구현
- [x] README 전면 개편 — Action 설치 가이드 + 기존 로컬 개발 방법 유지
- [x] 더미 데이터로 SVG 생성 테스트 통과

## 할 일 (Next)

- [ ] GitHub에 v1 태그 생성하여 Action 실제 배포
- [ ] npm publish 검토 (npx 지원)
- [ ] 테마 추가 (autumn, winter 등)

## 우리가 검토한 것 / 결정 사항

- 배포 방식: GitHub Action(composite) 선택 — npm publish보다 유저 진입장벽이 낮음
- 나무 확률 20%: 너무 많으면 꽃이 묻히고, 너무 적으면 안 보임 — 20%가 적절
- 빈 셀 장식 opacity 0.6: 성장 애니메이션을 방해하지 않으면서 존재감 유지
- 그루터기/버섯 모두 cellHash 기반 결정적 배치: 같은 데이터면 항상 같은 결과

## 참고 아티클 / 레퍼런스

- 제목: GitHub Actions — Creating a composite action
  - 링크: https://docs.github.com/en/actions/creating-actions/creating-a-composite-action
  - 한줄 요약: composite action은 별도 Docker 없이 여러 step을 묶어 배포 가능

## research.md 업데이트

- 상태: NO
- 근거:
  - DB/마이그레이션/큐/레이어 경계 변경 없음
  - README, action.yml, 렌더링 레이어 내 국소 변경
- 액션:
  - [x] 생략

## 변경 파일(참고)

- `action.yml` (신규) — GitHub Action 정의
- `.github/workflows/update-garden.yml` (신규) — 예제 워크플로우
- `README.md` — Action 설치 가이드 중심 전면 개편
- `src/app/generate.ts` — OUTPUT_PATH 환경변수 지원
- `src/svg/layers/growthLayer.ts` — 나무/그루터기/버섯 픽셀아트 추가
- `assets/garden.svg` — 테스트 생성 결과물
- `assets/preview.svg` — README 미리보기용 SVG
