[한국어](report-templates.ko.md)

# EntireKit Report Templates

A collection of markdown report templates for analyzing and sharing checkpoint data.
Daily, weekly, monthly, and custom range reports can be auto-generated with TypeScript runners or direct CLI commands.

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

### TypeScript/CLI Runner

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

### TypeScript/CLI Runner

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

### TypeScript/CLI Runner

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

## 4. Custom Range Report

In-depth analysis report for a specific time period.

### TypeScript/CLI Runner

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
npx entirekit report \
  --since 2026-02-13 \
  --until 2026-02-14 \
  --output ./reports/daily-2026-02-13.html \
  --no-open
```

### Example 2: Generate weekly report

```bash
npx entirekit report \
  --since 2026-02-10 \
  --until 2026-02-17 \
  --output ./reports/weekly-2026-W07.html \
  --no-open
```

### Example 3: Generate monthly report and automate

```bash
npx entirekit report \
  --since 2026-02-01 \
  --until 2026-02-28 \
  --output ./reports/monthly-2026-02.html \
  --export-json ./reports/monthly-2026-02.json \
  --no-open

# Crontab (monthly, 9:00)
0 9 1 * * cd /path/to/repo && npx entirekit report --since $(date +\%Y-\%m-01) --output ./reports/monthly-latest.html --no-open
```

### Example 4: Custom range report

```bash
npx entirekit report \
  --since 2026-01-15 \
  --until 2026-02-13 \
  --output ./reports/project-final-report.html \
  --export-json ./reports/project-final-report.json \
  --no-open
```

### Example 5: Generate HTML dashboard

```bash
npx entirekit report
npx entirekit report --limit 20 --no-open --output ./reports/latest-20.html
npx entirekit report --branch feature/auth --since 2026-02-01 --until 2026-02-13 --no-open
```

## 7. Configuration File Example

`.entire/report-config.json` in the project root:

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

## Best Practices

### 1. Regular Reviews

```bash
# Add to ~/.bashrc or ~/.zshrc
alias morning='git entirekit yesterday'
alias weekly='git entirekit week && git entirekit stats'
alias monthly='npx entirekit report --since 2026-02-01 --until 2026-02-28 --no-open'
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
        run: npx entirekit report --since 2026-02-10 --until 2026-02-17 --no-open --output ./reports/weekly.html
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
