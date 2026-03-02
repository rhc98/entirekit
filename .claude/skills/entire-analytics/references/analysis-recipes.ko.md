[English](analysis-recipes.md)

# Checkpoint 분석 레시피 모음

복잡한 분석을 간단하게 만드는 복사-붙여넣기 가능한 bash/jq 원라이너 모음입니다. 각 레시피는 즉시 사용 가능하도록 설계되었습니다.

---

## 📖 사용 방법

### 레시피 실행 방법

1. 아래 코드를 터미널에 복사-붙여넣기
2. `{변수}` 부분을 자신의 값으로 교체
3. Enter 키 입력

### 기본 설정

모든 레시피는 다음을 가정합니다:
- Git 저장소 루트에서 실행
- `entire/checkpoints/v1` 브랜치 존재
- `jq` 설치됨 (`brew install jq`)

### 커스터마이징 팁

각 레시피의 "커스터마이징" 섹션에서 일반적인 수정 방법을 안내합니다.

---

## 1️⃣ 토큰 집계 레시피

### 레시피 1.1: 기간별 Input 토큰 합계

특정 기간 동안 사용한 모든 input 토큰의 합계를 구합니다.

**실행:**
```bash
SINCE="2 weeks ago"
git log entire/checkpoints/v1 --since="$SINCE" --format="%H" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq -r '.token_usage.input_tokens // 0'
done | awk '{sum+=$1} END {print "Input tokens: " sum}'
```

**예상 출력:**
```
Input tokens: 45238
```

**커스터마이징:**
- `2 weeks ago` → `1 month ago`, `3 days ago` 등으로 변경
- Output 토큰: `.token_usage.output_tokens` 로 변경

---

### 레시피 1.2: 기간별 Output 토큰 합계

Input 토큰 대신 Output 토큰의 합계를 구합니다.

**실행:**
```bash
SINCE="1 week ago"
git log entire/checkpoints/v1 --since="$SINCE" --format="%H" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq -r '.token_usage.output_tokens // 0'
done | awk '{sum+=$1} END {print "Output tokens: " sum}'
```

**예상 출력:**
```
Output tokens: 128456
```

**커스터마이징:**
- Cache read 토큰: `.token_usage.cache_read_tokens` 로 변경
- Cache creation 토큰: `.token_usage.cache_creation_tokens` 로 변경

---

### 레시피 1.3: 캐시 읽기 비율 계산

전체 토큰 중 캐시에서 읽은 비율을 계산합니다.

**실행:**
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

**예상 출력:**
```json
{
  "cache_read": 23450,
  "input": 45238,
  "cache_creation": 5600,
  "cache_ratio": "34%"
}
```

**커스터마이징:**
- `1 week ago` → 다른 기간으로 변경
- JSON 형식 → `| .cache_ratio` 로 비율만 추출

---

### 레시피 1.4: 높은 토큰 사용 세션 찾기 (이상치)

5000개 이상의 output 토큰을 사용한 세션을 찾습니다.

**실행:**
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

**예상 출력:**
```
[2025-02-10] abc1234 - Tokens: 8234
Fix critical auth bug in production

[2025-02-08] def5678 - Tokens: 6100
Implement new dashboard with analytics
```

**커스터마이징:**
- `5000` → 다른 임계값으로 변경
- `-50` → 최근 N개 레코드 변경 (`-100`, `-200` 등)

---

### 레시피 1.5: 주별 토큰 사용량 비교

주별 토큰 사용량을 비교하여 추세를 봅니다.

**실행:**
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

**예상 출력:**
```
2025-W05: 145600 tokens (avg: 2912)
2025-W06: 128400 tokens (avg: 2568)
2025-W07: 167200 tokens (avg: 3344)
```

**커스터마이징:**
- Input 토큰으로 변경: `.token_usage.input_tokens` 사용
- 월별 분석: `--date=format:"%Y-%m"` 로 변경

---

## 2️⃣ 파일 분석 레시피

### 레시피 2.1: N개 최근 Checkpoint에서 수정된 모든 파일 나열

최근 30개 checkpoint에서 건드린 모든 파일을 찾습니다.

