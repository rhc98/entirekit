---
name: entire-analytics
description: >
  EntireKit 데이터를 위한 심층 분석 워크플로우: 통계 리포트, 비용 분석,
  생산성 트렌드, 회귀 디버깅, 지식 공유 및 내보내기.
  트리거 키워드: "checkpoint 리포트", "비용 분석", "토큰 사용량",
  "생산성 추세", "회귀 디버깅", "주간 리뷰", "checkpoint 내보내기"
---

[English](SKILL.md)


# Entire Analytics - 심층 분석 워크플로우

EntireKit 데이터에 대한 고급 분석 및 인사이트 도출 도구입니다. 단순 조회를 넘어 통계 리포트, 비용 분석, 생산성 추세, 회귀 디버깅 등의 복합적인 분석 작업을 제공합니다.

## 개요

**Entire Analytics**는 checkpoint 데이터의 다양한 각도에서의 분석을 지원합니다:

- **통계 리포트**: 토큰 사용량, AI 기여도, 파일 변경 이력 등의 정량적 분석
- **비용 분석**: API 호출별 토큰 비용 계산, 비용 최적화 기회 발굴
- **생산성 트렌드**: 시간대별 세션 활동, 생산성 패턴, 핫 파일 추적
- **회귀 디버깅**: 특정 버그가 언제 도입되었는지 추적, 과거 세션 컨텍스트 복원
- **지식 공유**: 분석 결과를 마크다운으로 내보내기, 팀과 공유

## 사용 시나리오

다음과 같은 요청에 이 스킬을 사용하세요:

### 분석 및 리포트
- "지난 주 뭐 했는지 리포트 생성해줘"
- "월별 checkpoint 통계 보여줘" / "일일 checkpoint 분석"
- "가장 자주 수정된 파일 top 10"
- "이번 달 토큰 사용량 분석"

### 비용 분석
- "API 비용 계산해줘" / "이번 달 비용은?"
- "가장 비싼 세션이 뭐야?" / "비용 효율이 낮은 세션 찾아줘"
- "캐시 히트율이 어떻게 되는지 보여줘"
- "토큰 사용량 최적화 기회가 있나?"

### 생산성 추세
- "시간대별 생산성 패턴이 뭐야?"
- "최근 hotspot 파일이 뭐지?"
- "주간 활동 분석"
- "AI 기여도 추이"

### 회귀 디버깅
- "이 버그가 언제 나타났어?"
- "src/hooks/useAuth.ts를 언제부터 수정했어?"
- "이 기능은 언제 추가됐어?"
- "이 파일의 변경 히스토리 전체"

### 지식 공유
- "checkpoint 데이터 마크다운으로 내보내줘"
- "최근 3개월 요약 문서 생성"
- "기능별 개발 히스토리 정리"

## 사전 조건 확인

checkpoint 분석을 시작하기 전에 다음을 확인하세요:

### 1. entire/checkpoints/v1 브랜치 확인

```bash
git rev-parse --verify entire/checkpoints/v1 >/dev/null 2>&1
```

브랜치가 없다면 [entire-checkpoint 스킬](../entire-checkpoint/)을 참조하세요.

### 2. jq 설치 확인

```bash
command -v jq >/dev/null 2>&1
```

**jq가 없다면 설치:**
- macOS: `brew install jq`
- Ubuntu/Debian: `sudo apt-get install jq`
- CentOS/RHEL: `sudo yum install jq`

### 3. 선택사항: bc (계산용)

```bash
command -v bc >/dev/null 2>&1
```

비용 계산이 필요하면 `bc` 설치:
- macOS: `brew install bc` (보통 기본 설치됨)
- Ubuntu: `sudo apt-get install bc`

### 4. Git Aliases 확인

entire-checkpoint의 aliases가 설정되어 있으면 더 쉽게 사용할 수 있습니다:

```bash
git config --local --get alias.entirekit >/dev/null 2>&1
```

미설치 시:
```bash
npx entirekit install
```

## 대화형 워크플로우 (Interactive Workflows)

### 워크플로우 1: 리포트 생성 (Generate Report)

**시나리오:** "지난 주 checkpoint 리포트 생성해줘"

**단계:**

#### 1단계: 사용자 입력 수집 (AskUserQuestion)

