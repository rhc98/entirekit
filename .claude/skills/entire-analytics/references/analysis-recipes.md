[한국어](analysis-recipes.ko.md)

# Checkpoint Analysis Recipe Collection

A collection of copy-pasteable bash/jq one-liners that make complex analysis simple. Each recipe is designed for immediate use.

---

## 📖 How to Use

### Running a Recipe

1. Copy and paste the code below into your terminal
2. Replace `{variable}` parts with your own values
3. Press Enter

### Basic Setup

All recipes assume:
- Running from the Git repository root
- `entire/checkpoints/v1` branch exists
- `jq` is installed (`brew install jq`)

### Customization Tips

Each recipe's "Customization" section explains common modifications.

---

## 1️⃣ Token Aggregation Recipes

### Recipe 1.1: Total Input Tokens for a Period

Sum all input tokens used during a specific period.

**Run:**
```bash
SINCE="2 weeks ago"
git log entire/checkpoints/v1 --since="$SINCE" --format="%H" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq -r '.token_usage.input_tokens // 0'
done | awk '{sum+=$1} END {print "Input tokens: " sum}'
```

**Expected output:**
```
Input tokens: 45238
```

**Customization:**
- Change `2 weeks ago` → `1 month ago`, `3 days ago`, etc.
- For output tokens: change to `.token_usage.output_tokens`

---

### Recipe 1.2: Total Output Tokens for a Period

Sum output tokens instead of input tokens.

**Run:**
```bash
SINCE="1 week ago"
git log entire/checkpoints/v1 --since="$SINCE" --format="%H" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq -r '.token_usage.output_tokens // 0'
done | awk '{sum+=$1} END {print "Output tokens: " sum}'
```

**Expected output:**
```
Output tokens: 128456
```

**Customization:**
- For cache read tokens: change to `.token_usage.cache_read_tokens`
- For cache creation tokens: change to `.token_usage.cache_creation_tokens`

---

### Recipe 1.3: Calculate Cache Read Ratio

Calculate what percentage of all tokens were read from cache.

**Run:**
```bash
SINCE="1 week ago"
git log entire/checkpoints/v1 --since="$SINCE" --format="%H" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null
done | jq -s '{
  cache_read: map(.token_usage.cache_read_tokens // 0 | tonumber) | add,
  input: map(.token_usage.input_tokens // 0 | tonumber) | add,
  cache_creation: map(.token_usage.cache_creation_tokens // 0 | tonumber) | add
} | {
  cache_read,
  input,
  cache_creation,
  cache_ratio: (.cache_read / (.cache_read + .input) * 100 | floor) | "\(.)%"
}'
```

**Expected output:**
```json
{
  "cache_read": 23450,
  "input": 45238,
  "cache_creation": 5600,
  "cache_ratio": "34%"
}
```

**Customization:**
- Change `1 week ago` → another period
- To extract only the ratio from JSON: append `| .cache_ratio`

---

### Recipe 1.4: Find High Token Usage Sessions (Outliers)

Find sessions that used more than 5000 output tokens.

**Run:**
```bash
THRESHOLD=5000
LIMIT=50
git log entire/checkpoints/v1 --format="%H %ad" --date=short -"$LIMIT" | while read hash date; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    tokens=$(git show $hash:$metadata 2>/dev/null | jq -r '.token_usage.output_tokens // 0')
    if [ "$tokens" -gt "$THRESHOLD" ]; then
      prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
      echo "[$date] $hash - Tokens: $tokens"
      git show $hash:$prompt_path 2>/dev/null | head -1
      echo ""
    fi
  fi
done
```

**Expected output:**
```
[2025-02-10] abc1234 - Tokens: 8234
Fix critical auth bug in production

[2025-02-08] def5678 - Tokens: 6100
Implement new dashboard with analytics
```

**Customization:**
- Change `5000` → another threshold
- Change `-50` → different number of recent records (`-100`, `-200`, etc.)

---

### Recipe 1.5: Compare Weekly Token Usage

Compare token usage week by week to see trends.

**Run:**
```bash
git log entire/checkpoints/v1 --format="%H %ad" --date=format:"%Y-W%V" | \
  awk '{week=$NF; hash=$1; print week, hash}' | \
  while read week hash; do
    metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
    [ -n "$metadata" ] && echo "$week $(git show $hash:$metadata 2>/dev/null | jq -r '.token_usage.output_tokens // 0')"
  done | \
  awk '{week=$1; tokens=$2; weekly[week]+=$2; count[week]++}
       END {for (w in weekly) printf "%s: %d tokens (avg: %d)\n", w, weekly[w], weekly[w]/count[w]}' | \
  sort
```

**Expected output:**
```
2025-W05: 145600 tokens (avg: 2912)
2025-W06: 128400 tokens (avg: 2568)
2025-W07: 167200 tokens (avg: 3344)
```