**실행:**
```bash
LIMIT=30
git log entire/checkpoints/v1 --format="%H" -"$LIMIT" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq -r '.files_touched[]? // empty'
done | sort | uniq
```

**예상 출력:**
```
src/hooks/useAuth.ts
src/components/Button.tsx
src/utils/api.ts
src/pages/Login.tsx
src/styles/global.css
```

**커스터마이징:**
- `-30` → `-50`, `-100` 등으로 변경
- 파일 카운트: `| uniq -c | sort -rn` 추가

---

### 레시피 2.2: 가장 자주 수정된 파일 상위 10개

어떤 파일이 가장 자주 변경되는지 알아봅니다.

**실행:**
```bash
LIMIT=100
git log entire/checkpoints/v1 --format="%H" -"$LIMIT" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq -r '.files_touched[]? // empty'
done | sort | uniq -c | sort -rn | head -10
```

**예상 출력:**
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

**커스터마이징:**
- `head -10` → `head -20`, `head -5` 등으로 변경
- `-100` → 분석할 checkpoint 개수 변경

---

### 레시피 2.3: 특정 파일의 수정 히스토리 추적

파일이 언제, 어떤 작업에서 수정되었는지 추적합니다.

**실행:**
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

**예상 출력:**
```
[2025-02-12] abc1234
Fix authentication error handling

[2025-02-10] def5678
Implement password reset feature

[2025-02-08] ghi9012
Add login form validation
```

**커스터마이징:**
- `src/hooks/useAuth.ts` → 다른 파일 경로로 변경
- `-100` → 분석할 checkpoint 개수 변경
- `head -1` → `head -3` 으로 더 많은 맥락 표시

---

### 레시피 2.4: 높은 AI 기여도를 가진 파일 찾기

80% 이상 AI가 작성한 파일들을 찾습니다.

**실행:**
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

**예상 출력:**
```
AI 95% - abc1234:
  src/components/Button.tsx
  src/components/Modal.tsx
  src/utils/styling.ts

AI 85% - def5678:
  src/hooks/useForm.ts
  src/utils/validation.ts
```

**커스터마이징:**
- `80` → 다른 임계값으로 변경
- 낮은 AI 기여도 찾기: `pct < 20` 로 변경

---

## 3️⃣ AI 기여도 분석 레시피

### 레시피 3.1: 평균 AI 기여도 계산

모든 checkpoint의 평균 AI 기여도를 구합니다.

**실행:**
```bash
LIMIT=100
git log entire/checkpoints/v1 --format="%H" -"$LIMIT" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq -r '.initial_attribution.agent_percentage // 0'
done | awk '{sum+=$1; count++} END {if (count > 0) printf "Average AI contribution: %.1f%%\n", sum/count}'
```

**예상 출력:**
```
Average AI contribution: 72.5%
```

**커스터마이징:**
- `-100` → 다른 checkpoint 개수로 변경
- 중앙값 구하기: `sort -n | sed -n '$((NR/2))p'` 추가

---

### 레시피 3.2: 80% 이상 AI 기여 세션 찾기

AI가 80% 이상 기여한 모든 세션을 나열합니다.

**실행:**
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

**예상 출력:**
```
[2025-02-12] abc1234 - AI 95%
  Implement new authentication system

[2025-02-10] def5678 - AI 88%
  Add error handling to API client

[2025-02-08] ghi9012 - AI 82%
  Create utility functions for date handling
```

**커스터마이징:**
- `80` → 다른 임계값으로 변경
- 낮은 AI 기여도 찾기: `< 20` 으로 변경

---

### 레시피 3.3: AI 기여도 추세 추적 (주별)

시간에 따른 AI 기여도 변화를 봅니다.

**실행:**
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

**단순화된 버전 (더 빠름):**
```bash
git log entire/checkpoints/v1 --format="%H %ad" --date=format:"%Y-W%V" -200 | \
  awk '{week=$NF; hash=$1; print week, hash}' | \
  while read week hash; do
    metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
    [ -n "$metadata" ] && echo "$week $(git show $hash:$metadata 2>/dev/null | jq -r '.initial_attribution.agent_percentage // 0')"
  done | sort | awk '{printf "%s ", $1; for(i=2;i<=NF;i++) sum+=$i; if (NR%5==0) {printf ": %.1f%%\n", sum/5; sum=0} else printf "%s ", $i}'
```