```javascript
// 리포트 유형 선택
AskUserQuestion({
  title: "리포트 유형 선택",
  question: "어떤 리포트를 원하시나요?",
  type: "preference",
  options: [
    { label: "일일 리포트 (Daily)", value: "daily" },
    { label: "주간 리포트 (Weekly)", value: "weekly" },
    { label: "월간 리포트 (Monthly)", value: "monthly" },
    { label: "커스텀 기간", value: "custom" }
  ]
})
```

선택 후:

```javascript
// 출력 형식 선택
AskUserQuestion({
  title: "출력 형식 선택",
  question: "어떤 형식으로 보고싶으신가요?",
  type: "preference",
  options: [
    { label: "터미널 출력 (Terminal)", value: "terminal" },
    { label: "마크다운 파일 (Markdown)", value: "markdown" },
    { label: "HTML 대시보드 (HTML)", value: "html" },
    { label: "JSON 데이터 (JSON)", value: "json" }
  ]
})
```

#### 2단계: 데이터 수집

**일일 리포트:**
```bash
SINCE_DATE=$(date -d "1 day ago" +%Y-%m-%d)
HASHES=$(git log entire/checkpoints/v1 --since="$SINCE_DATE" --format="%H")
```

**주간 리포트:**
```bash
SINCE_DATE=$(date -d "7 days ago" +%Y-%m-%d)
HASHES=$(git log entire/checkpoints/v1 --since="$SINCE_DATE" --format="%H")
```

**월간 리포트:**
```bash
SINCE_DATE=$(date -d "30 days ago" +%Y-%m-%d)
HASHES=$(git log entire/checkpoints/v1 --since="$SINCE_DATE" --format="%H")
```

#### 3단계: 메트릭 계산

```bash
# 헬퍼 함수: metadata 경로 추출
get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# 통계 집계
total_input=0
total_output=0
total_cache=0
total_api_calls=0
total_agents=0
total_human=0
declare -A file_count

for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    # 토큰 추출
    tokens=$(git show $hash:$metadata | jq '.token_usage')
    input=$(echo $tokens | jq -r '.input_tokens // 0')
    output=$(echo $tokens | jq -r '.output_tokens // 0')
    cache=$(echo $tokens | jq -r '.cache_read_tokens // 0')
    api_calls=$(echo $tokens | jq -r '.api_calls // 0')

    total_input=$((total_input + input))
    total_output=$((total_output + output))
    total_cache=$((total_cache + cache))
    total_api_calls=$((total_api_calls + api_calls))

    # AI 기여도
    attribution=$(git show $hash:$metadata | jq '.initial_attribution')
    agent=$(echo $attribution | jq -r '.agent_percentage // 0')
    total_agents=$((total_agents + agent))

    # 파일 집계
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')
    while read -r file; do
      if [ -n "$file" ]; then
        ((file_count["$file"]++))
      fi
    done <<< "$files"
  fi
done
```

#### 4단계: 출력 생성

**터미널 출력:**
```bash
echo "📊 Checkpoint 리포트 (주간)"
echo "================================================"
echo ""
echo "💰 토큰 사용량"
echo "  Input tokens:        $total_input"
echo "  Output tokens:       $total_output"
echo "  Cache read tokens:   $total_cache"
echo "  Total API calls:     $total_api_calls"
echo ""
echo "🤖 AI 기여도"
echo "  평균 AI 기여도:      ${total_agents}%"
echo ""
echo "📝 가장 많이 수정된 파일 TOP 10"
for file in $(printf '%s\n' "${!file_count[@]}" | sort -t: -k2 -rn | head -10); do
  echo "  ${file_count[$file]} - $file"
done
```

**마크다운 출력:**
```bash
cat > report_$(date +%Y%m%d).md << 'EOF'
# Checkpoint 주간 리포트

**생성일:** $(date '+%Y-%m-%d %H:%M:%S')

## 통계

### 토큰 사용량
- Input tokens: $total_input
- Output tokens: $total_output
- Cache read tokens: $total_cache
- Total API calls: $total_api_calls

### AI 기여도
- 평균: ${total_agents}%

### 가장 많이 수정된 파일
[파일 목록...]

EOF
```

---

### 워크플로우 2: 비용 분석 (Cost Analysis)

**시나리오:** "이번 달 API 비용이 얼마나 되는지 분석해줘"

