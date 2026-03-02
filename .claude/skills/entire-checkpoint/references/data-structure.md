[한국어](data-structure.ko.md)

# Checkpoint Data Structure and Access Patterns

Checkpoints are a Git-based system for storing snapshots of Claude Code sessions. Each checkpoint includes metadata, a prompt, context, and a full conversation log, all stored in a structured format on the `entire/checkpoints/v1` branch.

## 1. Branch Structure (entire/checkpoints/v1)

### Directory Hierarchy

```
entire/checkpoints/v1
├── 07/                          # Session hash (first 2 characters)
│   ├── 4ecf83c083/              # Session hash (full)
│   │   ├── 0/                   # Checkpoint number (first)
│   │   │   ├── metadata.json
│   │   │   ├── prompt.txt
│   │   │   ├── context.md
│   │   │   ├── full.jsonl
│   │   │   └── content_hash.txt
│   │   ├── 1/                   # Checkpoint number (second)
│   │   │   ├── metadata.json
│   │   │   ├── prompt.txt
│   │   │   ├── context.md
│   │   │   ├── full.jsonl
│   │   │   └── content_hash.txt
│   │   └── metadata.json        # Session-level metadata
│   │
│   ├── 65/
│   │   ├── d982e9d6db/
│   │   │   ├── 0/
│   │   │   └── 1/
│   │   └── metadata.json
│   │
│   └── ...
│
├── 23/
│   ├── 62034fcea4/
│   │   ├── 0/
│   │   ├── 1/
│   │   └── metadata.json
│   └── ...
│
└── ...
```

### Path Patterns

- **Session directory**: `{session_hash_prefix_2}/{session_hash_full}/`
- **Checkpoint directory**: `{session_hash_prefix_2}/{session_hash_full}/{checkpoint_number}/`
- **Metadata**: `{session_hash_prefix_2}/{session_hash_full}/{checkpoint_number}/metadata.json`

### Branch Navigation

```bash
# View all checkpoint commits
git log entire/checkpoints/v1 --oneline

# View a specific number of recent commits
git log entire/checkpoints/v1 --oneline -20

# View with detailed information
git log entire/checkpoints/v1 --format="%H %ad %s" --date=short
```

## 2. Checkpoint File Types

Each checkpoint contains the following 5 files:

### 2.1 metadata.json - Metadata

A JSON file containing all important information about the session.

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `cli_version` | string | Claude Code CLI version |
| `checkpoint_id` | string | Unique checkpoint ID (abbreviated session_hash) |
| `session_id` | string | Session UUID (full unique identifier) |
| `strategy` | string | Checkpoint creation strategy (manual-commit, auto, etc.) |
| `created_at` | string | Creation time in ISO8601 format |
| `branch` | string | Current Git branch name |
| `checkpoints_count` | number | Number of previous checkpoints in this session |
| `files_touched` | array | List of modified file paths |
| `agent` | string | Name of the AI agent used |
| `checkpoint_transcript_start` | number | Transcript start line number |
| `transcript_lines_at_start` | number | Total transcript line count at the start |
| `token_usage` | object | Token usage statistics |
| `initial_attribution` | object | AI contribution analysis |

**Token Usage (token_usage):**

```json
{
  "input_tokens": 9,              // Input tokens
  "cache_creation_tokens": 36048, // Cache creation tokens
  "cache_read_tokens": 128739,    // Cache read tokens
  "output_tokens": 24,            // Output tokens
  "api_call_count": 3             // API call count
}
```

**AI Contribution (initial_attribution):**

```json
{
  "calculated_at": "2026-02-12T08:34:26.971784Z",
  "agent_lines": 11,              // Lines written by AI
  "human_added": 23,              // Lines added by the user
  "human_modified": 0,            // Lines modified by the user
  "human_removed": 0,             // Lines deleted by the user
  "total_committed": 34,          // Total committed lines
  "agent_percentage": 32.35       // AI contribution ratio (%)
}
```