**예상 출력:**
```
2025-W05: 68.3%
2025-W06: 72.1%
2025-W07: 75.8%
2025-W08: 73.2%
```

**커스터마이징:**
- `-200` → 분석할 checkpoint 개수 변경
- 월별 분석: `--date=format:"%Y-%m"` 로 변경

---

### 레시피 3.4: 파일별 AI 기여도 분석

각 파일별로 AI가 얼마나 기여했는지 분석합니다.

**실행:**
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

**예상 출력:**
```
src/components/Button.tsx: 88.5% (modified 12 times)
src/hooks/useAuth.ts: 82.3% (modified 15 times)
src/utils/api.ts: 75.2% (modified 8 times)
src/pages/Dashboard.tsx: 68.9% (modified 6 times)
```

**커스터마이징:**
- `head -20` → `head -50` 등으로 변경
- `-50` → 분석할 checkpoint 개수 변경

---

## 4️⃣ 검색 및 필터링 레시피

### 레시피 4.1: 프롬프트에서 키워드 검색

특정 키워드를 포함하는 checkpoint를 찾습니다.

**실행:**
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

**예상 출력:**
```
[2025-02-12] abc1234
Fix authentication error handling when user tokens expire

[2025-02-10] def5678
Implement OAuth2 authentication for Google login
```

**커스터마이징:**
- `authentication` → 다른 키워드로 변경
- 정규표현식: `grep -E "auth|login|session"` 로 여러 패턴 검색
- `-100` → 분석할 checkpoint 개수 변경

---

### 레시피 4.2: 파일 이름으로 검색

특정 파일을 수정한 checkpoint를 찾습니다.

**실행:**
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

**예상 출력:**
```
[2025-02-12] abc1234
  src/hooks/useAuth.ts

[2025-02-10] def5678
  src/hooks/useAuth.ts

[2025-02-08] ghi9012
  src/hooks/useAuth.ts
```

**커스터마이징:**
- `useAuth` → 다른 파일명으로 변경
- 확장자로 검색: `PATTERN=".tsx$"` 로 변경
- 경로로 검색: `PATTERN="^src/components"` 로 변경

---

### 레시피 4.3: 날짜 범위로 필터링

특정 날짜 범위의 checkpoint만 보기.

**실행:**
```bash
START="2025-02-01"
END="2025-02-10"
git log entire/checkpoints/v1 --since="$START" --until="$END" --format="%H %ad" --date=short | while read hash date; do
  echo "[$date] $hash"
  prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
  [ -n "$prompt_path" ] && git show $hash:$prompt_path 2>/dev/null | head -1 | sed 's/^/  /'
done
```

**예상 출력:**
```
[2025-02-10] abc1234
  Fix authentication bug

[2025-02-08] def5678
  Implement dashboard

[2025-02-05] ghi9012
  Add form validation
```

**커스터마이징:**
- 날짜 형식: ISO 8601 (`YYYY-MM-DD`) 사용
- 상대 날짜: `--since="1 week ago" --until="3 days ago"` 사용 가능

---

### 레시피 4.4: 브랜치별 필터링

특정 브랜치 또는 태그에서만 checkpoint 검색.

**실행:**
```bash
PATTERN="feature"
git log entire/checkpoints/v1 --all --grep="$PATTERN" --format="%H %ad %s" --date=short | head -20
```

또는 브랜치 이름으로:

```bash
git log entire/checkpoints/v1 --format="%H %ad" --date=short -50 | while read hash date; do
  # 원본 브랜치 정보가 metadata에 있으면 사용
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && echo "$date $hash $(git show $hash:$metadata 2>/dev/null | jq -r '.branch // "unknown"')"
done | grep -v "unknown"
```

**예안 출력:**
```
2025-02-12 abc1234 feature/auth-refactor
2025-02-10 def5678 feature/dashboard
2025-02-08 ghi9012 feature/api-v2
```

