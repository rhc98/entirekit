---
name: entire-checkpoint
description: >
  AI 세션 히스토리를 위한 EntireKit 데이터 접근 및 쿼리.
  과거 작업 세션 검색, checkpoint 통계 조회, 최근 활동 목록 확인, checkpoint 비교 등의 작업에 사용.
  트리거 키워드: "checkpoint", "entirekit", "과거 세션", "히스토리 검색",
  "어제 뭐 했지", "어제 작업", "해결책 찾기", "checkpoint 비교", "최근 작업"
---

[English](SKILL.md)


# EntireKit 운영 도구

EntireKit 시스템에 대한 빠른 접근 및 쿼리 도구입니다. 일상적인 checkpoint 작업을 위한 원샷 명령어를 제공합니다.

## 개요

**Entire란?** Git 워크플로우에 AI 에이전트 세션을 캡처하는 개발자 플랫폼입니다. AI와의 대화 내용, 코드 변경사항, 기여도, 토큰 사용량 등을 `entire/checkpoints/v1` 브랜치에 저장합니다.

이 스킬은 checkpoint 데이터를 쉽게 검색하고 조회할 수 있도록 돕습니다.

## 사용 시나리오

다음과 같은 요청에 이 스킬을 사용하세요:

- "checkpoint 검색해줘" / "로그인 버그 checkpoint 찾아줘"
- "어제 뭐 했는지 보여줘" / "어제 작업 확인"
- "checkpoint 통계 보여줘" / "토큰 사용량 보여줘"
- "최근 작업 목록" / "최근 checkpoint"
- "이 두 checkpoint 비교해줘"
- "과거에 이 문제 어떻게 해결했는지 찾아줘"

## 사전 조건 확인

checkpoint 작업을 시작하기 전에 다음을 확인하세요:

### 1. entire/checkpoints/v1 브랜치 확인

```bash
git rev-parse --verify entire/checkpoints/v1 >/dev/null 2>&1
```

**브랜치가 없다면:**
- 아직 checkpoint가 생성되지 않았습니다
- Claude Code CLI로 작업하면 자동으로 생성됩니다
- 다른 기기에서 작업 중이라면: `git fetch origin entire/checkpoints/v1`

### 2. Node.js 설치 확인

```bash
node --version
```

**Node.js가 없다면 Node.js 20+를 먼저 설치하세요.**

### 3. Git Aliases 설정 확인

```bash
git config --local --get alias.entirekit >/dev/null 2>&1
```

**Aliases가 설정되지 않았다면:**

```bash
npx entirekit install
```

설치 후 다음 명령어들을 사용할 수 있습니다:
- `git entirekit stats` - 통계 분석
- `git entirekit search` - 키워드 검색
- `git entirekit recent` - 최근 10개
- `git entirekit today` - 오늘의 checkpoint
- `git entirekit yesterday` - 어제의 checkpoint
- `git entirekit week` - 최근 1주일
- `git entirekit diff` - 두 checkpoint 비교
- `git entirekit report` - HTML 리포트 생성

## 빠른 명령어 참조

### git entirekit stats - 통계 분석

**용도:** 토큰 사용량, AI 기여도, 자주 수정된 파일, 최근 세션 요약

**실행:**
```bash
git entirekit stats
```

**출력 예시:**
```
💰 토큰 사용량 통계 (최근 10개 checkpoint):
  Input tokens: 1,380
  Output tokens: 3,220
  Cache read tokens: 27,659,090
  Total API calls: 470
  Sessions analyzed: 10

🤖 AI 기여도 분석:
  Total agent lines: 2,847
  Total human modified: 456
  Average AI contribution: 73.7%
  Sessions with changes: 8

📝 가장 많이 터치된 파일 TOP 10:
  5 src/app/[locale]/layout.tsx
  4 src/app/[locale]/games/[id]/page.tsx
  3 src/hooks/useAuth.ts
```

### git entirekit search - 키워드 검색

**용도:** 과거 세션에서 특정 키워드 검색

**실행:**
```bash
git entirekit search "검색어"
```

**예시:**
```bash
# "로그인" 관련 작업 찾기
git entirekit search "로그인"

# 파일 이름으로 검색
git entirekit search "LoginForm.tsx"

# 에러 메시지로 검색
git entirekit search "TypeError"
```

