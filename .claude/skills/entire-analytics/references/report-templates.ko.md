[English](report-templates.md)

# EntireKit 리포트 템플릿

checkpoint 데이터를 분석하고 공유하기 위한 마크다운 리포트 템플릿 모음입니다.
일일, 주간, 월간, 커스텀 기간 리포트를 TypeScript 실행기 또는 CLI 명령으로 자동 생성할 수 있습니다.

## 개요

이 템플릿들은 다음 용도로 사용됩니다:

- **일일 리포트**: 어제의 작업 내용 빠른 리뷰 (아침 회의용)
- **주간 리포트**: 주간 생산성 분석 및 트렌드 (주간 회의용)
- **월간 리포트**: 비용 분석, 성과 평가, 팀 공유 (경영진 보고용)
- **커스텀 리포트**: 특정 기간의 심층 분석 (프로젝트 리뷰용)

---

## 1. 일일 리포트 (Daily Report)

### 템플릿 구조

```markdown
# Daily Checkpoint Report - {DATE}

## 요약

| 항목 | 값 |
|------|-----|
| 세션 수 | {COUNT} |
| 총 토큰 사용 | {TOKENS:,} |
| AI 기여도 | {AI_PCT}% |
| 수정 파일 수 | {FILES} |
| 주요 브랜치 | {BRANCH} |

## 통계

### 토큰 사용량
- **Input**: {INPUT:,} tokens
- **Output**: {OUTPUT:,} tokens
- **Cache Read**: {CACHE:,} tokens
- **API Calls**: {CALLS}회

### AI 기여도
- **평균 AI 기여도**: {AVG_PCT}%
- **기여한 라인 수**: {AGENT_LINES:,}
- **사람이 수정한 라인**: {HUMAN_MODIFIED:,}

## 핫 파일 (자주 수정된 파일)

| 파일 | 수정 횟수 |
|------|----------|
| {FILE1} | {COUNT1} |
| {FILE2} | {COUNT2} |
| {FILE3} | {COUNT3} |
| {FILE4} | {COUNT4} |
| {FILE5} | {COUNT5} |

## 세션 목록

### Session 1: {TIME}
- **Branch**: {BRANCH}
- **Output Tokens**: {TOKENS:,}
- **API Calls**: {CALLS}
- **Files Modified**: {COUNT}
- **AI Contribution**: {PCT}%

### Session 2: {TIME}
- **Branch**: {BRANCH}
- **Output Tokens**: {TOKENS:,}
- **API Calls**: {CALLS}
- **Files Modified**: {COUNT}
- **AI Contribution**: {PCT}%
```

### 예제 (실제 데이터)

```markdown
# Daily Checkpoint Report - 2026-02-13

## 요약

| 항목 | 값 |
|------|-----|
| 세션 수 | 5 |
| 총 토큰 사용 | 87,450 |
| AI 기여도 | 76.3% |
| 수정 파일 수 | 18 |
| 주요 브랜치 | feature/260213_1700 |

## 통계

### 토큰 사용량
- **Input**: 24,320 tokens
- **Output**: 52,100 tokens
- **Cache Read**: 11,030 tokens
- **API Calls**: 12회

### AI 기여도
- **평균 AI 기여도**: 76.3%
- **기여한 라인 수**: 342
- **사람이 수정한 라인**: 108

## 핫 파일 (자주 수정된 파일)

| 파일 | 수정 횟수 |
|------|----------|
| src/hooks/useAuth.ts | 4 |
| pages/login.tsx | 3 |
| components/Form.tsx | 3 |
| utils/api.ts | 2 |
| styles/theme.ts | 2 |

## 세션 목록

### Session 1: 09:30
- **Branch**: feature/260213_1700
- **Output Tokens**: 12,340
- **API Calls**: 3
- **Files Modified**: 5
- **AI Contribution**: 78.5%

### Session 2: 11:45
- **Branch**: feature/260213_1700
- **Output Tokens**: 8,920
- **API Calls**: 2
- **Files Modified**: 3
- **AI Contribution**: 72.1%

### Session 3: 14:20
- **Branch**: feature/260213_1700
- **Output Tokens**: 15,680
- **API Calls**: 4
- **Files Modified**: 6
- **AI Contribution**: 79.3%

### Session 4: 16:00
- **Branch**: feature/260213_1700
- **Output Tokens**: 10,240
- **API Calls**: 2
- **Files Modified**: 3
- **AI Contribution**: 75.2%

### Session 5: 17:30
- **Branch**: feature/260213_1700
- **Output Tokens**: 4,920
- **API Calls**: 1
- **Files Modified**: 1
- **AI Contribution**: 81.0%
```

