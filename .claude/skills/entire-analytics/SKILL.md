---
name: entire-analytics
description: >
  Deep analysis workflow for EntireKit data: statistical reports, cost analysis,
  productivity trends, regression debugging, knowledge sharing, and export.
  Trigger keywords: "checkpoint report", "cost analysis", "token usage",
  "productivity trends", "regression debugging", "weekly review", "checkpoint export"
---

[한국어](SKILL.ko.md)


# Entire Analytics - Deep Analysis Workflow

A tool for advanced analysis and insight extraction from EntireKit data. Goes beyond simple lookups to provide complex analytical tasks including statistical reports, cost analysis, productivity trends, and regression debugging.

## Overview

**Entire Analytics** supports analysis of checkpoint data from multiple angles:

- **Statistical Reports**: Quantitative analysis of token usage, AI contribution, file change history, and more
- **Cost Analysis**: Token cost calculation per API call, discovery of cost optimization opportunities
- **Productivity Trends**: Session activity by time of day, productivity patterns, hot file tracking
- **Regression Debugging**: Trace when specific bugs were introduced, restore past session context
- **Knowledge Sharing**: Export analysis results as markdown, share with team

## Usage Scenarios

Use this skill for requests like the following:

### Analysis & Reports
- "Generate a report of what I did last week"
- "Show me monthly checkpoint statistics" / "Daily checkpoint analysis"
- "Top 10 most frequently modified files"
- "Analyze this month's token usage"

### Cost Analysis
- "Calculate API costs" / "What are the costs this month?"
- "What was the most expensive session?" / "Find sessions with poor cost efficiency"
- "Show me the cache hit rate"
- "Are there any token usage optimization opportunities?"

### Productivity Trends
- "What are my productivity patterns by time of day?"
- "What are the recent hotspot files?"
- "Weekly activity analysis"
- "AI contribution trends"

### Regression Debugging
- "When did this bug appear?"
- "When did I start modifying src/hooks/useAuth.ts?"
- "When was this feature added?"
- "Full change history for this file"

### Knowledge Sharing
- "Export checkpoint data as markdown"
- "Generate a summary document for the last 3 months"
- "Organize development history by feature"

## Prerequisites

Before starting checkpoint analysis, verify the following:

### 1. Check entire/checkpoints/v1 Branch

```bash
git rev-parse --verify entire/checkpoints/v1 >/dev/null 2>&1
```

If the branch doesn't exist, refer to the [entire-checkpoint skill](../entire-checkpoint/).

### 2. Check jq Installation

```bash
command -v jq >/dev/null 2>&1
```

**If jq is not installed:**
- macOS: `brew install jq`
- Ubuntu/Debian: `sudo apt-get install jq`
- CentOS/RHEL: `sudo yum install jq`

### 3. Optional: bc (for calculations)

```bash
command -v bc >/dev/null 2>&1
```

Install `bc` if cost calculations are needed:
- macOS: `brew install bc` (usually installed by default)
- Ubuntu: `sudo apt-get install bc`

### 4. Check Git Aliases

If the entire-checkpoint aliases are configured, usage becomes easier:

```bash
git config --local --get alias.entirekit >/dev/null 2>&1
```

If not installed:
```bash
npx entirekit install
```

## Interactive Workflows

### Workflow 1: Generate Report

**Scenario:** "Generate a checkpoint report for last week"

**Steps:**

#### Step 1: Collect User Input (AskUserQuestion)

```javascript
// Select report type
AskUserQuestion({
  title: "Select Report Type",
  question: "What type of report would you like?",
  type: "preference",
  options: [
    { label: "Daily Report", value: "daily" },
    { label: "Weekly Report", value: "weekly" },
    { label: "Monthly Report", value: "monthly" },
    { label: "Custom Period", value: "custom" }
  ]
})
```

After selection:

```javascript
// Select output format
AskUserQuestion({
  title: "Select Output Format",
  question: "What format would you like?",
  type: "preference",
  options: [
    { label: "Terminal Output", value: "terminal" },
    { label: "Markdown File", value: "markdown" },
    { label: "HTML Dashboard", value: "html" },
    { label: "JSON Data", value: "json" }
  ]
})
```

#### Step 2: Collect Data

**Daily report:**
```bash
SINCE_DATE=$(date -d "1 day ago" +%Y-%m-%d)
HASHES=$(git log entire/checkpoints/v1 --since="$SINCE_DATE" --format="%H")
```

