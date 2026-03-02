[한국어](README.ko.md)

# EntireKit

A collection of tools for effectively analyzing and leveraging checkpoint data from **Entire**.

> **What is Entire?** A developer platform that captures AI agent sessions within your Git workflow.
>
> It records AI conversations, code changes, contributions, token usage, and more —
> making it possible to track "why was this code written this way?"
>
> **Supported tools:** [Claude Code](https://claude.ai/code), [Gemini CLI](https://github.com/google/generative-ai-cli), and more

### What is a Checkpoint?

A checkpoint is a snapshot within a session. All metadata is stored in the `entire/checkpoints/v1` branch.
Managed separately from your code commit history, it keeps your history clean
while perfectly preserving AI context.

This tool works with **any project using Entire** and is not tied to any specific AI tool.

## 🚀 Quick Start

### 1️⃣ Installation

```bash
# From the repository root
npx entirekit install
# Or non-interactive profile selection:
npx entirekit install --ai claude --force
```

You can run `install` even before your first checkpoint exists.
Checkpoint analysis commands (`stats`, `search`, `diff`, `report`) start working after checkpoints are created.

Once installed, the `git entirekit <command>` commands will be available.

### 2️⃣ Basic Usage

```bash
# View statistics
git entirekit stats

# Search by keyword
git entirekit search "login"

# List recent checkpoints
git entirekit recent
```

## 📚 Key Features

### 🔍 **Search & Tracking**

Quickly search and track past work history.

```bash
# Find all checkpoints containing the keyword "bug"
git entirekit search "bug"

# Work history related to a specific file
git entirekit search "LoginForm.tsx"

# Work from the past week
git entirekit week
```

**Use Cases:**
- 🐛 Bug root cause tracing: See when and why a piece of code was changed
- 🔄 Refactoring history: Reference past design decisions
- 👥 Onboarding: Share the development process with new team members

### 📊 **Statistics Analysis**

Measure AI usage and productivity.

```bash
git entirekit stats
```

**What you can see:**
- 💰 Token usage (input, output, cache read)
- 🤖 AI vs. human contribution ratio
- 📝 Most frequently modified files
- 📋 Recent session summaries

**Use Cases:**
- 💸 AI cost monitoring and optimization
- 📈 Productivity analysis (measure AI utilization)
- 🎯 Hotspot identification (frequently modified code → refactoring priorities)

### 🔬 **Comparative Analysis**

Compare changes between two checkpoints.

```bash
# Select two from the recent list
git entirekit recent

# Compare
git entirekit diff <hash1> <hash2>
```

**Use Cases:**
- 🔄 Discover repetitive work patterns
- 📉 Improve efficiency (compare token usage)

### 📊 **Visualization Reports**

Visualize checkpoint data with a beautiful, professional HTML dashboard.

```bash
# Default usage (includes all recent checkpoints)
git entirekit report

# Include only the most recent 20 checkpoints
git entirekit report --limit 20

# Filter by a specific branch
git entirekit report --branch feature/login

# Specify a date range
git entirekit report --since "2026-01-01" --until "2026-02-13"

# Specify output file (automatically opens in browser)
git entirekit report --output ~/Desktop/monthly-report.html

# Skip auto-open
git entirekit report --no-open --output ~/reports/report.html
```

**What's included in the report:**
- 📈 Dashboard: session count, API calls, token usage, cache efficiency, AI contribution, files changed
- 💰 Token analysis: input/output/cache token trends, usage comparison, summary table
- 🤖 AI contribution: contribution distribution, per-branch comparison, timeline
- 🔥 File hotspots: top 20 modified files, categorized by directory, searchable table
- 📅 Session timeline: GitHub-style activity heatmap, session detail cards
- 🌿 Branch analysis: per-branch summary, work distribution chart

**Use Cases:**
- 📊 Share development progress with the team (professional visualization)
- 💸 Generate monthly/weekly AI cost reports
- 📈 Analyze productivity trends (by time and branch)
- 🎯 Identify hotspot files (determine refactoring priorities)
- 📁 Check project health (cache efficiency, token usage)

## 📁 Structure

```
.entire/
├── ENTIREKIT.md           # Full guide (English)
├── ENTIREKIT.ko.md        # Full guide (Korean)
├── settings.json          # EntireKit settings
└── docs/                  # Additional documentation
    ├── quick-start.md     # Quick start guide
    └── advanced-usage.md  # Advanced usage
```

## 🎯 Real-World Examples

### Example 1: Debugging

```bash
# 1. Search by the name of the problematic file
git entirekit search "useAuth.ts"

# 2. Review the full context of the relevant checkpoint
# (includes when, why it was changed, with prompts and conversation)

# 3. Identify the root cause and fix it
```

### Example 2: Preparing for a Code Review

```bash
# 1. Check recent statistics
git entirekit stats

# Sample output:
# AI contribution: average 73.7%
# Most modified file: useAuth.ts (12 times)

# 2. Focus your review on code with high AI contribution
# 3. Repeatedly modified files → evaluate need for refactoring
```

### Example 3: Cost Optimization

```bash
# Check monthly token usage
git entirekit stats

# Check the cache read token ratio
# Higher is more cost-efficient (up to 90% savings)

# Improve prompts when inefficient patterns are found
```

### Example 4: Knowledge Sharing

```bash
# Extract the development process for a specific feature
git entirekit search "login implementation"

# Share with teammates:
# - Full conversation history
# - Decision-making process
# - Trial and error, and solutions
```

## 🛠️ System Requirements

- **Required:**
  - Git
  - Node.js 20+

- **Optional:**
  - Claude Code or Gemini CLI, etc.

### Verifying Installation

```bash
# Check Node.js
node --version

# Check EntireKit CLI
npx entirekit --version
```

## 📖 Learn More

- [Quick Start Guide](./docs/quick-start.md) - Get started in 5 minutes
- [Advanced Usage](./docs/advanced-usage.md) - In-depth features and tips

## 💡 Frequently Asked Questions

### Q: What is the relationship between this tool and Entire?
A: Entire is the **platform** that records AI sessions; this tool is a utility for **analyzing** the recorded checkpoints.
It can be used with any AI tool that supports Entire, such as Claude Code and Gemini CLI.

### Q: How do I install Entire?
A: It is installed automatically depending on your AI tool. See the [Entire documentation](https://github.com/entireio/cli) for details.

### Q: Do I need a checkpoint before running `install`?
A: No. `install` works without existing checkpoints. Checkpoint analysis commands require checkpoint data.

### Q: Can I use this with other projects?
A: Yes! Install EntireKit in that project and run `npx entirekit install`.

### Q: Where is checkpoint data stored?
A: It is stored in the `entire/checkpoints/v1` git branch. It does not exist on the regular filesystem.

### Q: How much does it cost?
A: This tool itself is free. AI API costs can be checked via the token usage recorded in your checkpoints.

## 🤝 Contributing

Bug reports, feature suggestions, and Pull Requests are welcome!

## 📄 License

MIT License

---

**Tip:** Every morning, use `git entirekit yesterday` to remind yourself what you worked on yesterday! 🌅