### TypeScript/CLI 실행기

```bash
mkdir -p reports

npx entirekit report \
  --since 2026-02-13 \
  --until 2026-02-14 \
  --export-json reports/daily-2026-02-13.json \
  --output reports/daily-2026-02-13.html \
  --no-open
```

```ts
// scripts/daily-report.ts
import { execa } from 'execa';

async function main(): Promise<void> {
  await execa(
    'npx',
    [
      'entirekit',
      'report',
      '--since',
      '2026-02-13',
      '--until',
      '2026-02-14',
      '--export-json',
      'reports/daily-2026-02-13.json',
      '--output',
      'reports/daily-2026-02-13.html',
      '--no-open',
    ],
    { stdio: 'inherit' }
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

---

## 2. 주간 리포트 (Weekly Report)

### 템플릿 구조

```markdown
# Weekly Checkpoint Report - Week {WEEK}

## 개요

| 항목 | 값 |
|------|-----|
| 총 세션 수 | {TOTAL} |
| 일평균 세션 수 | {AVG} |
| 총 토큰 사용 | {TOKENS:,} |
| 총 API 호출 | {CALLS} |
| 전체 AI 기여도 | {AVG_PCT}% |
| 수정된 파일 수 | {FILES} |
| 활동 일수 | {DAYS} |

## 생산성 트렌드

### 일일 세션 분포

| 요일 | 세션 수 | 토큰 사용 | API 호출 |
|------|--------|---------|---------|
| 월요일 | {COUNT} | {TOKENS:,} | {CALLS} |
| 화요일 | {COUNT} | {TOKENS:,} | {CALLS} |
| 수요일 | {COUNT} | {TOKENS:,} | {CALLS} |
| 목요일 | {COUNT} | {TOKENS:,} | {CALLS} |
| 금요일 | {COUNT} | {TOKENS:,} | {CALLS} |

## TOP 파일

| 파일 | 수정 횟수 | 디렉토리 |
|------|----------|---------|
| {FILE} | {COUNT} | {DIR} |
| {FILE} | {COUNT} | {DIR} |
| {FILE} | {COUNT} | {DIR} |

## 세션 타임라인

{SESSION_CARDS}
```

### 예제 (실제 데이터)

```markdown
# Weekly Checkpoint Report - Week 07/2026

## 개요

| 항목 | 값 |
|------|-----|
| 총 세션 수 | 35 |
| 일평균 세션 수 | 5.0 |
| 총 토큰 사용 | 612,480 |
| 총 API 호출 | 85 |
| 전체 AI 기여도 | 75.2% |
| 수정된 파일 수 | 47 |
| 활동 일수 | 7 |

## 생산성 트렌드

### 일일 세션 분포

| 요일 | 세션 수 | 토큰 사용 | API 호출 |
|------|--------|---------|---------|
| 월요일 | 6 | 87,520 | 12 |
| 화요일 | 5 | 82,340 | 11 |
| 수요일 | 5 | 91,230 | 13 |
| 목요일 | 6 | 93,450 | 14 |
| 금요일 | 7 | 105,620 | 15 |
| 토요일 | 3 | 78,900 | 12 |
| 일요일 | 2 | 73,420 | 8 |

## TOP 파일

| 파일 | 수정 횟수 | 디렉토리 |
|------|----------|---------|
| src/hooks/useAuth.ts | 12 | src/hooks |
| pages/login.tsx | 10 | pages |
| components/Form.tsx | 9 | components |
| utils/api.ts | 8 | utils |
| styles/theme.ts | 7 | styles |
| src/store/auth.ts | 6 | src/store |
| types/index.ts | 6 | types |
| middleware/auth.ts | 5 | middleware |

