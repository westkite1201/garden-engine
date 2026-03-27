
<p align="center">
  <img src="assets/garden.svg" alt="My Garden" width="800"/>
</p>


# Garden Engine

> 1년간의 커밋이 살아 있는 정원으로 피어납니다.

GitHub 잔디(contribution graph)를 픽셀아트 정원 애니메이션 SVG로 변환하는 엔진입니다.
꿀벌이 날아다니며 셀에 물을 주면, 커밋 수에 따라 새싹 → 잎 → 봉오리 → 만개 꽃으로 자라납니다.

<p align="center">
  <img src="assets/preview.svg" alt="Garden Engine Preview" width="800"/>
</p>

## How it works

```
GitHub GraphQL API  →  Contribution Grid  →  Simulation Engine  →  Animated SVG
     (commits)          (52x7 cells)        (bee pathfinding)     (CSS keyframes)
```

1. **Fetch** — GitHub GraphQL API에서 최근 1년 커밋 데이터를 가져옵니다
2. **Map** — 커밋 수를 사분위수 기반으로 0~4 레벨로 매핑합니다
3. **Simulate** — 꿀벌 액터가 BFS로 셀을 찾아 이동하며 물을 줍니다
4. **Render** — 5개 레이어(울타리, 흙, 성장, 이펙트, 액터)를 합성합니다

## Setup — GitHub Action (추천)

자신의 프로필 README 레포에 워크플로우 파일 하나만 추가하면 매일 자동으로 정원이 업데이트됩니다.

### 1. GitHub Token 발급

[Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)에서 **`read:user`** scope가 포함된 토큰을 생성하세요.

### 2. Secret 등록

레포 → Settings → Secrets and variables → Actions → **New repository secret**

- Name: `GH_TOKEN`
- Value: 위에서 만든 토큰

### 3. 워크플로우 추가

`.github/workflows/update-garden.yml` 파일을 생성하세요:

```yaml
name: Update Garden

on:
  schedule:
    - cron: "0 0 * * *" # 매일 자정 (UTC)
  workflow_dispatch: # 수동 실행

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate garden SVG
        uses: westkite1201/garden-engine@v1
        with:
          github_token: ${{ secrets.GH_TOKEN }}
          # username: ""          # 비워두면 토큰 소유자
          # theme: spring         # 테마 선택
          # output_path: assets/garden.svg

      - name: Commit & push
        run: |
          git config user.name "garden-bot"
          git config user.email "garden-bot@users.noreply.github.com"
          git add assets/garden.svg
          git diff --staged --quiet || git commit -m "chore: update garden 🌱"
          git push
```

### 4. README에 삽입

```markdown
<p align="center">
  <img src="assets/garden.svg" alt="My Garden" width="800"/>
</p>
```

완료! Actions 탭에서 **Run workflow**를 눌러 바로 테스트할 수 있습니다.

### Action Inputs

| Input | 필수 | 기본값 | 설명 |
|-------|------|--------|------|
| `github_token` | O | — | GitHub PAT (`read:user` scope) |
| `username` | X | `""` | GitHub 유저네임 (비워두면 토큰 소유자) |
| `theme` | X | `spring` | 정원 테마 |
| `output_path` | X | `assets/garden.svg` | SVG 출력 경로 |

## Local Development

```bash
# 클론 & 설치
git clone https://github.com/westkite1201/garden-engine.git
cd garden-engine
npm install

# 환경변수 설정
cp .env.sample .env
# .env 파일에 GITHUB_TOKEN 입력

# 빌드 & 생성
npm run generate
```

`assets/garden.svg`에 결과물이 저장됩니다.

```bash
# 테마 지정
npm run build && npm start -- --theme=spring
```

## Output

자체 포함된 단일 SVG 파일 (외부 리소스 불필요):

- CSS `@keyframes` 애니메이션 내장
- `viewBox` 기반 반응형 스케일링
- GitHub README / 웹페이지 / 어디든 임베드 가능

## Growth Stages

커밋 활동에 따라 4단계로 성장합니다:

```
 Lv1 새싹        Lv2 잎          Lv3 봉오리       Lv4 만개
    ·              ·G·              p             p · p
   ·G·            · G ·            ppp           ppCpp
    G               G              gGg            ppp
    G               G               G             gGg
                    G                G              G
                                     G              G
```

| Level | 기준 | 색상 |
|-------|------|------|
| 0 (흙) | 커밋 없음 | `#161b22` |
| 1 | 하위 25% | `#0e4429` |
| 2 | 25~50% | `#006d32` |
| 3 | 50~75% | `#26a641` |
| 4 | 상위 25% | `#39d353` |

꽃은 6가지 색상 중 셀 위치에 따라 결정됩니다:
체리블로썸 핑크, 라벤더, 코랄, 스카이블루, 오렌지, 자홍

## Theme System

`ThemePack` 인터페이스로 테마를 확장할 수 있습니다:

| 속성 | 설명 |
|------|------|
| `palette` | 배경, 흙, 레벨 1~4, 액센트 색상 |
| `tiles` | 각 성장 단계의 SVG 셰이프 |
| `actor` | 캐릭터 스프라이트 (SVG + 크기) |
| `effects` | 인트로/아웃트로 이펙트 |
| `rules` | 체류 시간, 액터 수, 셀 이동 속도 |

현재 포함된 테마: **Spring Garden** (꿀벌 + 6종 꽃)

## Project Structure

```
src/
├── app/           # 메인 오케스트레이터 & 테스트 생성기
├── config/        # 그리드 레이아웃 & 타이밍 상수
├── engine/        # 시뮬레이션 엔진 (타입, 컨텍스트, 플래너, 시뮬레이터, 타임라인)
├── github/        # GitHub GraphQL API 연동
├── grid/          # 기여 데이터 → 그리드 셀 매핑
├── svg/
│   ├── layers/    # 5개 렌더링 레이어 (울타리, 흙, 성장, 이펙트, 액터)
│   └── render/    # SVG 합성
└── theme/         # 테마 시스템 (타입, 레지스트리, spring 테마)
```

## Tech Stack

- **TypeScript** (ES2022, strict)
- **Node.js** >= 18
- GitHub GraphQL API
- CSS Keyframe Animations
- Zero runtime dependencies (dotenv only)

## PR 기록

| 날짜 | 주제 | 링크 |
|------|------|------|
| 2026-03-27 | README + GitHub Action + 정원 장식 추가 | [docs/pr/2026-03-27-add-readme-svg.md](docs/pr/2026-03-27-add-readme-svg.md) |
| 2026-03-26 | Garden Engine MVP 구현 | [docs/pr/2026-03-26-garden-engine-mvp.md](docs/pr/2026-03-26-garden-engine-mvp.md) |

## License

MIT


