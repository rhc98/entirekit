[한국어](report-templates.ko.md)

# EntireKit Report Templates

A collection of markdown report templates for analyzing and sharing checkpoint data.
Daily, weekly, monthly, and custom range reports can be auto-generated with bash scripts.

## Overview

These templates are used for:

- **Daily Report**: Quick review of yesterday's work (for morning standups)
- **Weekly Report**: Weekly productivity analysis and trends (for weekly meetings)
- **Monthly Report**: Cost analysis, performance evaluation, team sharing (for management reporting)
- **Custom Report**: In-depth analysis of a specific period (for project reviews)

---

## 1. Daily Report

### Template Structure

```markdown
# Daily Checkpoint Report - {DATE}

## Summary

| Item | Value |
|------|-------|
| Sessions | {COUNT} |
| Total Token Usage | {TOKENS:,} |
| AI Contribution | {AI_PCT}% |
| Files Modified | {FILES} |
| Primary Branch | {BRANCH} |

## Statistics

### Token Usage
- **Input**: {INPUT:,} tokens
- **Output**: {OUTPUT:,} tokens
- **Cache Read**: {CACHE:,} tokens
- **API Calls**: {CALLS}

### AI Contribution
- **Average AI Contribution**: {AVG_PCT}%
- **Lines Contributed**: {AGENT_LINES:,}
- **Lines Human-Modified**: {HUMAN_MODIFIED:,}

## Hot Files (Most Frequently Modified)

| File | Modification Count |
|------|--------------------|
| {FILE1} | {COUNT1} |
| {FILE2} | {COUNT2} |
| {FILE3} | {COUNT3} |
| {FILE4} | {COUNT4} |
| {FILE5} | {COUNT5} |

## Session List

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

### Example (with real data)

```markdown
# Daily Checkpoint Report - 2026-02-13

## Summary

| Item | Value |
|------|-------|
| Sessions | 5 |
| Total Token Usage | 87,450 |
| AI Contribution | 76.3% |
| Files Modified | 18 |
| Primary Branch | feature/260213_1700 |

## Statistics

### Token Usage
- **Input**: 24,320 tokens
- **Output**: 52,100 tokens
- **Cache Read**: 11,030 tokens
- **API Calls**: 12

### AI Contribution
- **Average AI Contribution**: 76.3%
- **Lines Contributed**: 342
- **Lines Human-Modified**: 108

## Hot Files (Most Frequently Modified)

| File | Modification Count |
|------|--------------------|
| src/hooks/useAuth.ts | 4 |
| pages/login.tsx | 3 |
| components/Form.tsx | 3 |
| utils/api.ts | 2 |
| styles/theme.ts | 2 |

## Session List

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

### Bash Script