**출력:** 프롬프트 내용과 관련 파일 수정 이력

### git entirekit recent - 최근 checkpoint 목록

**용도:** 최근 10개 checkpoint 해시와 요약

**실행:**
```bash
git entirekit recent
```

**출력 예시:**
```
ac03096 2026-02-13 로그인 액션 관련 작업
f5d02f6 2026-02-13 OG 이미지 최적화
375e65c 2026-02-12 페이지 전환 개선
```

### git entirekit today/yesterday/week - 시간 필터

**용도:** 특정 기간의 checkpoint 조회

**실행:**
```bash
git entirekit today      # 오늘
git entirekit yesterday  # 어제
git entirekit week       # 최근 1주일
```

### git entirekit diff - Checkpoint 비교

**용도:** 두 checkpoint 간의 차이 비교 (토큰, 파일, AI 기여도)

**실행:**
```bash
git entirekit diff <hash1> <hash2>
```

**예시:**
```bash
# 1. 최근 목록에서 해시 확인
git entirekit recent

# 2. 두 개 선택해서 비교
git entirekit diff ac03096 f5d02f6
```

### git entirekit report - HTML 리포트 생성

**용도:** 브라우저에서 볼 수 있는 시각적 대시보드 생성

**실행:**
```bash
git entirekit report
```

**참고:** 이 명령은 TypeScript CLI에 내장되어 있습니다.

## 워크플로우

### 워크플로우 1: 과거 해결책 검색

**시나리오:** "이 버그 전에도 본 것 같은데..."

**단계:**
1. 사용자로부터 키워드 획득
2. `git entirekit search "<키워드>"` 실행
3. 결과가 있으면 checkpoint 해시와 프롬프트 표시
4. 사용자가 관심 있는 checkpoint가 있으면 전체 대화 제공:
   ```bash
   HASH="ac03096"
   JSONL_PATH=$(git ls-tree -r --name-only $HASH | grep 'full.jsonl$' | tail -1)
   git show $HASH:$JSONL_PATH | jq -r '.content'
   ```
5. 결과가 없으면 대안 키워드 제안

**예시:**
```
User: "로그인 버그 어떻게 해결했었지?"
Assistant: git entirekit search "로그인" 실행
→ [2026-02-13] Checkpoint: ac03096 발견
→ 프롬프트 내용 표시
→ "전체 대화를 보시겠습니까?" 물어보기
```

### 워크플로우 2: 세션 상세정보 보기

**시나리오:** 특정 checkpoint의 모든 정보 확인

**단계:**
1. checkpoint 해시 획득 (from `git entirekit recent` or search)
2. 메타데이터 추출:
   ```bash
   get_metadata_path() {
     local hash=$1
     git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1
   }
   metadata_path=$(get_metadata_path $HASH)
   git show $HASH:$metadata_path | jq .
   ```
3. 컨텍스트 추출:
   ```bash
   context_path=$(git ls-tree -r --name-only $HASH | grep 'context.md$' | head -1)
   git show $HASH:$context_path
   ```
4. 프롬프트 추출:
   ```bash
   prompt_path=$(git ls-tree -r --name-only $HASH | grep 'prompt.txt$' | head -1)
   git show $HASH:$prompt_path
   ```
5. 필요시 전체 대화 추출 (full.jsonl)

**표시 형식:**
```markdown
## Checkpoint: ac03096
**날짜:** 2026-02-13
**브랜치:** feature/login

### 프롬프트
[프롬프트 내용...]

### 통계
- Input tokens: 145
- Output tokens: 320
- AI 기여도: 78%

### 수정된 파일
- src/app/[locale]/(auth)/login/page.tsx
- src/hooks/useAuth.ts

### 컨텍스트
[컨텍스트 요약...]
```

### 워크플로우 3: Checkpoint 비교

**시나리오:** "이 두 세션의 차이가 뭐지?"

**단계:**
1. `git entirekit recent` 실행하여 목록 표시
2. 사용자가 두 해시 선택
3. `git entirekit diff <hash1> <hash2>` 실행
4. 비교 결과 표시:
   - 토큰 사용량 변화
   - 수정된 파일 차이
   - AI 기여도 변화

