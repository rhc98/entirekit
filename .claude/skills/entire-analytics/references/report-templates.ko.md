[English](report-templates.md)

# EntireKit 리포트 템플릿

checkpoint 데이터를 분석하고 공유하기 위한 마크다운 리포트 템플릿 모음입니다.
일일, 주간, 월간, 그리고 커스텀 기간 리포트를 bash 스크립트로 자동 생성할 수 있습니다.

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

### Bash 스크립트

```bash
#!/bin/bash
# daily-report.sh - 일일 리포트 생성

set -euo pipefail

TARGET_DATE="${1:-$(date +%Y-%m-%d)}"
OUTPUT_FILE="checkpoint-report-daily-${TARGET_DATE}.md"

# 헬퍼 함수
get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only "$hash" 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# 날짜 범위 설정
START_DATE="$TARGET_DATE"
END_DATE=$(date -d "$TARGET_DATE +1 day" +%Y-%m-%d)

# 데이터 수집
HASHES=$(git log entire/checkpoints/v1 --since="$START_DATE" --until="$END_DATE" --format="%H")

if [ -z "$HASHES" ]; then
  echo "❌ 해당 날짜에 checkpoint가 없습니다."
  exit 1
fi

# 통계 계산
TOTAL_INPUT=0
TOTAL_OUTPUT=0
TOTAL_CACHE=0
TOTAL_CALLS=0
AGENT_LINES=0
HUMAN_MODIFIED=0
AGENT_PCT_SUM=0
AGENT_PCT_COUNT=0
SESSION_COUNT=0
declare -A FILE_COUNTS

while read -r hash; do
  metadata_path=$(get_metadata_path "$hash")
  if [ -n "$metadata_path" ]; then
    data=$(git show "$hash:$metadata_path" 2>/dev/null) || continue

    # 토큰 통계
    input=$(echo "$data" | jq -r '.token_usage.input_tokens // 0')
    output=$(echo "$data" | jq -r '.token_usage.output_tokens // 0')
    cache=$(echo "$data" | jq -r '.token_usage.cache_read_tokens // 0')
    calls=$(echo "$data" | jq -r '.token_usage.api_call_count // 0')

    TOTAL_INPUT=$((TOTAL_INPUT + input))
    TOTAL_OUTPUT=$((TOTAL_OUTPUT + output))
    TOTAL_CACHE=$((TOTAL_CACHE + cache))
    TOTAL_CALLS=$((TOTAL_CALLS + calls))

    # AI 기여도 통계
    agent=$(echo "$data" | jq -r '.initial_attribution.agent_lines // 0')
    human=$(echo "$data" | jq -r '.initial_attribution.human_modified // 0')
    pct=$(echo "$data" | jq -r '.initial_attribution.agent_percentage // 0')

    if [ "$agent" != "0" ] || [ "$human" != "0" ]; then
      AGENT_LINES=$((AGENT_LINES + agent))
      HUMAN_MODIFIED=$((HUMAN_MODIFIED + human))
      AGENT_PCT_SUM=$(echo "$AGENT_PCT_SUM + $pct" | bc -l)
      AGENT_PCT_COUNT=$((AGENT_PCT_COUNT + 1))
    fi

    # 파일 통계
    while read -r file; do
      FILE_COUNTS["$file"]=$((${FILE_COUNTS["$file"]:-0} + 1))
    done < <(echo "$data" | jq -r '.files_touched[]? // empty')

    SESSION_COUNT=$((SESSION_COUNT + 1))
  fi
done <<< "$HASHES"

# 평균 AI 기여도
AVG_AI_PCT=0
if [ "$AGENT_PCT_COUNT" -gt 0 ]; then
  AVG_AI_PCT=$(echo "scale=1; $AGENT_PCT_SUM / $AGENT_PCT_COUNT" | bc -l)
fi

# TOP 5 파일
HOTFILES=$(
  for file in "${!FILE_COUNTS[@]}"; do
    echo "${FILE_COUNTS[$file]} $file"
  done | sort -rn | head -5 | awk '{print "| " $2 " | " $1 " |"}'
)

# 브랜치 정보
MAIN_BRANCH=$(git log entire/checkpoints/v1 --since="$START_DATE" --until="$END_DATE" --format="%H" | head -1 | xargs -I {} git show {}:$(get_metadata_path {}) 2>/dev/null | jq -r '.branch // "unknown"')

# 리포트 생성
cat > "$OUTPUT_FILE" << EOF
# Daily Checkpoint Report - $TARGET_DATE

## 요약

| 항목 | 값 |
|------|-----|
| 세션 수 | $SESSION_COUNT |
| 총 토큰 사용 | $(printf "%'d" $((TOTAL_INPUT + TOTAL_OUTPUT))) |
| AI 기여도 | $AVG_AI_PCT% |
| 수정 파일 수 | ${#FILE_COUNTS[@]} |
| 주요 브랜치 | $MAIN_BRANCH |

## 통계

### 토큰 사용량
- **Input**: $(printf "%'d" $TOTAL_INPUT) tokens
- **Output**: $(printf "%'d" $TOTAL_OUTPUT) tokens
- **Cache Read**: $(printf "%'d" $TOTAL_CACHE) tokens
- **API Calls**: $TOTAL_CALLS회

### AI 기여도
- **평균 AI 기여도**: $AVG_AI_PCT%
- **기여한 라인 수**: $(printf "%'d" $AGENT_LINES)
- **사람이 수정한 라인**: $(printf "%'d" $HUMAN_MODIFIED)

## 핫 파일 (자주 수정된 파일)

| 파일 | 수정 횟수 |
|------|----------|
$HOTFILES

## 세션 목록

EOF

# 각 세션 정보 추가
i=1
while read -r hash; do
  metadata_path=$(get_metadata_path "$hash")
  if [ -n "$metadata_path" ]; then
    data=$(git show "$hash:$metadata_path" 2>/dev/null) || continue

    time=$(echo "$data" | jq -r '.created_at // "unknown"' | cut -d'T' -f2 | cut -d'+' -f1)
    branch=$(echo "$data" | jq -r '.branch // "unknown"')
    output=$(echo "$data" | jq -r '.token_usage.output_tokens // 0')
    calls=$(echo "$data" | jq -r '.token_usage.api_call_count // 0')
    files=$(echo "$data" | jq -r '.files_touched | length // 0')
    pct=$(echo "$data" | jq -r '.initial_attribution.agent_percentage // 0')

    cat >> "$OUTPUT_FILE" << EOF
### Session $i: $time
- **Branch**: $branch
- **Output Tokens**: $(printf "%'d" $output)
- **API Calls**: $calls
- **Files Modified**: $files
- **AI Contribution**: $(printf "%.1f" $pct)%

EOF
    i=$((i + 1))
  fi
done <<< "$HASHES"

echo "✅ 리포트 생성 완료: $OUTPUT_FILE"
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

### Bash 스크립트

```bash
#!/bin/bash
# weekly-report.sh - 주간 리포트 생성