```bash
#!/bin/bash
# daily-report.sh - Generate daily report

set -euo pipefail

TARGET_DATE="${1:-$(date +%Y-%m-%d)}"
OUTPUT_FILE="checkpoint-report-daily-${TARGET_DATE}.md"

# Helper function
get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only "$hash" 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# Set date range
START_DATE="$TARGET_DATE"
END_DATE=$(date -d "$TARGET_DATE +1 day" +%Y-%m-%d)

# Collect data
HASHES=$(git log entire/checkpoints/v1 --since="$START_DATE" --until="$END_DATE" --format="%H")

if [ -z "$HASHES" ]; then
  echo "❌ No checkpoints found for this date."
  exit 1
fi

# Calculate statistics
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

    # Token statistics
    input=$(echo "$data" | jq -r '.token_usage.input_tokens // 0')
    output=$(echo "$data" | jq -r '.token_usage.output_tokens // 0')
    cache=$(echo "$data" | jq -r '.token_usage.cache_read_tokens // 0')
    calls=$(echo "$data" | jq -r '.token_usage.api_call_count // 0')

    TOTAL_INPUT=$((TOTAL_INPUT + input))
    TOTAL_OUTPUT=$((TOTAL_OUTPUT + output))
    TOTAL_CACHE=$((TOTAL_CACHE + cache))
    TOTAL_CALLS=$((TOTAL_CALLS + calls))

    # AI contribution statistics
    agent=$(echo "$data" | jq -r '.initial_attribution.agent_lines // 0')
    human=$(echo "$data" | jq -r '.initial_attribution.human_modified // 0')
    pct=$(echo "$data" | jq -r '.initial_attribution.agent_percentage // 0')

    if [ "$agent" != "0" ] || [ "$human" != "0" ]; then
      AGENT_LINES=$((AGENT_LINES + agent))
      HUMAN_MODIFIED=$((HUMAN_MODIFIED + human))
      AGENT_PCT_SUM=$(echo "$AGENT_PCT_SUM + $pct" | bc -l)
      AGENT_PCT_COUNT=$((AGENT_PCT_COUNT + 1))
    fi

    # File statistics
    while read -r file; do
      FILE_COUNTS["$file"]=$((${FILE_COUNTS["$file"]:-0} + 1))
    done < <(echo "$data" | jq -r '.files_touched[]? // empty')

    SESSION_COUNT=$((SESSION_COUNT + 1))
  fi
done <<< "$HASHES"

# Average AI contribution
AVG_AI_PCT=0
if [ "$AGENT_PCT_COUNT" -gt 0 ]; then
  AVG_AI_PCT=$(echo "scale=1; $AGENT_PCT_SUM / $AGENT_PCT_COUNT" | bc -l)
fi

# TOP 5 files
HOTFILES=$(
  for file in "${!FILE_COUNTS[@]}"; do
    echo "${FILE_COUNTS[$file]} $file"
  done | sort -rn | head -5 | awk '{print "| " $2 " | " $1 " |"}'
)

# Branch information
MAIN_BRANCH=$(git log entire/checkpoints/v1 --since="$START_DATE" --until="$END_DATE" --format="%H" | head -1 | xargs -I {} git show {}:$(get_metadata_path {}) 2>/dev/null | jq -r '.branch // "unknown"')

# Generate report
cat > "$OUTPUT_FILE" << EOF
# Daily Checkpoint Report - $TARGET_DATE

## Summary

| Item | Value |
|------|-------|
| Sessions | $SESSION_COUNT |
| Total Token Usage | $(printf "%'d" $((TOTAL_INPUT + TOTAL_OUTPUT))) |
| AI Contribution | $AVG_AI_PCT% |
| Files Modified | ${#FILE_COUNTS[@]} |
| Primary Branch | $MAIN_BRANCH |

## Statistics

### Token Usage
- **Input**: $(printf "%'d" $TOTAL_INPUT) tokens
- **Output**: $(printf "%'d" $TOTAL_OUTPUT) tokens
- **Cache Read**: $(printf "%'d" $TOTAL_CACHE) tokens
- **API Calls**: $TOTAL_CALLS

### AI Contribution
- **Average AI Contribution**: $AVG_AI_PCT%
- **Lines Contributed**: $(printf "%'d" $AGENT_LINES)
- **Lines Human-Modified**: $(printf "%'d" $HUMAN_MODIFIED)

## Hot Files (Most Frequently Modified)

| File | Modification Count |
|------|--------------------|
$HOTFILES

## Session List

EOF

# Add each session's info
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

echo "✅ Report generated: $OUTPUT_FILE"
```

---

## 2. Weekly Report

### Template Structure

```markdown
# Weekly Checkpoint Report - Week {WEEK}

## Overview

| Item | Value |
|------|-------|
| Total Sessions | {TOTAL} |
| Daily Average Sessions | {AVG} |
| Total Token Usage | {TOKENS:,} |
| Total API Calls | {CALLS} |
| Overall AI Contribution | {AVG_PCT}% |
| Files Modified | {FILES} |
| Active Days | {DAYS} |

## Productivity Trends

### Daily Session Distribution

| Day | Sessions | Token Usage | API Calls |
|-----|----------|-------------|-----------|
| Monday | {COUNT} | {TOKENS:,} | {CALLS} |
| Tuesday | {COUNT} | {TOKENS:,} | {CALLS} |
| Wednesday | {COUNT} | {TOKENS:,} | {CALLS} |
| Thursday | {COUNT} | {TOKENS:,} | {CALLS} |
| Friday | {COUNT} | {TOKENS:,} | {CALLS} |

## TOP Files

| File | Modification Count | Directory |
|------|--------------------|-----------|
| {FILE} | {COUNT} | {DIR} |
| {FILE} | {COUNT} | {DIR} |
| {FILE} | {COUNT} | {DIR} |

## Session Timeline

{SESSION_CARDS}
```

### Example (with real data)