**Customization:**
- Switch to input tokens: use `.token_usage.input_tokens`
- Monthly analysis: change to `--date=format:"%Y-%m"`

---

## 2️⃣ File Analysis Recipes

### Recipe 2.1: List All Files Modified in the Last N Checkpoints

Find all files touched in the most recent 30 checkpoints.

**Run:**
```bash
LIMIT=30
git log entire/checkpoints/v1 --format="%H" -"$LIMIT" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq -r '.files_touched[]? // empty'
done | sort | uniq
```

**Expected output:**
```
src/hooks/useAuth.ts
src/components/Button.tsx
src/utils/api.ts
src/pages/Login.tsx
src/styles/global.css
```

**Customization:**
- Change `-30` → `-50`, `-100`, etc.
- To get file counts: append `| uniq -c | sort -rn`

---

### Recipe 2.2: Top 10 Most Frequently Modified Files

Find out which files change most often.

**Run:**
```bash
LIMIT=100
git log entire/checkpoints/v1 --format="%H" -"$LIMIT" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq -r '.files_touched[]? // empty'
done | sort | uniq -c | sort -rn | head -10
```

**Expected output:**
```
     24 src/hooks/useAuth.ts
     19 src/components/Button.tsx
     15 src/pages/Dashboard.tsx
     12 src/utils/api.ts
      8 src/styles/global.css
      6 README.md
      5 package.json
      4 tsconfig.json
      3 .env.example
      2 src/components/Modal.tsx
```

**Customization:**
- Change `head -10` → `head -20`, `head -5`, etc.
- Change `-100` → different number of checkpoints to analyze

---

### Recipe 2.3: Track Modification History for a Specific File

Track when and in which task a file was modified.

**Run:**
```bash
FILE="src/hooks/useAuth.ts"
git log entire/checkpoints/v1 --format="%H %ad" --date=short -100 | while read hash date; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    files=$(git show $hash:$metadata 2>/dev/null | jq -r '.files_touched[]? // empty')
    if echo "$files" | grep -q "^$FILE$"; then
      prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
      echo "[$date] $hash"
      git show $hash:$prompt_path 2>/dev/null | head -1
      echo ""
    fi
  fi
done
```

**Expected output:**
```
[2025-02-12] abc1234
Fix authentication error handling

[2025-02-10] def5678
Implement password reset feature

[2025-02-08] ghi9012
Add login form validation
```

**Customization:**
- Change `src/hooks/useAuth.ts` → another file path
- Change `-100` → different number of checkpoints
- Change `head -1` → `head -3` to show more context

---

### Recipe 2.4: Find Files with High AI Contribution

Find files that were written more than 80% by AI.

**Run:**
```bash
THRESHOLD=80
LIMIT=50
git log entire/checkpoints/v1 --format="%H" -"$LIMIT" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    data=$(git show $hash:$metadata 2>/dev/null)
    pct=$(echo "$data" | jq -r '.initial_attribution.agent_percentage // 0')
    files=$(echo "$data" | jq -r '.files_touched[]? // empty')

    if (( $(echo "$pct >= $THRESHOLD" | bc -l) )); then
      echo "AI ${pct}% - $hash:"
      echo "$files" | sed 's/^/  /'
      echo ""
    fi
  fi
done
```

**Expected output:**
```
AI 95% - abc1234:
  src/components/Button.tsx
  src/components/Modal.tsx
  src/utils/styling.ts

AI 85% - def5678:
  src/hooks/useForm.ts
  src/utils/validation.ts
```

**Customization:**
- Change `80` → another threshold
- To find low AI contribution: change to `pct < 20`

---

## 3️⃣ AI Contribution Analysis Recipes

### Recipe 3.1: Calculate Average AI Contribution

Find the average AI contribution across all checkpoints.

**Run:**
```bash
LIMIT=100
git log entire/checkpoints/v1 --format="%H" -"$LIMIT" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq -r '.initial_attribution.agent_percentage // 0'
done | awk '{sum+=$1; count++} END {if (count > 0) printf "Average AI contribution: %.1f%%\n", sum/count}'
```

**Expected output:**
```
Average AI contribution: 72.5%
```

**Customization:**
- Change `-100` → another number of checkpoints
- To find the median: append `sort -n | sed -n '$((NR/2))p'`

---

### Recipe 3.2: Find Sessions with 80%+ AI Contribution

List all sessions where AI contributed 80% or more.

**Run:**
```bash
THRESHOLD=80
LIMIT=100
git log entire/checkpoints/v1 --format="%H %ad" --date=short -"$LIMIT" | while read hash date; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    pct=$(git show $hash:$metadata 2>/dev/null | jq -r '.initial_attribution.agent_percentage // 0')
    if (( $(echo "$pct >= $THRESHOLD" | bc -l) )); then
      prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
      echo "[$date] $hash - AI ${pct}%"
      git show $hash:$prompt_path 2>/dev/null | head -1 | sed 's/^/  /'
    fi
  fi
done
```

