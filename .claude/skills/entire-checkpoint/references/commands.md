[한국어](commands.ko.md)

# EntireKit - Git Alias Command Reference

This document is a comprehensive reference for all git alias commands provided by the EntireKit system.

## Overview

After installation, the following 8 git alias commands are available:

| Command | Purpose | Returns |
|---------|---------|---------|
| `git entirekit stats` | Statistical analysis of the last 10 checkpoints | Token, AI contribution, file statistics |
| `git entirekit search` | Keyword search across checkpoints | Related prompts, file modification history |
| `git entirekit recent` | List of the last 10 checkpoints | Commit hash, commit message |
| `git entirekit today` | List of checkpoints created today | Commit hash, commit message |
| `git entirekit yesterday` | List of checkpoints created yesterday | Commit hash, commit message |
| `git entirekit week` | List of checkpoints from the last week | Commit hash, commit message |
| `git entirekit diff` | Detailed comparison between two checkpoints | Token usage, files, AI contribution |
| `git entirekit report` | Generate HTML report (planned) | HTML file path |

## Installation

All aliases are configured per-project via `git config --local`.

```bash
# Install from the project root
npx entirekit install
```

All commands are immediately available after installation.

---

## Detailed Command Guide

### 1. git entirekit stats

**Purpose**: Comprehensively analyzes statistics from recent checkpoints.

**Syntax**
```bash
git entirekit stats
```

**Implementation**
- Command: `git entirekit stats`
- Behavior: Analyzes the last 10 commits on the `entire/checkpoints/v1` branch

**Output Format**

```
📊 Checkpoint Branch Analysis Tool
================================

💰 Token Usage Statistics (last 10 checkpoints):
  Input tokens: 1,380
  Output tokens: 3,220
  Cache read tokens: 27,659,090
  Total API calls: 470
  Sessions analyzed: 10

🤖 AI Contribution Analysis (last 10 checkpoints):
  Total agent lines: 450
  Total human modified: 160
  Average AI contribution: 73.7%
  Sessions with changes: 8

📝 Top 10 Most-Touched Files:
      8 src/app/components/Button.tsx
      6 src/app/layout.tsx
      5 src/styles/globals.css
      ...

📋 Last 5 Session Summaries:
--- Session 1 (a3f2b1c) ---
[First 5 lines of prompt displayed]
Date: 2026-02-13
Branch: feature/260213_1700
...
```

**Real Example**

```bash
$ git entirekit stats
```

Information available in the output:
- **Token usage**: API cost estimation
- **API call count**: Average number of AI interactions per session
- **AI contribution**: Ratio of human-modified code vs. AI-written code
- **File change status**: Which files are modified frequently

**Common Use Cases**

1. **Weekly retrospective preparation**
   ```bash
   git entirekit stats  # Check productivity metrics for the week
   ```

2. **Team review preparation**
   ```bash
   # Share AI contribution with the team
   git entirekit stats | grep "Average AI contribution"
   ```

3. **Cost estimation**
   ```bash
   git entirekit stats | head -6  # Check token usage only
   ```

**Tips and Notes**

- Only analyzes the last 10 checkpoints (for performance reasons)
- Requires the `jq` command (checked by the setup script)
- Sessions without a metadata.json file are excluded
- Token counts are displayed with comma separators (e.g., `1,380`)

---

### 2. git entirekit search

**Purpose**: Searches checkpoints by keyword to find past work history.

**Syntax**
```bash
git entirekit search "<search term>"
```

**Implementation**
- Command: `git entirekit search`
- Behavior: Searches in three places: prompt.txt, context.md, and files_touched

**Parameters**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `search term` | Text to find (case-insensitive) | `"login"`, `"bug fix"` |

**Output Format**

```
🔍 Searching for '<search term>'...
================================

📝 Related Prompts:

[2026-02-13] Checkpoint: ac03096
---
First 5 lines of the user's input prompt...

[2026-02-12] Checkpoint: f7e2c45
---
Prompt content from another checkpoint...

📂 Related File Modification History:

[2026-02-13] Checkpoint: ac03096
Files touched:
  - src/app/auth/login/page.tsx
  - src/components/LoginForm.tsx
```