**커스터마이징:**
- `feature` → 다른 패턴으로 변경
- 정확한 일치: `--grep="^feature"` 사용

---

### 레시피 4.5: 복합 조건 검색

여러 조건을 동시에 만족하는 checkpoint 찾기.

**실행:**
```bash
# 예: "auth" 키워드 + "useAuth.ts" 파일 + 50개 이상 tokens
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

**예상 출력:**
```
[2025-02-12] abc1234 - Tokens: 5234
  Fix authentication error handling

[2025-02-10] def5678 - Tokens: 3100
  Implement login flow validation
```

**커스터마이징:**
- 조건 추가: `&&` 로 더 많은 조건 연결
- 조건 제거: 해당 `if` 라인 삭제
- 논리 변경: `||` (또는), `!` (반대) 사용

---

## 5️⃣ 시간 기반 분석 레시피

### 레시피 5.1: 요일별 Checkpoint 그룹화

어느 요일에 가장 많이 작업했는지 확인.

**실행:**
```bash
git log entire/checkpoints/v1 --format="%ad" --date=format:"%A" -200 | sort | uniq -c | sort -rn
```

**예상 출력:**
```
     45 Monday
     42 Friday
     38 Thursday
     35 Wednesday
     28 Tuesday
     12 Saturday
      8 Sunday
```

**커스터마이징:**
- 주간 시작: `%a` (단축) 또는 `%A` (전체) 사용
- 숫자로 변경: `%u` (월=1) 또는 `%w` (일=0) 사용

---

### 레시피 5.2: 시간별 Checkpoint 그룹화

하루 중 어느 시간대가 가장 활동적인지 확인.

**실행:**
```bash
git log entire/checkpoints/v1 --format="%ad" --date=format:"%H" -200 | sort | uniq -c | sort -k2 -n | \
  awk '{printf "%02d:00 - %02d:59 |", $2, $2; for(i=0;i<$1;i++) printf "█"; printf " (%d)\n", $1}'
```

**예상 출력:**
```
09:00 - 09:59 |████████████████ (16)
10:00 - 10:59 |██████████████████████ (22)
11:00 - 11:59 |███████████████████ (19)
14:00 - 14:59 |████████████████████████ (24)
15:00 - 15:59 |██████████████ (14)
17:00 - 17:59 |████████ (8)
```

**커스터마이징:**
- 30분 단위: `--date=format:"%H:%M"` 사용 (하지만 메타데이터에 분 정보가 없을 수 있음)
- 다른 형식: `--date=format:"%H:%M"` 로 분 단위 시도

---

### 레시피 5.3: 일일 Checkpoint 개수 추세

매일 몇 개의 checkpoint를 생성했는지 추적.

**실행:**
```bash
git log entire/checkpoints/v1 --format="%ad" --date=format:"%Y-%m-%d" -300 | sort | uniq -c | sort -k2 | \
  awk '{printf "%s: ", $2; for(i=0;i<$1;i++) printf "●"; printf " (%d)\n", $1}'
```

**예상 출력:**
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

**커스터마이징:**
- 주별로 변경: `--date=format:"%Y-W%V"` 사용
- 월별로 변경: `--date=format:"%Y-%m"` 사용

---

### 레시피 5.4: 가장 활동적인 시간대 찾기

가장 많은 checkpoint가 생성된 상위 3개 시간대 찾기.

**실행:**
```bash
git log entire/checkpoints/v1 --format="%ad" --date=format:"%H" -200 | sort | uniq -c | sort -rn | head -3 | \
  awk '{printf "%02d:00 시간대: %d개 checkpoint\n", $2, $1}'
