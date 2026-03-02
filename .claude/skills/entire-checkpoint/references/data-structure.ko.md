[English](data-structure.md)

# Checkpoint 데이터 구조 및 접근 패턴

체크포인트는 Claude Code 세션의 스냅샷을 저장하는 Git 기반 시스템입니다. 각 체크포인트는 메타데이터, 프롬프트, 컨텍스트, 전체 대화 기록을 포함하며, `entire/checkpoints/v1` 브랜치에 구조화되어 저장됩니다.

## 1. 브랜치 구조 (entire/checkpoints/v1)

### 디렉토리 계층 구조

```
entire/checkpoints/v1
├── 07/                          # 세션 해시 (처음 2글자)
│   ├── 4ecf83c083/              # 세션 해시 (전체)
│   │   ├── 0/                   # 체크포인트 번호 (첫 번째)
│   │   │   ├── metadata.json
│   │   │   ├── prompt.txt
│   │   │   ├── context.md
│   │   │   ├── full.jsonl
│   │   │   └── content_hash.txt
│   │   ├── 1/                   # 체크포인트 번호 (두 번째)
│   │   │   ├── metadata.json
│   │   │   ├── prompt.txt
│   │   │   ├── context.md
│   │   │   ├── full.jsonl
│   │   │   └── content_hash.txt
│   │   └── metadata.json        # 세션 레벨 메타데이터
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

### 경로 패턴

- **세션 디렉토리**: `{session_hash_prefix_2}/{session_hash_full}/`
- **체크포인트 디렉토리**: `{session_hash_prefix_2}/{session_hash_full}/{checkpoint_number}/`
- **메타데이터**: `{session_hash_prefix_2}/{session_hash_full}/{checkpoint_number}/metadata.json`

### 브랜치 탐색

```bash
# 모든 체크포인트 커밋 보기
git log entire/checkpoints/v1 --oneline

# 특정 개수의 최근 커밋 보기
git log entire/checkpoints/v1 --oneline -20

# 상세 정보와 함께 보기
git log entire/checkpoints/v1 --format="%H %ad %s" --date=short
```

## 2. 체크포인트 파일 타입

각 체크포인트는 다음 5개 파일을 포함합니다:

### 2.1 metadata.json - 메타데이터

세션의 모든 중요 정보를 담은 JSON 파일입니다.

**필드 설명:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `cli_version` | string | Claude Code CLI 버전 |
| `checkpoint_id` | string | 체크포인트 고유 ID (session_hash의 축약형) |
| `session_id` | string | 세션 UUID (전체 고유 식별자) |
| `strategy` | string | 체크포인트 생성 전략 (manual-commit, auto 등) |
| `created_at` | string | ISO8601 형식 생성 시간 |
| `branch` | string | 현재 Git 브랜치명 |
| `checkpoints_count` | number | 이 세션의 이전 체크포인트 개수 |
| `files_touched` | array | 수정된 파일 경로 목록 |
| `agent` | string | 사용된 AI 에이전트명 |
| `checkpoint_transcript_start` | number | 트랜스크립트 시작 줄 번호 |
| `transcript_lines_at_start` | number | 시작 시점의 전체 트랜스크립트 라인 수 |
| `token_usage` | object | 토큰 사용량 통계 |
| `initial_attribution` | object | AI 기여도 분석 |

**토큰 사용량 (token_usage):**

```json
{
  "input_tokens": 9,              // 입력 토큰
  "cache_creation_tokens": 36048, // 캐시 생성 토큰
  "cache_read_tokens": 128739,    // 캐시 읽기 토큰
  "output_tokens": 24,            // 출력 토큰
  "api_call_count": 3             // API 호출 횟수
}
```

**AI 기여도 (initial_attribution):**

```json
{
  "calculated_at": "2026-02-12T08:34:26.971784Z",
  "agent_lines": 11,              // AI가 작성한 라인 수
  "human_added": 23,              // 사용자가 추가한 라인 수
  "human_modified": 0,            // 사용자가 수정한 라인 수
  "human_removed": 0,             // 사용자가 삭제한 라인 수
  "total_committed": 34,          // 커밋된 전체 라인 수
  "agent_percentage": 32.35       // AI 기여 비율 (%)
}
```

### 2.2 prompt.txt - 원본 프롬프트

사용자의 원본 질문/요청입니다. 여러 줄의 입력이 포함될 수 있으며, 마크다운이나 특수 포매팅 없이 순수 텍스트입니다.

```
user-web 의 기존 webview bridge 연동 구조는 구 버전 앱에서 쓰던거라
새 버전 앱(user-app-flutter) 에 맞게 마이그레이션이 필요해