```markdown
# Weekly Checkpoint Report - Week 07/2026

## Overview

| Item | Value |
|------|-------|
| Total Sessions | 35 |
| Daily Average Sessions | 5.0 |
| Total Token Usage | 612,480 |
| Total API Calls | 85 |
| Overall AI Contribution | 75.2% |
| Files Modified | 47 |
| Active Days | 7 |

## Productivity Trends

### Daily Session Distribution

| Day | Sessions | Token Usage | API Calls |
|-----|----------|-------------|-----------|
| Monday | 6 | 87,520 | 12 |
| Tuesday | 5 | 82,340 | 11 |
| Wednesday | 5 | 91,230 | 13 |
| Thursday | 6 | 93,450 | 14 |
| Friday | 7 | 105,620 | 15 |
| Saturday | 3 | 78,900 | 12 |
| Sunday | 2 | 73,420 | 8 |

## TOP Files

| File | Modification Count | Directory |
|------|--------------------|-----------|
| src/hooks/useAuth.ts | 12 | src/hooks |
| pages/login.tsx | 10 | pages |
| components/Form.tsx | 9 | components |
| utils/api.ts | 8 | utils |
| styles/theme.ts | 7 | styles |
| src/store/auth.ts | 6 | src/store |
| types/index.ts | 6 | types |
| middleware/auth.ts | 5 | middleware |

## Key Achievements

- ✅ Feature: Login functionality completed
- ✅ Fix: Cache efficiency improved (85% → 92%)
- ✅ Refactor: Authentication logic simplified
- ✅ Docs: API documentation written

## Improvements

- Cache Read tokens trending upward (positive sign - cost savings)
- AI contribution stably maintained above 75%
- Productivity peaks on Friday (wrapping up weekly work)
```

### Bash Script

```bash
#!/bin/bash
# weekly-report.sh - Generate weekly report

set -euo pipefail

WEEK="${1:-$(date +%V)}"
YEAR="${2:-$(date +%Y)}"
OUTPUT_FILE="checkpoint-report-weekly-${YEAR}-W${WEEK}.md"

get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only "$hash" 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# Calculate Monday and Sunday of the target week
MONDAY=$(date -d "$YEAR-W$WEEK-1" +%Y-%m-%d)
SUNDAY=$(date -d "$YEAR-W$WEEK-0" +%Y-%m-%d)

HASHES=$(git log entire/checkpoints/v1 --since="$MONDAY" --until="$(date -d "$SUNDAY +1 day" +%Y-%m-%d)" --format="%H")

# Calculate statistics
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

    # Daily statistics
    DAILY_SESSIONS["$dayofweek"]=$((${DAILY_SESSIONS["$dayofweek"]:-0} + 1))

    # Token statistics
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

    # AI contribution
    pct=$(echo "$data" | jq -r '.initial_attribution.agent_percentage // 0')
    if [ "$pct" != "0" ]; then
      AGENT_PCT_SUM=$(echo "$AGENT_PCT_SUM + $pct" | bc -l)
      AGENT_PCT_COUNT=$((AGENT_PCT_COUNT + 1))
    fi

    # File statistics
    while read -r file; do
      FILE_COUNTS["$file"]=$((${FILE_COUNTS["$file"]:-0} + 1))
    done < <(echo "$data" | jq -r '.files_touched[]? // empty')

    TOTAL_SESSIONS=$((TOTAL_SESSIONS + 1))
  fi
done <<< "$HASHES"

# Calculate active days
ACTIVE_DAYS=${#DAILY_SESSIONS[@]}

# Average AI contribution
AVG_AI_PCT=0
if [ "$AGENT_PCT_COUNT" -gt 0 ]; then
  AVG_AI_PCT=$(echo "scale=1; $AGENT_PCT_SUM / $AGENT_PCT_COUNT" | bc -l)
fi

# Daily average sessions
AVG_SESSIONS=$(echo "scale=1; $TOTAL_SESSIONS / $ACTIVE_DAYS" | bc -l)

# TOP 8 files
HOTFILES=$(
  for file in "${!FILE_COUNTS[@]}"; do
    echo "${FILE_COUNTS[$file]} $file"
  done | sort -rn | head -8 | awk '{print "| " $2 " | " $1 " | " (match($2, /\//) ? substr($2, 1, index($2, "/") - 1) : ".") " |"}'
)

# Day-of-week table rows
DAYNAMES=("Monday" "Tuesday" "Wednesday" "Thursday" "Friday" "Saturday" "Sunday")
DAYTABLE=""
for day in "${DAYNAMES[@]}"; do
  sessions=${DAILY_SESSIONS["$day"]:-0}
  tokens=${DAILY_TOKENS["$day"]:-0}
  calls=${DAILY_CALLS["$day"]:-0}
  DAYTABLE+="| $day | $sessions | $(printf "%'d" $tokens) | $calls |\n"
done

# Generate report
cat > "$OUTPUT_FILE" << EOF
# Weekly Checkpoint Report - Week $(printf "%02d" $WEEK)/$YEAR

## Overview

| Item | Value |
|------|-------|
| Total Sessions | $TOTAL_SESSIONS |
| Daily Average Sessions | $AVG_SESSIONS |
| Total Token Usage | $(printf "%'d" $((TOTAL_INPUT + TOTAL_OUTPUT))) |
| Total API Calls | $TOTAL_CALLS |
| Overall AI Contribution | $AVG_AI_PCT% |
| Files Modified | ${#FILE_COUNTS[@]} |
| Active Days | $ACTIVE_DAYS |

## Productivity Trends

### Daily Session Distribution

| Day | Sessions | Token Usage | API Calls |
|-----|----------|-------------|-----------|
EOF

echo -ne "$DAYTABLE" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << EOF

## TOP Files

| File | Modification Count | Directory |
|------|--------------------|-----------|
$HOTFILES

## Detailed Statistics

### Token Analysis
- **Input**: $(printf "%'d" $TOTAL_INPUT) tokens
- **Output**: $(printf "%'d" $TOTAL_OUTPUT) tokens
- **Cache Read**: $(printf "%'d" $TOTAL_CACHE) tokens
- **Total**: $(printf "%'d" $((TOTAL_INPUT + TOTAL_OUTPUT + TOTAL_CACHE))) tokens

### AI Contribution
- **Average**: $AVG_AI_PCT%
- **Sessions**: $AGENT_PCT_COUNT

---

**Generated**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

echo "✅ Report generated: $OUTPUT_FILE"
```