**Expected output:**
```
[2025-02-12] abc1234 - AI 95%
  Implement new authentication system

[2025-02-10] def5678 - AI 88%
  Add error handling to API client

[2025-02-08] ghi9012 - AI 82%
  Create utility functions for date handling
```

**Customization:**
- Change `80` → another threshold
- To find low AI contribution: change to `< 20`

---

### Recipe 3.3: Track AI Contribution Trends (Weekly)

See how AI contribution changes over time.

**Run:**
```bash
git log entire/checkpoints/v1 --format="%H %ad" --date=format:"%Y-W%V" | \
  awk '{week=$NF; hash=$1; print week, hash}' | \
  while read week hash; do
    metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
    if [ -n "$metadata" ]; then
      pct=$(git show $hash:$metadata 2>/dev/null | jq -r '.initial_attribution.agent_percentage // 0')
      echo "$week $pct"
    fi
  done | \
  awk '{week=$1; pct=$2; sum[week]+=$2; count[week]++}
       END {for (w in week_order) {
         if (w in sum) printf "%s: %.1f%% (n=%d)\n", w, sum[w]/count[w], count[w]
       }
       for (w in sum) week_order[w]=1
      }' | sort
```

**Simplified version (faster):**
```bash
git log entire/checkpoints/v1 --format="%H %ad" --date=format:"%Y-W%V" -200 | \
  awk '{week=$NF; hash=$1; print week, hash}' | \
  while read week hash; do
    metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
    [ -n "$metadata" ] && echo "$week $(git show $hash:$metadata 2>/dev/null | jq -r '.initial_attribution.agent_percentage // 0')"
  done | sort | awk '{printf "%s ", $1; for(i=2;i<=NF;i++) sum+=$i; if (NR%5==0) {printf ": %.1f%%\n", sum/5; sum=0} else printf "%s ", $i}'
```

**Expected output:**
```
2025-W05: 68.3%
2025-W06: 72.1%
2025-W07: 75.8%
2025-W08: 73.2%
```

**Customization:**
- Change `-200` → different number of checkpoints
- Monthly analysis: change to `--date=format:"%Y-%m"`

---

### Recipe 3.4: Analyze AI Contribution by File

Analyze how much AI contributed to each individual file.

**Run:**
```bash
LIMIT=50
git log entire/checkpoints/v1 --format="%H" -"$LIMIT" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    pct=$(git show $hash:$metadata 2>/dev/null | jq -r '.initial_attribution.agent_percentage // 0')
    git show $hash:$metadata 2>/dev/null | jq -r '.files_touched[]? // empty' | \
      while read file; do
        echo "$file|$pct"
      done
  fi
done | \
  awk -F'|' '{files[$1]+=$2; count[$1]++}
             END {for (f in files) if (count[f] > 0) printf "%s: %.1f%% (modified %d times)\n", f, files[f]/count[f], count[f]}' | \
  sort -t: -k2 -rn | head -20
```

**Expected output:**
```
src/components/Button.tsx: 88.5% (modified 12 times)
src/hooks/useAuth.ts: 82.3% (modified 15 times)
src/utils/api.ts: 75.2% (modified 8 times)
src/pages/Dashboard.tsx: 68.9% (modified 6 times)
```

**Customization:**
- Change `head -20` → `head -50`, etc.
- Change `-50` → different number of checkpoints

---

## 4️⃣ Search and Filtering Recipes

### Recipe 4.1: Search for Keywords in Prompts

Find checkpoints containing a specific keyword.

**Run:**
```bash
KEYWORD="authentication"
git log entire/checkpoints/v1 --format="%H %ad" --date=short -100 | while read hash date; do
  prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
  if [ -n "$prompt_path" ]; then
    if git show $hash:$prompt_path 2>/dev/null | grep -iq "$KEYWORD"; then
      echo "[$date] $hash"
      git show $hash:$prompt_path | head -2
      echo ""
    fi
  fi
done
```

**Expected output:**
```
[2025-02-12] abc1234
Fix authentication error handling when user tokens expire

[2025-02-10] def5678
Implement OAuth2 authentication for Google login
```

**Customization:**
- Change `authentication` → another keyword
- Regular expressions: use `grep -E "auth|login|session"` to search multiple patterns
- Change `-100` → different number of checkpoints

---

### Recipe 4.2: Search by File Name

Find checkpoints that modified a specific file.