**Real Examples**

```bash
# Search for login-related work
$ git entirekit search "login"

🔍 Searching for 'login'...
================================

📝 Related Prompts:

[2026-02-13] Checkpoint: ac03096
---
@src/app/[locale]/(auth)/login/page.tsx regarding login action...
1. Analyze swagger from NEXT_PUBLIC_API_URL...

📂 Related File Modification History:

[2026-02-13] Checkpoint: ac03096
Files touched:
  - src/app/auth/login/page.tsx
  - src/types/auth.ts
```

```bash
# Search for OG image optimization
$ git entirekit search "og"

# Search by specific bug symptom
$ git entirekit search "loading not working"

# Search by file name
$ git entirekit search "Button.tsx"
```

**Search Scope**

1. **Prompt (prompt.txt)**
   - The task content the user requested
   - Parts of the AI conversation

2. **Context (context.md)**
   - Project state at the time of the work session
   - Dependency information
   - Structural descriptions

3. **Modified Files (files_touched)**
   - List of files changed during the session
   - Exact file paths

**Common Use Cases**

1. **Finding similar bugs**
   ```bash
   git entirekit search "error message"
   # Check how a similar error was handled in the past
   ```

2. **Checking feature development history**
   ```bash
   git entirekit search "payment"
   # Find when payment functionality was developed and which files were modified
   ```

3. **Change history for a specific file**
   ```bash
   git entirekit search "api.ts"
   # Find when and in what context this file was modified
   ```

4. **Explaining work to a teammate**
   ```bash
   git entirekit search "authentication"
   # Search all related work history to share with teammates
   ```

**Tips and Notes**

- Search is **case-insensitive** (uses `-i` flag)
- Only searches the last 20 checkpoints (for performance reasons)
- Regular expressions are not supported; only plain string search
- Empty search terms return an error
- Non-ASCII characters are supported

---

### 3. git entirekit recent

**Purpose**: Displays the last 10 checkpoints in a simple list format.

**Syntax**
```bash
git entirekit recent
```

**Implementation**
- Direct git command: `log entire/checkpoints/v1 --oneline -10`
- No additional parsing (pure git output)

**Output Format**

```
abc1234 feat(og): optimize asset OG image generation
def5678 fix(og): add explicit image dimensions to OpenGraph metadata
ghi9012 Merge branch 'feature/page_transition' into 'master'
jkl3456 feat: improve UX with page transitions and restructured asset routes
mno7890 Merge branch 'feature/260213' into 'master'
pqr1234 perf: cleanup unused dependencies
stu5678 refactor: extract common layout logic
vwx9012 fix: resolve CSS module conflicts
yza3456 docs: update README with new API endpoints
bcd7890 feat: add error boundary component
```

**Real Examples**

```bash
# Quickly check recent work
$ git entirekit recent

# Copy a specific commit hash from results to use in another command
$ git entirekit recent | head -1 | cut -d' ' -f1
abc1234
```

**Common Use Cases**

1. **Quick review of recent work**
   ```bash
   git entirekit recent  # See recent work at a glance
   ```

2. **Check details of a specific checkpoint**
   ```bash
   git entirekit recent          # View list
   git show abc1234:.entire/...  # View details of the desired checkpoint
   ```

3. **Find hashes for git entirekit diff**
   ```bash
   git entirekit recent          # Find the two hashes to compare
   git entirekit diff abc1234 def5678  # Compare two checkpoints
   ```

**Tips and Notes**

- Fastest command (no additional parsing)
- Displays exactly 10 entries
- `--oneline` format: `<hash> <message>`
- Only the first line of the commit message is shown
- Error if `entire/checkpoints/v1` branch does not exist

---

### 4. git entirekit today

**Purpose**: Displays all checkpoints created today.

**Syntax**
```bash
git entirekit today
```

