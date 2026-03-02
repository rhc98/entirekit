[English](README.md)

# entirekit

EntireKit 분석 및 `git entirekit <command>` alias 설치를 위한 CLI 도구입니다.

## 설치

```bash
npm i -D entirekit
```

## 사용법

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

`install`은 첫 checkpoint 생성 전에도 실행할 수 있습니다.  
다만 `stats`, `search`, `diff`, `report` 같은 분석 명령은 checkpoint 데이터가 필요합니다.

## 포함 명령어

- `npx entirekit install`
- `entirekit stats`
- `entirekit search`
- `entirekit diff`
- `entirekit report`

## 상세 문서

- 영어: `.entire/ENTIREKIT.md`
- 한국어: `.entire/ENTIREKIT.ko.md`