```

**예상 출력:**
```
14:00 시간대: 24개 checkpoint
10:00 시간대: 22개 checkpoint
11:00 시간대: 19개 checkpoint
```

**커스터마이징:**
- `head -3` → `head -5` 등으로 더 많은 결과 보기
- `-200` → 분석할 checkpoint 개수 변경

---

## 6️⃣ 캐시 효율성 레시피

### 레시피 6.1: 캐시 히트 비율 계산

전체 토큰 중 캐시 읽기 비율을 정확히 계산합니다.

**실행:**
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

**예상 출력:**
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

**커스터마이징:**
- `1 week ago` → 다른 기간으로 변경
- 정렬된 결과: `| sort_by(.cache_hit_ratio)` 추가

---

### 레시피 6.2: 캐시 사용량이 낮은 세션 찾기

캐시를 거의 사용하지 않은 세션을 식별합니다.

**실행:**
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

**예상 출력:**
```
[2025-02-12] abc1234 - Cache hit: 2%
[2025-02-10] def5678 - Cache hit: 5%
[2025-02-08] ghi9012 - Cache hit: 8%
[2025-02-05] jkl3456 - Cache hit: 3%
```

**커스터마이징:**
- `10` → 다른 임계값으로 변경
- `head -20` → 더 많은 결과 보기

---

### 레시피 6.3: 시간대별 캐시 효율성 비교

시간대에 따라 캐시 효율성이 달라지는지 확인합니다.

**실행:**
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

**예상 출력:**
```
09:00 | Cache hit: 28.3%
10:00 | Cache hit: 31.5%
11:00 | Cache hit: 35.2%
14:00 | Cache hit: 38.9%
15:00 | Cache hit: 32.1%
```

**커스터마이징:**
- `-200` → 분석할 checkpoint 개수 변경
- 주별 분석: `--date=format:"%A"` 로 변경

---

### 레시피 6.4: 캐시 생성 vs 읽기 비교

캐시를 많이 만들고 있는지, 아니면 잘 활용하고 있는지 확인합니다.

**실행:**
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

**예상 출력:**
```json
{
  "cache_creation": 8900,
  "cache_read": 45600,
  "total_cache": 54500,
  "creation_pct": "16%",
  "read_pct": "84%"
}
```

**좋은 상황:** `read_pct` > `creation_pct` (캐시를 잘 활용)

**커스터마이징:**
- `-100` → 분석할 checkpoint 개수 변경
- 비율 역순: `creation_pct`와 `read_pct` 순서 바꾸기

---

## 7️⃣ 내보내기 레시피

### 레시피 7.1: Checkpoint 데이터를 CSV로 내보내기

모든 checkpoint 메타데이터를 CSV 파일로 저장합니다.

**실행:**
```bash
OUTPUT="checkpoints-$(date +%Y%m%d).csv"

# CSV 헤더
echo "date,hash,ai_percentage,input_tokens,output_tokens,cache_read,cache_creation,files_touched_count" > "$OUTPUT"

# 데이터 수집
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

echo "CSV 내보내기 완료: $OUTPUT"
wc -l "$OUTPUT"
```

**결과:**
```
checkpoints-20250212.csv 가 생성되었습니다. (201 lines)
```

**커스터마이징:**
- `-200` → 다른 checkpoint 개수로 변경
- 추가 컬럼: jq 필터에 더 많은 필드 추가
- 날짜 범위: `--since`, `--until` 추가

---

### 레시피 7.2: Checkpoint를 JSON 형식으로 내보내기

완전한 JSON 형식으로 데이터를 내보냅니다 (Excel, Power BI 등에서 처리 가능).

**실행:**
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

echo "JSON 내보내기 완료: $OUTPUT"
ls -lh "$OUTPUT"
```

**결과:**
```
JSON 내보내기 완료: checkpoints-20250212.json
-rw-r--r--  1 user  staff  256K 2025-02-12 15:30 checkpoints-20250212.json
```

**활용:**
```bash
# 내보낸 데이터에서 쿼리
jq '.[] | select(.initial_attribution.agent_percentage > 80)' checkpoints-20250212.json

# 통계 다시 계산
jq '[.[] | .token_usage.output_tokens] | add' checkpoints-20250212.json
```

**커스터마이징:**
- `-100` → 다른 checkpoint 개수로 변경
- 프롬프트 전체: `| head -1` 제거
- 간단하게: 일부 필드만 선택

---

### 레시피 7.3: 공유 가능한 요약 문서 생성

마크다운 형식의 아름다운 요약 리포트를 생성합니다.

