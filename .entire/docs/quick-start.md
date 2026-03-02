[한국어](quick-start.ko.md)

# Quick Start Guide

Get up and running with the EntireKit tool in 5 minutes.

## 🎯 Goals

By the end of this guide, you will have:
- ✅ Installed the Checkpoint tool
- ✅ Learned 3 essential commands
- ✅ Everything you need to use it in your daily work

## 1️⃣ Installation (30 seconds)

```bash
# From the project root
npx entirekit install
```

You can run `install` before the first checkpoint is created.
Checkpoint analysis commands (`stats`, `search`, `diff`, `report`) require checkpoints.

A successful installation will show:
```
✨ Installation complete!
Available commands:
  git entirekit stats
  git entirekit search <keyword>
  ...
```

## 2️⃣ First Command (1 minute)

### View Statistics

```bash
git entirekit stats
```

**Example output:**
```
💰 Token Usage Statistics (most recent 10 checkpoints):
  Input tokens: 1,380
  Output tokens: 3,220
  Cache read tokens: 27,659,090
  Total API calls: 470
  Sessions analyzed: 10

🤖 AI Contribution Analysis:
  Average AI contribution: 73.7%
  ...
```

**What this tells you:**
- 💰 AI usage cost (token count)
- 🤖 How much of the code was written by AI
- 📝 Which files are modified most frequently

## 3️⃣ Second Command (2 minutes)

### Search Past Work

If you're stuck or think you've solved a similar problem before:

```bash
git entirekit search "keyword"
```

**Real example:**
```bash
# Find work related to "login"
git entirekit search "login"

# Output:
# [2026-02-13] Checkpoint: ac03096
# ---
# @src/app/[locale]/(auth)/login/page.tsx Regarding login actions...
# 1. Analyzed swagger for NEXT_PUBLIC_API_URL...
# 2. Separately from the existing identity verification login...
```

**Usage tips:**
- 🐛 Search by bug name
- 📂 Search by file name
- 🔑 Search by feature keyword

## 4️⃣ Third Command (1 minute)

### List Recent Work

When you can't remember what you did yesterday:

```bash
git entirekit yesterday
```

Or view the most recent 10:
```bash
git entirekit recent
```

## 🎓 Next Steps

### Make It a Daily Routine

**Morning:**
```bash
git entirekit yesterday  # Remind yourself what you did yesterday
```

**When you get stuck during work:**
```bash
git entirekit search "related keyword"  # Find past solutions
```

**End of day:**
```bash
git entirekit today      # Review what you accomplished today
```

## 💡 Practical Scenarios

### Scenario 1: "I think I've seen this bug before..."

```bash
# 1. Search by the bug's symptom
git entirekit search "not loading"

# 2. Find the related checkpoint and review the full context
# 3. Reference the solution from that time
```

### Scenario 2: "I need to review code that AI wrote..."

```bash
# 1. Check statistics
git entirekit stats

# 2. Identify files with high AI contribution
# 3. Focus your review on those files
```

### Scenario 3: "I need to explain to a teammate how I built this..."

```bash
# 1. Search by feature keyword
git entirekit search "payment feature"

# 2. Share the full development process (prompts, conversations, code)
```

### Scenario 4: "I need to show the team this month's work status..."

```bash
# 1. Generate a visual report
git entirekit report --limit 50 --output ~/monthly-report.html

# 2. Share the link or send the file
# 3. Teammates view the dashboard in their browser
# 4. See token usage, AI contribution, and file changes at a glance
```

## 🔥 Top 5+ Most-Used Commands

### Top 5: Core Commands

1. **Check yesterday's work** - `git entirekit yesterday`
   Check what you did yesterday, every morning

2. **View statistics** - `git entirekit stats`
   Check token usage and AI contribution during weekly retrospectives

3. **Keyword search** - `git entirekit search "keyword"`
   Find past solutions when a problem arises

4. **Recent list** - `git entirekit recent`
   Quickly review recent work

5. **Weekly work** - `git entirekit week`
   Summarize the week's work for weekend retrospectives

### Bonus: Generate HTML Report

6. **Visualization dashboard** - `git entirekit report`
   View a professional HTML report in your browser

   ```bash
   # Basic usage (automatically opens in browser)
   git entirekit report

   # Generate with only the most recent 20 checkpoints
   git entirekit report --limit 20

   # Save to desktop for sharing with the team
   git entirekit report --output ~/Desktop/report.html
   ```

## ❓ Troubleshooting

### "entire/checkpoints/v1 branch not found"

→ No checkpoints have been created yet.
This affects checkpoint analysis commands (`stats`, `search`, `diff`, `report`).
`install` itself can still run before checkpoints exist.

### "npx: command not found"

→ Node.js is not installed (or not in PATH). Install Node.js 20+ and try again.

### "No search results found"

→ Try different keywords:
```bash
# File name
git entirekit search "Login"

# Feature name
git entirekit search "auth"

# Bug symptom
git entirekit search "error"
```

## 🎉 Done!

You're now ready to use the EntireKit tool!

**Next:**
- [Advanced Usage](./advanced-usage.md) - More powerful features
- [Main README](../ENTIREKIT.md) - Full documentation

**Tip:** Git aliases are configured per project,
so to use them in another project, run `npx entirekit install` in that project as well.