**Weekly report:**
```bash
SINCE_DATE=$(date -d "7 days ago" +%Y-%m-%d)
HASHES=$(git log entire/checkpoints/v1 --since="$SINCE_DATE" --format="%H")
```

**Monthly report:**
```bash
SINCE_DATE=$(date -d "30 days ago" +%Y-%m-%d)
HASHES=$(git log entire/checkpoints/v1 --since="$SINCE_DATE" --format="%H")
```

#### Step 3: Calculate Metrics

```bash
# Helper function: extract metadata path
get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# Aggregate statistics
total_input=0
total_output=0
total_cache=0
total_api_calls=0
total_agents=0
total_human=0
declare -A file_count

for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    # Extract tokens
    tokens=$(git show $hash:$metadata | jq '.token_usage')
    input=$(echo $tokens | jq -r '.input_tokens // 0')
    output=$(echo $tokens | jq -r '.output_tokens // 0')
    cache=$(echo $tokens | jq -r '.cache_read_tokens // 0')
    api_calls=$(echo $tokens | jq -r '.api_calls // 0')

    total_input=$((total_input + input))
    total_output=$((total_output + output))
    total_cache=$((total_cache + cache))
    total_api_calls=$((total_api_calls + api_calls))

    # AI contribution
    attribution=$(git show $hash:$metadata | jq '.initial_attribution')
    agent=$(echo $attribution | jq -r '.agent_percentage // 0')
    total_agents=$((total_agents + agent))

    # File aggregation
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')
    while read -r file; do
      if [ -n "$file" ]; then
        ((file_count["$file"]++))
      fi
    done <<< "$files"
  fi
done
```

#### Step 4: Generate Output

**Terminal output:**
```bash
echo "📊 Checkpoint Report (Weekly)"
echo "================================================"
echo ""
echo "💰 Token Usage"
echo "  Input tokens:        $total_input"
echo "  Output tokens:       $total_output"
echo "  Cache read tokens:   $total_cache"
echo "  Total API calls:     $total_api_calls"
echo ""
echo "🤖 AI Contribution"
echo "  Average AI contribution: ${total_agents}%"
echo ""
echo "📝 Top 10 Most Modified Files"
for file in $(printf '%s\n' "${!file_count[@]}" | sort -t: -k2 -rn | head -10); do
  echo "  ${file_count[$file]} - $file"
done
```

**Markdown output:**
```bash
cat > report_$(date +%Y%m%d).md << 'EOF'
# Checkpoint Weekly Report

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')

## Statistics

### Token Usage
- Input tokens: $total_input
- Output tokens: $total_output
- Cache read tokens: $total_cache
- Total API calls: $total_api_calls

### AI Contribution
- Average: ${total_agents}%

### Most Modified Files
[File list...]

EOF
```

---

### Workflow 2: Cost Analysis

**Scenario:** "Analyze how much the API costs this month"

**Steps:**

#### Step 1: Select Analysis Period (AskUserQuestion)

```javascript
AskUserQuestion({
  title: "Select Analysis Period",
  question: "Which period's costs would you like to analyze?",
  type: "preference",
  options: [
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 90 days", value: "90d" },
    { label: "All time", value: "all" },
    { label: "Custom period", value: "custom" }
  ]
})
```

#### Step 2: Configure Pricing Information

OpenAI pricing (2024):

```bash
# GPT-4 input tokens
INPUT_PRICE=0.00003  # per token

# GPT-4 output tokens
OUTPUT_PRICE=0.00006  # per token

# Cache read (cached input tokens)
CACHE_READ_PRICE=0.000009  # per token (90% discount)

# Cache creation cost
CACHE_WRITE_PRICE=0.00006  # per token (25% surcharge over token price)
```

#### Step 3: Calculate Costs

```bash
get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# Retrieve checkpoints for the period
SINCE_DATE=$(date -d "30 days ago" +%Y-%m-%d)
HASHES=$(git log entire/checkpoints/v1 --since="$SINCE_DATE" --format="%H")

declare -A session_cost
declare -a session_hashes
total_cost=0

for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    tokens=$(git show $hash:$metadata | jq '.token_usage')

    input=$(echo $tokens | jq -r '.input_tokens // 0')
    output=$(echo $tokens | jq -r '.output_tokens // 0')
    cache=$(echo $tokens | jq -r '.cache_read_tokens // 0')

    # Cost calculation using bc
    input_cost=$(echo "scale=6; $input * $INPUT_PRICE" | bc)
    output_cost=$(echo "scale=6; $output * $OUTPUT_PRICE" | bc)
    cache_cost=$(echo "scale=6; $cache * $CACHE_READ_PRICE" | bc)

    session_total=$(echo "scale=6; $input_cost + $output_cost + $cache_cost" | bc)

    session_cost[$hash]=$session_total
    session_hashes+=($hash)
    total_cost=$(echo "scale=6; $total_cost + $session_total" | bc)
  fi
done
```