**실행:**
```bash
OUTPUT="checkpoint-report-$(date +%Y%m%d).md"

cat > "$OUTPUT" << 'EOF'
# Checkpoint 분석 리포트

생성 날짜: $(date)

## 📊 요약 통계

EOF

# 통계 추가
HASHES=$(git log entire/checkpoints/v1 --since="1 week ago" --format="%H")
COUNT=$(echo "$HASHES" | wc -l)

echo "- **Total Checkpoints**: $COUNT" >> "$OUTPUT"
echo "- **Period**: Last 7 days" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# 토큰 통계
echo "## 💾 토큰 사용량" >> "$OUTPUT"

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

# 상위 작업
echo "## 🎯 상위 10개 작업" >> "$OUTPUT"
echo "" >> "$OUTPUT"

git log entire/checkpoints/v1 --since="1 week ago" --format="%H %ad" --date=short | head -10 | while read hash date; do
  prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
  echo "- **[$date]** $(git show $hash:$prompt_path 2>/dev/null | head -1)" >> "$OUTPUT"
done

echo "" >> "$OUTPUT"
echo "---" >> "$OUTPUT"
echo "Generated: $(date)" >> "$OUTPUT"

echo "리포트 생성 완료: $OUTPUT"
cat "$OUTPUT"
```

**결과:**
```
# Checkpoint 분석 리포트

생성 날짜: 2025-02-12 15:35:22 KST

## 📊 요약 통계

- **Total Checkpoints**: 47
- **Period**: Last 7 days
- **Input Tokens**: 412,358
- **Output Tokens**: 1,156,234
- **Total**: 1,568,592

## 🎯 상위 10개 작업

- **[2025-02-12]** Fix critical authentication bug
- **[2025-02-12]** Implement new dashboard features
...
```

**커스터마이징:**
- `1 week ago` → 다른 기간으로 변경
- `head -10` → 더 많은 항목 표시
- 마크다운 형식 변경: `##` → `###`, 이모지 추가/제거

---

### 레시피 7.4: 특정 Checkpoint를 팀원과 공유

특정 checkpoint의 모든 정보를 추출하여 공유합니다.

**실행:**
```bash
HASH="abc1234"  # 공유할 checkpoint hash
SHARE_DIR="/tmp/checkpoint-${HASH:0:7}-share"

mkdir -p "$SHARE_DIR"

# 메타데이터 추출
git ls-tree -r --name-only $HASH | grep '/[0-9]/metadata.json$' | tail -1 | \
  xargs -I {} git show $HASH:{} > "$SHARE_DIR/metadata.json"

# 프롬프트 추출
git ls-tree -r --name-only $HASH | grep 'prompt.txt$' | tail -1 | \
  xargs -I {} git show $HASH:{} > "$SHARE_DIR/prompt.txt"

# Context 추출
git ls-tree -r --name-only $HASH | grep 'context.md$' | tail -1 | \
  xargs -I {} git show $HASH:{} > "$SHARE_DIR/context.md" 2>/dev/null || echo "No context.md"

# README 생성
cat > "$SHARE_DIR/README.md" << EOF
# Checkpoint Share: ${HASH:0:7}

## 파일 설명

- **metadata.json**: Checkpoint 메타데이터
  - 토큰 사용량
  - AI 기여도
  - 수정된 파일 목록

- **prompt.txt**: 사용자 프롬프트

- **context.md**: 작업 컨텍스트 요약

## 사용법

\`\`\`bash
# 메타데이터 보기
cat metadata.json | jq '.'

# 토큰 사용량만 보기
cat metadata.json | jq '.token_usage'

# 수정된 파일 보기
cat metadata.json | jq '.files_touched[]'
\`\`\`

## 메타데이터

$(cat "$SHARE_DIR/metadata.json" | jq '.')
EOF

echo "Checkpoint 공유 완료!"
echo "위치: $SHARE_DIR"
echo "파일:"
ls -lh "$SHARE_DIR"
```

**결과:**
```
Checkpoint 공유 완료!
위치: /tmp/checkpoint-abc1234-share
파일:
total 48
-rw-r--r--  1 user  staff  2.3K metadata.json
-rw-r--r--  1 user  staff  1.8K prompt.txt
-rw-r--r--  1 user  staff   856 context.md
-rw-r--r--  1 user  staff  3.2K README.md
```