## 주요 성과

- ✅ Feature: 로그인 기능 완성
- ✅ Fix: 캐시 효율성 개선 (85% → 92%)
- ✅ Refactor: 인증 로직 단순화
- ✅ Docs: API 문서 작성

## 개선 사항

- Cache Read 토큰이 증가 추세 (좋은 신호 - 비용 절감)
- AI 기여도가 안정적으로 75% 이상 유지
- 금요일에 생산성 최고조 (주간 업무 마무리)
```

### TypeScript/CLI 실행기

```bash
mkdir -p reports

npx entirekit report \
  --since 2026-02-10 \
  --until 2026-02-17 \
  --export-json reports/weekly-2026-W07.json \
  --output reports/weekly-2026-W07.html \
  --no-open
```

---

## 3. 월간 리포트 (Monthly Report)

### 템플릿 구조

```markdown
# Monthly Checkpoint Report - {MONTH}

## Executive Summary

{MONTH}의 개발 활동을 요약합니다.

- **총 세션**: {COUNT}개
- **평균 AI 기여도**: {PCT}%
- **총 토큰 사용**: {TOKENS:,}개
- **추정 비용**: ${COST}

## 월간 통계

| 항목 | 값 | 전월 | 변화 |
|------|-----|------|------|
| 세션 수 | {COUNT} | {PREV} | {CHANGE} |
| 평균 AI 기여도 | {PCT}% | {PREV_PCT}% | {CHANGE} |
| 캐시 효율성 | {CACHE}% | {PREV_CACHE}% | {CHANGE} |
| 수정 파일 수 | {FILES} | {PREV_FILES} | {CHANGE} |

## 비용 분석

### 토큰별 비용

| 항목 | 사용량 | 단가 | 비용 |
|------|--------|------|------|
| Input Tokens | {TOKENS:,} | $0.003/1K | ${COST} |
| Output Tokens | {TOKENS:,} | $0.015/1K | ${COST} |
| Cache Read | {TOKENS:,} | $0.0003/1K | ${COST} |
| Cache Creation | {TOKENS:,} | $0.00375/1K | ${COST} |
| **총합** | | | **${TOTAL}** |

## 핫 파일 분석

{HOTFILE_CARDS}

## 주간별 분석

### Week 1 ({WEEK1_DATES})
- 세션: {COUNT}
- 토큰: {TOKENS:,}
- AI 기여도: {PCT}%

### Week 2 ({WEEK2_DATES})
- 세션: {COUNT}
- 토큰: {TOKENS:,}
- AI 기여도: {PCT}%

### Week 3 ({WEEK3_DATES})
- 세션: {COUNT}
- 토큰: {TOKENS:,}
- AI 기여도: {PCT}%

### Week 4 ({WEEK4_DATES})
- 세션: {COUNT}
- 토큰: {TOKENS:,}
- AI 기여도: {PCT}%

## 주목할 세션

{NOTABLE_SESSIONS}

## 브랜치 분석

| 브랜치 | 세션 | 토큰 | AI % |
|--------|------|------|------|
| {BRANCH} | {COUNT} | {TOKENS:,} | {PCT}% |
| {BRANCH} | {COUNT} | {TOKENS:,} | {PCT}% |
| {BRANCH} | {COUNT} | {TOKENS:,} | {PCT}% |

## 권장사항

1. {RECOMMENDATION}
2. {RECOMMENDATION}
3. {RECOMMENDATION}
```

### 예제 (실제 데이터)

```markdown
# Monthly Checkpoint Report - 2026-02

## Executive Summary

2월의 개발 활동을 요약합니다.

- **총 세션**: 187개
- **평균 AI 기여도**: 76.2%
- **총 토큰 사용**: 2,543,680개
- **추정 비용**: $38.15

이번 달은 로그인 기능과 인증 시스템 개선에 집중했으며, 캐시 효율성을 92%까지 개선했습니다.

## 월간 통계

| 항목 | 값 | 전월 | 변화 |
|------|-----|------|------|
| 세션 수 | 187 | 156 | ↑ 20% |
| 평균 AI 기여도 | 76.2% | 74.8% | ↑ 1.4% |
| 캐시 효율성 | 92% | 85% | ↑ 7% |
| 수정 파일 수 | 58 | 52 | ↑ 6 |