---

## 3. Monthly Report

### Template Structure

```markdown
# Monthly Checkpoint Report - {MONTH}

## Executive Summary

Summary of development activity for {MONTH}.

- **Total Sessions**: {COUNT}
- **Average AI Contribution**: {PCT}%
- **Total Token Usage**: {TOKENS:,}
- **Estimated Cost**: ${COST}

## Monthly Statistics

| Item | Value | Previous Month | Change |
|------|-------|----------------|--------|
| Sessions | {COUNT} | {PREV} | {CHANGE} |
| Average AI Contribution | {PCT}% | {PREV_PCT}% | {CHANGE} |
| Cache Efficiency | {CACHE}% | {PREV_CACHE}% | {CHANGE} |
| Files Modified | {FILES} | {PREV_FILES} | {CHANGE} |

## Cost Analysis

### Cost by Token Type

| Item | Usage | Unit Price | Cost |
|------|-------|------------|------|
| Input Tokens | {TOKENS:,} | $0.003/1K | ${COST} |
| Output Tokens | {TOKENS:,} | $0.015/1K | ${COST} |
| Cache Read | {TOKENS:,} | $0.0003/1K | ${COST} |
| Cache Creation | {TOKENS:,} | $0.00375/1K | ${COST} |
| **Total** | | | **${TOTAL}** |

## Hot File Analysis

{HOTFILE_CARDS}

## Weekly Breakdown

### Week 1 ({WEEK1_DATES})
- Sessions: {COUNT}
- Tokens: {TOKENS:,}
- AI Contribution: {PCT}%

### Week 2 ({WEEK2_DATES})
- Sessions: {COUNT}
- Tokens: {TOKENS:,}
- AI Contribution: {PCT}%

### Week 3 ({WEEK3_DATES})
- Sessions: {COUNT}
- Tokens: {TOKENS:,}
- AI Contribution: {PCT}%

### Week 4 ({WEEK4_DATES})
- Sessions: {COUNT}
- Tokens: {TOKENS:,}
- AI Contribution: {PCT}%

## Notable Sessions

{NOTABLE_SESSIONS}

## Branch Analysis

| Branch | Sessions | Tokens | AI % |
|--------|----------|--------|------|
| {BRANCH} | {COUNT} | {TOKENS:,} | {PCT}% |
| {BRANCH} | {COUNT} | {TOKENS:,} | {PCT}% |
| {BRANCH} | {COUNT} | {TOKENS:,} | {PCT}% |

## Recommendations

1. {RECOMMENDATION}
2. {RECOMMENDATION}
3. {RECOMMENDATION}
```

### Example (with real data)

