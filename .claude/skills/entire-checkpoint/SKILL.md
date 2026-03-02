---
name: entire-checkpoint
description: >
  EntireKit data access and querying for AI session history.
  Used for searching past work sessions, viewing checkpoint statistics, listing recent activity, comparing checkpoints, and more.
  Trigger keywords: "checkpoint", "entirekit", "past sessions", "history search",
  "what did I do yesterday", "yesterday's work", "find solution", "compare checkpoints", "recent work"
---

[한국어](SKILL.ko.md)


# EntireKit Operations Tool

A fast access and query tool for the EntireKit system. Provides one-shot commands for everyday checkpoint operations.

## Overview

**What is Entire?** A developer platform that captures AI agent sessions into your Git workflow. It stores AI conversation history, code changes, contributions, token usage, and more on the `entire/checkpoints/v1` branch.

This skill helps you easily search and retrieve checkpoint data.

## Usage Scenarios

Use this skill for requests like:

- "search checkpoints" / "find the login bug checkpoint"
- "show me what I did yesterday" / "check yesterday's work"
- "show checkpoint statistics" / "show token usage"
- "list recent work" / "recent checkpoints"
- "compare these two checkpoints"
- "find how I solved this problem in the past"

## Prerequisites

Before starting checkpoint operations, verify the following:

### 1. Check the entire/checkpoints/v1 Branch

```bash
git rev-parse --verify entire/checkpoints/v1 >/dev/null 2>&1
```

**If the branch doesn't exist:**
- No checkpoints have been created yet
- Working with Claude Code CLI will create it automatically
- If working from another machine: `git fetch origin entire/checkpoints/v1`

### 2. Check Node.js Installation

```bash
node --version
```

**If Node.js is missing, install Node.js 20+ first.**

### 3. Check Git Aliases Setup

```bash
git config --local --get alias.entirekit >/dev/null 2>&1
```

**If aliases are not configured:**

```bash
npx entirekit install
```

After installation, the following commands are available:
- `git entirekit stats` - Statistics analysis
- `git entirekit search` - Keyword search
- `git entirekit recent` - Last 10 checkpoints
- `git entirekit today` - Today's checkpoints
- `git entirekit yesterday` - Yesterday's checkpoints
- `git entirekit week` - Last 1 week
- `git entirekit diff` - Compare two checkpoints
- `git entirekit report` - Generate HTML report

## Quick Command Reference

### git entirekit stats - Statistics Analysis

**Purpose:** Token usage, AI contribution, most-modified files, recent session summaries

**Run:**
```bash
git entirekit stats
```

**Sample output:**
```
💰 Token Usage Statistics (last 10 checkpoints):
  Input tokens: 1,380
  Output tokens: 3,220
  Cache read tokens: 27,659,090
  Total API calls: 470
  Sessions analyzed: 10

🤖 AI Contribution Analysis:
  Total agent lines: 2,847
  Total human modified: 456
  Average AI contribution: 73.7%
  Sessions with changes: 8

📝 Top 10 Most-Touched Files:
  5 src/app/[locale]/layout.tsx
  4 src/app/[locale]/games/[id]/page.tsx
  3 src/hooks/useAuth.ts
```

### git entirekit search - Keyword Search

**Purpose:** Search for specific keywords across past sessions

**Run:**
```bash
git entirekit search "<search term>"
```

**Examples:**
```bash
# Find work related to "login"
git entirekit search "login"

# Search by file name
git entirekit search "LoginForm.tsx"

# Search by error message
git entirekit search "TypeError"
```

**Output:** Prompt contents and related file modification history

### git entirekit recent - Recent Checkpoint List

**Purpose:** List the last 10 checkpoint hashes and summaries

**Run:**
```bash
git entirekit recent
```

**Sample output:**
```
ac03096 2026-02-13 Work related to login action
f5d02f6 2026-02-13 OG image optimization
375e65c 2026-02-12 Page transition improvements
```

### git entirekit today/yesterday/week - Time Filters

**Purpose:** View checkpoints for a specific time period

**Run:**
```bash
git entirekit today      # Today
git entirekit yesterday  # Yesterday
git entirekit week       # Last 1 week
```

### git entirekit diff - Compare Checkpoints

**Purpose:** Compare the difference between two checkpoints (tokens, files, AI contribution)

**Run:**
```bash
git entirekit diff <hash1> <hash2>
```

**Example:**
```bash
# 1. Check hashes from the recent list
git entirekit recent

# 2. Select two and compare
git entirekit diff ac03096 f5d02f6
```

### git entirekit report - Generate HTML Report

**Purpose:** Generate a visual dashboard viewable in a browser

**Run:**
```bash
git entirekit report
```

**Note:** This command is built into the TypeScript CLI.

## Workflows

### Workflow 1: Search for Past Solutions

**Scenario:** "I think I've seen this bug before..."

**Steps:**
1. Get keyword from user
2. Run `git entirekit search "<keyword>"`
3. If results found, display checkpoint hash and prompt
4. If user is interested in a checkpoint, provide the full conversation:
   ```bash
   HASH="ac03096"
   JSONL_PATH=$(git ls-tree -r --name-only $HASH | grep 'full.jsonl$' | tail -1)
   git show $HASH:$JSONL_PATH | jq -r '.content'
   ```
5. If no results, suggest alternative keywords

**Example:**
```
User: "How did I fix the login bug?"
Assistant: Run git entirekit search "login"
→ [2026-02-13] Checkpoint: ac03096 found
→ Display prompt content
→ Ask "Would you like to see the full conversation?"
```

### Workflow 2: View Session Details

**Scenario:** Check all information for a specific checkpoint