## 비용 분석

### 토큰별 비용

| 항목 | 사용량 | 단가 | 비용 |
|------|--------|------|------|
| Input Tokens | 487,230 | $0.003/1K | $1.46 |
| Output Tokens | 1,623,450 | $0.015/1K | $24.35 |
| Cache Read | 289,560 | $0.0003/1K | $0.09 |
| Cache Creation | 143,440 | $0.00375/1K | $0.54 |
| **총합** | 2,543,680 | | **$26.44** |

**월간 예상 비용**: $26.44 (이전 달: $32.18) → **18% 감소**

## 핫 파일 분석

### 🔥 가장 자주 수정된 파일 TOP 10

| 파일 | 수정 횟수 | 디렉토리 | 최근 수정 |
|------|----------|---------|---------|
| src/hooks/useAuth.ts | 34 | src/hooks | 2026-02-13 |
| pages/login.tsx | 28 | pages | 2026-02-12 |
| components/Form.tsx | 25 | components | 2026-02-11 |
| utils/api.ts | 23 | utils | 2026-02-10 |
| styles/theme.ts | 19 | styles | 2026-02-09 |
| src/store/auth.ts | 18 | src/store | 2026-02-08 |
| types/index.ts | 17 | types | 2026-02-07 |
| middleware/auth.ts | 16 | middleware | 2026-02-06 |
| constants/api.ts | 14 | constants | 2026-02-05 |
| test/auth.test.ts | 12 | test | 2026-02-04 |

**분석**: 인증 관련 파일들(hooks, pages, store, middleware)에 집중. 리팩토링이나 통합 고려.

## 주간별 분석

### Week 05 (2026-02-03 ~ 2026-02-09)
- 세션: 45
- 토큰: 612,450
- AI 기여도: 75.8%
- 주요 작업: 로그인 폼 개발, 유효성 검사 구현

### Week 06 (2026-02-10 ~ 2026-02-16)
- 세션: 52
- 토큰: 723,890
- AI 기여도: 77.1%
- 주요 작업: 인증 로직 리팩토링, 토큰 관리 개선

### Week 07 (2026-02-17 ~ 2026-02-23)
- 세션: 48
- 토큰: 687,340
- AI 기여도: 76.5%
- 주요 작업: 캐시 최적화, 에러 핸들링 개선

### Week 08 (2026-02-24 ~ 2026-02-28)
- 세션: 42
- 토큰: 519,000
- AI 기여도: 75.2%
- 주요 작업: 테스트 코드 작성, 문서화

## 주목할 세션

### ⭐ 가장 효율적인 세션
**Session ID**: a7f3b2e9c1
**날짜**: 2026-02-11
**내용**: 캐시 효율성 개선 구현
**토큰**: 4,320 (매우 효율적)
**AI 기여도**: 89%
**결과**: 캐시 hit rate 85% → 92%

### 🎯 가장 큰 변화가 있던 세션
**Session ID**: c4e2f8d1a3
**날짜**: 2026-02-07
**내용**: 인증 시스템 완전 리팩토링
**토큰**: 45,680
**파일 수정**: 12개
**AI 기여도**: 82%
**결과**: 코드 라인 수 30% 감소, 성능 40% 향상

## 브랜치 분석

| 브랜치 | 세션 | 토큰 | AI % | 파일 |
|--------|------|------|------|------|
| feature/auth-refactor | 78 | 987,640 | 78.5% | 23 |
| feature/cache-optimization | 56 | 743,210 | 75.2% | 18 |
| bugfix/token-expiry | 34 | 523,450 | 72.1% | 12 |
| feature/error-handling | 19 | 289,380 | 74.8% | 5 |

## 권장사항

1. **인증 모듈 통합**: useAuth.ts와 auth.ts의 기능이 중복되고 있습니다. 이번 달 말에 통합 리팩토링을 계획하세요.

2. **테스트 커버리지 증대**: 인증 로직 변경이 많았으므로 테스트 코드 비율을 현재 65%에서 85% 이상으로 높여야 합니다.