```markdown
# Monthly Checkpoint Report - 2026-02

## Executive Summary

Summary of development activity for February.

- **Total Sessions**: 187
- **Average AI Contribution**: 76.2%
- **Total Token Usage**: 2,543,680
- **Estimated Cost**: $38.15

This month focused on improving the login feature and authentication system, with cache efficiency improved to 92%.

## Monthly Statistics

| Item | Value | Previous Month | Change |
|------|-------|----------------|--------|
| Sessions | 187 | 156 | ↑ 20% |
| Average AI Contribution | 76.2% | 74.8% | ↑ 1.4% |
| Cache Efficiency | 92% | 85% | ↑ 7% |
| Files Modified | 58 | 52 | ↑ 6 |

## Cost Analysis

### Cost by Token Type

| Item | Usage | Unit Price | Cost |
|------|-------|------------|------|
| Input Tokens | 487,230 | $0.003/1K | $1.46 |
| Output Tokens | 1,623,450 | $0.015/1K | $24.35 |
| Cache Read | 289,560 | $0.0003/1K | $0.09 |
| Cache Creation | 143,440 | $0.00375/1K | $0.54 |
| **Total** | 2,543,680 | | **$26.44** |

**Monthly estimated cost**: $26.44 (previous month: $32.18) → **18% reduction**

## Hot File Analysis

### 🔥 Top 10 Most Frequently Modified Files

| File | Modification Count | Directory | Last Modified |
|------|--------------------|-----------|---------------|
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

**Analysis**: Concentrated on authentication-related files (hooks, pages, store, middleware). Consider refactoring or consolidation.

## Weekly Breakdown

### Week 05 (2026-02-03 ~ 2026-02-09)
- Sessions: 45
- Tokens: 612,450
- AI Contribution: 75.8%
- Key work: Login form development, validation implementation

### Week 06 (2026-02-10 ~ 2026-02-16)
- Sessions: 52
- Tokens: 723,890
- AI Contribution: 77.1%
- Key work: Authentication logic refactoring, token management improvement

### Week 07 (2026-02-17 ~ 2026-02-23)
- Sessions: 48
- Tokens: 687,340
- AI Contribution: 76.5%
- Key work: Cache optimization, error handling improvement

### Week 08 (2026-02-24 ~ 2026-02-28)
- Sessions: 42
- Tokens: 519,000
- AI Contribution: 75.2%
- Key work: Test code writing, documentation

## Notable Sessions

### ⭐ Most Efficient Session
**Session ID**: a7f3b2e9c1
**Date**: 2026-02-11
**Work**: Cache efficiency improvement implementation
**Tokens**: 4,320 (very efficient)
**AI Contribution**: 89%
**Result**: Cache hit rate 85% → 92%

### 🎯 Session with Largest Impact
**Session ID**: c4e2f8d1a3
**Date**: 2026-02-07
**Work**: Full authentication system refactoring
**Tokens**: 45,680
**Files Modified**: 12
**AI Contribution**: 82%
**Result**: Code line count reduced 30%, performance improved 40%

## Branch Analysis

| Branch | Sessions | Tokens | AI % | Files |
|--------|----------|--------|------|-------|
| feature/auth-refactor | 78 | 987,640 | 78.5% | 23 |
| feature/cache-optimization | 56 | 743,210 | 75.2% | 18 |
| bugfix/token-expiry | 34 | 523,450 | 72.1% | 12 |
| feature/error-handling | 19 | 289,380 | 74.8% | 5 |

## Recommendations

1. **Auth Module Consolidation**: useAuth.ts and auth.ts have overlapping functionality. Plan a consolidation refactor for end of month.

2. **Increase Test Coverage**: Given the many authentication logic changes, test code ratio should be raised from the current 65% to above 85%.

3. **Establish Cache Strategy**: Current cache efficiency is high at 92%; recommend maintaining this while applying the same approach to other modules.

4. **Update Documentation**: Many changes occurred, so API documentation and architecture documentation should be updated.

---

**Generated**: 2026-03-01 09:30:00
**Data Range**: 2026-02-01 00:00:00 ~ 2026-02-28 23:59:59
```

### Bash Script