**Steps:**
1. Get checkpoint hash (from `git entirekit recent` or search)
2. Extract metadata:
   ```bash
   get_metadata_path() {
     local hash=$1
     git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1
   }
   metadata_path=$(get_metadata_path $HASH)
   git show $HASH:$metadata_path | jq .
   ```
3. Extract context:
   ```bash
   context_path=$(git ls-tree -r --name-only $HASH | grep 'context.md$' | head -1)
   git show $HASH:$context_path
   ```
4. Extract prompt:
   ```bash
   prompt_path=$(git ls-tree -r --name-only $HASH | grep 'prompt.txt$' | head -1)
   git show $HASH:$prompt_path
   ```
5. Extract full conversation if needed (full.jsonl)

**Display format:**
```markdown
## Checkpoint: ac03096
**Date:** 2026-02-13
**Branch:** feature/login

### Prompt
[Prompt content...]

### Statistics
- Input tokens: 145
- Output tokens: 320
- AI contribution: 78%

### Modified Files
- src/app/[locale]/(auth)/login/page.tsx
- src/hooks/useAuth.ts

### Context
[Context summary...]
```

### Workflow 3: Compare Checkpoints

**Scenario:** "What's the difference between these two sessions?"

**Steps:**
1. Run `git entirekit recent` to display the list
2. User selects two hashes
3. Run `git entirekit diff <hash1> <hash2>`
4. Display comparison results:
   - Token usage changes
   - File modification differences
   - AI contribution changes

**Sample output:**
```
📊 Checkpoint Comparison: ac03096 vs f5d02f6

🔢 Token Usage Comparison:
Checkpoint 1:
  Input: 145, Output: 320, Cache: 12,450

Checkpoint 2:
  Input: 89, Output: 156, Cache: 8,920

📝 Modified Files Comparison:
Checkpoint 1: 5 files
Checkpoint 2: 2 files
```

## Direct Data Access Patterns

When you need to access data directly without using scripts:

### Helper Function: get_metadata_path()

```bash
get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}
```

**Purpose:** Extract the metadata.json path from a checkpoint hash

### Traversing the Checkpoint Branch

```bash
# Last 10 checkpoint hashes
git log entire/checkpoints/v1 --format="%H" -10

# With dates
git log entire/checkpoints/v1 --format="%H %ad" --date=short -10

# For a specific period
git log entire/checkpoints/v1 --since="2 weeks ago" --format="%H"
```

### jq Query Patterns

```bash
# Extract token usage
git show $HASH:$metadata_path | jq '.token_usage'

# Specific fields only
git show $HASH:$metadata_path | jq -r '.token_usage.output_tokens'

# List modified files
git show $HASH:$metadata_path | jq -r '.files_touched[]'

# AI contribution
git show $HASH:$metadata_path | jq '.initial_attribution.agent_percentage'
```

### File Tree Navigation

```bash
# List all files in a checkpoint
git ls-tree -r --name-only $HASH

# Specific file types only
git ls-tree -r --name-only $HASH | grep '\.json$'
git ls-tree -r --name-only $HASH | grep 'prompt.txt$'
git ls-tree -r --name-only $HASH | grep 'full.jsonl$'
```

## Error Handling

### Branch Missing

**Error:**
```
fatal: ambiguous argument 'entire/checkpoints/v1': unknown revision
```

**Resolution:**
1. Entire is not configured or no checkpoints have been created yet
2. If working from another machine: `git fetch origin entire/checkpoints/v1`
3. If first time use, work with Claude Code CLI and wait for checkpoint creation

### jq Missing

**Error:**
```
jq: command not found
```

**Resolution:**
- macOS: `brew install jq`
- Ubuntu: `sudo apt-get install jq`
- CentOS: `sudo yum install jq`

### No Search Results

**Message:** "No search results"

**Resolution:**
1. Retry with broader keywords
2. Search by file name
3. Expand the date range
4. Check for typos

**Suggested alternatives:**
```
No results found. Try the following:
- More general keywords: "login" instead of "auth"
- Search by file name: "LoginForm" or ".tsx"
- Browse the full list manually: git entirekit recent
```

### Git Aliases Missing

**Error:**
```
git: 'entirekit stats' is not a git command
```

**Resolution:**
```bash
npx entirekit install
```

Confirm overwrite if reinstallation is needed, then proceed.

## Advanced Tips

### 1. Change History for a Specific File

```bash
FILE="src/hooks/useAuth.ts"
git log entire/checkpoints/v1 --format="%H %ad" --date=short -30 | while read hash date; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')
    if echo "$files" | grep -q "$FILE"; then
      echo "[$date] $hash"
    fi
  fi
done
```

### 2. Aggregate Token Usage

```bash
# Total output tokens over the last 2 weeks
HASHES=$(git log entire/checkpoints/v1 --since="2 weeks ago" --format="%H")
total=0
for hash in $HASHES; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    tokens=$(git show $hash:$metadata | jq -r '.token_usage.output_tokens // 0')
    total=$((total + tokens))
  fi
done
echo "Total output tokens: $total"
```

### 3. Read Full Conversation

```bash
HASH="ac03096"
JSONL_PATH=$(git ls-tree -r --name-only $HASH | grep 'full.jsonl$' | tail -1)
git show $HASH:$JSONL_PATH | jq -r '.content' | less
```

## Reference Documents

For more details, see the following reference documents:

- [commands.md](./references/commands.md) - Detailed reference for all git alias commands
- [data-structure.md](./references/data-structure.md) - Checkpoint data structure and access patterns

## Related Skills

- **entire-analytics** - Advanced analysis tasks including deep analytics, report generation, cost analysis, and trend tracking