3. **캐시 전략 수립**: 현재 캐시 효율성이 92%로 높으므로, 이를 유지하면서 다른 모듈에도 적용하는 것을 권장합니다.

4. **문서 업데이트**: 많은 변경이 있었으므로 API 문서와 아키텍처 문서를 업데이트하세요.

---

**생성일시**: 2026-03-01 09:30:00
**데이터 범위**: 2026-02-01 00:00:00 ~ 2026-02-28 23:59:59
```

### TypeScript/CLI 실행기

```bash
mkdir -p reports

npx entirekit report \
  --since 2026-02-01 \
  --until 2026-02-28 \
  --export-json reports/monthly-2026-02.json \
  --output reports/monthly-2026-02.html \
  --no-open
```

---

## 4. 커스텀 범위 리포트 (Custom Range Report)

특정 기간의 심층 분석 리포트입니다.

### TypeScript/CLI 실행기

```bash
mkdir -p reports

npx entirekit report \
  --since 2026-02-01 \
  --until 2026-02-13 \
  --export-json reports/custom-2026-02-01-to-2026-02-13.json \
  --output reports/custom-2026-02-01-to-2026-02-13.html \
  --no-open
```

---

## 5. HTML 대시보드 템플릿 (개념)

`entirekit report`가 생성하는 인터랙티브 HTML 대시보드의 구조입니다.

### 섹션 구조

```
┌─────────────────────────────────────────┐
│ Header: EntireKit Report        │
│ Subtitle: Generated 2026-02-13...       │
├─────────────────────────────────────────┤
│ Navigation Tabs (Dashboard, Tokens, ...) │
├─────────────────────────────────────────┤
│ 1. KPI Cards (6개 주요 지표)             │
│    - Sessions | API Calls | Output Tokens │
│    - Cache Efficiency | AI % | Files    │
├─────────────────────────────────────────┤
│ 2. Dashboard Charts                     │
│    - Token Usage (Doughnut)             │
│    - AI vs Human (Doughnut)             │
├─────────────────────────────────────────┤
│ 3. Token Section                        │
│    - Stacked Bar (Session by token type) │
│    - Trend Line (Output tokens over time) │
│    - API Calls Bar Chart                │
│    - Summary Table                      │
├─────────────────────────────────────────┤
│ 4. Attribution Section                  │
│    - Overall AI/Human (Doughnut)        │
│    - By Branch (Horizontal Bar)         │
│    - Trend Line                         │
├─────────────────────────────────────────┤
│ 5. File Hotspots Section                │
│    - Top 20 Files (Horizontal Bar)      │
│    - By Directory (Horizontal Bar)      │
│    - Searchable Table (100 files/page)  │
├─────────────────────────────────────────┤
│ 6. Timeline Section                     │
│    - Activity Heatmap (GitHub style)    │
│    - Session Cards (최근 50개)           │
├─────────────────────────────────────────┤
│ 7. Branch Analysis Section              │
│    - Branch Summary Table               │
│    - Distribution Chart (Stacked Bar)   │
└─────────────────────────────────────────┘
```

### 사용 가능한 라이브러리

- **Chart.js 4.4.7**: 모든 차트 렌더링
- **GitHub 스타일 색상**: 다크 테마, 전문적 외관
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

### 생성 명령

```bash
# 기본 (모든 checkpoints 포함)
git entirekit report

# 최근 20개만
git entirekit report --limit 20

# 특정 브랜치 필터링
git entirekit report --branch feature/auth

# 날짜 범위
git entirekit report --since 2026-02-01 --until 2026-02-13

# 커스텀 출력
git entirekit report --output ~/reports/feb-report.html --no-open
```

---

## 6. 사용 예시

### 예시 1: 일일 리포트 생성 및 저장

```bash
npx entirekit report \
  --since 2026-02-13 \
  --until 2026-02-14 \
  --output ./reports/daily-2026-02-13.html \
  --no-open
```

### 예시 2: 주간 리포트 생성

```bash
npx entirekit report \
  --since 2026-02-10 \
  --until 2026-02-17 \
  --output ./reports/weekly-2026-W07.html \
  --no-open