```bash
#!/bin/bash
# monthly-report.sh - Generate monthly report (improved from advanced-usage.md example)

set -euo pipefail

MONTH="${1:-$(date +%Y-%m)}"
OUTPUT_FILE="checkpoint-report-monthly-${MONTH}.md"

get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only "$hash" 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# Date range
YEAR=$(echo "$MONTH" | cut -d'-' -f1)
MONTH_NUM=$(echo "$MONTH" | cut -d'-' -f2)
START_DATE="$MONTH-01"
LAST_DAY=$(date -d "$YEAR-$MONTH_NUM-01 +1 month -1 day" +%d)
END_DATE="$MONTH-$LAST_DAY"

HASHES=$(git log entire/checkpoints/v1 --since="$START_DATE" --until="$(date -d "$END_DATE +1 day" +%Y-%m-%d)" --format="%H")

# Calculate statistics
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

    # Calculate week number
    date=$(echo "$data" | jq -r '.created_at // "unknown"' | cut -d'T' -f1)
    week=$(date -d "$date" +%V)

    # Token statistics
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

    # Weekly statistics
    WEEKLY_SESSIONS["$week"]=$((${WEEKLY_SESSIONS["$week"]:-0} + 1))
    WEEKLY_TOKENS["$week"]=$((${WEEKLY_TOKENS["$week"]:-0} + output))

    # AI contribution
    pct=$(echo "$data" | jq -r '.initial_attribution.agent_percentage // 0')
    if [ "$pct" != "0" ]; then
      AGENT_PCT_SUM=$(echo "$AGENT_PCT_SUM + $pct" | bc -l)
      AGENT_PCT_COUNT=$((AGENT_PCT_COUNT + 1))
    fi

    # File statistics
    while read -r file; do
      FILE_COUNTS["$file"]=$((${FILE_COUNTS["$file"]:-0} + 1))
    done < <(echo "$data" | jq -r '.files_touched[]? // empty')

    # Branch statistics
    branch=$(echo "$data" | jq -r '.branch // "unknown"')
    BRANCH_STATS["$branch"]=$((${BRANCH_STATS["$branch"]:-0} + 1))

    TOTAL_SESSIONS=$((TOTAL_SESSIONS + 1))
  fi
done <<< "$HASHES"

# Calculations
AVG_AI_PCT=0
if [ "$AGENT_PCT_COUNT" -gt 0 ]; then
  AVG_AI_PCT=$(echo "scale=1; $AGENT_PCT_SUM / $AGENT_PCT_COUNT" | bc -l)
fi

# Cost calculation (based on Claude 3.5 Sonnet pricing)
COST_INPUT=$(echo "scale=2; $TOTAL_INPUT / 1000 * 0.003" | bc -l)
COST_OUTPUT=$(echo "scale=2; $TOTAL_OUTPUT / 1000 * 0.015" | bc -l)
COST_CACHE_READ=$(echo "scale=2; $TOTAL_CACHE_READ / 1000 * 0.0003" | bc -l)
COST_CACHE_CREATE=$(echo "scale=2; $TOTAL_CACHE_CREATE / 1000 * 0.00375" | bc -l)
TOTAL_COST=$(echo "$COST_INPUT + $COST_OUTPUT + $COST_CACHE_READ + $COST_CACHE_CREATE" | bc -l)

# TOP 10 files
HOTFILES=$(
  for file in "${!FILE_COUNTS[@]}"; do
    echo "${FILE_COUNTS[$file]} $file"
  done | sort -rn | head -10 | awk '{print "| " $2 " | " $1 " | " (match($2, /\//) ? substr($2, 1, index($2, "/") - 1) : ".") " | - |"}'
)

# Branch information
BRANCHES=$(
  for branch in "${!BRANCH_STATS[@]}"; do
    echo "${BRANCH_STATS[$branch]} $branch"
  done | sort -rn | head -5 | awk '{print "| " $2 " | " $1 " | 0 | 0% |"}'
)

# Generate report
cat > "$OUTPUT_FILE" << EOF
# Monthly Checkpoint Report - $MONTH

## Executive Summary

Summary of development activity for $MONTH.

- **Total Sessions**: ${TOTAL_SESSIONS}
- **Average AI Contribution**: ${AVG_AI_PCT}%
- **Total Token Usage**: $(printf "%'d" $((TOTAL_INPUT + TOTAL_OUTPUT + TOTAL_CACHE_READ + TOTAL_CACHE_CREATE)))
- **Estimated Cost**: \$$TOTAL_COST

## Monthly Statistics

| Item | Value |
|------|-------|
| Sessions | $TOTAL_SESSIONS |
| Average AI Contribution | ${AVG_AI_PCT}% |
| Cache Efficiency | $(echo "scale=1; $TOTAL_CACHE_READ / ($TOTAL_INPUT + $TOTAL_CACHE_READ) * 100" | bc -l)% |
| Files Modified | ${#FILE_COUNTS[@]} |

## Cost Analysis

| Item | Usage | Unit Price | Cost |
|------|-------|------------|------|
| Input Tokens | $(printf "%'d" $TOTAL_INPUT) | \$0.003/1K | \$$COST_INPUT |
| Output Tokens | $(printf "%'d" $TOTAL_OUTPUT) | \$0.015/1K | \$$COST_OUTPUT |
| Cache Read | $(printf "%'d" $TOTAL_CACHE_READ) | \$0.0003/1K | \$$COST_CACHE_READ |
| Cache Creation | $(printf "%'d" $TOTAL_CACHE_CREATE) | \$0.00375/1K | \$$COST_CACHE_CREATE |
| **Total** | $(printf "%'d" $((TOTAL_INPUT + TOTAL_OUTPUT + TOTAL_CACHE_READ + TOTAL_CACHE_CREATE))) | | **\$$TOTAL_COST** |

## Hot File Analysis

| File | Modification Count | Directory | Last Modified |
|------|--------------------|-----------|---------------|
$HOTFILES

## Branch Analysis

| Branch | Sessions | Tokens | AI % |
|--------|----------|--------|------|
$BRANCHES

## Weekly Breakdown

EOF

# Add weekly data
for week in $(echo "${!WEEKLY_SESSIONS[@]}" | tr ' ' '\n' | sort -n); do
  week_start=$(date -d "$YEAR-W$week-1" +%Y-%m-%d)
  week_end=$(date -d "$YEAR-W$week-0" +%Y-%m-%d)
  sessions=${WEEKLY_SESSIONS[$week]:-0}
  tokens=${WEEKLY_TOKENS[$week]:-0}

  cat >> "$OUTPUT_FILE" << EOF

### Week $(printf "%02d" $week) ($week_start ~ $week_end)
- Sessions: $sessions
- Tokens: $(printf "%'d" $tokens)

EOF
done

cat >> "$OUTPUT_FILE" << EOF

---

**Generated**: $(date '+%Y-%m-%d %H:%M:%S')
**Data Range**: ${START_DATE} ~ ${END_DATE}

EOF

echo "✅ Report generated: $OUTPUT_FILE"
```