**단계:**

#### 1단계: 분석 기간 선택 (AskUserQuestion)

```javascript
AskUserQuestion({
  title: "분석 기간 선택",
  question: "어떤 기간의 비용을 분석할까요?",
  type: "preference",
  options: [
    { label: "지난 7일", value: "7d" },
    { label: "지난 30일", value: "30d" },
    { label: "지난 90일", value: "90d" },
    { label: "전체 기간", value: "all" },
    { label: "커스텀 기간", value: "custom" }
  ]
})
```

#### 2단계: 가격 정보 설정

OpenAI 가격 기준 (2024년):

```bash
# GPT-4 입력 토큰
INPUT_PRICE=0.00003  # per token

# GPT-4 출력 토큰
OUTPUT_PRICE=0.00006  # per token

# Cache read (캐시 히트된 입력 토큰)
CACHE_READ_PRICE=0.000009  # per token (90% 할인)

# Cache creation (캐시 생성 비용)
CACHE_WRITE_PRICE=0.00006  # per token (토큰 가격의 25% 추가)
```

#### 3단계: 비용 계산

```bash
get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# 기간별 checkpoint 조회
SINCE_DATE=$(date -d "30 days ago" +%Y-%m-%d)
HASHES=$(git log entire/checkpoints/v1 --since="$SINCE_DATE" --format="%H")

declare -A session_cost
declare -a session_hashes
total_cost=0

for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    tokens=$(git show $hash:$metadata | jq '.token_usage')

    input=$(echo $tokens | jq -r '.input_tokens // 0')
    output=$(echo $tokens | jq -r '.output_tokens // 0')
    cache=$(echo $tokens | jq -r '.cache_read_tokens // 0')

    # bc를 이용한 비용 계산
    input_cost=$(echo "scale=6; $input * $INPUT_PRICE" | bc)
    output_cost=$(echo "scale=6; $output * $OUTPUT_PRICE" | bc)
    cache_cost=$(echo "scale=6; $cache * $CACHE_READ_PRICE" | bc)

    session_total=$(echo "scale=6; $input_cost + $output_cost + $cache_cost" | bc)

    session_cost[$hash]=$session_total
    session_hashes+=($hash)
    total_cost=$(echo "scale=6; $total_cost + $session_total" | bc)
  fi
done
```

#### 4단계: 분석 및 인사이트

**비용 분포:**
```bash
# 비용 기준 정렬 (비싼 것부터)
for hash in $(for h in "${!session_cost[@]}"; do echo "${session_cost[$h]} $h"; done | sort -rn | cut -d' ' -f2 | head -10); do
  cost=${session_cost[$hash]}
  echo "$hash: \$$cost"
done
```

**아웃라이어 감지:**
```bash
# 평균 비용 계산
avg_cost=$(echo "scale=6; $total_cost / ${#session_cost[@]}" | bc)

# 평균의 2배 이상: 비싼 세션
for hash in "${!session_cost[@]}"; do
  cost=${session_cost[$hash]}
  threshold=$(echo "scale=6; $avg_cost * 2" | bc)
  if (( $(echo "$cost > $threshold" | bc -l) )); then
    echo "⚠️  비싼 세션: $hash (\$$cost)"
  fi
done
```

**캐시 효율성:**
```bash
total_cache_tokens=0
total_uncached_tokens=0

for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    tokens=$(git show $hash:$metadata | jq '.token_usage')
    cache=$(echo $tokens | jq -r '.cache_read_tokens // 0')
    input=$(echo $tokens | jq -r '.input_tokens // 0')

    total_cache_tokens=$((total_cache_tokens + cache))
    total_uncached_tokens=$((total_uncached_tokens + input))
  fi
done

# 캐시 히트율
if [ $((total_cache_tokens + total_uncached_tokens)) -gt 0 ]; then
  cache_rate=$(echo "scale=2; $total_cache_tokens * 100 / ($total_cache_tokens + $total_uncached_tokens)" | bc)
  echo "Cache hit rate: $cache_rate%"
fi
```

#### 5단계: 최적화 제안