### 2.2 prompt.txt - Original Prompt

The user's original question or request. May contain multiple lines of input, stored as plain text without markdown or special formatting.

```
The existing webview bridge integration in user-web was built for the old app version
and needs to be migrated to match the new version (user-app-flutter)

Let's analyze the existing bridge integration structure in the web project alongside the new app's bridge structure
and implement the bridge interface and webview account authentication structure for the web side
```

### 2.3 context.md - Session Context Summary

A markdown document summarizing the session state at the time of the checkpoint.

**Contents include:**
- Work progress to date
- Key findings
- Current stage
- Next steps
- Technical decisions

```markdown
## Session Summary

### Current Task
Web bridge migration from React Native to Flutter

### Progress
- Analyzed old bridge structure (@webview-bridge/web)
- Analyzed new Flutter bridge structure (flutter_inappwebview)
- Implemented new MyAppBridgeAPI
- Created BridgeProvider with MyApp integration

### Key Findings
- Token sync: only access_token synced to Flutter
- Render blocking: removed from BridgeProvider
- App version: read from User-Agent MyApp/<version>

### Next Steps
- Testing with Flutter app
- Review and merge MR
```

### 2.4 full.jsonl - Full Conversation Log

The complete conversation log stored in JSONL format (one object per line). Each line represents a single event.

**Sample event types:**

```jsonl
{"type":"progress","data":{"type":"hook_progress","command":"..."},"timestamp":"..."}
{"type":"message","userType":"external","content":"user message","timestamp":"..."}
{"type":"tool-use","toolName":"Bash","command":"git status","timestamp":"..."}
{"type":"tool-result","result":"output...","timestamp":"..."}
```

**Characteristics:**
- Recorded in chronological order
- Contains all interactions from the session
- May be a large file (potentially tens of MB)
- Raw data for analysis and replay

### 2.5 content_hash.txt - Content Hash

A hash value for verifying the integrity of the checkpoint contents.

```
abc123def456...
```

## 3. metadata.json Schema (Complete Example)

```json
{
  "cli_version": "0.4.2",
  "checkpoint_id": "074ecf83c083",
  "session_id": "6eecbb19-216d-4a8f-88ff-c697daabfa50",
  "strategy": "manual-commit",
  "created_at": "2026-02-12T08:34:27.059716Z",
  "branch": "feature/migrate_webview",
  "checkpoints_count": 0,
  "files_touched": [
    "src/app/[locale]/(auth)/login/_hooks/useCredentialLoginFlow.ts",
    "src/app/[locale]/(auth)/login/_hooks/useLoginFlow.ts",
    "src/app/[locale]/more/_components/ServiceNotice.tsx",
    "src/components/SessionWatcher.tsx",
    "src/components/menu/UserAccount.tsx",
    "src/hooks/useInitBridgeAuth.ts",
    "src/lib/myAppBridge.ts",
    "src/providers/BridgeProvider.tsx",
    "src/types/bridge.types.ts",
    "src/types/global.d.ts"
  ],
  "agent": "Claude Code",
  "checkpoint_transcript_start": 597,
  "transcript_lines_at_start": 597,
  "token_usage": {
    "input_tokens": 9,
    "cache_creation_tokens": 36048,
    "cache_read_tokens": 128739,
    "output_tokens": 24,
    "api_call_count": 3
  },
  "initial_attribution": {
    "calculated_at": "2026-02-12T08:34:26.971784Z",
    "agent_lines": 11,
    "human_added": 23,
    "human_modified": 0,
    "human_removed": 0,
    "total_committed": 34,
    "agent_percentage": 32.35294117647059
  }
}
```

## 4. Git Traversal Patterns

### 4.1 List All Checkpoints

```bash
# Display in newest-first order
git log entire/checkpoints/v1 --oneline -20

# Extract hashes only
git log entire/checkpoints/v1 --format="%H" -20

# Display with dates
git log entire/checkpoints/v1 --format="%H %ad" --date=short -20
```

