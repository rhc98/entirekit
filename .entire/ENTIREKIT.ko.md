[English](ENTIREKIT.md)

# EntireKit

**Entire**의 checkpoint 데이터를 효과적으로 분석하고 활용하기 위한 도구 모음입니다.

> **Entire란?** Git 워크플로우에 AI 에이전트 세션을 캡처하는 개발자 플랫폼입니다.
>
> AI와의 대화 내용, 코드 변경사항, 기여도, 토큰 사용량 등을 기록하여
> "왜 이 코드가 이렇게 작성되었는가?"를 추적 가능하게 만듭니다.
>
> **지원 도구:** [Claude Code](https://claude.ai/code), [Gemini CLI](https://github.com/google/generative-ai-cli) 등

### Checkpoint란?

세션 내의 저장점(snapshot)으로, 모든 메타데이터는 `entire/checkpoints/v1` 브랜치에 저장됩니다.
코드 커밋 히스토리와 별도로 관리되어 히스토리를 깔끔하게 유지하면서도
AI 컨텍스트를 완벽하게 보존합니다.

이 도구는 **Entire를 사용하는 모든 프로젝트**에서 활용 가능하며, 특정 AI 도구에 종속되지 않습니다.

## 🚀 빠른 시작

### 1️⃣ 설치

```bash
# 저장소 루트에서
npx entirekit install
# 비대화형 프로파일 선택:
npx entirekit install --ai claude --force
```

첫 checkpoint가 없어도 `install`은 실행할 수 있습니다.
`stats`, `search`, `diff`, `report` 같은 분석 명령은 checkpoint가 생성된 뒤부터 동작합니다.

설치가 완료되면 `git entirekit <command>` 명령어들을 사용할 수 있습니다.

### 2️⃣ 기본 사용

```bash
# 통계 보기
git entirekit stats

# 키워드 검색
git entirekit search "로그인"

# 최근 checkpoint 목록
git entirekit recent
```

## 📚 주요 기능

### 🔍 **검색 & 추적**

과거 작업 이력을 빠르게 검색하고 추적할 수 있습니다.

```bash
# "버그"라는 키워드가 포함된 모든 checkpoint 찾기
git entirekit search "버그"

# 특정 파일 관련 작업 이력
git entirekit search "LoginForm.tsx"

# 최근 1주일 작업
git entirekit week
```

**활용 시나리오:**
- 🐛 버그 원인 추적: 언제, 왜 해당 코드를 수정했는지 확인
- 🔄 리팩토링 히스토리: 과거 설계 결정 참고
- 👥 온보딩: 신규 팀원에게 개발 과정 공유

### 📊 **통계 분석**

AI 사용량과 생산성을 측정할 수 있습니다.

```bash
git entirekit stats
```

**확인 가능한 정보:**
- 💰 토큰 사용량 (input, output, cache read)
- 🤖 AI vs 사람 기여도 비율
- 📝 가장 많이 수정된 파일
- 📋 최근 세션 요약

**활용 시나리오:**
- 💸 AI 비용 모니터링 및 최적화
- 📈 생산성 분석 (AI 활용도 측정)
- 🎯 핫스팟 파악 (자주 수정되는 코드 → 리팩토링 우선순위)

### 🔬 **비교 분석**

두 checkpoint 간의 변화를 비교합니다.

```bash
# 최근 목록에서 두 개 선택
git entirekit recent

# 비교
git entirekit diff <hash1> <hash2>
```

**활용 시나리오:**
- 🔄 반복 작업 패턴 발견
- 📉 효율성 개선 (토큰 사용량 비교)

### 📊 **시각화 리포트**

아름답고 전문적인 HTML 대시보드로 checkpoint 데이터를 시각화합니다.

```bash
# 기본 사용 (최근 모든 checkpoint 포함)
git entirekit report

# 최근 20개 checkpoint만 포함
git entirekit report --limit 20

# 특정 브랜치 필터링
git entirekit report --branch feature/login

# 특정 날짜 범위
git entirekit report --since "2026-01-01" --until "2026-02-13"

# 출력 파일 지정 (자동으로 브라우저에서 열립니다)
git entirekit report --output ~/Desktop/monthly-report.html

# 자동 열기 제외
git entirekit report --no-open --output ~/reports/report.html
```

**리포트에 포함된 정보:**
- 📈 대시보드: 세션 수, API 호출, 토큰 사용량, 캐시 효율성, AI 기여도, 수정된 파일 수
- 💰 토큰 분석: 입력/출력/캐시 토큰 추이, 사용량 비교, 요약 테이블
- 🤖 AI 기여도: 기여도 분포, 브랜치별 비교, 시간대별 타임라인
- 🔥 파일 핫스팟: 상위 20개 수정 파일, 디렉토리별 분류, 검색 가능한 테이블
- 📅 세션 타임라인: GitHub 스타일 활동 히트맵, 세션 상세 카드
- 🌿 브랜치 분석: 브랜치별 요약, 작업 분포 차트

**활용 시나리오:**
- 📊 팀에 개발 진행 상황 공유 (전문적인 시각화)
- 💸 월간/주간 AI 비용 리포트 작성
- 📈 생산성 추이 분석 (시간대별, 브랜치별)
- 🎯 핫스팟 파일 식별 (리팩토링 우선순위 결정)
- 📁 프로젝트 건강도 점검 (캐시 효율성, 토큰 사용량)

## 📁 구조

```
.entire/
├── ENTIREKIT.md           # 전체 가이드 (영문)
├── ENTIREKIT.ko.md        # 전체 가이드 (한글)
├── settings.json          # EntireKit 설정
└── docs/                  # 추가 문서
    ├── quick-start.md     # 빠른 시작 가이드
    └── advanced-usage.md  # 고급 활용법
```

## 🎯 실전 활용 예시

### 예시 1: 버그 디버깅

```bash
# 1. 문제가 된 파일 이름으로 검색
git entirekit search "useAuth.ts"

# 2. 해당 checkpoint의 전체 컨텍스트 확인
# (언제, 왜 수정했는지 프롬프트와 대화 내용 포함)

# 3. 문제 원인 파악 및 수정
```

### 예시 2: 코드 리뷰 준비

```bash
# 1. 최근 통계 확인
git entirekit stats

# 출력 예:
# AI 기여도: 평균 73.7%
# 가장 많이 수정된 파일: useAuth.ts (12회)

# 2. AI가 많이 작성한 코드 집중 리뷰
# 3. 반복 수정된 파일 → 리팩토링 필요성 검토
```

### 예시 3: 비용 최적화

```bash
# 월간 토큰 사용량 확인
git entirekit stats

# Cache read tokens 비율 확인
# 높을수록 비용 효율적 (최대 90% 절감)

# 비효율적인 패턴 발견 시 프롬프트 개선
```

### 예시 4: 지식 공유

```bash
# 특정 기능 개발 과정 추출
git entirekit search "로그인 구현"

# 결과를 팀원에게 공유
# - 전체 대화 내용
# - 의사결정 과정
# - 시행착오와 해결책
```

## 🛠️ 시스템 요구사항

- **필수:**
  - Git
  - Node.js 20+

- **선택:**
  - Claude Code or Gemini CLI 등

### 설치 확인

```bash
# Node.js 확인
node --version

# EntireKit CLI 확인
npx entirekit --version
```

## 📖 더 알아보기

- [빠른 시작 가이드](./docs/quick-start.ko.md) - 5분 안에 시작하기
- [고급 활용법](./docs/advanced-usage.ko.md) - 심화 기능과 팁

## 💡 자주 묻는 질문

### Q: 이 도구와 Entire의 관계는?
A: Entire는 AI 세션을 기록하는 **플랫폼**이고, 이 도구는 기록된 checkpoint를 **분석**하는 유틸리티입니다.
Claude Code, Gemini CLI 등 Entire를 지원하는 모든 AI 도구와 함께 사용할 수 있습니다.

### Q: Entire는 어떻게 설치하나요?
A: AI 도구에 따라 자동 설치됩니다. 자세한 내용은 [Entire 문서](https://github.com/entireio/cli) 참고

### Q: `install` 전에 checkpoint가 꼭 필요하나요?
A: 아닙니다. `install`은 checkpoint 없이도 실행됩니다. 다만 분석 명령은 checkpoint 데이터가 필요합니다.

### Q: 다른 프로젝트에도 사용할 수 있나요?
A: 네! 해당 프로젝트에서 EntireKit을 설치한 뒤 `npx entirekit install`을 실행하면 됩니다.

### Q: Checkpoint 데이터는 어디에 저장되나요?
A: `entire/checkpoints/v1` git 브랜치에 저장됩니다. 일반 파일 시스템에는 없습니다.

### Q: 비용은 얼마나 드나요?
A: 이 도구 자체는 무료입니다. AI API 사용 비용은 checkpoint에 기록된 토큰 사용량으로 확인 가능합니다.

## 🤝 기여하기

버그 리포트, 기능 제안, Pull Request를 환영합니다!

## 📄 라이선스

MIT License

---

**Tip:** 매일 아침 `git entirekit yesterday`로 어제 작업을 리마인드하세요! 🌅