**Run:**
```bash
PATTERN="useAuth"
git log entire/checkpoints/v1 --format="%H %ad" --date=short -100 | while read hash date; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    files=$(git show $hash:$metadata 2>/dev/null | jq -r '.files_touched[]? // empty')
    if echo "$files" | grep -q "$PATTERN"; then
      echo "[$date] $hash"
      echo "$files" | grep "$PATTERN" | sed 's/^/  /'
    fi
  fi
done
```

**Expected output:**
```
[2025-02-12] abc1234
  src/hooks/useAuth.ts

[2025-02-10] def5678
  src/hooks/useAuth.ts

[2025-02-08] ghi9012
  src/hooks/useAuth.ts
```

**Customization:**
- Change `useAuth` → another filename
- Search by extension: change to `PATTERN=".tsx$"`
- Search by path: change to `PATTERN="^src/components"`

---

### Recipe 4.3: Filter by Date Range

View only checkpoints within a specific date range.

**Run:**
```bash
START="2025-02-01"
END="2025-02-10"
git log entire/checkpoints/v1 --since="$START" --until="$END" --format="%H %ad" --date=short | while read hash date; do
  echo "[$date] $hash"
  prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
  [ -n "$prompt_path" ] && git show $hash:$prompt_path 2>/dev/null | head -1 | sed 's/^/  /'
done
```

**Expected output:**
```
[2025-02-10] abc1234
  Fix authentication bug

[2025-02-08] def5678
  Implement dashboard

[2025-02-05] ghi9012
  Add form validation
```

**Customization:**
- Date format: use ISO 8601 (`YYYY-MM-DD`)
- Relative dates: `--since="1 week ago" --until="3 days ago"` also works

---

### Recipe 4.4: Filter by Branch

Search checkpoints from a specific branch or tag only.

**Run:**
```bash
PATTERN="feature"
git log entire/checkpoints/v1 --all --grep="$PATTERN" --format="%H %ad %s" --date=short | head -20
```

Or by branch name:

```bash
git log entire/checkpoints/v1 --format="%H %ad" --date=short -50 | while read hash date; do
  # Use branch info from metadata if available
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && echo "$date $hash $(git show $hash:$metadata 2>/dev/null | jq -r '.branch // "unknown"')"
done | grep -v "unknown"
```

**Expected output:**
```
2025-02-12 abc1234 feature/auth-refactor
2025-02-10 def5678 feature/dashboard
2025-02-08 ghi9012 feature/api-v2
```

**Customization:**
- Change `feature` → another pattern
- Exact match: use `--grep="^feature"`

---

### Recipe 4.5: Multi-condition Search

Find checkpoints that satisfy multiple conditions simultaneously.

**Run:**
```bash
# Example: "auth" keyword + "useAuth.ts" file + 50+ tokens
KEYWORD="auth"
FILE="useAuth"
MIN_TOKENS=1000

git log entire/checkpoints/v1 --format="%H %ad" --date=short -100 | while read hash date; do
  prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)

  if [ -n "$prompt_path" ] && [ -n "$metadata" ]; then
    has_keyword=$(git show $hash:$prompt_path 2>/dev/null | grep -iq "$KEYWORD" && echo 1 || echo 0)
    has_file=$(git show $hash:$metadata 2>/dev/null | jq -r '.files_touched[]? // empty' | grep -q "$FILE" && echo 1 || echo 0)
    tokens=$(git show $hash:$metadata 2>/dev/null | jq -r '.token_usage.output_tokens // 0')

    if [ "$has_keyword" = "1" ] && [ "$has_file" = "1" ] && [ "$tokens" -gt "$MIN_TOKENS" ]; then
      echo "[$date] $hash - Tokens: $tokens"
      git show $hash:$prompt_path 2>/dev/null | head -1 | sed 's/^/  /'
    fi
  fi
done
```

**Expected output:**
```
[2025-02-12] abc1234 - Tokens: 5234
  Fix authentication error handling

[2025-02-10] def5678 - Tokens: 3100
  Implement login flow validation
```

**Customization:**
- Add conditions: connect with `&&`
- Remove conditions: delete the relevant `if` line
- Change logic: use `||` (or), `!` (not)

---

## 5️⃣ Time-based Analysis Recipes

### Recipe 5.1: Group Checkpoints by Day of Week

Find out which day of the week you work the most.

**Run:**
```bash
git log entire/checkpoints/v1 --format="%ad" --date=format:"%A" -200 | sort | uniq -c | sort -rn
```

**Expected output:**
```
     45 Monday
     42 Friday
     38 Thursday
     35 Wednesday
     28 Tuesday
     12 Saturday
      8 Sunday
```

**Customization:**
- Abbreviated day name: use `%a` (short) or `%A` (full)
- Numeric: use `%u` (Mon=1) or `%w` (Sun=0)

---

### Recipe 5.2: Group Checkpoints by Hour