**Implementation**
- Direct git command: `log entire/checkpoints/v1 --since=today --oneline`
- Filter: From midnight (00:00) to the current time

**Output Format**

```
abc1234 feat(og): optimize asset OG image generation
def5678 fix(og): add explicit image dimensions to OpenGraph metadata
ghi9012 docs: update API documentation
```

Or if no work was done:
```
(no results)
```

**Real Examples**

```bash
# Check what was done today
$ git entirekit today

abc1234 feat(og): optimize asset OG image generation
def5678 fix(og): add explicit image dimensions to OpenGraph metadata

# Count today's sessions
$ git entirekit today | wc -l
2
```

**Common Use Cases**

1. **Review today's work at end of day**
   ```bash
   git entirekit today  # "This is what I got done today"
   ```

2. **Prepare for standup meeting**
   ```bash
   git entirekit today  # Check current work status to share with the team
   ```

3. **Write daily report**
   ```bash
   echo "Today's work:" >> report.txt
   git entirekit today >> report.txt
   ```

**Timezone Handling**

- `--since=today` starts from midnight in the system timezone
- Example: 2026-02-13 00:00 ~ 23:59:59 in local time

**Tips and Notes**

- Follows the system timezone
- Filters based on commit author date
- Outputs nothing if there is no work today
- Not affected by `user.name` or `user.email` git config settings

---

### 5. git entirekit yesterday

**Purpose**: Displays all checkpoints created yesterday.

**Syntax**
```bash
git entirekit yesterday
```

**Implementation**
- Direct git command: `log entire/checkpoints/v1 --since=yesterday --until=today --oneline`
- Filter: From yesterday's midnight to today's midnight

**Output Format**

```
jkl3456 feat: improve UX with page transitions
mno7890 Merge branch 'feature/260213' into 'master'
pqr1234 perf: cleanup unused dependencies
stu5678 refactor: extract common layout logic
```

Or if no work was done:
```
(no results)
```

**Real Examples**

```bash
# Check what was done yesterday in the morning
$ git entirekit yesterday

jkl3456 feat: improve UX with page transitions
mno7890 Merge branch 'feature/260213' into 'master'
pqr1234 perf: cleanup unused dependencies

# Sort yesterday's work nicely
$ git entirekit yesterday | sort
```

**Common Use Cases**

1. **Morning reminder before starting work**
   ```bash
   git entirekit yesterday  # Check yesterday's work and plan today's tasks
   ```

2. **Prepare for weekly meeting**
   ```bash
   for day in {0..4}; do
     echo "=== Day $((day+1)) ==="
     git log --since="$day days ago" --until="$((day-1)) days ago" ...
   done
   ```

3. **Daily standup with the team**
   ```bash
   echo "Yesterday's work:"
   git entirekit yesterday | sed 's/^/  - /'
   ```

**Timezone Handling**

- `--since=yesterday --until=today` means exactly 24 hours
- Example: 2026-02-13 00:00 ~ 2026-02-14 00:00

**Tips and Notes**

- If the current time is 3 AM, "yesterday" refers to the previous day
- Results may vary depending on the system timezone
- Outputs nothing if there was no work in the last 24 hours

---

### 6. git entirekit week

**Purpose**: Displays all checkpoints created in the last week (7 days).

**Syntax**
```bash
git entirekit week
```

**Implementation**
- Direct git command: `log entire/checkpoints/v1 --since='1 week ago' --oneline`
- Filter: From 7 days ago to now

**Output Format**

```
abc1234 feat(og): optimize asset OG image generation
def5678 fix(og): add explicit image dimensions to OpenGraph metadata
ghi9012 docs: update API documentation
jkl3456 feat: improve UX with page transitions
mno7890 Merge branch 'feature/260213' into 'master'
pqr1234 perf: cleanup unused dependencies
stu5678 refactor: extract common layout logic
```

**Real Examples**

```bash
# Prepare for weekly retrospective
$ git entirekit week

# Count this week's sessions
$ git entirekit week | wc -l
7

# Format this week's work as markdown
$ echo "## This Week's Work" && git entirekit week | sed 's/^/- /'
```

