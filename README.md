[한국어](README.ko.md)

# entirekit

[![npm version](https://img.shields.io/npm/v/entirekit?logo=npm)](https://www.npmjs.com/package/entirekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/rhc98/entirekit/blob/main/LICENSE)

CLI toolkit for analyzing EntireKit data and installing `git entirekit <command>` aliases.

## Install

```bash
npm i -D entirekit
```

## Usage

```bash
npx entirekit help
npx entirekit install --ai claude --force
npx entirekit install --ai gemini --force
npx entirekit install --ai none --yes --force
npx entirekit doctor
npx entirekit stats
npx entirekit stats --limit 30 --branch feature/login --json
npx entirekit search login
npx entirekit search login --since 2026-01-01 --json
npx entirekit diff abc123 def456 --json
npx entirekit report --limit 20 --no-open
npx entirekit report --export-json /tmp/entire-report.json --export-csv /tmp/entire-sessions.csv
```

`install` can run before your first checkpoint is created.  
Checkpoint analysis commands (`stats`, `search`, `diff`, `report`) require checkpoint data.

## Included Commands

- `npx entirekit install`
- `entirekit stats`
- `entirekit search`
- `entirekit diff`
- `entirekit report`

## Full Docs

- English: [`.entire/ENTIREKIT.md`](https://github.com/rhc98/entirekit/blob/main/.entire/ENTIREKIT.md)
- Korean: [`.entire/ENTIREKIT.ko.md`](https://github.com/rhc98/entirekit/blob/main/.entire/ENTIREKIT.ko.md)