### 4.2 View the File Tree of a Checkpoint

```bash
# List all files in a specific commit
git ls-tree -r --name-only ac03096

# Display with file sizes
git ls-tree -r -l ac03096

# Extract only metadata.json
git ls-tree -r --name-only ac03096 | grep metadata.json
```

### 4.3 Extract and Read Files

```bash
# Read metadata.json
git show ac03096:07/4ecf83c083/0/metadata.json

# Read prompt.txt
git show ac03096:07/4ecf83c083/0/prompt.txt

# Read context.md
git show ac03096:07/4ecf83c083/0/context.md

# Read the first 100 lines of full.jsonl
git show ac03096:07/4ecf83c083/0/full.jsonl | head -100
```

## 5. Helper Function: get_metadata_path()

Since the checkpoint path differs per session, you should always use the `get_metadata_path()` function to find the metadata path.

```bash
# Define the helper function
get_metadata_path() {
  local hash=$1
  # Match with /[0-9]/metadata.json pattern (checkpoint level, not session level)
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# Usage example
metadata_path=$(get_metadata_path ac03096)
echo $metadata_path
# Output: 07/4ecf83c083/0/metadata.json

# Read file contents
git show ac03096:$metadata_path | jq .
```

**Important:** The regex `/[0-9]/metadata.json$` ensures:
- Only checkpoint-level metadata is selected (not session-level)
- Exact path extraction (selects the first of multiple paths)

## 6. jq Query Recipes

### 6.1 Extract Token Usage

```bash
# View full token usage
git show ac03096:$metadata_path | jq '.token_usage'

# Input tokens only
git show ac03096:$metadata_path | jq '.token_usage.input_tokens'

# Calculate total of all tokens
git show ac03096:$metadata_path | jq '.token_usage |
  .input_tokens + .output_tokens + .cache_creation_tokens + .cache_read_tokens'
```

### 6.2 Extract AI Contribution

```bash
# Full contribution information
git show ac03096:$metadata_path | jq '.initial_attribution'

# AI contribution percentage only
git show ac03096:$metadata_path | jq '.initial_attribution.agent_percentage'

# AI line count
git show ac03096:$metadata_path | jq '.initial_attribution.agent_lines'
```

### 6.3 Extract List of Modified Files

```bash
# Full file list
git show ac03096:$metadata_path | jq '.files_touched[]'

# Filter only files matching a specific pattern (e.g., src/components/)
git show ac03096:$metadata_path | jq '.files_touched[] |
  select(startswith("src/components/"))'

# Count number of files
git show ac03096:$metadata_path | jq '.files_touched | length'

# Output file list with newlines
git show ac03096:$metadata_path | jq -r '.files_touched[]'
```

### 6.4 Filter by Date

```bash
# Checkpoints after 2026-02-12
git log entire/checkpoints/v1 --format="%H" | while read hash; do
  date=$(git show $hash:$metadata_path 2>/dev/null | jq -r '.created_at')
  if [[ "$date" > "2026-02-12" ]]; then
    echo "$hash $date"
  fi
done

# Specific date range
git log entire/checkpoints/v1 --format="%H" --since="2026-02-01" --until="2026-02-15"
```

### 6.5 Filter by Branch

```bash
# Only checkpoints from feature/migrate_webview branch
git log entire/checkpoints/v1 --format="%H" | while read hash; do
  branch=$(git show $hash:$metadata_path 2>/dev/null | jq -r '.branch')
  if [ "$branch" = "feature/migrate_webview" ]; then
    echo "$hash"
  fi
done

# Checkpoint count per branch
git log entire/checkpoints/v1 --format="%H" | while read hash; do
  git show $hash:$metadata_path 2>/dev/null | jq -r '.branch'
done | sort | uniq -c
```

### 6.6 Aggregate Statistics