Find out which hours of the day are most active.

**Run:**
```bash
git log entire/checkpoints/v1 --format="%ad" --date=format:"%H" -200 | sort | uniq -c | sort -k2 -n | \
  awk '{printf "%02d:00 - %02d:59 |", $2, $2; for(i=0;i<$1;i++) printf "█"; printf " (%d)\n", $1}'
```

**Expected output:**
```
09:00 - 09:59 |████████████████ (16)
10:00 - 10:59 |██████████████████████ (22)
11:00 - 11:59 |███████████████████ (19)
14:00 - 14:59 |████████████████████████ (24)
15:00 - 15:59 |██████████████ (14)
17:00 - 17:59 |████████ (8)
```

**Customization:**
- 30-minute intervals: use `--date=format:"%H:%M"` (minute data may not be available in metadata)
- Different format: try `--date=format:"%H:%M"` for minute-level granularity

---

### Recipe 5.3: Daily Checkpoint Count Trend

Track how many checkpoints you created each day.

**Run:**
```bash
git log entire/checkpoints/v1 --format="%ad" --date=format:"%Y-%m-%d" -300 | sort | uniq -c | sort -k2 | \
  awk '{printf "%s: ", $2; for(i=0;i<$1;i++) printf "●"; printf " (%d)\n", $1}'
```

**Expected output:**
```
2025-02-05: ●●● (3)
2025-02-06: ●●●●●●● (7)
2025-02-07: ●●●●● (5)
2025-02-08: ●●●●●●●●●●● (11)
2025-02-09: ●●●●●●● (7)
2025-02-10: ●●●●●●●●● (9)
2025-02-11: ●●●● (4)
2025-02-12: ●●●●●●●●●●● (11)
```

**Customization:**
- Switch to weekly: use `--date=format:"%Y-W%V"`
- Switch to monthly: use `--date=format:"%Y-%m"`

---

### Recipe 5.4: Find Most Active Time Slots

Find the top 3 hours with the most checkpoints.

**Run:**
```bash
git log entire/checkpoints/v1 --format="%ad" --date=format:"%H" -200 | sort | uniq -c | sort -rn | head -3 | \
  awk '{printf "%02d:00 hour: %d checkpoints\n", $2, $1}'
```

**Expected output:**
```
14:00 hour: 24 checkpoints
10:00 hour: 22 checkpoints
11:00 hour: 19 checkpoints
```

**Customization:**
- Change `head -3` → `head -5` to see more results
- Change `-200` → different number of checkpoints

---

## 6️⃣ Cache Efficiency Recipes

### Recipe 6.1: Calculate Cache Hit Ratio

Precisely calculate what percentage of all tokens came from cache reads.

**Run:**
```bash
SINCE="1 week ago"
git log entire/checkpoints/v1 --since="$SINCE" --format="%H" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null
done | jq -s '
  map(.token_usage) |
  {
    cache_read: map(.cache_read_tokens // 0) | add,
    input: map(.input_tokens // 0) | add,
    output: map(.output_tokens // 0) | add,
    cache_creation: map(.cache_creation_tokens // 0) | add
  } |
  . as $tokens |
  {
    cache_read: $tokens.cache_read,
    input: $tokens.input,
    output: $tokens.output,
    cache_creation: $tokens.cache_creation,
    total_read: ($tokens.cache_read + $tokens.input),
    cache_hit_ratio: "(\($tokens.cache_read / ($tokens.cache_read + $tokens.input) * 100) | floor)%"
  }
'
```

**Expected output:**
```json
{
  "cache_read": 45600,
  "input": 89200,
  "output": 156400,
  "cache_creation": 8900,
  "total_read": 134800,
  "cache_hit_ratio": "34%"
}
```

**Customization:**
- Change `1 week ago` → another period
- Sorted results: append `| sort_by(.cache_hit_ratio)`

---

### Recipe 6.2: Find Sessions with Low Cache Usage

Identify sessions that barely used the cache.

**Run:**
```bash
THRESHOLD=10
LIMIT=100

git log entire/checkpoints/v1 --format="%H %ad" --date=short -"$LIMIT" | while read hash date; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    data=$(git show $hash:$metadata 2>/dev/null)
    cache_read=$(echo "$data" | jq -r '.token_usage.cache_read_tokens // 0')
    input=$(echo "$data" | jq -r '.token_usage.input_tokens // 0')

    if [ "$input" -gt 0 ]; then
      ratio=$((cache_read * 100 / (cache_read + input)))
      if [ "$ratio" -lt "$THRESHOLD" ]; then
        echo "[$date] $hash - Cache hit: ${ratio}%"
      fi
    fi
  fi
done | head -20
```