**Common Use Cases**

1. **Friday weekly retrospective**
   ```bash
   git entirekit week  # Review all work done this week
   ```

2. **Write weekly report**
   ```bash
   git entirekit week | sed 's/^/  /' > weekly-report.txt
   ```

3. **Team weekly meeting**
   ```bash
   echo "Team's work this week:"
   git entirekit week | head -20  # Show only the latest 20 if there are too many
   ```

4. **Productivity analysis**
   ```bash
   git entirekit week | wc -l  # Number of checkpoints this week
   git entirekit stats         # Together with token usage
   ```

**Timezone Handling**

- `--since='1 week ago'` starts exactly 604,800 seconds (7 days) ago
- Example: If current time is 2026-02-13 15:30, then from 2026-02-06 15:30

**Tips and Notes**

- The most flexible time filter command
- Shows all checkpoints if there are multiple in a week
- Ordered from newest to oldest (most recent on top)
- Use with `git entirekit stats` for a full report

---

### 7. git entirekit diff

**Purpose**: Shows a detailed comparison between two checkpoints.

**Syntax**
```bash
git entirekit diff <checkpoint1_hash> <checkpoint2_hash>
```

**Implementation**
- Command: `git entirekit diff`
- Behavior: Extracts information from metadata.json for each checkpoint

**Parameters**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `checkpoint1_hash` | First comparison target (short hash OK) | `abc1234` or `abc12345678...` |
| `checkpoint2_hash` | Second comparison target (short hash OK) | `def5678` or `def56789012...` |

**Output Format**

```
📊 Checkpoint Comparison: abc1234 vs def5678
================================

🔢 Token Usage Comparison:
Checkpoint 1:
{
  "input_tokens": 1380,
  "output_tokens": 3220,
  "cache_read_tokens": 27659090,
  "api_call_count": 470
}

Checkpoint 2:
{
  "input_tokens": 2100,
  "output_tokens": 4150,
  "cache_read_tokens": 31245100,
  "api_call_count": 580
}

📝 Modified Files Comparison:
Checkpoint 1:
  - src/app/[locale]/(auth)/login/page.tsx
  - src/components/LoginForm.tsx

Checkpoint 2:
  - src/app/api/auth/route.ts
  - src/utils/auth.ts

🤖 AI Contribution Comparison:
Checkpoint 1:
{
  "agent_lines": 450,
  "human_modified": 160,
  "agent_percentage": 73.7
}

Checkpoint 2:
{
  "agent_lines": 680,
  "human_modified": 200,
  "agent_percentage": 77.3
}
```

**Real Examples**

```bash
# First find the hashes to compare
$ git entirekit recent
abc1234 feat(og): optimize...
def5678 fix(og): add explicit...

# Compare two checkpoints
$ git entirekit diff abc1234 def5678

📊 Checkpoint Comparison: abc1234 vs def5678
================================
[Detailed comparison output]

# Short hashes also work
$ git entirekit diff abc def

# Compare with older work
$ git entirekit week | tail -1 | cut -d' ' -f1  # Extract hash from 7 days ago
pqr1234
$ git entirekit diff pqr1234 abc1234  # Check one week's progress
```

**Comparison Items**

1. **Token usage**
   - Input tokens: Number of tokens in the user's input text
   - Output tokens: Number of tokens in the AI's output text
   - Cache read tokens: Number of tokens read from prompt cache
   - API call count: Total number of API calls

2. **Modified files**
   - List of all files changed in that checkpoint
   - Includes exact file paths

3. **AI contribution**
   - agent_lines: Number of code lines written by AI
   - human_modified: Number of lines modified by humans
   - agent_percentage: AI contribution as a percentage

**Common Use Cases**

1. **Compare code quality between two versions**
   ```bash
   git entirekit diff abc1234 def5678
   # Compare AI contribution and token usage to analyze efficiency
   ```