**공유 방법:**
```bash
# ZIP으로 압축해서 공유
zip -r checkpoint-abc1234.zip $SHARE_DIR
```

**커스터마이징:**
- `abc1234` → 공유할 hash 변경
- 추가 파일: `full.jsonl` 등 다른 파일도 추출 가능

---

## 🔧 레시피 확장하기

### 새로운 레시피 만드는 방법

1. **기본 구조 이해하기**
   ```bash
   git log entire/checkpoints/v1 --format="%H" -50 | while read hash; do
     # 각 checkpoint에서 데이터 추출
     metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
     [ -n "$metadata" ] && git show $hash:$metadata 2>/dev/null | jq '.필드'
   done
   ```

2. **필터링 추가**
   ```bash
   if [ 조건 ]; then
     # 조건을 만족할 때만 처리
   fi
   ```

3. **집계 추가**
   ```bash
   | awk '{sum+=$1} END {print "Total: " sum}'
   ```

4. **테스트하기**
   - 먼저 `-10` 으로 작은 데이터에서 테스트
   - 결과가 맞으면 `-100` 등으로 확대

---

## 📚 유용한 팁

### jq 필터 치트시트

```bash
# 기본 필드 추출
jq '.token_usage.output_tokens'

# 배열 모든 요소
jq '.files_touched[]'

# 조건부 필터
jq 'select(.token_usage.output_tokens > 5000)'

# 계산
jq '.token_usage | .input_tokens + .output_tokens'

# 정렬
jq 'sort_by(.token_usage.output_tokens) | reverse'
```

### Git 로그 형식

```bash
%H   - Commit hash (full)
%h   - Commit hash (short)
%ad  - Author date (adjustable with --date)
%s   - Subject (first line)

날짜 형식:
--date=short        → 2025-02-12
--date=format:"%Y-%m"  → 2025-02
--date=format:"%A"  → Monday
--date=format:"%H"  → 14
```

### 성능 최적화

```bash
# 메타데이터를 먼저 캐시
METADATA=$(git show $hash:$metadata)

# jq를 한 번만 호출
echo "$METADATA" | jq '.token_usage | ., .input_tokens, .output_tokens'

# 큰 데이터셋은 슬라이싱
git log --format="%H" -200 | tail -50  # 150-200번째만 처리
```

---

## 🎯 자주 사용되는 조합

### 일일 리포트
```bash
# 어제의 모든 작업 요약
git log entire/checkpoints/v1 --since="1 day ago" --until="now" \
  --format="%ad %H" --date=short
```

### 주간 분석
```bash
# 지난주 통계
git entirekit stats  # 별도 명령이 있으면 사용
# 또는
git log entire/checkpoints/v1 --since="1 week ago" --oneline
```

### 월간 리뷰
```bash
# 한 달간의 최고 기여도 세션
git log entire/checkpoints/v1 --since="1 month ago" --format="%H" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  [ -n "$metadata" ] && echo "$(git show $hash:$metadata 2>/dev/null | jq -r '.initial_attribution.agent_percentage // 0') $hash"
done | sort -rn | head -10
```

---

## 🚨 문제 해결

### "metadata.json을 찾을 수 없음" 오류

```bash
# 올바른 경로 형식 확인
git ls-tree -r --name-only $HASH | grep 'metadata'

# 다른 metadata 파일이 있는지 확인
git ls-tree -r --name-only $HASH | head -20
```

### jq 설치 안 됨

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# 설치 확인
jq --version
```

### 권한 거부 오류

```bash
# 스크립트에 실행 권한 추가
chmod +x script.sh
./script.sh

# 또는 bash로 직접 실행
bash script.sh
```

---

## 📖 더 배우기

- `git log` 옵션: `git log --help`
- `jq` 사용법: `jq --help` 또는 https://stedolan.github.io/jq/manual/
- Entire 문서: `.entire/docs/` 디렉토리
- 기본 사용법: `advanced-usage.md`

---

**Last Updated**: 2025-02-13
**Compatible with**: EntireKit System v1+