```markdown
## 비용 최적화 제안

### 현재 상황
- 총 비용: $X.XX
- 일일 평균: $Y.YY
- 예상 월비: $Z.ZZ

### 아웃라이어 세션
[비싼 세션 목록]

### 개선 기회
1. **캐시 활용 증대**
   - 현재 캐시 히트율: XX%
   - 목표: YY%
   - 예상 절감: $Z.ZZ/월

2. **토큰 효율성**
   - 평균 Input/Output 비율
   - 개선 제안

3. **세션 최적화**
   - 불필요한 API 호출 제거
   - 프롬프트 길이 최적화
```

---

### 워크플로우 3: 생산성 트렌드 (Productivity Trends)

**시나리오:** "최근 생산성 패턴이 어떻게 되는지 보여줘"

**단계:**

#### 1단계: 분석 유형 선택 (AskUserQuestion)

```javascript
AskUserQuestion({
  title: "생산성 분석 유형",
  question: "어떤 관점의 생산성을 분석할까요?",
  type: "preference",
  options: [
    { label: "시간대별 활동", value: "hourly" },
    { label: "일일 생산성", value: "daily" },
    { label: "주간 패턴", value: "weekly" },
    { label: "핫 파일 분석", value: "hotfiles" },
    { label: "AI 기여도 추이", value: "aitrend" }
  ]
})
```

#### 2단계: 시간대별 활동 분석

```bash
# 시간대별 checkpoint 분포
for hour in {0..23}; do
  count=$(git log entire/checkpoints/v1 --format="%H %aI" -30 | \
    awk -F'T' "{if (\$2 ~ /^$(printf '%02d' $hour)/) print}" | wc -l)
  printf "%02d:00 | " $hour
  for ((i=0; i<count; i++)); do echo -n "█"; done
  echo ""
done
```

**출력:**
```
00:00 |
01:00 |
02:00 | █
...
14:00 | ████████████████
15:00 | ███████████
...
23:00 |
```

#### 3단계: 일일 생산성 점수

```bash
# 각 checkpoint의 생산성 점수 계산
# 점수 = (AI 기여도 * 파일 수정 개수 * 토큰 효율) / 시간

get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

declare -A daily_productivity

HASHES=$(git log entire/checkpoints/v1 --format="%H" -30)
for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    date=$(git log -1 --format="%ad" --date=short $hash)

    # 메트릭 추출
    ai_contrib=$(git show $hash:$metadata | jq -r '.initial_attribution.agent_percentage // 0')
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty' | wc -l)
    tokens=$(git show $hash:$metadata | jq '.token_usage')
    input=$(echo $tokens | jq -r '.input_tokens // 1')
    output=$(echo $tokens | jq -r '.output_tokens // 1')

    # 효율 점수 (output/input 비율)
    efficiency=$(echo "scale=2; $output / $input" | bc)

    # 생산성 점수
    score=$(echo "scale=1; ($ai_contrib * $files * $efficiency) / 100" | bc)

    daily_productivity[$date]=$(echo "scale=1; ${daily_productivity[$date]:-0} + $score" | bc)
  fi
done

# 일일 시각화
for date in $(printf '%s\n' "${!daily_productivity[@]}" | sort -r); do
  score=${daily_productivity[$date]}
  echo "$date | Score: $score"
done
```

#### 4단계: 핫 파일 분석

```bash
# 최근 N일간 가장 자주 수정된 파일
declare -A file_frequency
declare -a file_list

HASHES=$(git log entire/checkpoints/v1 --since="30 days ago" --format="%H")
for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')
    while read -r file; do
      if [ -n "$file" ]; then
        ((file_frequency["$file"]++))
      fi
    done <<< "$files"
  fi
done

# TOP 10 hotfiles
echo "🔥 가장 자주 수정된 파일 (최근 30일)"
echo "================================================"
for file in $(printf '%s\n' "${!file_frequency[@]}" | sort -t: -k2 -rn | head -10); do
  count=${file_frequency[$file]}
  echo "[$count] $file"
done
```

#### 5단계: AI 기여도 추이