2. **Track progress**
   ```bash
   git entirekit diff $(git entirekit week | tail -1 | cut -d' ' -f1) $(git entirekit recent | head -1 | cut -d' ' -f1)
   # Check one week's progress
   ```

3. **Before and after refactoring comparison**
   ```bash
   # Checkpoint hash before refactoring: a1b2c3d
   # Checkpoint hash after refactoring: x9y8z7w
   git entirekit diff a1b2c3d x9y8z7w
   # Visualize how much code was modified
   ```

4. **Bug fix verification**
   ```bash
   # Hash when bug was found: bug001
   # Hash after bug was fixed: fix001
   git entirekit diff bug001 fix001
   # Check which files were modified and how much was changed
   ```

**Tips and Notes**

- Short hashes (7 or more characters) are automatically recognized
- Order does not matter (abc vs def = def vs abc)
- Checkpoints without metadata.json cannot be compared
- Output is in JSON format so it can be parsed with `jq`:
  ```bash
  git entirekit diff abc def | grep -A5 "token_usage" | jq '.'
  ```

---

### 8. git entirekit report

**Purpose**: Generates an HTML report visualizing all checkpoint data.

**Syntax**
```bash
git entirekit report [--limit <count>] [--output <path>]
```

**Implementation**
- Command: `git entirekit report`
- Feature: HTML dashboard generation

**Parameters**

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `--limit` | Number of checkpoints to include (newest first) | All | `--limit 50` |
| `--output` | File path to save to | Auto-generated | `--output ~/report.html` |

**Expected Output Format** (when implemented)

```
✅ Report generation complete!
📁 Saved to: /Users/ryuhc/report_20260213.html
🌐 Opening in browser...

Report contents:
- 📊 Token usage chart (time series)
- 🤖 AI contribution distribution
- 📝 File change heatmap
- 📈 Productivity metrics
- 🎯 Session-by-session details
```

**Expected Usage Examples**

```bash
# Default: include all checkpoints in newest-first order
git entirekit report

# Include only the last 20
git entirekit report --limit 20

# Save to a specific path
git entirekit report --output ~/Desktop/monthly-report.html

# Monthly report
git entirekit report --limit 100 --output ~/monthly.html

# Format shareable with the team
git entirekit report --output ~/public_reports/$(date +%Y%m%d).html
```

**Expected Report Contents**

1. **Summary information**
   - Total number of checkpoints
   - Time period (oldest to newest)
   - Total token usage
   - Average AI contribution

2. **Charts and graphs**
   - Daily checkpoint count
   - Token usage trends
   - AI contribution distribution
   - Most frequently modified files

3. **Detailed tables**
   - Metadata for each checkpoint
   - File change history
   - API call statistics

4. **Statistical analysis**
   - Productivity by day of the week
   - Number of changes per file
   - Session-by-session efficiency

**Expected Common Use Cases**

1. **Monthly performance report**
   ```bash
   git entirekit report --limit 200 --output ~/monthly_$(date +%Y%m).html
   # Visualize all work over a month and share with the manager
   ```

2. **Team dashboard**
   ```bash
   git entirekit report --output ~/team-dashboard.html
   # Save to a shared team directory so anyone can access it
   ```

3. **Weekly newsletter**
   ```bash
   git entirekit report --limit 50 --output ~/weekly-$(date +%Y-week%V).html
   # Run every Friday to generate a weekly report
   ```

4. **Client presentation**
   ```bash
   git entirekit report --output ~/client_demo.html
   # Present progress with a visually polished report
   ```

**Tips and Notes**

- `git entirekit report` is implemented in the TypeScript CLI
- Use `--export-json` and `--export-csv` to generate additional machine-readable artifacts
- Use `--no-open` in headless CI environments

---

## Command Combination Scenarios

### Scenario 1: Starting the Morning

```bash
# 1. Check what was done yesterday
git entirekit yesterday

# 2. Check the most recent item from yesterday's work
git entirekit recent | head -1

# 3. If needed, look up the context from that time in detail
# (use the checkpoint hash for additional lookup)
```

### Scenario 2: Finding a Bug Fix