**Expected output:**
```
[2025-02-12] abc1234 - Cache hit: 2%
[2025-02-10] def5678 - Cache hit: 5%
[2025-02-08] ghi9012 - Cache hit: 8%
[2025-02-05] jkl3456 - Cache hit: 3%
```

**Customization:**
- Change `10` → another threshold
- Change `head -20` → see more results

---

### Recipe 6.3: Compare Cache Efficiency by Time of Day

Check if cache efficiency varies by time of day.

**Run:**
```bash
git log entire/checkpoints/v1 --format="%H %ad" --date=format:"%H" -200 | \
  awk '{hour=$NF; hash=$1; print hour, hash}' | \
  while read hour hash; do
    metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
    if [ -n "$metadata" ]; then
      data=$(git show $hash:$metadata 2>/dev/null)
      cache=$(echo "$data" | jq -r '.token_usage.cache_read_tokens // 0')
      input=$(echo "$data" | jq -r '.token_usage.input_tokens // 0')
      if [ "$input" -gt 0 ]; then
        ratio=$((cache * 100 / (cache + input)))
        echo "$hour $ratio"
      fi
    fi
  done | awk '{hour=$1; ratio=$2; sum[hour]+=$2; count[hour]++}
              END {for (h=0; h<24; h++) {
                hh=sprintf("%02d", h)
                if (hh in sum) printf "%s:00 | Cache hit: %.1f%%\n", hh, sum[hh]/count[hh]
              }}' | sort
```

**Expected output:**
```
09:00 | Cache hit: 28.3%
10:00 | Cache hit: 31.5%
11:00 | Cache hit: 35.2%
14:00 | Cache hit: 38.9%
15:00 | Cache hit: 32.1%
```

**Customization:**
- Change `-200` → different number of checkpoints
- Weekly analysis: change to `--date=format:"%A"`

---

### Recipe 6.4: Compare Cache Creation vs Cache Read

Check whether you're creating a lot of cache or actually using it well.

**Run:**
```bash
git log entire/checkpoints/v1 --format="%H" -100 | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null
done | jq -s '
  map(.token_usage) |
  {
    cache_creation: map(.cache_creation_tokens // 0) | add,
    cache_read: map(.cache_read_tokens // 0) | add,
    total_cache: (map(.cache_creation_tokens // 0) | add) + (map(.cache_read_tokens // 0) | add)
  } |
  . + {
    creation_pct: "(\(.cache_creation / .total_cache * 100) | floor)%",
    read_pct: "(\(.cache_read / .total_cache * 100) | floor)%"
  }
'
```

**Expected output:**
```json
{
  "cache_creation": 8900,
  "cache_read": 45600,
  "total_cache": 54500,
  "creation_pct": "16%",
  "read_pct": "84%"
}
```

**Healthy state:** `read_pct` > `creation_pct` (good cache utilization)

**Customization:**
- Change `-100` → different number of checkpoints
- Swap ratios: switch order of `creation_pct` and `read_pct`

---

## 7️⃣ Export Recipes

### Recipe 7.1: Export Checkpoint Data to CSV

Save all checkpoint metadata to a CSV file.

**Run:**
```bash
OUTPUT="checkpoints-$(date +%Y%m%d).csv"

# CSV header
echo "date,hash,ai_percentage,input_tokens,output_tokens,cache_read,cache_creation,files_touched_count" > "$OUTPUT"

# Collect data
git log entire/checkpoints/v1 --format="%H %ad" --date=short -200 | while read hash date; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    git show $hash:$metadata 2>/dev/null | jq -r \
      --arg date "$date" \
      --arg hash "$hash" \
      '$date + "," + $hash + "," +
       (.initial_attribution.agent_percentage // 0 | tostring) + "," +
       (.token_usage.input_tokens // 0 | tostring) + "," +
       (.token_usage.output_tokens // 0 | tostring) + "," +
       (.token_usage.cache_read_tokens // 0 | tostring) + "," +
       (.token_usage.cache_creation_tokens // 0 | tostring) + "," +
       (.files_touched | length | tostring)' \
      >> "$OUTPUT"
  fi
done

echo "CSV export complete: $OUTPUT"
wc -l "$OUTPUT"
```

**Result:**
```
checkpoints-20250212.csv created. (201 lines)
```

**Customization:**
- Change `-200` → different number of checkpoints
- Additional columns: add more fields to the jq filter
- Date range: add `--since`, `--until`

---

### Recipe 7.2: Export Checkpoints as JSON

Export data in full JSON format (processable by Excel, Power BI, etc.).