```bash
# 일주일 단위로 AI 기여도 추이
declare -a weeks
declare -a contributions

for i in {0..3}; do
  start_date=$(date -d "$((i*7)) days ago" +%Y-%m-%d)
  end_date=$(date -d "$((i*7-7)) days ago" +%Y-%m-%d)

  week_label=$(date -d "$start_date" +%Y-W%V)

  HASHES=$(git log entire/checkpoints/v1 --since="$end_date" --until="$start_date" --format="%H")

  total_contrib=0
  count=0
  for hash in $HASHES; do
    metadata=$(get_metadata_path $hash)
    if [ -n "$metadata" ]; then
      contrib=$(git show $hash:$metadata | jq -r '.initial_attribution.agent_percentage // 0')
      total_contrib=$((total_contrib + contrib))
      ((count++))
    fi
  done

  if [ $count -gt 0 ]; then
    avg_contrib=$(echo "scale=1; $total_contrib / $count" | bc)
    weeks+=("$week_label")
    contributions+=("$avg_contrib")
  fi
done

# 시각화
echo "📈 AI 기여도 추이"
echo "================================================"
for i in "${!weeks[@]}"; do
  week=${weeks[$i]}
  contrib=${contributions[$i]}
  printf "%-12s | " "$week"
  count=$(echo "$contrib / 5" | bc)
  for ((j=0; j<count; j++)); do echo -n "█"; done
  echo " $contrib%"
done
```

---

### 워크플로우 4: 회귀 디버깅 (Regression Debugging)

**시나리오:** "이 버그가 언제 도입되었어?"

**단계:**

#### 1단계: 검색 조건 정의 (AskUserQuestion)

```javascript
AskUserQuestion({
  title: "회귀 버그 검색",
  question: "어떻게 찾을까요?",
  type: "preference",
  options: [
    { label: "파일 이름으로", value: "filename" },
    { label: "키워드로", value: "keyword" },
    { label: "에러 메시지", value: "error" }
  ]
})
```

선택에 따라:

```javascript
// filename 선택 시
AskUserQuestion({
  title: "파일 입력",
  question: "수정된 파일 이름을 입력하세요 (예: LoginForm.tsx)",
  type: "text"
})
```

#### 2단계: 변경 히스토리 추출

```bash
TARGET_FILE="src/hooks/useAuth.ts"  # 사용자 입력

get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

# 해당 파일을 수정한 모든 checkpoint 찾기
declare -a modifications
declare -a modification_dates

echo "🔍 $TARGET_FILE 수정 히스토리"
echo "================================================"

HASHES=$(git log entire/checkpoints/v1 --format="%H" -100)
for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')
    if echo "$files" | grep -q "$TARGET_FILE"; then
      date=$(git log -1 --format="%ad" --date=short $hash)
      time=$(git log -1 --format="%ai" $hash | cut -d' ' -f2)

      modifications+=("$hash")
      modification_dates+=("$date $time")

      # 프롬프트 미리보기
      prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | head -1)
      if [ -n "$prompt_path" ]; then
        prompt=$(git show $hash:$prompt_path | head -1)
        echo "[$date] $hash"
        echo "  프롬프트: $prompt"
      fi
    fi
  fi
done
```

#### 3단계: 버그 도입 지점 특정

```bash
# 연속된 두 checkpoint 간 차이 분석
echo ""
echo "🐛 버그 도입 가능 지점"
echo "================================================"

for ((i=0; i<${#modifications[@]}-1; i++)); do
  hash1=${modifications[$i]}
  hash2=${modifications[$((i+1))]}

  echo ""
  echo "비교: ${modification_dates[$i]} → ${modification_dates[$((i+1))]}"
  echo ""

  # 각 checkpoint의 메타데이터 비교
  metadata1=$(get_metadata_path $hash1)
  metadata2=$(get_metadata_path $hash2)

  # 토큰 변화
  tokens1=$(git show $hash1:$metadata1 | jq '.token_usage | {input, output}')
  tokens2=$(git show $hash2:$metadata2 | jq '.token_usage | {input, output}')

  echo "토큰 변화:"
  echo "  $hash1: $tokens1"
  echo "  $hash2: $tokens2"

  # 프롬프트 비교
  prompt1=$(git ls-tree -r --name-only $hash1 | grep 'prompt.txt$' | head -1)
  prompt2=$(git ls-tree -r --name-only $hash2 | grep 'prompt.txt$' | head -1)

  if [ -n "$prompt1" ] && [ -n "$prompt2" ]; then
    echo ""
    echo "세션 내용 비교:"
    echo "  Checkpoint 1:"
    git show $hash1:$prompt1 | head -3 | sed 's/^/    /'
    echo "  Checkpoint 2:"
    git show $hash2:$prompt2 | head -3 | sed 's/^/    /'
  fi
done
```