**출력 예시:**
```
📊 Checkpoint 비교: ac03096 vs f5d02f6

🔢 토큰 사용량 비교:
Checkpoint 1:
  Input: 145, Output: 320, Cache: 12,450

Checkpoint 2:
  Input: 89, Output: 156, Cache: 8,920

📝 수정된 파일 비교:
Checkpoint 1: 5개 파일
Checkpoint 2: 2개 파일
```

## 직접 데이터 접근 패턴

스크립트를 사용하지 않고 직접 데이터에 접근해야 할 때:

### 헬퍼 함수: get_metadata_path()

```bash
get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}
```

**용도:** checkpoint 해시에서 metadata.json 경로 추출

### Checkpoint 브랜치 순회

```bash
# 최근 10개 checkpoint 해시
git log entire/checkpoints/v1 --format="%H" -10

# 날짜와 함께
git log entire/checkpoints/v1 --format="%H %ad" --date=short -10

# 특정 기간
git log entire/checkpoints/v1 --since="2 weeks ago" --format="%H"
```

### jq 쿼리 패턴

```bash
# 토큰 사용량 추출
git show $HASH:$metadata_path | jq '.token_usage'

# 특정 필드만
git show $HASH:$metadata_path | jq -r '.token_usage.output_tokens'

# 수정된 파일 목록
git show $HASH:$metadata_path | jq -r '.files_touched[]'

# AI 기여도
git show $HASH:$metadata_path | jq '.initial_attribution.agent_percentage'
```

### 파일 트리 탐색

```bash
# checkpoint의 모든 파일 목록
git ls-tree -r --name-only $HASH

# 특정 파일 타입만
git ls-tree -r --name-only $HASH | grep '\.json$'
git ls-tree -r --name-only $HASH | grep 'prompt.txt$'
git ls-tree -r --name-only $HASH | grep 'full.jsonl$'
```

## 에러 처리

### 브랜치 없음

**에러:**
```
fatal: ambiguous argument 'entire/checkpoints/v1': unknown revision
```

**해결:**
1. Entire가 설정되지 않았거나 checkpoint가 아직 생성되지 않음
2. 다른 기기에서 작업 중이라면: `git fetch origin entire/checkpoints/v1`
3. 처음 사용이라면 Claude Code CLI로 작업 후 checkpoint 생성 대기

### jq 없음

**에러:**
```
jq: command not found
```

**해결:**
- macOS: `brew install jq`
- Ubuntu: `sudo apt-get install jq`
- CentOS: `sudo yum install jq`

### 검색 결과 없음

**메시지:** "검색 결과 없음"

**해결:**
1. 더 넓은 키워드로 재시도
2. 파일 이름으로 검색
3. 날짜 범위 확대
4. 오타 확인

**대안 제안:**
```
검색 결과가 없습니다. 다음을 시도해보세요:
- 더 일반적인 키워드: "auth" 대신 "login"
- 파일 이름으로 검색: "LoginForm" 또는 ".tsx"
- 전체 목록에서 수동 검색: git entirekit recent
```

### Git Aliases 없음

**에러:**
```
git: 'entirekit stats' is not a git command
```

**해결:**
```bash
npx entirekit install
```

재설치가 필요하면 덮어쓰기 확인 후 진행.

## 고급 팁

### 1. 특정 파일의 변경 히스토리

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

### 2. 토큰 사용량 집계

```bash
# 최근 2주간 총 output tokens
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

### 3. 전체 대화 내용 읽기

```bash
HASH="ac03096"
JSONL_PATH=$(git ls-tree -r --name-only $HASH | grep 'full.jsonl$' | tail -1)
git show $HASH:$JSONL_PATH | jq -r '.content' | less
```

## 참조 문서

더 자세한 정보는 다음 참조 문서를 확인하세요:

- [commands.md](./references/commands.md) - 모든 git alias 명령어 상세 참조
- [data-structure.md](./references/data-structure.md) - Checkpoint 데이터 구조 및 접근 패턴

## 관련 스킬

- **entire-analytics** - 심층 분석, 리포트 생성, 비용 분석, 트렌드 추적 등의 고급 분석 작업
