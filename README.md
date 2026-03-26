# Garden Engine 🌸

GitHub 잔디(contribution graph)를 살아 있는 정원 애니메이션으로 변환합니다.

> "1년간의 커밋이 살아 있는 정원으로 피어납니다."

## 미리보기

![Garden Animation](assets/garden.svg)

## 특징

- GitHub 잔디 색상 정확히 매칭 (다크 모드)
- 성장 모델: 흙 → 새싹 → 잎 → 봉오리 → 만개 (contribution 레벨 기반)
- 픽셀아트 스타일 벌 + 6색 꽃
- 엔진/테마 분리 (ThemePack 시스템)
- GitHub Actions 자동 업데이트

## 사용법

```bash
# 설치
npm install

# .env 설정
cp .env.sample .env
# GITHUB_TOKEN, GITHUB_USERNAME 설정

# 빌드
npm run build

# 생성
npm run generate

# 테스트 (더미 데이터)
npm start
```

## 테마

현재 `spring` 테마 지원. ThemePack 인터페이스로 확장 가능.

## PR 기록

| 날짜 | 제목 | 링크 |
|------|------|------|
| 2026-03-26 | Garden Engine MVP 구현 | [docs/pr/2026-03-26-garden-engine-mvp.md](docs/pr/2026-03-26-garden-engine-mvp.md) |