set -euo pipefail

WEEK="${1:-$(date +%V)}"
YEAR="${2:-$(date +%Y)}"
OUTPUT_FILE="checkpoint-report-weekly-${YEAR}-W${WEEK}.md"

get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only "$hash" 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# 해당 주의 월요일, 일요일 계산
MONDAY=$(date -d "$YEAR-W$WEEK-1" +%Y-%m-%d)
SUNDAY=$(date -d "$YEAR-W$WEEK-0" +%Y-%m-%d)

HASHES=$(git log entire/checkpoints/v1 --since="$MONDAY" --until="$(date -d "$SUNDAY +1 day" +%Y-%m-%d)" --format="%H")

# 통계 계산
declare -A DAILY_SESSIONS
declare -A DAILY_TOKENS
declare -A DAILY_CALLS
declare -A FILE_COUNTS
TOTAL_SESSIONS=0
TOTAL_INPUT=0
TOTAL_OUTPUT=0
TOTAL_CACHE=0
TOTAL_CALLS=0
AGENT_PCT_SUM=0
AGENT_PCT_COUNT=0
ACTIVE_DAYS=0

while read -r hash; do
  metadata_path=$(get_metadata_path "$hash")
  if [ -n "$metadata_path" ]; then
    data=$(git show "$hash:$metadata_path" 2>/dev/null) || continue

    date=$(echo "$data" | jq -r '.created_at // "unknown"' | cut -d'T' -f1)
    dayofweek=$(date -d "$date" +%A)

    # 일일 통계
    DAILY_SESSIONS["$dayofweek"]=$((${DAILY_SESSIONS["$dayofweek"]:-0} + 1))

    # 토큰 통계
    input=$(echo "$data" | jq -r '.token_usage.input_tokens // 0')
    output=$(echo "$data" | jq -r '.token_usage.output_tokens // 0')
    cache=$(echo "$data" | jq -r '.token_usage.cache_read_tokens // 0')
    calls=$(echo "$data" | jq -r '.token_usage.api_call_count // 0')

    TOTAL_INPUT=$((TOTAL_INPUT + input))
    TOTAL_OUTPUT=$((TOTAL_OUTPUT + output))
    TOTAL_CACHE=$((TOTAL_CACHE + cache))
    TOTAL_CALLS=$((TOTAL_CALLS + calls))

    DAILY_TOKENS["$dayofweek"]=$((${DAILY_TOKENS["$dayofweek"]:-0} + output))
    DAILY_CALLS["$dayofweek"]=$((${DAILY_CALLS["$dayofweek"]:-0} + calls))

    # AI 기여도
    pct=$(echo "$data" | jq -r '.initial_attribution.agent_percentage // 0')
    if [ "$pct" != "0" ]; then
      AGENT_PCT_SUM=$(echo "$AGENT_PCT_SUM + $pct" | bc -l)
      AGENT_PCT_COUNT=$((AGENT_PCT_COUNT + 1))
    fi

    # 파일 통계
    while read -r file; do
      FILE_COUNTS["$file"]=$((${FILE_COUNTS["$file"]:-0} + 1))
    done < <(echo "$data" | jq -r '.files_touched[]? // empty')

    TOTAL_SESSIONS=$((TOTAL_SESSIONS + 1))
  fi