#### Step 4: Analysis and Insights

**Cost distribution:**
```bash
# Sort by cost (most expensive first)
for hash in $(for h in "${!session_cost[@]}"; do echo "${session_cost[$h]} $h"; done | sort -rn | cut -d' ' -f2 | head -10); do
  cost=${session_cost[$hash]}
  echo "$hash: \$$cost"
done
```

**Outlier detection:**
```bash
# Calculate average cost
avg_cost=$(echo "scale=6; $total_cost / ${#session_cost[@]}" | bc)

# More than 2x the average: expensive sessions
for hash in "${!session_cost[@]}"; do
  cost=${session_cost[$hash]}
  threshold=$(echo "scale=6; $avg_cost * 2" | bc)
  if (( $(echo "$cost > $threshold" | bc -l) )); then
    echo "⚠️  Expensive session: $hash (\$$cost)"
  fi
done
```

**Cache efficiency:**
```bash
total_cache_tokens=0
total_uncached_tokens=0

for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    tokens=$(git show $hash:$metadata | jq '.token_usage')
    cache=$(echo $tokens | jq -r '.cache_read_tokens // 0')
    input=$(echo $tokens | jq -r '.input_tokens // 0')

    total_cache_tokens=$((total_cache_tokens + cache))
    total_uncached_tokens=$((total_uncached_tokens + input))
  fi
done

# Cache hit rate
if [ $((total_cache_tokens + total_uncached_tokens)) -gt 0 ]; then
  cache_rate=$(echo "scale=2; $total_cache_tokens * 100 / ($total_cache_tokens + $total_uncached_tokens)" | bc)
  echo "Cache hit rate: $cache_rate%"
fi
```

#### Step 5: Optimization Suggestions

```markdown
## Cost Optimization Suggestions

### Current Status
- Total cost: $X.XX
- Daily average: $Y.YY
- Estimated monthly: $Z.ZZ

### Outlier Sessions
[List of expensive sessions]

### Improvement Opportunities
1. **Increase Cache Utilization**
   - Current cache hit rate: XX%
   - Target: YY%
   - Estimated savings: $Z.ZZ/month

2. **Token Efficiency**
   - Average Input/Output ratio
   - Improvement suggestions

3. **Session Optimization**
   - Eliminate unnecessary API calls
   - Optimize prompt length
```

---

### Workflow 3: Productivity Trends

**Scenario:** "Show me what my recent productivity patterns look like"

**Steps:**

#### Step 1: Select Analysis Type (AskUserQuestion)

```javascript
AskUserQuestion({
  title: "Productivity Analysis Type",
  question: "Which perspective of productivity would you like to analyze?",
  type: "preference",
  options: [
    { label: "Activity by time of day", value: "hourly" },
    { label: "Daily productivity", value: "daily" },
    { label: "Weekly patterns", value: "weekly" },
    { label: "Hot file analysis", value: "hotfiles" },
    { label: "AI contribution trends", value: "aitrend" }
  ]
})
```

#### Step 2: Activity Analysis by Time of Day

```bash
# Checkpoint distribution by hour
for hour in {0..23}; do
  count=$(git log entire/checkpoints/v1 --format="%H %aI" -30 | \
    awk -F'T' "{if (\$2 ~ /^$(printf '%02d' $hour)/) print}" | wc -l)
  printf "%02d:00 | " $hour
  for ((i=0; i<count; i++)); do echo -n "█"; done
  echo ""
done
```

**Output:**
```
00:00 |
01:00 |
02:00 | █
...
14:00 | ████████████████
15:00 | ███████████
...
23:00 |
```

#### Step 3: Daily Productivity Score