web project 의 기존 bridge 연동 구조와 새 app 의 bridge 구조를 함께 분석해서
web 부분의 bridge 인터페이스와 웹뷰용 계정 인증 구조를 구현해볼까
```

### 2.3 context.md - 세션 컨텍스트 요약

이 체크포인트 시점의 세션 상태를 마크다운 형식으로 요약한 문서입니다.

**포함 내용:**
- 현재까지의 작업 진행 상황
- 주요 발견사항
- 현재 단계
- 다음 단계
- 기술적 결정사항

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

### 2.4 full.jsonl - 전체 대화 기록

JSONL 형식(한 줄 한 객체)으로 저장된 전체 대화 기록입니다. 각 라인은 하나의 이벤트를 나타냅니다.

**이벤트 타입 예시:**

```jsonl
{"type":"progress","data":{"type":"hook_progress","command":"..."},"timestamp":"..."}
{"type":"message","userType":"external","content":"사용자 메시지","timestamp":"..."}
{"type":"tool-use","toolName":"Bash","command":"git status","timestamp":"..."}
{"type":"tool-result","result":"output...","timestamp":"..."}
```

**특징:**
- 시간순 기록
- 세션의 모든 상호작용 포함
- 대형 파일 (수십 MB 가능)
- 분석/재생을 위한 원본 데이터

### 2.5 content_hash.txt - 컨텐츠 해시

체크포인트 내용의 무결성 검증을 위한 해시값입니다.

```
abc123def456...
```

## 3. metadata.json 스키마 (완전한 예시)

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

## 4. Git 트래버설 패턴

### 4.1 모든 체크포인트 목록 조회

```bash
# 최근 순서로 표시
git log entire/checkpoints/v1 --oneline -20

# 해시만 추출
git log entire/checkpoints/v1 --format="%H" -20

# 날짜와 함께 표시
git log entire/checkpoints/v1 --format="%H %ad" --date=short -20
```

### 4.2 체크포인트의 파일 트리 조회

```bash
# 특정 커밋의 모든 파일 나열
git ls-tree -r --name-only ac03096

# 파일 크기와 함께 표시
git ls-tree -r -l ac03096

# metadata.json만 추출
git ls-tree -r --name-only ac03096 | grep metadata.json
```

### 4.3 파일 추출 및 읽기

```bash
# metadata.json 읽기
git show ac03096:07/4ecf83c083/0/metadata.json

# prompt.txt 읽기
git show ac03096:07/4ecf83c083/0/prompt.txt

# context.md 읽기
git show ac03096:07/4ecf83c083/0/context.md