```

### 예시 3: 월간 리포트 생성 및 자동화

```bash
npx entirekit report \
  --since 2026-02-01 \
  --until 2026-02-28 \
  --output ./reports/monthly-2026-02.html \
  --export-json ./reports/monthly-2026-02.json \
  --no-open

# Crontab (매월 1일 09:00)
0 9 1 * * cd /path/to/repo && npx entirekit report --since $(date +\%Y-\%m-01) --output ./reports/monthly-latest.html --no-open
```

### 예시 4: 커스텀 기간 리포트

```bash
npx entirekit report \
  --since 2026-01-15 \
  --until 2026-02-13 \
  --output ./reports/project-final-report.html \
  --export-json ./reports/project-final-report.json \
  --no-open
```

### 예시 5: HTML 대시보드 생성

```bash
npx entirekit report
npx entirekit report --limit 20 --no-open --output ./reports/latest-20.html
npx entirekit report --branch feature/auth --since 2026-02-01 --until 2026-02-13 --no-open
```

## 7. 설정 파일 예시

프로젝트 루트의 `.entire/report-config.json`:

```json
{
  "outputDir": "./reports",
  "autoOpen": false,
  "defaultLimit": 100,
  "cost": {
    "inputPer1k": 0.003,
    "outputPer1k": 0.015,
    "cacheReadPer1k": 0.0003,
    "cacheCreatePer1k": 0.00375
  },
  "notifications": {
    "slackWebhookUrl": "",
    "emailRecipient": ""
  }
}
```

## 모범 사례

### 1. 정기적 리뷰

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
alias morning='git entirekit yesterday'
alias weekly='git entirekit week && git entirekit stats'
alias monthly='npx entirekit report --since 2026-02-01 --until 2026-02-28 --no-open'
```

### 2. CI/CD 통합

GitHub Actions:

```yaml
name: Generate Reports
on:
  schedule:
    - cron: '0 9 * * MON'  # 매주 월요일 9시

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate Weekly Report
        run: npx entirekit report --since 2026-02-10 --until 2026-02-17 --no-open --output ./reports/weekly.html
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: weekly-report
          path: checkpoint-report-*.md
```

### 3. 팀 공유 템플릿

```markdown
## Weekly Standup - Week {N}

**개발 활동 요약**

{% include_relative checkpoint-report-weekly-*.md %}

**이번 주 목표**: ...
**다음 주 목표**: ...
**주의사항**: ...
```

### 4. 월간 경영진 보고

최상위 3개 지표만 포함:

```markdown
# Monthly Executive Summary

- 📊 **개발 생산성**: 187 세션 (전월 대비 20% 증가)
- 💰 **AI 비용**: $26.44 (예산 대비 70%)
- 🎯 **완료 기능**: 5개 (로그인, 캐시, 에러 처리 등)

[상세 리포트 다운로드](checkpoint-report-monthly-2026-02.md)
```

---

## 문제 해결

### Q: "No checkpoint data found" 오류
```bash
# checkpoint 브랜치 확인
git log entire/checkpoints/v1 --oneline | head

# checkpoint 생성 (Claude Code에서)
# 또는 생성 후 다시 시도
```

### Q: 데이터 누락
```bash
# 메타데이터 경로 확인
git ls-tree -r entire/checkpoints/v1 | grep metadata.json | head -5

# 수동으로 특정 checkpoint 검사
HASH="abc1234"
git show $HASH:$(git ls-tree -r --name-only $HASH | grep metadata.json | tail -1) | jq .
```

### Q: 성능 최적화
```bash
# 최근 N개만 분석
git log entire/checkpoints/v1 --format="%H" -50 | ...

# 캐시 활용 (반복 실행 시)
git log entire/checkpoints/v1 ... > /tmp/hashes.txt
cat /tmp/hashes.txt | while read hash; do ...
```

---

## 참고 자료

- [Entire GitHub](https://github.com/entireio/cli)
- [Claude Code 문서](https://claude.com/claude-code)
- [jq 매뉴얼](https://stedolan.github.io/jq/)
- [Chart.js 문서](https://www.chartjs.org/)
