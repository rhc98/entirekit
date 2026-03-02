[한국어](advanced-usage.ko.md)

# Advanced Usage

How to leverage the more powerful features of the Checkpoint tool.

## 🎯 Advanced Search

### 1. Multi-Condition Search

Combine multiple keywords to search:

```bash
# Only files related to "login"
git entirekit search "login" | grep "Files touched"

# Specific date range
git log entire/checkpoints/v1 --since="2 weeks ago" --until="1 week ago" --oneline
```

### 2. Regex Search

```bash
# grep directly from the checkpoint branch
git log entire/checkpoints/v1 --format="%H" -50 | while read hash; do
  path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
  content=$(git show $hash:$path 2>/dev/null)
  if echo "$content" | grep -E "login|auth" >/dev/null; then
    echo "Found in $hash"
    echo "$content" | head -3
    echo ""
  fi
done
```

### 3. Per-File Change History

Track when a specific file was modified:

```bash
FILE="src/hooks/useAuth.ts"

git log entire/checkpoints/v1 --format="%H %ad" --date=short -30 | while read hash date; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')
    if echo "$files" | grep -q "$FILE"; then
      echo "[$date] $hash"
      # Also print the prompt for this checkpoint
      prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
      git show $hash:$prompt_path 2>/dev/null | head -2
      echo ""
    fi
  fi
done
```

## 📊 Statistics Analysis

### 1. Custom Stats Extraction

Statistics for a specific period:

```bash
# Token usage over the past 2 weeks
HASHES=$(git log entire/checkpoints/v1 --since="2 weeks ago" --format="%H")

total_tokens=0
for hash in $HASHES; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    tokens=$(git show $hash:$metadata | jq -r '.token_usage.output_tokens // 0')
    total_tokens=$((total_tokens + tokens))
  fi
done

echo "Output tokens over the past 2 weeks: $total_tokens"
```

### 2. Per-File AI Contribution

See which files had the most AI involvement:

```bash
git log entire/checkpoints/v1 --format="%H" -30 | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    data=$(git show $hash:$metadata 2>/dev/null)
    pct=$(echo "$data" | jq -r '.initial_attribution.agent_percentage // 0')
    files=$(echo "$data" | jq -r '.files_touched[]? // empty' | head -3)

    if (( $(echo "$pct > 70" | bc -l) )); then
      echo "AI ${pct}% contribution:"
      echo "$files" | sed 's/^/  - /'
      echo ""
    fi
  fi
done
```

### 3. Productivity Trends

Analyze productivity over time:

```bash
# Number of checkpoints per week
git log entire/checkpoints/v1 --format="%ad" --date=format:"%Y-%U" | \
  sort | uniq -c | tail -10

# Patterns by day of week
git log entire/checkpoints/v1 --format="%ad" --date=format:"%A" | \
  sort | uniq -c
```

## 🔬 Deep Analysis

### 1. Extract Full Conversation History

View all messages for a specific checkpoint:

```bash
HASH="ac03096"  # Select from git entirekit recent

# Find the full.jsonl path
JSONL_PATH=$(git ls-tree -r --name-only $HASH | grep 'full.jsonl$' | tail -1)

# Extract content (formatted for readability)
git show $HASH:$JSONL_PATH | jq -r '.content' | less
```

### 2. Prompt Pattern Analysis

Discover frequently used prompt patterns:

```bash
# Extract just the first line of each prompt
git log entire/checkpoints/v1 --format="%H" -50 | while read hash; do
  prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
  git show $hash:$prompt_path 2>/dev/null | head -1
done | sort | uniq -c | sort -rn | head -20
```

### 3. Token Efficiency Analysis

Find sessions that accomplished a lot with few tokens:

```bash
git log entire/checkpoints/v1 --format="%H" -30 | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    data=$(git show $hash:$metadata 2>/dev/null)
    tokens=$(echo "$data" | jq -r '.token_usage.output_tokens // 0')
    files_count=$(echo "$data" | jq -r '.files_touched | length // 0')

    if [ "$tokens" -lt 1000 ] && [ "$files_count" -gt 2 ]; then
      echo "Efficient: ${tokens} tokens, ${files_count} files - $hash"
    fi
  fi
done
```

## 💾 Data Export

### 1. Generate Monthly Report

```bash
#!/bin/bash
# monthly-report.sh

MONTH=$(date +%Y-%m)
OUTPUT="checkpoint-report-${MONTH}.md"

cat > "$OUTPUT" << EOF
# Checkpoint Report - $MONTH

## Statistics

$(git entirekit stats)

## Key Work

EOF

git log entire/checkpoints/v1 --since="1 month ago" --format="%H %ad" --date=short | \
  head -20 | while read hash date; do
    prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
    echo "### [$date] Checkpoint ${hash:0:7}" >> "$OUTPUT"
    git show $hash:$prompt_path 2>/dev/null | head -3 >> "$OUTPUT"
    echo "" >> "$OUTPUT"
done

echo "Report generated: $OUTPUT"
```