```bash
# Average AI contribution (last 10)
git log entire/checkpoints/v1 --format="%H" -10 | while read hash; do
  metadata_path=$(git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1)
  git show $hash:$metadata_path 2>/dev/null | jq '.initial_attribution.agent_percentage'
done | awk '{s+=$1; n++} END {print s/n}'

# Total token usage (last 20)
git log entire/checkpoints/v1 --format="%H" -20 | while read hash; do
  metadata_path=$(git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1)
  git show $hash:$metadata_path 2>/dev/null | jq '.token_usage |
    .input_tokens + .output_tokens + .cache_creation_tokens + .cache_read_tokens'
done | awk '{s+=$1} END {print s}'
```

## 7. Access Pattern Examples

### 7.1 Read Metadata for a Specific Hash

```bash
#!/bin/bash

HASH="ac03096"

# Helper function
get_metadata_path() {
  git ls-tree -r --name-only $1 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# Find metadata path
metadata_path=$(get_metadata_path $HASH)
echo "Metadata path: $metadata_path"

# Print full metadata
echo "=== Full Metadata ==="
git show $HASH:$metadata_path | jq .

# Extract key information only
echo ""
echo "=== Summary ==="
git show $HASH:$metadata_path | jq '{
  session_id: .session_id,
  branch: .branch,
  created_at: .created_at,
  files_touched: (.files_touched | length),
  token_usage: .token_usage,
  ai_contribution: .initial_attribution.agent_percentage
}'
```

### 7.2 Extract All Prompts from the Last 10 Checkpoints

```bash
#!/bin/bash

echo "📝 Prompts from the last 10 checkpoints"
echo "=================================="

git log entire/checkpoints/v1 --format="%H" -10 | while read hash; do
  echo ""
  echo "--- Checkpoint: ${hash:0:7} ---"

  # Find prompt path
  prompt_path=$(git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/prompt.txt$' | tail -1)

  if [ -n "$prompt_path" ]; then
    echo "Path: $prompt_path"
    echo "Content:"
    git show $hash:$prompt_path | head -10
  else
    echo "No prompt found"
  fi
done
```

### 7.3 Find Checkpoints That Modified a Specific File

```bash
#!/bin/bash

TARGET_FILE="src/lib/mapoBridge.ts"

echo "🔍 Checkpoints that modified '$TARGET_FILE'"
echo "================================================"

get_metadata_path() {
  git ls-tree -r --name-only $1 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

git log entire/checkpoints/v1 --format="%H %ad" --date=short -20 | while read hash date; do
  metadata_path=$(get_metadata_path $hash)

  if [ -n "$metadata_path" ]; then
    # Search for the target file in files_touched
    if git show $hash:$metadata_path 2>/dev/null | jq -r '.files_touched[]' | grep -q "^${TARGET_FILE}$"; then
      echo ""
      echo "[$date] Checkpoint: ${hash:0:7}"
      echo "Branch: $(git show $hash:$metadata_path | jq -r '.branch')"
      echo "AI Contribution: $(git show $hash:$metadata_path | jq -r '.initial_attribution.agent_percentage')%"
    fi
  fi
done
```

### 7.4 Calculate Token Usage Within a Date Range

```bash
#!/bin/bash

START_DATE="2026-02-01"
END_DATE="2026-02-15"

echo "💰 Token usage for $START_DATE ~ $END_DATE"
echo "================================================"

get_metadata_path() {
  git ls-tree -r --name-only $1 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

total_input=0
total_output=0
total_cache=0
count=0

git log entire/checkpoints/v1 --format="%H" --all | while read hash; do
  metadata_path=$(get_metadata_path $hash)
  if [ -n "$metadata_path" ]; then
    data=$(git show $hash:$metadata_path 2>/dev/null)
    created=$(echo "$data" | jq -r '.created_at' | cut -d'T' -f1)

    if [[ "$created" > "$START_DATE" ]] && [[ "$created" < "$END_DATE" ]]; then
      input=$(echo "$data" | jq '.token_usage.input_tokens // 0')
      output=$(echo "$data" | jq '.token_usage.output_tokens // 0')
      cache=$(echo "$data" | jq '.token_usage.cache_read_tokens // 0')

      total_input=$((total_input + input))
      total_output=$((total_output + output))
      total_cache=$((total_cache + cache))
      count=$((count + 1))
    fi
  fi
done

echo "Total checkpoints: $count"
echo "Input tokens: $total_input"
echo "Output tokens: $total_output"
echo "Cache tokens: $total_cache"
echo "Total: $((total_input + total_output + total_cache))"
```