```bash
# Calculate productivity score for each checkpoint
# Score = (AI contribution * number of file changes * token efficiency) / time

get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

declare -A daily_productivity

HASHES=$(git log entire/checkpoints/v1 --format="%H" -30)
for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    date=$(git log -1 --format="%ad" --date=short $hash)

    # Extract metrics
    ai_contrib=$(git show $hash:$metadata | jq -r '.initial_attribution.agent_percentage // 0')
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty' | wc -l)
    tokens=$(git show $hash:$metadata | jq '.token_usage')
    input=$(echo $tokens | jq -r '.input_tokens // 1')
    output=$(echo $tokens | jq -r '.output_tokens // 1')

    # Efficiency score (output/input ratio)
    efficiency=$(echo "scale=2; $output / $input" | bc)

    # Productivity score
    score=$(echo "scale=1; ($ai_contrib * $files * $efficiency) / 100" | bc)

    daily_productivity[$date]=$(echo "scale=1; ${daily_productivity[$date]:-0} + $score" | bc)
  fi
done

# Daily visualization
for date in $(printf '%s\n' "${!daily_productivity[@]}" | sort -r); do
  score=${daily_productivity[$date]}
  echo "$date | Score: $score"
done
```

#### Step 4: Hot File Analysis

```bash
# Most frequently modified files in the last N days
declare -A file_frequency
declare -a file_list

HASHES=$(git log entire/checkpoints/v1 --since="30 days ago" --format="%H")
for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')
    while read -r file; do
      if [ -n "$file" ]; then
        ((file_frequency["$file"]++))
      fi
    done <<< "$files"
  fi
done

# TOP 10 hotfiles
echo "🔥 Most Frequently Modified Files (Last 30 days)"
echo "================================================"
for file in $(printf '%s\n' "${!file_frequency[@]}" | sort -t: -k2 -rn | head -10); do
  count=${file_frequency[$file]}
  echo "[$count] $file"
done
```

#### Step 5: AI Contribution Trends

```bash
# AI contribution trends in weekly intervals
declare -a weeks
declare -a contributions

for i in {0..3}; do
  start_date=$(date -d "$((i*7)) days ago" +%Y-%m-%d)
  end_date=$(date -d "$((i*7-7)) days ago" +%Y-%m-%d)

  week_label=$(date -d "$start_date" +%Y-W%V)

  HASHES=$(git log entire/checkpoints/v1 --since="$end_date" --until="$start_date" --format="%H")

  total_contrib=0
  count=0
  for hash in $HASHES; do
    metadata=$(get_metadata_path $hash)
    if [ -n "$metadata" ]; then
      contrib=$(git show $hash:$metadata | jq -r '.initial_attribution.agent_percentage // 0')
      total_contrib=$((total_contrib + contrib))
      ((count++))
    fi
  done

  if [ $count -gt 0 ]; then
    avg_contrib=$(echo "scale=1; $total_contrib / $count" | bc)
    weeks+=("$week_label")
    contributions+=("$avg_contrib")
  fi
done

# Visualization
echo "📈 AI Contribution Trends"
echo "================================================"
for i in "${!weeks[@]}"; do
  week=${weeks[$i]}
  contrib=${contributions[$i]}
  printf "%-12s | " "$week"
  count=$(echo "$contrib / 5" | bc)
  for ((j=0; j<count; j++)); do echo -n "█"; done
  echo " $contrib%"
done
```

---

### Workflow 4: Regression Debugging

**Scenario:** "When was this bug introduced?"

**Steps:**

#### Step 1: Define Search Criteria (AskUserQuestion)

```javascript
AskUserQuestion({
  title: "Regression Bug Search",
  question: "How would you like to find it?",
  type: "preference",
  options: [
    { label: "By file name", value: "filename" },
    { label: "By keyword", value: "keyword" },
    { label: "By error message", value: "error" }
  ]
})
```

Depending on selection:

```javascript
// When filename is selected
AskUserQuestion({
  title: "Enter File",
  question: "Enter the name of the modified file (e.g., LoginForm.tsx)",
  type: "text"
})
```

#### Step 2: Extract Change History

```bash
TARGET_FILE="src/hooks/useAuth.ts"  # user input

get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# Find all checkpoints that modified the file
declare -a modifications
declare -a modification_dates

echo "🔍 $TARGET_FILE Modification History"
echo "================================================"

HASHES=$(git log entire/checkpoints/v1 --format="%H" -100)
for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')
    if echo "$files" | grep -q "$TARGET_FILE"; then
      date=$(git log -1 --format="%ad" --date=short $hash)
      time=$(git log -1 --format="%ai" $hash | cut -d' ' -f2)

      modifications+=("$hash")
      modification_dates+=("$date $time")

      # Prompt preview
      prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | head -1)
      if [ -n "$prompt_path" ]; then
        prompt=$(git show $hash:$prompt_path | head -1)
        echo "[$date] $hash"
        echo "  Prompt: $prompt"
      fi
    fi
  fi
done
```