### 2. Share a Specific Checkpoint with a Teammate

```bash
#!/bin/bash
# export-checkpoint.sh <hash>

HASH=$1
OUTPUT_DIR="/tmp/checkpoint-${HASH:0:7}"

mkdir -p "$OUTPUT_DIR"

# Extract all related files
for file in full.jsonl context.md prompt.txt metadata.json; do
  path=$(git ls-tree -r --name-only $HASH | grep "$file$" | tail -1)
  if [ -n "$path" ]; then
    git show $HASH:$path > "$OUTPUT_DIR/$file"
  fi
done

# Generate README
cat > "$OUTPUT_DIR/README.txt" << EOF
Checkpoint: $HASH
Exported: $(date)

Files:
- full.jsonl: Full conversation history
- context.md: Summary
- prompt.txt: User prompt
- metadata.json: Metadata (tokens, files, etc.)

How to read:
cat full.jsonl | jq -r '.content'
EOF

echo "Checkpoint exported to: $OUTPUT_DIR"
```

## 🛠️ Automation

### 1. Daily Slack Notification

```bash
#!/bin/bash
# daily-slack-notify.sh

WEBHOOK_URL="your-slack-webhook-url"

STATS=$(git entirekit yesterday)
COUNT=$(echo "$STATS" | wc -l)

curl -X POST $WEBHOOK_URL -H 'Content-Type: application/json' -d '{
  "text": "Yesterday we had '"$COUNT"' checkpoint sessions",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "```'"$STATS"'```"
      }
    }
  ]
}'
```

### 2. Automated Weekly Review

```bash
#!/bin/bash
# weekly-review.sh

echo "# Weekly Review - $(date +%Y-%W)"
echo ""

echo "## Overview"
git log entire/checkpoints/v1 --since="1 week ago" --oneline | wc -l | \
  xargs echo "Total checkpoints:"

echo ""
echo "## Statistics"
git entirekit stats

echo ""
echo "## Hot Files"
git log entire/checkpoints/v1 --since="1 week ago" --format="%H" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  git show $hash:$metadata 2>/dev/null | jq -r '.files_touched[]? // empty'
done | sort | uniq -c | sort -rn | head -10
```

## 🔍 Debugging Tips

### 1. Find When an Error First Occurred

```bash
ERROR_MSG="TypeError"

git log entire/checkpoints/v1 --format="%H %ad" --date=short --reverse | \
  while read hash date; do
    prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
    if git show $hash:$prompt_path 2>/dev/null | grep -q "$ERROR_MSG"; then
      echo "First occurrence: [$date] $hash"
      git show $hash:$prompt_path | head -5
      break
    fi
done
```

### 2. Track a Regression Bug

```bash
# Find the last checkpoint where a feature was working
FEATURE="login"

git log entire/checkpoints/v1 --format="%H %ad" --date=short | \
  while read hash date; do
    if git entirekit search "$FEATURE" 2>/dev/null | grep -q "$hash"; then
      echo "[$date] Feature mentioned: $hash"
    fi
done
```

## 🎓 Best Practices

### 1. Regular Reviews

```bash
# Add to ~/.bashrc or ~/.zshrc
alias morning='git entirekit yesterday'
alias weekly='git entirekit week && git entirekit stats'
```

### 2. Team Sharing Template

Document important checkpoints:

```markdown
## [Feature Name] Implementation (Checkpoint: abc1234)

### Background
- Why it was built

### Implementation
- Search checkpoint: `git entirekit search "feature name"`
- Key files: ...

### Results
- Token usage: ...
- AI contribution: ...
```

### 3. Cost Optimization

Improving cache efficiency:

```bash
# Check cache read ratio
git entirekit stats | grep "Cache"

# If the ratio is low:
# - Maintain context when modifying the same file multiple times
# - Reduce unnecessary file reads
```

## 🚀 Advanced Integrations

### Git Hook Integration

`.git/hooks/post-commit`:
```bash
#!/bin/bash
# Check recent checkpoints on every commit

echo "Recent checkpoints:"
git entirekit recent | head -3
```

### IDE Integration

VSCode tasks.json:
```json
{
  "label": "Checkpoint Stats",
  "type": "shell",
  "command": "git entirekit stats",
  "problemMatcher": []
}
```

## 📚 References

- [Entire GitHub](https://github.com/entireio/cli)
- [Claude Code Documentation](https://claude.com/claude-code)
- [jq Manual](https://stedolan.github.io/jq/manual/)

---

**Next steps:**
- Try it out in practice
- Integrate into your team's workflow
- Build your own custom scripts