---

## 4. Custom Range Report

In-depth analysis report for a specific time period.

```bash
#!/bin/bash
# custom-range-report.sh - Generate date range report

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

# Calculate statistics (same approach as the monthly report above)
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

    # Token and contribution statistics...
    TOTAL_SESSIONS=$((TOTAL_SESSIONS + 1))
  fi
done <<< "$HASHES"

cat > "$OUTPUT_FILE" << EOF
# Custom Range Report

**Period**: $START_DATE ~ $END_DATE
**Total Sessions**: $TOTAL_SESSIONS

## Summary
...

EOF

echo "✅ Custom report generated: $OUTPUT_FILE"
```

---

## 5. HTML Dashboard Template (Concept)

Structure of the interactive HTML dashboard generated by `entirekit report`.

### Section Structure

```
┌─────────────────────────────────────────┐
│ Header: EntireKit Report        │
│ Subtitle: Generated 2026-02-13...       │
├─────────────────────────────────────────┤
│ Navigation Tabs (Dashboard, Tokens, ...) │
├─────────────────────────────────────────┤
│ 1. KPI Cards (6 key metrics)            │
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
│    - Session Cards (last 50)            │
├─────────────────────────────────────────┤
│ 7. Branch Analysis Section              │
│    - Branch Summary Table               │
│    - Distribution Chart (Stacked Bar)   │
└─────────────────────────────────────────┘
```

### Available Libraries

- **Chart.js 4.4.7**: All chart rendering
- **GitHub-style colors**: Dark theme, professional appearance
- **Responsive design**: Mobile, tablet, desktop support

### Generation Commands

```bash
# Default (includes all checkpoints)
git entirekit report

# Last 20 only
git entirekit report --limit 20

# Filter by specific branch
git entirekit report --branch feature/auth

# Date range
git entirekit report --since 2026-02-01 --until 2026-02-13

# Custom output
git entirekit report --output ~/reports/feb-report.html --no-open
```

---

## 6. Usage Examples

### Example 1: Generate and save a daily report

```bash
# Generate yesterday's report
./daily-report.sh $(date -d "yesterday" +%Y-%m-%d)

# Specific date
./daily-report.sh 2026-02-13

# Save to file
./daily-report.sh 2026-02-13 > report.md

# Share with team
cat checkpoint-report-daily-2026-02-13.md | mail -s "Daily Report" team@company.com
```

### Example 2: Generate weekly report