#### 4단계: 과거 세션 컨텍스트 복원

```bash
# 특정 checkpoint의 전체 대화 내용 조회
SELECTED_HASH="ac03096"  # 사용자가 선택한 해시

echo "📋 세션 전체 내용"
echo "================================================"

# 메타데이터 출력
metadata=$(get_metadata_path $SELECTED_HASH)
echo "메타데이터:"
git show $SELECTED_HASH:$metadata | jq '.metadata' | head -20

# 프롬프트 출력
echo ""
echo "초기 프롬프트:"
echo "================================================"
prompt_path=$(git ls-tree -r --name-only $SELECTED_HASH | grep 'prompt.txt$' | head -1)
git show $SELECTED_HASH:$prompt_path

# 전체 대화 내용
echo ""
echo "전체 대화 내용:"
echo "================================================"
jsonl_path=$(git ls-tree -r --name-only $SELECTED_HASH | grep 'full.jsonl$' | tail -1)
if [ -n "$jsonl_path" ]; then
  git show $SELECTED_HASH:$jsonl_path | jq -r '.content' | head -100
fi
```

---

### 워크플로우 5: 지식 공유 및 내보내기 (Knowledge Sharing & Export)

**시나리오:** "최근 3개월 개발 히스토리를 마크다운으로 정리해줘"

**단계:**

#### 1단계: 공유 콘텐츠 선택 (AskUserQuestion)

```javascript
AskUserQuestion({
  title: "공유할 콘텐츠",
  question: "뭘 공유할까요?",
  type: "preference",
  options: [
    { label: "전체 세션 히스토리", value: "sessions" },
    { label: "기능별 개발 이력", value: "features" },
    { label: "개발자 기여도 분석", value: "contribution" },
    { label: "변경된 모든 파일", value: "files" },
    { label: "주간/월간 요약", value: "summary" }
  ]
})
```

#### 2단계: 기간 선택

```javascript
AskUserQuestion({
  title: "기간 선택",
  question: "어떤 기간을 내보낼까요?",
  type: "preference",
  options: [
    { label: "지난 7일", value: "7d" },
    { label: "지난 30일", value: "30d" },
    { label: "지난 90일", value: "90d" },
    { label: "전체", value: "all" }
  ]
})
```

#### 3단계: 세션 히스토리 내보내기

```bash
OUTPUT_FILE="checkpoint_export_$(date +%Y%m%d).md"

cat > "$OUTPUT_FILE" << 'EOF'
# Checkpoint 내보내기

**생성일:** $(date '+%Y-%m-%d %H:%M:%S')
**기간:** 최근 30일

---

## 목차

- [세션 목록](#세션-목록)
- [파일 변경 이력](#파일-변경-이력)
- [통계](#통계)

---

## 세션 목록

| 날짜 | 해시 | 프롬프트 | 파일 수 | 토큰 |
|------|------|---------|--------|------|
EOF

get_metadata_path() {
  local hash=$1
  git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
}

HASHES=$(git log entire/checkpoints/v1 --since="30 days ago" --format="%H")
for hash in $HASHES; do
  metadata=$(get_metadata_path $hash)
  if [ -n "$metadata" ]; then
    date=$(git log -1 --format="%ad" --date=short $hash)

    # 프롬프트 추출
    prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | head -1)
    prompt=$(git show $hash:$prompt_path 2>/dev/null | head -1 | cut -c1-50)

    # 파일/토큰 정보
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty' | wc -l)
    tokens=$(git show $hash:$metadata | jq '.token_usage | .input_tokens + .output_tokens')

    echo "| $date | ${hash:0:7} | $prompt | $files | $tokens |" >> "$OUTPUT_FILE"
  fi
done

echo ""
echo "✅ 내보내기 완료: $OUTPUT_FILE"
```

#### 4단계: 기능별 히스토리