#### Step 3: Pinpoint Bug Introduction

```bash
# Analyze differences between two consecutive checkpoints
echo ""
echo "🐛 Possible Bug Introduction Points"
echo "================================================"

for ((i=0; i<${#modifications[@]}-1; i++)); do
  hash1=${modifications[$i]}
  hash2=${modifications[$((i+1))]}

  echo ""
  echo "Compare: ${modification_dates[$i]} → ${modification_dates[$((i+1))]}"
  echo ""

  # Compare metadata of each checkpoint
  metadata1=$(get_metadata_path $hash1)
  metadata2=$(get_metadata_path $hash2)

  # Token changes
  tokens1=$(git show $hash1:$metadata1 | jq '.token_usage | {input, output}')
  tokens2=$(git show $hash2:$metadata2 | jq '.token_usage | {input, output}')

  echo "Token changes:"
  echo "  $hash1: $tokens1"
  echo "  $hash2: $tokens2"

  # Prompt comparison
  prompt1=$(git ls-tree -r --name-only $hash1 | grep 'prompt.txt$' | head -1)
  prompt2=$(git ls-tree -r --name-only $hash2 | grep 'prompt.txt$' | head -1)

  if [ -n "$prompt1" ] && [ -n "$prompt2" ]; then
    echo ""
    echo "Session content comparison:"
    echo "  Checkpoint 1:"
    git show $hash1:$prompt1 | head -3 | sed 's/^/    /'
    echo "  Checkpoint 2:"
    git show $hash2:$prompt2 | head -3 | sed 's/^/    /'
  fi
done
```

#### Step 4: Restore Past Session Context

```bash
# View entire conversation content for a specific checkpoint
SELECTED_HASH="ac03096"  # hash selected by user

echo "📋 Full Session Content"
echo "================================================"

# Output metadata
metadata=$(get_metadata_path $SELECTED_HASH)
echo "Metadata:"
git show $SELECTED_HASH:$metadata | jq '.metadata' | head -20

# Output prompt
echo ""
echo "Initial Prompt:"
echo "================================================"
prompt_path=$(git ls-tree -r --name-only $SELECTED_HASH | grep 'prompt.txt$' | head -1)
git show $SELECTED_HASH:$prompt_path

# Full conversation content
echo ""
echo "Full Conversation:"
echo "================================================"
jsonl_path=$(git ls-tree -r --name-only $SELECTED_HASH | grep 'full.jsonl$' | tail -1)
if [ -n "$jsonl_path" ]; then
  git show $SELECTED_HASH:$jsonl_path | jq -r '.content' | head -100
fi
```

---

### Workflow 5: Knowledge Sharing & Export

**Scenario:** "Organize the last 3 months of development history as markdown"

**Steps:**

#### Step 1: Select Content to Share (AskUserQuestion)

```javascript
AskUserQuestion({
  title: "Content to Share",
  question: "What would you like to share?",
  type: "preference",
  options: [
    { label: "Full session history", value: "sessions" },
    { label: "Development history by feature", value: "features" },
    { label: "Developer contribution analysis", value: "contribution" },
    { label: "All changed files", value: "files" },
    { label: "Weekly/monthly summary", value: "summary" }
  ]
})
```

#### Step 2: Select Period

```javascript
AskUserQuestion({
  title: "Select Period",
  question: "What period would you like to export?",
  type: "preference",
  options: [
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 90 days", value: "90d" },
    { label: "All time", value: "all" }
  ]
})
```

#### Step 3: Export Session History

```bash
OUTPUT_FILE="checkpoint_export_$(date +%Y%m%d).md"

cat > "$OUTPUT_FILE" << 'EOF'
# Checkpoint Export

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')
**Period:** Last 30 days

---

## Table of Contents

- [Session List](#session-list)
- [File Change History](#file-change-history)
- [Statistics](#statistics)

---

## Session List

| Date | Hash | Prompt | Files | Tokens |
|------|------|--------|-------|--------|
EOF

get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

HASHES=$(git log entire/checkpoints/v1 --since="30 days ago" --format="%H")
for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    date=$(git log -1 --format="%ad" --date=short $hash)

    # Extract prompt
    prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | head -1)
    prompt=$(git show $hash:$prompt_path 2>/dev/null | head -1 | cut -c1-50)

    # File/token info
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty' | wc -l)
    tokens=$(git show $hash:$metadata | jq '.token_usage | .input_tokens + .output_tokens')

    echo "| $date | ${hash:0:7} | $prompt | $files | $tokens |" >> "$OUTPUT_FILE"
  fi
done

echo ""
echo "✅ Export complete: $OUTPUT_FILE"
```