### 7.5 Extract Multiple Pieces of Information in a Single Query

```bash
#!/bin/bash

HASH="ac03096"

get_metadata_path() {
  git ls-tree -r --name-only $1 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

metadata_path=$(get_metadata_path $HASH)
data=$(git show $HASH:$metadata_path)

# Extract multiple pieces of information in a single jq call
info=$(echo "$data" | jq '{
  session_id: .session_id,
  checkpoint_id: .checkpoint_id,
  branch: .branch,
  created_at: .created_at,
  files_count: (.files_touched | length),
  input_tokens: .token_usage.input_tokens,
  output_tokens: .token_usage.output_tokens,
  cache_tokens: .token_usage.cache_read_tokens,
  ai_percentage: .initial_attribution.agent_percentage,
  human_lines: .initial_attribution.human_added,
  agent_lines: .initial_attribution.agent_lines
}')

echo "$info" | jq .
```

## 8. Advanced Usage

### 8.1 Checkpoint Script Example (Full Analysis)

See `entirekit stats`:

```bash
#!/bin/bash

# Token statistics (last 10)
# AI contribution analysis (last 10)
# Top 10 most-modified files
# Last 5 session summaries
```

### 8.2 Checkpoint Search Script

See `entirekit search`:

```bash
#!/bin/bash

# Keyword search in prompts
# Keyword search in context
# Pattern matching in modified files
```

### 8.3 Checkpoint Comparison

See `entirekit diff`:

```bash
# Compare changes between two checkpoints
# Query file modification history
# Track token usage changes
```

## 9. Performance Tips

### Caching

Since metadata is accessed frequently, consider caching in scripts:

```bash
# First run: create metadata cache
git log entire/checkpoints/v1 --format="%H" | while read hash; do
  get_metadata_path $hash > /tmp/checkpoint_paths.txt
done

# Subsequent access: use cache
cat /tmp/checkpoint_paths.txt | while read path; do
  git show $path:$path | jq .session_id
done
```

### Parallel Processing

Use `xargs -P` to parallelize when analyzing a large number of checkpoints:

```bash
# Parallel processing with 4 processes
git log entire/checkpoints/v1 --format="%H" -50 | \
  xargs -P 4 -I {} bash -c 'analyze_checkpoint "$@"' _ {}
```

### Handling Large Files

Since `full.jsonl` can be large:

```bash
# Extract only what is needed
git show $hash:$jsonl_path | head -1000 | jq .

# Stream processing (memory efficient)
git show $hash:$jsonl_path | jq -s 'map(select(.type == "message")) | length'
```

## 10. Troubleshooting

### Cannot Find Metadata Path

```bash
# Manually check the path
git ls-tree -r --name-only $hash | grep metadata.json | head -20

# Validate regex pattern
git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$'
```

### jq Parsing Error

```bash
# Validate JSON
git show $hash:$path | jq empty

# Check format
git show $hash:$path | head -c 200
```

### File Too Large

```bash
# Check size
git ls-tree -r -l $hash | grep metadata.json

# Read only a portion
git show $hash:$path | head -50
```

## Reference

- **Branch**: `entire/checkpoints/v1`
- **CLI implementation**: `src/commands/`
- **Data formats**: JSON (metadata), JSONL (full log), text (prompt)
- **Git version**: 2.13+ required (uses ls-tree -r)