# full.jsonl의 처음 100줄 읽기
git show ac03096:07/4ecf83c083/0/full.jsonl | head -100
```

## 5. 헬퍼 함수: get_metadata_path()

체크포인트 경로는 세션마다 다르므로, 항상 `get_metadata_path()` 함수를 사용하여 메타데이터 경로를 찾아야 합니다.

```bash
# 헬퍼 함수 정의
get_metadata_path() {
  local hash=$1
  # /[0-9]/metadata.json 패턴으로 매칭 (세션 레벨이 아닌 체크포인트 레벨)
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# 사용 예시
metadata_path=$(get_metadata_path ac03096)
echo $metadata_path
# 출력: 07/4ecf83c083/0/metadata.json

# 파일 내용 읽기
git show ac03096:$metadata_path | jq .
```

**중요:** 정규표현식 `/[0-9]/metadata.json$`는 다음을 보장합니다:
- 체크포인트 레벨 메타데이터만 선택 (세션 레벨 제외)
- 정확한 경로 추출 (여러 경로 중 첫 번째 선택)

## 6. jq 쿼리 레시피

### 6.1 토큰 사용량 추출

```bash
# 전체 토큰 사용량 보기
git show ac03096:$metadata_path | jq '.token_usage'

# Input 토큰만
git show ac03096:$metadata_path | jq '.token_usage.input_tokens'

# 모든 토큰 합계 계산
git show ac03096:$metadata_path | jq '.token_usage |
  .input_tokens + .output_tokens + .cache_creation_tokens + .cache_read_tokens'
```

### 6.2 AI 기여도 추출

```bash
# 전체 기여도 정보
git show ac03096:$metadata_path | jq '.initial_attribution'

# AI 기여 비율만
git show ac03096:$metadata_path | jq '.initial_attribution.agent_percentage'

# AI 라인 수
git show ac03096:$metadata_path | jq '.initial_attribution.agent_lines'
```

### 6.3 수정된 파일 목록 추출

```bash
# 전체 파일 목록
git show ac03096:$metadata_path | jq '.files_touched[]'

# 특정 패턴의 파일만 필터링 (예: src/components/)
git show ac03096:$metadata_path | jq '.files_touched[] |
  select(startswith("src/components/"))'

# 파일 개수 세기
git show ac03096:$metadata_path | jq '.files_touched | length'

# 파일 목록을 줄바꿈으로 출력
git show ac03096:$metadata_path | jq -r '.files_touched[]'
```

### 6.4 날짜로 필터링

```bash
# 2026-02-12 이후의 체크포인트
git log entire/checkpoints/v1 --format="%H" | while read hash; do
  date=$(git show $hash:$metadata_path 2>/dev/null | jq -r '.created_at')
  if [[ "$date" > "2026-02-12" ]]; then
    echo "$hash $date"
  fi
done

# 특정 날짜 범위
git log entire/checkpoints/v1 --format="%H" --since="2026-02-01" --until="2026-02-15"
```

### 6.5 브랜치별 필터링

```bash
# feature/migrate_webview 브랜치의 체크포인트만
git log entire/checkpoints/v1 --format="%H" | while read hash; do
  branch=$(git show $hash:$metadata_path 2>/dev/null | jq -r '.branch')
  if [ "$branch" = "feature/migrate_webview" ]; then
    echo "$hash"
  fi
done

# 각 브랜치별 체크포인트 개수
git log entire/checkpoints/v1 --format="%H" | while read hash; do
  git show $hash:$metadata_path 2>/dev/null | jq -r '.branch'
done | sort | uniq -c
```

### 6.6 통계 집계

```bash
# 평균 AI 기여도 (최근 10개)
git log entire/checkpoints/v1 --format="%H" -10 | while read hash; do
  metadata_path=$(git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1)
  git show $hash:$metadata_path 2>/dev/null | jq '.initial_attribution.agent_percentage'
done | awk '{s+=$1; n++} END {print s/n}'

# 총 토큰 사용량 (최근 20개)
git log entire/checkpoints/v1 --format="%H" -20 | while read hash; do
  metadata_path=$(git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1)
  git show $hash:$metadata_path 2>/dev/null | jq '.token_usage |
    .input_tokens + .output_tokens + .cache_creation_tokens + .cache_read_tokens'
done | awk '{s+=$1} END {print s}'
```

## 7. 접근 패턴 예시 (TypeScript 우선)

### 7.1 특정 해시의 메타데이터 읽기

```bash
# CLI 요약
npx entirekit diff <older-hash> <newer-hash> --json

# 원본 메타데이터 확인
HASH="ac03096"
git show "$HASH:$(git ls-tree -r --name-only "$HASH" | grep '/[0-9]/metadata.json$' | tail -1)" | jq .
```

### 7.2 최근 체크포인트 프롬프트 추출

```bash
npx entirekit recent
npx entirekit search "prompt" --limit 10 --json
```

### 7.3 특정 파일을 수정한 체크포인트 찾기

```bash
npx entirekit search "src/lib/mapoBridge.ts" --limit 100 --json
```

### 7.4 기간별 토큰 사용량 계산

```bash
npx entirekit stats --since 2026-02-01 --until 2026-02-15 --json
npx entirekit report --since 2026-02-01 --until 2026-02-15 --export-json ./analysis/range.json --no-open
```

### 7.5 단일 쿼리로 복수 정보 추출

```bash
npx entirekit stats --json | jq '{
  sessions: .sessions_analyzed,
  input_tokens: .tokens.input,
  output_tokens: .tokens.output,
  cache_read_tokens: .tokens.cache_read,
  api_calls: .tokens.api_calls
}'
```

## 8. 고급 활용

### 8.1 전체 분석 파이프라인

```bash
mkdir -p analysis