**Run:**
```bash
OUTPUT="checkpoints-$(date +%Y%m%d).json"

git log entire/checkpoints/v1 --format="%H %ad" --date=short -100 | while read hash date; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)

  if [ -n "$metadata" ]; then
    meta=$(git show $hash:$metadata 2>/dev/null)
    prompt=$([ -n "$prompt_path" ] && git show $hash:$prompt_path 2>/dev/null | head -1 || echo "")

    echo "$meta" | jq \
      --arg date "$date" \
      --arg hash "$hash" \
      --arg prompt "$prompt" \
      '. + {date: $date, hash: $hash, prompt: $prompt}'
  fi
done | jq -s '.' > "$OUTPUT"

echo "JSON export complete: $OUTPUT"
ls -lh "$OUTPUT"
```

**Result:**
```
JSON export complete: checkpoints-20250212.json
-rw-r--r--  1 user  staff  256K 2025-02-12 15:30 checkpoints-20250212.json
```

**Usage:**
```bash
# Query the exported data
jq '.[] | select(.initial_attribution.agent_percentage > 80)' checkpoints-20250212.json

# Recalculate statistics
jq '[.[] | .token_usage.output_tokens] | add' checkpoints-20250212.json
```

**Customization:**
- Change `-100` → different number of checkpoints
- Full prompt: remove `| head -1`
- Simplified: select only certain fields

---

### Recipe 7.3: Generate a Shareable Summary Document

Generate a beautiful summary report in markdown format.

**Run:**
```bash
OUTPUT="checkpoint-report-$(date +%Y%m%d).md"

cat > "$OUTPUT" << 'EOF'
# Checkpoint Analysis Report

Generated: $(date)

## 📊 Summary Statistics

EOF

# Add statistics
HASHES=$(git log entire/checkpoints/v1 --since="1 week ago" --format="%H")
COUNT=$(echo "$HASHES" | wc -l)

echo "- **Total Checkpoints**: $COUNT" >> "$OUTPUT"
echo "- **Period**: Last 7 days" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Token statistics
echo "## 💾 Token Usage" >> "$OUTPUT"

TOTAL_INPUT=0
TOTAL_OUTPUT=0
for hash in $HASHES; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    input=$(git show $hash:$metadata 2>/dev/null | jq -r '.token_usage.input_tokens // 0')
    output=$(git show $hash:$metadata 2>/dev/null | jq -r '.token_usage.output_tokens // 0')
    TOTAL_INPUT=$((TOTAL_INPUT + input))
    TOTAL_OUTPUT=$((TOTAL_OUTPUT + output))
  fi
done

echo "- **Input Tokens**: $(printf "%'d\n" $TOTAL_INPUT)" >> "$OUTPUT"
echo "- **Output Tokens**: $(printf "%'d\n" $TOTAL_OUTPUT)" >> "$OUTPUT"
echo "- **Total**: $(printf "%'d\n" $((TOTAL_INPUT + TOTAL_OUTPUT)))" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Top tasks
echo "## 🎯 Top 10 Tasks" >> "$OUTPUT"
echo "" >> "$OUTPUT"

git log entire/checkpoints/v1 --since="1 week ago" --format="%H %ad" --date=short | head -10 | while read hash date; do
  prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
  echo "- **[$date]** $(git show $hash:$prompt_path 2>/dev/null | head -1)" >> "$OUTPUT"
done

echo "" >> "$OUTPUT"
echo "---" >> "$OUTPUT"
echo "Generated: $(date)" >> "$OUTPUT"

echo "Report generation complete: $OUTPUT"
cat "$OUTPUT"
```

**Result:**
```
# Checkpoint Analysis Report

Generated: 2025-02-12 15:35:22 KST

## 📊 Summary Statistics

- **Total Checkpoints**: 47
- **Period**: Last 7 days
- **Input Tokens**: 412,358
- **Output Tokens**: 1,156,234
- **Total**: 1,568,592

## 🎯 Top 10 Tasks

- **[2025-02-12]** Fix critical authentication bug
- **[2025-02-12]** Implement new dashboard features
...
```

**Customization:**
- Change `1 week ago` → another period
- Change `head -10` → show more items
- Change markdown format: `##` → `###`, add/remove emojis

---

### Recipe 7.4: Share a Specific Checkpoint with a Team Member

Extract all information from a specific checkpoint for sharing.