#### Step 4: Feature-based History

```bash
# Group files by feature
cat >> "$OUTPUT_FILE" << 'EOF'

## Development History by Feature

EOF

declare -A feature_files=(
  ["Authentication"]="src/hooks/useAuth.ts|src/api/auth.ts"
  ["Games"]="src/app/games|src/hooks/useGame.ts"
  ["Assets"]="src/app/assets|src/api/asset.ts"
  ["UI"]="src/components|src/app"
)

for feature in "${!feature_files[@]}"; do
  patterns=${feature_files[$feature]}

  echo "### $feature" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"

  HASHES=$(git log entire/checkpoints/v1 --since="30 days ago" --format="%H")
  for hash in $HASHES; do
    metadata=$(get_metadata_path $hash)
    if [ -n "$metadata" ]; then
      files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')

      for pattern in ${patterns//|/ }; do
        if echo "$files" | grep -q "$pattern"; then
          date=$(git log -1 --format="%ad" --date=short $hash)
          short_hash=${hash:0:7}

          prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | head -1)
          prompt=$(git show $hash:$prompt_path 2>/dev/null | head -1)

          echo "- **$date** ($short_hash): $prompt" >> "$OUTPUT_FILE"
          break
        fi
      done
    fi
  done

  echo "" >> "$OUTPUT_FILE"
done
```

---

## Advanced Analysis Scripts

### Script 1: Full Analysis Dashboard

```bash
#!/bin/bash
# analyze-full.sh - Run all analyses at once

generate_full_analysis() {
  local output_file="analysis_$(date +%Y%m%d_%H%M%S).md"

  {
    echo "# Comprehensive Analysis Report"
    echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    echo "## Token Analysis"
    echo '```'
    git entirekit stats 2>/dev/null || echo "Cannot run git entirekit stats"
    echo '```'
    echo ""

    echo "## Recent Activity"
    echo '```'
    git entirekit recent 2>/dev/null || git log entire/checkpoints/v1 --format="%h %ad %s" --date=short -10
    echo '```'
    echo ""

  } > "$output_file"

  echo "Report saved: $output_file"
}

generate_full_analysis
```

### Script 2: Cost Report Generator

```bash
#!/bin/bash
# cost-report.sh

generate_cost_report() {
  local days=${1:-30}
  local output="cost_report_${days}d.md"

  # Pricing configuration
  local INPUT_PRICE=0.00003
  local OUTPUT_PRICE=0.00006
  local CACHE_PRICE=0.000009

  {
    echo "# Cost Analysis Report (Last ${days} days)"
    echo "Generated: $(date)"
    echo ""

    # Token statistics
    echo "## Token Usage"
    echo ""

    # See Workflow 2 for cost calculation

  } > "$output"

  echo "Cost report: $output"
}

generate_cost_report 30
```

### Script 3: File Change History

```bash
#!/bin/bash
# file-history.sh

show_file_history() {
  local target_file="$1"

  if [ -z "$target_file" ]; then
    echo "Usage: $0 <file path>"
    return 1
  fi

  get_metadata_path() {
    local hash=$1
    git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
  }

  echo "File change history: $target_file"
  echo "=========================================="
  echo ""

  HASHES=$(git log entire/checkpoints/v1 --format="%H" -100)
  for hash in $HASHES; do
    metadata=$(get_metadata_path $hash)
    if [ -n "$metadata" ]; then
      files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')

      if echo "$files" | grep -q "$target_file"; then
        date=$(git log -1 --format="%ad" --date=short $hash)
        time=$(git log -1 --format="%ai" $hash | cut -d' ' -f2)

        prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | head -1)
        if [ -n "$prompt_path" ]; then
          prompt=$(git show $hash:$prompt_path | head -1)
          echo "[$date $time] $hash"
          echo "  $prompt"
          echo ""
        fi
      fi
    fi
  done
}

show_file_history "$@"
```

---

## Reference Documents

For more detailed information, refer to the following reference documents:

- [entire-checkpoint skill](../entire-checkpoint/SKILL.md) - Basic lookup and search (prerequisite)
- [report-templates.md](./references/report-templates.md) - Various report templates
- [analysis-recipes.md](./references/analysis-recipes.md) - Reusable analysis recipes

## Related Skills

- **entire-checkpoint** - Basic checkpoint lookup and search tool