```bash
# 1. Search for similar bugs or features
git entirekit search "loading error"

# 2. Find related checkpoint
# → Check the corresponding hash

# 3. Review details from that time
# (use entirekit diff to compare with another version if needed)
```

### Scenario 3: Preparing for the Weekly Meeting

```bash
# 1. Check all work done this week
git entirekit week

# 2. Collect statistics data
git entirekit stats

# 3. Generate report (after implementation)
git entirekit report --limit 50 --output ~/weekly-report.html
```

### Scenario 4: Pre-Code Review Check

```bash
# 1. Check recent changes
git entirekit recent

# 2. Check AI contribution
git entirekit stats | grep "Average AI contribution"

# 3. Check detailed changed files
git entirekit diff <previous> <latest>

# 4. Focus review on those files
```

### Scenario 5: Explaining Work to a Teammate

```bash
# 1. Search by the relevant feature keyword
git entirekit search "payment feature"

# 2. Show all related checkpoints
# 3. Share the context and changed files for each checkpoint
```

---

## Command Reference Table

| Command | Time Range | Output Format | Parsing Required | Implementation |
|---------|-----------|--------------|-----------------|----------------|
| `entirekit stats` | Last 10 | Text summary | Yes | `git entirekit stats` |
| `entirekit search` | Last 20 | Text detailed | Yes | `git entirekit search` |
| `entirekit recent` | No limit | oneline | Optional | `git log` |
| `entirekit today` | Today | oneline | No | `git log` |
| `entirekit yesterday` | Yesterday | oneline | No | `git log` |
| `entirekit week` | 7 days | oneline | No | `git log` |
| `entirekit diff` | Two selected | JSON | Yes | `git entirekit diff` |
| `entirekit report` | Selectable | HTML | Yes | `git entirekit report` |

---

## Troubleshooting

### "Cannot find entire/checkpoints/v1 branch"

**Cause**: The EntireKit branch has not been created yet.

**Resolution**:
```bash
# Performing a few tasks with Claude Code CLI will create it automatically
# Or create the branch manually
git checkout --orphan entire/checkpoints/v1
```

### "jq: command not found"

**Cause**: The required dependency jq is not installed.

**Resolution**:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

### "No search results"

**Cause**: The search keyword is missing or a different word should be used.

**Resolution**:
```bash
# Try a different keyword
git entirekit search "different-keyword"

# Search by file name
git entirekit search "page.tsx"

# Search by feature name
git entirekit search "auth"

# Check recent work first
git entirekit recent
```

### Command not running

**Cause**: Git alias is not installed or the config is corrupted.

**Check**:
```bash
# Check installed aliases
git config --local --list | grep entirekit

# Reinstall
npx entirekit install
```

### Output is too long or truncated

**Cause**: Terminal buffer size is small or there are many command results.

**Resolution**:
```bash
# Save results to a file
git entirekit stats > stats.txt

# Paginate
git entirekit recent | less

# Check only the first N entries
git entirekit recent | head -5
```

### Want to track change history for a specific file

**Cause**: Simple filename search does not provide a direct diff.

**Resolution**:
```bash
# 1. Search by filename to find related checkpoints
git entirekit search "Button.tsx"

# 2. Compare two checkpoints
git entirekit diff <hash1> <hash2>

# 3. Compare actual file contents (standard git feature)
git diff <hash1> <hash2> -- src/Button.tsx
```

---

## Advanced Tips

### Automation: Generate Daily Report

```bash
#!/bin/bash
# daily-report.sh

DATE=$(date +%Y-%m-%d)
OUTPUT=~/reports/checkpoint-$DATE.txt

echo "=== Daily Checkpoint Report ===" > $OUTPUT
echo "Date: $DATE" >> $OUTPUT
echo "" >> $OUTPUT

echo "Today's work:" >> $OUTPUT
git entirekit today >> $OUTPUT
echo "" >> $OUTPUT

echo "Statistics:" >> $OUTPUT
git entirekit stats >> $OUTPUT

echo "Report saved to: $OUTPUT"
open $OUTPUT
```