done <<< "$HASHES"

# 활동 일수 계산
ACTIVE_DAYS=${#DAILY_SESSIONS[@]}

# 평균 AI 기여도
AVG_AI_PCT=0
if [ "$AGENT_PCT_COUNT" -gt 0 ]; then
  AVG_AI_PCT=$(echo "scale=1; $AGENT_PCT_SUM / $AGENT_PCT_COUNT" | bc -l)
fi

# 일평균 세션 수
AVG_SESSIONS=$(echo "scale=1; $TOTAL_SESSIONS / $ACTIVE_DAYS" | bc -l)

# TOP 8 파일
HOTFILES=$(
  for file in "${!FILE_COUNTS[@]}"; do
    echo "${FILE_COUNTS[$file]} $file"
  done | sort -rn | head -8 | awk '{print "| " $2 " | " $1 " | " (match($2, /\//) ? substr($2, 1, index($2, "/") - 1) : ".") " |"}'
)

# 요일별 데이터 테이블 행
DAYNAMES=("Monday" "Tuesday" "Wednesday" "Thursday" "Friday" "Saturday" "Sunday")
DAYTABLE=""
for day in "${DAYNAMES[@]}"; do
  sessions=${DAILY_SESSIONS["$day"]:-0}
  tokens=${DAILY_TOKENS["$day"]:-0}
  calls=${DAILY_CALLS["$day"]:-0}
  DAYTABLE+="| $(echo $day | sed 's/Monday/월요일/;s/Tuesday/화요일/;s/Wednesday/수요일/;s/Thursday/목요일/;s/Friday/금요일/;s/Saturday/토요일/;s/Sunday/일요일/') | $sessions | $(printf "%'d" $tokens) | $calls |\n"
done

# 리포트 생성
cat > "$OUTPUT_FILE" << EOF
# Weekly Checkpoint Report - Week $(printf "%02d" $WEEK)/$YEAR

## 개요

| 항목 | 값 |
|------|-----|
| 총 세션 수 | $TOTAL_SESSIONS |
| 일평균 세션 수 | $AVG_SESSIONS |
| 총 토큰 사용 | $(printf "%'d" $((TOTAL_INPUT + TOTAL_OUTPUT))) |
| 총 API 호출 | $TOTAL_CALLS |
| 전체 AI 기여도 | $AVG_AI_PCT% |
| 수정된 파일 수 | ${#FILE_COUNTS[@]} |
| 활동 일수 | $ACTIVE_DAYS |

## 생산성 트렌드

### 일일 세션 분포

| 요일 | 세션 수 | 토큰 사용 | API 호출 |
|------|--------|---------|---------|
EOF

echo -ne "$DAYTABLE" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << EOF

## TOP 파일

| 파일 | 수정 횟수 | 디렉토리 |
|------|----------|---------|
$HOTFILES

## 통계 상세

### 토큰 분석
- **Input**: $(printf "%'d" $TOTAL_INPUT) tokens
- **Output**: $(printf "%'d" $TOTAL_OUTPUT) tokens
- **Cache Read**: $(printf "%'d" $TOTAL_CACHE) tokens
- **총합**: $(printf "%'d" $((TOTAL_INPUT + TOTAL_OUTPUT + TOTAL_CACHE))) tokens

### AI 기여도
- **평균**: $AVG_AI_PCT%
- **세션 수**: $AGENT_PCT_COUNT

---

**생성일시**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

echo "✅ 리포트 생성 완료: $OUTPUT_FILE"
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

### Bash 스크립트

```bash
#!/bin/bash
# monthly-report.sh - 월간 리포트 생성 (advanced-usage.md 예제 개선)

set -euo pipefail

MONTH="${1:-$(date +%Y-%m)}"
OUTPUT_FILE="checkpoint-report-monthly-${MONTH}.md"

get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only "$hash" 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# 날짜 범위
YEAR=$(echo "$MONTH" | cut -d'-' -f1)
MONTH_NUM=$(echo "$MONTH" | cut -d'-' -f2)
START_DATE="$MONTH-01"
LAST_DAY=$(date -d "$YEAR-$MONTH_NUM-01 +1 month -1 day" +%d)
END_DATE="$MONTH-$LAST_DAY"

HASHES=$(git log entire/checkpoints/v1 --since="$START_DATE" --until="$(date -d "$END_DATE +1 day" +%Y-%m-%d)" --format="%H")

# 통계 계산
declare -A FILE_COUNTS
declare -A WEEKLY_SESSIONS
declare -A WEEKLY_TOKENS
declare -A BRANCH_STATS

TOTAL_SESSIONS=0
TOTAL_INPUT=0
TOTAL_OUTPUT=0
TOTAL_CACHE_READ=0
TOTAL_CACHE_CREATE=0
TOTAL_CALLS=0
AGENT_PCT_SUM=0
AGENT_PCT_COUNT=0

while read -r hash; do
  metadata_path=$(get_metadata_path "$hash")
  if [ -n "$metadata_path" ]; then
    data=$(git show "$hash:$metadata_path" 2>/dev/null) || continue

    # 주 번호 계산
    date=$(echo "$data" | jq -r '.created_at // "unknown"' | cut -d'T' -f1)
    week=$(date -d "$date" +%V)

    # 토큰 통계
    input=$(echo "$data" | jq -r '.token_usage.input_tokens // 0')
    output=$(echo "$data" | jq -r '.token_usage.output_tokens // 0')
    cache_read=$(echo "$data" | jq -r '.token_usage.cache_read_tokens // 0')
    cache_create=$(echo "$data" | jq -r '.token_usage.cache_creation_tokens // 0')
    calls=$(echo "$data" | jq -r '.token_usage.api_call_count // 0')

    TOTAL_INPUT=$((TOTAL_INPUT + input))
    TOTAL_OUTPUT=$((TOTAL_OUTPUT + output))
    TOTAL_CACHE_READ=$((TOTAL_CACHE_READ + cache_read))
    TOTAL_CACHE_CREATE=$((TOTAL_CACHE_CREATE + cache_create))
    TOTAL_CALLS=$((TOTAL_CALLS + calls))

    # 주간 통계
    WEEKLY_SESSIONS["$week"]=$((${WEEKLY_SESSIONS["$week"]:-0} + 1))
    WEEKLY_TOKENS["$week"]=$((${WEEKLY_TOKENS["$week"]:-0} + output))

    # AI 기여도
    pct=$(echo "$data" | jq -r '.initial_attribution.agent_percentage // 0')
    if [ "$pct" != "0" ]; then
      AGENT_PCT_SUM=$(echo "$AGENT_PCT_SUM + $pct" | bc -l)
      AGENT_PCT_COUNT=$((AGENT_PCT_COUNT + 1))
    fi

    # 파일 통계
    while read -r file; do
      FILE_COUNTS["$file"]=$((${FILE_COUNTS["$file"]:-0} + 1))
    done < <(echo "$data" | jq -r '.files_touched[]? // empty')

    # 브랜치 통계
    branch=$(echo "$data" | jq -r '.branch // "unknown"')
    BRANCH_STATS["$branch"]=$((${BRANCH_STATS["$branch"]:-0} + 1))

    TOTAL_SESSIONS=$((TOTAL_SESSIONS + 1))
  fi
done <<< "$HASHES"

# 계산
AVG_AI_PCT=0
if [ "$AGENT_PCT_COUNT" -gt 0 ]; then
  AVG_AI_PCT=$(echo "scale=1; $AGENT_PCT_SUM / $AGENT_PCT_COUNT" | bc -l)
fi

# 비용 계산 (Claude 3.5 Sonnet 기준)
COST_INPUT=$(echo "scale=2; $TOTAL_INPUT / 1000 * 0.003" | bc -l)
COST_OUTPUT=$(echo "scale=2; $TOTAL_OUTPUT / 1000 * 0.015" | bc -l)
COST_CACHE_READ=$(echo "scale=2; $TOTAL_CACHE_READ / 1000 * 0.0003" | bc -l)
COST_CACHE_CREATE=$(echo "scale=2; $TOTAL_CACHE_CREATE / 1000 * 0.00375" | bc -l)
TOTAL_COST=$(echo "$COST_INPUT + $COST_OUTPUT + $COST_CACHE_READ + $COST_CACHE_CREATE" | bc -l)

# TOP 10 파일
HOTFILES=$(
  for file in "${!FILE_COUNTS[@]}"; do
    echo "${FILE_COUNTS[$file]} $file"
  done | sort -rn | head -10 | awk '{print "| " $2 " | " $1 " | " (match($2, /\//) ? substr($2, 1, index($2, "/") - 1) : ".") " | - |"}'
)

# 브랜치 정보
BRANCHES=$(
  for branch in "${!BRANCH_STATS[@]}"; do
    echo "${BRANCH_STATS[$branch]} $branch"
  done | sort -rn | head -5 | awk '{print "| " $2 " | " $1 " | 0 | 0% |"}'
)

# 리포트 생성
cat > "$OUTPUT_FILE" << EOF
# Monthly Checkpoint Report - $MONTH

## Executive Summary

$MONTH의 개발 활동을 요약합니다.

- **총 세션**: ${TOTAL_SESSIONS}개
- **평균 AI 기여도**: ${AVG_AI_PCT}%
- **총 토큰 사용**: $(printf "%'d" $((TOTAL_INPUT + TOTAL_OUTPUT + TOTAL_CACHE_READ + TOTAL_CACHE_CREATE)))개
- **추정 비용**: \$$TOTAL_COST

## 월간 통계

| 항목 | 값 |
|------|-----|
| 세션 수 | $TOTAL_SESSIONS |
| 평균 AI 기여도 | ${AVG_AI_PCT}% |
| 캐시 효율성 | $(echo "scale=1; $TOTAL_CACHE_READ / ($TOTAL_INPUT + $TOTAL_CACHE_READ) * 100" | bc -l)% |
| 수정 파일 수 | ${#FILE_COUNTS[@]} |

## 비용 분석

| 항목 | 사용량 | 단가 | 비용 |
|------|--------|------|------|
| Input Tokens | $(printf "%'d" $TOTAL_INPUT) | \$0.003/1K | \$$COST_INPUT |
| Output Tokens | $(printf "%'d" $TOTAL_OUTPUT) | \$0.015/1K | \$$COST_OUTPUT |
| Cache Read | $(printf "%'d" $TOTAL_CACHE_READ) | \$0.0003/1K | \$$COST_CACHE_READ |
| Cache Creation | $(printf "%'d" $TOTAL_CACHE_CREATE) | \$0.00375/1K | \$$COST_CACHE_CREATE |
| **총합** | $(printf "%'d" $((TOTAL_INPUT + TOTAL_OUTPUT + TOTAL_CACHE_READ + TOTAL_CACHE_CREATE))) | | **\$$TOTAL_COST** |

## 핫 파일 분석

| 파일 | 수정 횟수 | 디렉토리 | 최근 수정 |
|------|----------|---------|---------|
$HOTFILES

## 브랜치 분석

| 브랜치 | 세션 | 토큰 | AI % |
|--------|------|------|------|
$BRANCHES

## 주간별 분석

EOF

# 주간 데이터 추가
for week in $(echo "${!WEEKLY_SESSIONS[@]}" | tr ' ' '\n' | sort -n); do
  week_start=$(date -d "$YEAR-W$week-1" +%Y-%m-%d)
  week_end=$(date -d "$YEAR-W$week-0" +%Y-%m-%d)
  sessions=${WEEKLY_SESSIONS[$week]:-0}
  tokens=${WEEKLY_TOKENS[$week]:-0}

  cat >> "$OUTPUT_FILE" << EOF

### Week $(printf "%02d" $week) ($week_start ~ $week_end)
- 세션: $sessions
- 토큰: $(printf "%'d" $tokens)

EOF
done

cat >> "$OUTPUT_FILE" << EOF

---

**생성일시**: $(date '+%Y-%m-%d %H:%M:%S')
**데이터 범위**: ${START_DATE} ~ ${END_DATE}

EOF

echo "✅ 리포트 생성 완료: $OUTPUT_FILE"
```

---

## 4. 커스텀 범위 리포트 (Custom Range Report)

특정 기간의 심층 분석 리포트입니다.

```bash
#!/bin/bash
# custom-range-report.sh - 날짜 범위 리포트 생성

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 START_DATE END_DATE [OUTPUT_FILE]"
  echo "Example: $0 2026-02-01 2026-02-13"
  exit 1
fi

START_DATE="$1"
END_DATE="$2"
OUTPUT_FILE="${3:-checkpoint-report-${START_DATE}_to_${END_DATE}.md}"

get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only "$hash" 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

HASHES=$(git log entire/checkpoints/v1 --since="$START_DATE" --until="$(date -d "$END_DATE +1 day" +%Y-%m-%d)" --format="%H")

# 통계 계산 (위의 월간 리포트와 동일한 방식)
declare -A FILE_COUNTS
TOTAL_SESSIONS=0
TOTAL_INPUT=0
TOTAL_OUTPUT=0
AGENT_PCT_SUM=0
AGENT_PCT_COUNT=0

while read -r hash; do
  metadata_path=$(get_metadata_path "$hash")
  if [ -n "$metadata_path" ]; then
    data=$(git show "$hash:$metadata_path" 2>/dev/null) || continue

    # 토큰 및 기여도 통계...
    TOTAL_SESSIONS=$((TOTAL_SESSIONS + 1))
  fi
done <<< "$HASHES"

cat > "$OUTPUT_FILE" << EOF
# Custom Range Report

**기간**: $START_DATE ~ $END_DATE
**총 세션**: $TOTAL_SESSIONS

## 요약
...

EOF

echo "✅ 커스텀 리포트 생성: $OUTPUT_FILE"
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
# 어제 리포트 생성
./daily-report.sh $(date -d "yesterday" +%Y-%m-%d)

# 특정 날짜
./daily-report.sh 2026-02-13

# 파일로 저장
./daily-report.sh 2026-02-13 > report.md

# 팀원에게 공유
cat checkpoint-report-daily-2026-02-13.md | mail -s "Daily Report" team@company.com
```

### 예시 2: 주간 리포트 생성

```bash
# 현재 주 리포트
./weekly-report.sh

# 특정 주
./weekly-report.sh 07 2026

# 슬랙 봇에 전송
curl -X POST https://hooks.slack.com/services/... \
  -H 'Content-Type: application/json' \
  -d "{
    \"text\": \"Weekly Report - Week 07\",
    \"attachments\": [{
      \"text\": \"$(cat checkpoint-report-weekly-2026-W07.md)\"
    }]
  }"
```

### 예시 3: 월간 리포트 생성 및 자동화

```bash
# 현재 달
./monthly-report.sh

# 특정 달
./monthly-report.sh 2026-02

# crontab에 추가 (매월 1일 9시)
0 9 1 * * /path/to/monthly-report.sh $(date +\%Y-\%m --date="yesterday") && \
  mailx -s "Monthly Report" manager@company.com < checkpoint-report-monthly-*.md
```

### 예시 4: 커스텀 범위 리포트

```bash
# 특정 기간
./custom-range-report.sh 2026-02-01 2026-02-13

# 프로젝트 완료 후 분석
./custom-range-report.sh 2026-01-15 2026-02-13 project-final-report.md

# 동료와 공유
open checkpoint-report-2026-02-01_to_2026-02-13.md
```

### 예시 5: HTML 대시보드 생성

```bash
# 인터랙티브 리포트 생성 (자동으로 브라우저에서 열림)
git entirekit report

# 월간 리포트 생성
git entirekit report --since 2026-02-01 --until 2026-03-01 \
  --output ~/Desktop/feb-2026-report.html

# CI/CD에서 자동 생성 및 저장
git entirekit report --no-open --output ./reports/checkpoint-$(date +%Y-%m-%d).html
```

---

## 7. 설정 파일 예시

프로젝트 루트의 `.entire/config.sh`:

```bash
# 리포트 설정
REPORT_OUTPUT_DIR="./reports"
REPORT_AUTO_OPEN=true
REPORT_THEME="dark"  # light, dark, auto

# 비용 설정 (Claude 3.5 Sonnet 기준)
COST_PER_1K_OUTPUT=0.015
COST_PER_1K_INPUT=0.003
COST_PER_1K_CACHE_READ=0.0003
COST_PER_1K_CACHE_CREATE=0.00375

# 자동화 설정
AUTO_DAILY_REPORT=true      # 매일 자동 생성
AUTO_WEEKLY_REPORT=true     # 매주 월요일 생성
AUTO_MONTHLY_REPORT=true    # 매월 1일 생성

# 알림 설정
SLACK_WEBHOOK_URL=""        # Slack 통합
EMAIL_RECIPIENT=""          # 이메일 수신자
```

---

## 모범 사례

### 1. 정기적 리뷰

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
alias morning='git entirekit yesterday'
alias weekly='git entirekit week && git entirekit stats'
alias monthly='./monthly-report.sh'
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
        run: ./weekly-report.sh
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