**Run:**
```bash
HASH="abc1234"  # checkpoint hash to share
SHARE_DIR="/tmp/checkpoint-${HASH:0:7}-share"

mkdir -p "$SHARE_DIR"

# Extract metadata
git ls-tree -r --name-only $HASH | grep '/[0-9]/metadata.json$' | tail -1 | \
  xargs -I {} git show $HASH:{} > "$SHARE_DIR/metadata.json"

# Extract prompt
git ls-tree -r --name-only $HASH | grep 'prompt.txt$' | tail -1 | \
  xargs -I {} git show $HASH:{} > "$SHARE_DIR/prompt.txt"

# Extract context
git ls-tree -r --name-only $HASH | grep 'context.md$' | tail -1 | \
  xargs -I {} git show $HASH:{} > "$SHARE_DIR/context.md" 2>/dev/null || echo "No context.md"

# Create README
cat > "$SHARE_DIR/README.md" << EOF
# Checkpoint Share: ${HASH:0:7}

## File Descriptions

- **metadata.json**: Checkpoint metadata
  - Token usage
  - AI contribution
  - List of modified files

- **prompt.txt**: User prompt

- **context.md**: Task context summary

## Usage

\`\`\`bash
# View metadata
cat metadata.json | jq '.'

# View token usage only
cat metadata.json | jq '.token_usage'

# View modified files
cat metadata.json | jq '.files_touched[]'
\`\`\`

## Metadata

$(cat "$SHARE_DIR/metadata.json" | jq '.')
EOF

echo "Checkpoint share complete!"
echo "Location: $SHARE_DIR"
echo "Files:"
ls -lh "$SHARE_DIR"
```

**Result:**
```
Checkpoint share complete!
Location: /tmp/checkpoint-abc1234-share
Files:
total 48
-rw-r--r--  1 user  staff  2.3K metadata.json
-rw-r--r--  1 user  staff  1.8K prompt.txt
-rw-r--r--  1 user  staff   856 context.md
-rw-r--r--  1 user  staff  3.2K README.md
```

**How to share:**
```bash
# Compress to ZIP and share
zip -r checkpoint-abc1234.zip $SHARE_DIR
```

**Customization:**
- Change `abc1234` → the hash to share
- Additional files: other files like `full.jsonl` can also be extracted

---

## 🔧 Extending Recipes

### How to Create New Recipes

1. **Understand the basic structure**
   ```bash
   git log entire/checkpoints/v1 --format="%H" -50 | while read hash; do
     # Extract data from each checkpoint
     metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
     [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq '.field'
   done
   ```

2. **Add filtering**
   ```bash
   if [ condition ]; then
     # Process only when condition is met
   fi
   ```

3. **Add aggregation**
   ```bash
   | awk '{sum+=$1} END {print "Total: " sum}'
   ```

4. **Test it**
   - Start with `-10` on a small dataset
   - Once results look right, expand to `-100`, etc.

---

## 📚 Useful Tips

### jq Filter Cheat Sheet

```bash
# Extract a basic field
jq '.token_usage.output_tokens'

# All array elements
jq '.files_touched[]'

# Conditional filter
jq 'select(.token_usage.output_tokens > 5000)'

# Calculation
jq '.token_usage | .input_tokens + .output_tokens'

# Sort
jq 'sort_by(.token_usage.output_tokens) | reverse'
```

### Git Log Formats

```bash
%H   - Commit hash (full)
%h   - Commit hash (short)
%ad  - Author date (adjustable with --date)
%s   - Subject (first line)

Date formats:
--date=short        → 2025-02-12
--date=format:"%Y-%m"  → 2025-02
--date=format:"%A"  → Monday
--date=format:"%H"  → 14
```

### Performance Optimization

```bash
# Cache metadata first
METADATA=$(git show $hash:$metadata)

# Call jq only once
echo "$METADATA" | jq '.token_usage | ., .input_tokens, .output_tokens'

# Slice large datasets
git log --format="%H" -200 | tail -50  # Process only entries 150-200
```

---

## 🎯 Frequently Used Combinations

### Daily Report
```bash
# Summary of all work done yesterday
git log entire/checkpoints/v1 --since="1 day ago" --until="now" \
  --format="%ad %H" --date=short
```

### Weekly Analysis
```bash
# Last week's statistics
git entirekit stats  # use separate command if available
# or
git log entire/checkpoints/v1 --since="1 week ago" --oneline
```

### Monthly Review
```bash
# Highest contribution sessions for the past month
git log entire/checkpoints/v1 --since="1 month ago" --format="%H" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && echo "$(git show $hash:$metadata 2>/dev/null | jq -r '.initial_attribution.agent_percentage // 0') $hash"
done | sort -rn | head -10
```

---

## 🚨 Troubleshooting

### "Cannot find metadata.json" Error

```bash
# Verify the correct path format
git ls-tree -r --name-only $HASH | grep 'metadata'

# Check if other metadata files exist
git ls-tree -r --name-only $HASH | head -20
```

### jq Not Installed

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Verify installation
jq --version
```

### Permission Denied Error

```bash
# Add execute permission to script
chmod +x script.sh
./script.sh

# Or run directly with bash
bash script.sh
```

---

## 📖 Learn More

- `git log` options: `git log --help`
- `jq` usage: `jq --help` or https://stedolan.github.io/jq/manual/
- Entire documentation: `.entire/docs/` directory
- Basic usage: `advanced-usage.md`

---

**Last Updated**: 2025-02-13
**Compatible with**: EntireKit System v1+