Usage:
```bash
chmod +x daily-report.sh
./daily-report.sh
```

### Automation: Weekly Report

```bash
#!/bin/bash
# weekly-report.sh

WEEK=$(date +%Y-week%V)
OUTPUT=~/reports/checkpoint-$WEEK.html

git entirekit report --limit 100 --output $OUTPUT
open $OUTPUT
```

### Data Extraction: JSON Parsing

```bash
# Extract metadata for a specific checkpoint
HASH="abc1234"
git show $HASH:*/*/metadata.json | jq '.token_usage.input_tokens'

# All AI contribution statistics
git log entire/checkpoints/v1 --format="%H" | while read hash; do
  git show $hash:*/*/metadata.json 2>/dev/null | jq '.initial_attribution.agent_percentage // "N/A"'
done | jq -s 'add/length'
```

### Filtering: Query Only Specific Time Period

```bash
# Work from the last 3 days
git log entire/checkpoints/v1 --since="3 days ago" --oneline

# Specific date range
git log entire/checkpoints/v1 \
  --since="2026-02-01" \
  --until="2026-02-10" \
  --oneline
```

### Integration: Combine Multiple Commands

```bash
# Complete weekly analysis
echo "=== WEEKLY ANALYSIS ==="
echo ""
echo "## Work Summary"
git entirekit week | sed 's/^/- /'
echo ""
echo "## Statistics"
git entirekit stats | head -10
echo ""
echo "## Top Modified Files"
git entirekit stats | grep -A10 "Most-Touched"
```

---

## Configuration and Customization

### Check Alias Configuration

```bash
# Check all installed checkpoint aliases
git config --local --list | grep alias.entirekit
```

**Sample output**:
```
alias.entirekit=!entirekit
...
```

### Modifying Aliases

To change a configured alias:

```bash
# Direct modification (e.g., change entirekit recent to show 20 entries)
git config --local alias.entirekit "log entire/checkpoints/v1 --oneline -20"

# Verify
git entirekit recent  # Shows 20 entries
```

### Global Configuration

To use in other projects:

```bash
# Use --global instead of --local
git config --global alias.entirekit "log entire/checkpoints/v1 --oneline -10"

# Verify
git config --global --list | grep entirekit recent
```

**Note**: Generally `--local` is recommended since settings may differ per project

### Command Behavior Customization

Use CLI options instead of editing internal files:

```bash
# Analyze the latest 20 checkpoints
git entirekit stats --limit 20

# Filter by branch and date range
git entirekit stats --branch feature/login --since 2026-01-01 --until 2026-01-31
```

---

## Performance Optimization

### Search Optimization for Large Repositories

Searches may be slow if there are many checkpoints.

Use command options instead of editing internal files:
```bash
git entirekit search "<keyword>" --limit 10
```

### Caching

There is currently no caching feature, so manual caching if needed:

```bash
# Save frequently used statistics
git entirekit stats > ~/cache/weekly-stats.txt

# Reference quickly later
cat ~/cache/weekly-stats.txt
```

---

## Summary

| Command | Most Common Use Time | Alternative |
|---------|---------------------|------------|
| `entirekit recent` | Quick check needed | `entirekit today`, `entirekit week` |
| `entirekit today` | Every morning/evening | `entirekit recent` |
| `entirekit stats` | Weekly meetings, reviews | `entirekit diff` |
| `entirekit search` | Finding past work | git log grep |
| `entirekit diff` | Detailed comparison of two versions | `entirekit stats` |
| `entirekit report` | Report generation | Save `entirekit stats` output |

---

## Additional Resources

- [Quick Start Guide](../../../../.entire/docs/quick-start.md) - Get started in 5 minutes
- [Advanced Usage](../../../../.entire/docs/advanced-usage.md) - More complex scenarios
- [Main README](../../../../README.md) - Complete documentation
- [Checkpoint Structure](./data-structure.md) - Detailed data format

---

**Last updated**: 2026-02-13
**Version**: 1.0.0