```bash
# Current week report
./weekly-report.sh

# Specific week
./weekly-report.sh 07 2026

# Send to Slack bot
curl -X POST https://hooks.slack.com/services/... \
  -H 'Content-Type: application/json' \
  -d "{
    \"text\": \"Weekly Report - Week 07\",
    \"attachments\": [{
      \"text\": \"$(cat checkpoint-report-weekly-2026-W07.md)\"
    }]
  }"
```

### Example 3: Generate monthly report and automate

```bash
# Current month
./monthly-report.sh

# Specific month
./monthly-report.sh 2026-02

# Add to crontab (9am on 1st of every month)
0 9 1 * * /path/to/monthly-report.sh $(date +\%Y-\%m --date="yesterday") && \
  mailx -s "Monthly Report" manager@company.com < checkpoint-report-monthly-*.md
```

### Example 4: Custom range report

```bash
# Specific period
./custom-range-report.sh 2026-02-01 2026-02-13

# Post-project analysis
./custom-range-report.sh 2026-01-15 2026-02-13 project-final-report.md

# Share with colleague
open checkpoint-report-2026-02-01_to_2026-02-13.md
```

### Example 5: Generate HTML dashboard

```bash
# Generate interactive report (opens in browser automatically)
git entirekit report

# Generate monthly report
git entirekit report --since 2026-02-01 --until 2026-03-01 \
  --output ~/Desktop/feb-2026-report.html

# Auto-generate and save in CI/CD
git entirekit report --no-open --output ./reports/checkpoint-$(date +%Y-%m-%d).html
```

---

## 7. Configuration File Example

`.entire/config.sh` in the project root:

```bash
# Report settings
REPORT_OUTPUT_DIR="./reports"
REPORT_AUTO_OPEN=true
REPORT_THEME="dark"  # light, dark, auto

# Cost settings (based on Claude 3.5 Sonnet pricing)
COST_PER_1K_OUTPUT=0.015
COST_PER_1K_INPUT=0.003
COST_PER_1K_CACHE_READ=0.0003
COST_PER_1K_CACHE_CREATE=0.00375

# Automation settings
AUTO_DAILY_REPORT=true      # Generate daily
AUTO_WEEKLY_REPORT=true     # Generate every Monday
AUTO_MONTHLY_REPORT=true    # Generate on the 1st of each month

# Notification settings
SLACK_WEBHOOK_URL=""        # Slack integration
EMAIL_RECIPIENT=""          # Email recipient
```

---

## Best Practices

### 1. Regular Reviews

```bash
# Add to ~/.bashrc or ~/.zshrc
alias morning='git entirekit yesterday'
alias weekly='git entirekit week && git entirekit stats'
alias monthly='./monthly-report.sh'
```

### 2. CI/CD Integration

GitHub Actions:

```yaml
name: Generate Reports
on:
  schedule:
    - cron: '0 9 * * MON'  # Every Monday at 9am

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

### 3. Team Sharing Template

```markdown
## Weekly Standup - Week {N}

**Development Activity Summary**

{% include_relative checkpoint-report-weekly-*.md %}

**This week's goals**: ...
**Next week's goals**: ...
**Notes**: ...
```

### 4. Monthly Executive Report

Include only the top 3 metrics:

```markdown
# Monthly Executive Summary

- 📊 **Development Productivity**: 187 sessions (20% increase from previous month)
- 💰 **AI Cost**: $26.44 (70% of budget)
- 🎯 **Completed Features**: 5 (login, cache, error handling, etc.)

[Download detailed report](checkpoint-report-monthly-2026-02.md)
```

---

## Troubleshooting

### Q: "No checkpoint data found" error
```bash
# Check checkpoint branch
git log entire/checkpoints/v1 --oneline | head

# Create a checkpoint (from Claude Code)
# Or try again after creating one
```

### Q: Missing data
```bash
# Check metadata path
git ls-tree -r entire/checkpoints/v1 | grep metadata.json | head -5

# Manually inspect a specific checkpoint
HASH="abc1234"
git show $HASH:$(git ls-tree -r --name-only $HASH | grep metadata.json | tail -1) | jq .
```

### Q: Performance optimization
```bash
# Analyze only the last N entries
git log entire/checkpoints/v1 --format="%H" -50 | ...

# Use cache (for repeated runs)
git log entire/checkpoints/v1 ... > /tmp/hashes.txt
cat /tmp/hashes.txt | while read hash; do ...
```

---

## References

- [Entire GitHub](https://github.com/entireio/cli)
- [Claude Code Documentation](https://claude.com/claude-code)
- [jq Manual](https://stedolan.github.io/jq/)
- [Chart.js Documentation](https://www.chartjs.org/)