npx entirekit stats --limit 50 --json > analysis/stats.json
npx entirekit search "auth" --limit 100 --json > analysis/search-auth.json
npx entirekit report --limit 100 --output analysis/dashboard.html --no-open
```

### 8.2 TypeScript 자동화 진입점

```ts
// scripts/checkpoint-analysis.ts
import { execa } from 'execa';
import { mkdirSync, writeFileSync } from 'node:fs';

async function main(): Promise<void> {
  mkdirSync('analysis', { recursive: true });

  const stats = await execa('npx', ['entirekit', 'stats', '--json']);
  writeFileSync('analysis/stats.json', stats.stdout, 'utf8');

  await execa(
    'npx',
    ['entirekit', 'report', '--limit', '100', '--output', 'analysis/dashboard.html', '--no-open'],
    { stdio: 'inherit' }
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

### 8.3 체크포인트 비교

```bash
npx entirekit diff <hash1> <hash2>
npx entirekit diff <hash1> <hash2> --json > analysis/diff.json
```

## 9. 성능 팁

### 캐싱

TypeScript CLI의 JSON 내보내기를 캐시 아티팩트로 활용하세요:

```bash
mkdir -p .cache/entirekit

npx entirekit stats --limit 200 --json > .cache/entirekit/stats.json
npx entirekit report --limit 200 --export-json .cache/entirekit/report.json --no-open
```

### 병렬 처리

대규모 저장소에서는 독립적인 CLI 분석을 병렬 실행하세요:

```bash
mkdir -p analysis

npx entirekit stats --json > analysis/stats.json &
npx entirekit search "auth" --limit 200 --json > analysis/search-auth.json &
npx entirekit search "billing" --limit 200 --json > analysis/search-billing.json &
wait
```

### 대형 파일 처리

`full.jsonl`은 크기가 클 수 있으므로:

```bash
# 필요한 부분만 추출
git show $hash:$jsonl_path | head -1000 | jq .

# 스트림 처리 (메모리 효율적)
git show $hash:$jsonl_path | jq -s 'map(select(.type == "message")) | length'
```

## 10. 문제 해결

### 메타데이터 경로를 찾을 수 없음

```bash
# 경로 수동 확인
git ls-tree -r --name-only $hash | grep metadata.json | head -20

# 정규표현식 패턴 검증
git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$'
```

### jq 파싱 에러

```bash
# JSON 유효성 검증
git show $hash:$path | jq empty

# 포맷 확인
git show $hash:$path | head -c 200
```

### 파일이 너무 큼

```bash
# 크기 확인
git ls-tree -r -l $hash | grep metadata.json

# 일부만 읽기
git show $hash:$path | head -50
```

## 참고

- **브랜치**: `entire/checkpoints/v1`
- **CLI 구현 위치**: `src/commands/`
- **데이터 형식**: JSON (메타데이터), JSONL (전체 기록), 텍스트 (프롬프트)
- **Git 버전**: 2.13+ 필수 (ls-tree -r 사용)