```bash
# 파일을 기능별로 그룹화
cat >> "$OUTPUT_FILE" << 'EOF'

## 기능별 개발 이력

EOF

declare -A feature_files=(
  ["인증"]="src/hooks/useAuth.ts|src/api/auth.ts"
  ["게임"]="src/app/games|src/hooks/useGame.ts"
  ["에셋"]="src/app/assets|src/api/asset.ts"
  ["UI"]="src/components|src/app"
)

for feature in "${!feature_files[@]}"; do
  patterns=${feature_files[$feature]}

  echo "### $feature" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"

  HASHES=$(git log entire/checkpoints/v1 --since="30 days ago" --format="%H")
  for hash in $HASHES; do
    metadata=$(get_metadata_path $hash)
    if [ -n "$metadata" ]; then
      files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')

      for pattern in ${patterns//|/ }; do
        if echo "$files" | grep -q "$pattern"; then
          date=$(git log -1 --format="%ad" --date=short $hash)
          short_hash=${hash:0:7}

          prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | head -1)
          prompt=$(git show $hash:$prompt_path 2>/dev/null | head -1)

          echo "- **$date** ($short_hash): $prompt" >> "$OUTPUT_FILE"
          break
        fi
      done
    fi
  done

  echo "" >> "$OUTPUT_FILE"
done
```

---

## 고급 분석 스크립트

### 스크립트 1: 완전 분석 대시보드

```bash
#!/bin/bash
# analyze-full.sh - 모든 분석을 한 번에 실행

generate_full_analysis() {
  local output_file="analysis_$(date +%Y%m%d_%H%M%S).md"

  {
    echo "# 종합 분석 리포트"
    echo "생성일: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    echo "## 토큰 분석"
    echo '```'
    git entirekit stats 2>/dev/null || echo "git entirekit stats 실행 불가"
    echo '```'
    echo ""

    echo "## 최근 활동"
    echo '```'
    git entirekit recent 2>/dev/null || git log entire/checkpoints/v1 --format="%h %ad %s" --date=short -10
    echo '```'
    echo ""

  } > "$output_file"

  echo "리포트 저장: $output_file"
}

generate_full_analysis
```

### 스크립트 2: 비용 리포트 생성기

```bash
#!/bin/bash
# cost-report.sh

generate_cost_report() {
  local days=${1:-30}
  local output="cost_report_${days}d.md"

  # 가격 설정
  local INPUT_PRICE=0.00003
  local OUTPUT_PRICE=0.00006
  local CACHE_PRICE=0.000009

  {
    echo "# 비용 분석 리포트 (최근 ${days}일)"
    echo "생성: $(date)"
    echo ""

    # 토큰 통계
    echo "## 토큰 사용량"
    echo ""

    # 비용 계산은 워크플로우 2 참조

  } > "$output"

  echo "비용 리포트: $output"
}

generate_cost_report 30
```

### 스크립트 3: 파일별 변경 히스토리

```bash
#!/bin/bash
# file-history.sh

show_file_history() {
  local target_file="$1"

  if [ -z "$target_file" ]; then
    echo "사용법: $0 <파일경로>"
    return 1
  fi

  get_metadata_path() {
    local hash=$1
    git ls-tree -r --name-only $hash 2>/dev/null | grep '/[0-9]/metadata.json$' | tail -1
  }

  echo "파일 변경 히스토리: $target_file"
  echo "=========================================="
  echo ""

  HASHES=$(git log entire/checkpoints/v1 --format="%H" -100)
  for hash in $HASHES; do
    metadata=$(get_metadata_path $hash)
    if [ -n "$metadata" ]; then
      files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')

      if echo "$files" | grep -q "$target_file"; then
        date=$(git log -1 --format="%ad" --date=short $hash)
        time=$(git log -1 --format="%ai" $hash | cut -d' ' -f2)

        prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | head -1)
        if [ -n "$prompt_path" ]; then
          prompt=$(git show $hash:$prompt_path | head -1)
          echo "[$date $time] $hash"
          echo "  $prompt"
          echo ""
        fi
      fi
    fi
  done
}

show_file_history "$@"
```

---

## 참조 문서

더 자세한 정보는 다음 참조 문서를 확인하세요:

- [entire-checkpoint 스킬](../entire-checkpoint/SKILL.md) - 기본 조회 및 검색 (사전 조건)
- [report-templates.md](./references/report-templates.md) - 다양한 리포트 템플릿
- [analysis-recipes.md](./references/analysis-recipes.md) - 재사용 가능한 분석 레시피

## 관련 스킬

- **entire-checkpoint** - 기본 checkpoint 조회 및 검색 도구
