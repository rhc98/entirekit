[English](advanced-usage.md)

# 고급 활용법

Checkpoint 도구의 강력한 기능들을 활용하는 방법입니다.

## 🎯 고급 검색

### 1. 복합 조건 검색

여러 키워드를 조합해서 검색:

```bash
# "로그인" 관련 파일만
git entirekit search "login" | grep "Files touched"

# 특정 날짜 범위
git log entire/checkpoints/v1 --since="2 weeks ago" --until="1 week ago" --oneline
```

### 2. 정규표현식 검색

```bash
# checkpoint 브랜치에서 직접 grep
git log entire/checkpoints/v1 --format="%H" -50 | while read hash; do
  path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
  content=$(git show $hash:$path 2>/dev/null)
  if echo "$content" | grep -E "로그인|인증|auth" >/dev/null; then
    echo "Found in $hash"
    echo "$content" | head -3
    echo ""
  fi
done
```

### 3. 파일별 변경 히스토리

특정 파일이 언제 수정되었는지 추적:

```bash
FILE="src/hooks/useAuth.ts"

git log entire/checkpoints/v1 --format="%H %ad" --date=short -30 | while read hash date; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    files=$(git show $hash:$metadata | jq -r '.files_touched[]? // empty')
    if echo "$files" | grep -q "$FILE"; then
      echo "[$date] $hash"
      # 해당 checkpoint의 프롬프트도 출력
      prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
      git show $hash:$prompt_path 2>/dev/null | head -2
      echo ""
    fi
  fi
done
```

## 📊 통계 분석

### 1. 맞춤 통계 추출

특정 기간의 통계:

```bash
# 최근 2주간 토큰 사용량
HASHES=$(git log entire/checkpoints/v1 --since="2 weeks ago" --format="%H")

total_tokens=0
for hash in $HASHES; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    tokens=$(git show $hash:$metadata | jq -r '.token_usage.output_tokens // 0')
    total_tokens=$((total_tokens + tokens))
  fi
done

echo "최근 2주간 output tokens: $total_tokens"
```

### 2. 파일별 AI 기여도

어떤 파일에 AI가 많이 기여했는지:

```bash
git log entire/checkpoints/v1 --format="%H" -30 | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    data=$(git show $hash:$metadata 2>/dev/null)
    pct=$(echo "$data" | jq -r '.initial_attribution.agent_percentage // 0')
    files=$(echo "$data" | jq -r '.files_touched[]? // empty' | head -3)

    if (( $(echo "$pct > 70" | bc -l) )); then
      echo "AI ${pct}% contribution:"
      echo "$files" | sed 's/^/  - /'
      echo ""
    fi
  fi
done
```

### 3. 생산성 트렌드

시간대별 생산성 분석:

```bash
# 주별 checkpoint 수
git log entire/checkpoints/v1 --format="%ad" --date=format:"%Y-%U" | \
  sort | uniq -c | tail -10

# 요일별 패턴
git log entire/checkpoints/v1 --format="%ad" --date=format:"%A" | \
  sort | uniq -c
```

## 🔬 심층 분석

### 1. 전체 대화 내용 추출

특정 checkpoint의 모든 대화 보기:

```bash
HASH="ac03096"  # git entirekit recent에서 선택

# full.jsonl 경로 찾기
JSONL_PATH=$(git ls-tree -r --name-only $HASH | grep 'full.jsonl$' | tail -1)

# 내용 추출 (읽기 쉽게 변환)
git show $HASH:$JSONL_PATH | jq -r '.content' | less
```

### 2. 프롬프트 패턴 분석

자주 사용하는 프롬프트 패턴:

```bash
# 프롬프트 첫 줄만 추출
git log entire/checkpoints/v1 --format="%H" -50 | while read hash; do
  prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
  git show $hash:$prompt_path 2>/dev/null | head -1
done | sort | uniq -c | sort -rn | head -20
```

### 3. 토큰 효율성 분석

적은 토큰으로 많은 작업을 한 세션 찾기:

```bash
git log entire/checkpoints/v1 --format="%H" -30 | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  if [ -n "$metadata" ]; then
    data=$(git show $hash:$metadata 2>/dev/null)
    tokens=$(echo "$data" | jq -r '.token_usage.output_tokens // 0')
    files_count=$(echo "$data" | jq -r '.files_touched | length // 0')

    if [ "$tokens" -lt 1000 ] && [ "$files_count" -gt 2 ]; then
      echo "Efficient: ${tokens} tokens, ${files_count} files - $hash"
    fi
  fi
done
```

## 💾 데이터 내보내기

### 1. 월간 리포트 생성

```bash
#!/bin/bash
# monthly-report.sh

MONTH=$(date +%Y-%m)
OUTPUT="checkpoint-report-${MONTH}.md"

cat > "$OUTPUT" << EOF
# Checkpoint Report - $MONTH

## 통계

$(git entirekit stats)

## 주요 작업

EOF

git log entire/checkpoints/v1 --since="1 month ago" --format="%H %ad" --date=short | \
  head -20 | while read hash date; do
    prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
    echo "### [$date] Checkpoint ${hash:0:7}" >> "$OUTPUT"
    git show $hash:$prompt_path 2>/dev/null | head -3 >> "$OUTPUT"
    echo "" >> "$OUTPUT"
done

echo "리포트 생성 완료: $OUTPUT"
```

### 2. 특정 checkpoint를 다른 팀원과 공유

```bash
#!/bin/bash
# export-checkpoint.sh <hash>

HASH=$1
OUTPUT_DIR="/tmp/checkpoint-${HASH:0:7}"

mkdir -p "$OUTPUT_DIR"

# 모든 관련 파일 추출
for file in full.jsonl context.md prompt.txt metadata.json; do
  path=$(git ls-tree -r --name-only $HASH | grep "$file$" | tail -1)
  if [ -n "$path" ]; then
    git show $HASH:$path > "$OUTPUT_DIR/$file"
  fi
done

# README 생성
cat > "$OUTPUT_DIR/README.txt" << EOF
Checkpoint: $HASH
Exported: $(date)

Files:
- full.jsonl: 전체 대화 내용
- context.md: 요약
- prompt.txt: 사용자 프롬프트
- metadata.json: 메타데이터 (토큰, 파일 등)

읽는 법:
cat full.jsonl | jq -r '.content'
EOF

echo "Checkpoint exported to: $OUTPUT_DIR"
```

## 🛠️ 자동화

### 1. 일일 슬랙 알림

```bash
#!/bin/bash
# daily-slack-notify.sh

WEBHOOK_URL="your-slack-webhook-url"

STATS=$(git entirekit yesterday)
COUNT=$(echo "$STATS" | wc -l)

curl -X POST $WEBHOOK_URL -H 'Content-Type: application/json' -d '{
  "text": "Yesterday we had '"$COUNT"' checkpoint sessions",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "```'"$STATS"'```"
      }
    }
  ]
}'
```

### 2. 주간 리뷰 자동화

```bash
#!/bin/bash
# weekly-review.sh

echo "# Weekly Review - $(date +%Y-%W)"
echo ""

echo "## Overview"
git log entire/checkpoints/v1 --since="1 week ago" --oneline | wc -l | \
  xargs echo "Total checkpoints:"

echo ""
echo "## Statistics"
git entirekit stats

echo ""
echo "## Hot Files"
git log entire/checkpoints/v1 --since="1 week ago" --format="%H" | while read hash; do
  metadata=$(git ls-tree -r --name-only $hash | grep '/[0-9]/metadata.json$' | tail -1)
  git show $hash:$metadata 2>/dev/null | jq -r '.files_touched[]? // empty'
done | sort | uniq -c | sort -rn | head -10
```

## 🔍 디버깅 팁

### 1. 특정 에러의 최초 발생 시점 찾기

```bash
ERROR_MSG="TypeError"

git log entire/checkpoints/v1 --format="%H %ad" --date=short --reverse | \
  while read hash date; do
    prompt_path=$(git ls-tree -r --name-only $hash | grep 'prompt.txt$' | tail -1)
    if git show $hash:$prompt_path 2>/dev/null | grep -q "$ERROR_MSG"; then
      echo "First occurrence: [$date] $hash"
      git show $hash:$prompt_path | head -5
      break
    fi
done
```

### 2. 회귀 버그 추적

```bash
# 기능이 작동했던 마지막 checkpoint 찾기
FEATURE="로그인"

git log entire/checkpoints/v1 --format="%H %ad" --date=short | \
  while read hash date; do
    if git entirekit search "$FEATURE" 2>/dev/null | grep -q "$hash"; then
      echo "[$date] Feature mentioned: $hash"
    fi
done
```

## 🎓 Best Practices

### 1. 정기적인 리뷰

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
alias morning='git entirekit yesterday'
alias weekly='git entirekit week && git entirekit stats'
```

### 2. 팀 공유 템플릿

중요한 checkpoint를 문서화:

```markdown
## [기능명] 구현 (Checkpoint: abc1234)

### 배경
- 왜 만들었는지

### 구현
- checkpoint 검색: `git entirekit search "기능명"`
- 주요 파일: ...

### 결과
- 토큰 사용: ...
- AI 기여도: ...
```

### 3. 비용 최적화

Cache 효율 높이기:

```bash
# Cache read 비율 확인
git entirekit stats | grep "Cache"

# 비율이 낮다면:
# - 같은 파일을 여러 번 수정할 때 context 유지
# - 불필요한 파일 읽기 줄이기
```

## 🚀 고급 통합

### Git 훅 연동

`.git/hooks/post-commit`:
```bash
#!/bin/bash
# 커밋할 때마다 최근 checkpoint 확인

echo "Recent checkpoints:"
git entirekit recent | head -3
```

### IDE 통합

VSCode tasks.json:
```json
{
  "label": "Checkpoint Stats",
  "type": "shell",
  "command": "git entirekit stats",
  "problemMatcher": []
}
```

## 📚 참고 자료

- [Entire GitHub](https://github.com/entireio/cli)
- [Claude Code 문서](https://claude.com/claude-code)
- [jq 매뉴얼](https://stedolan.github.io/jq/manual/)

---

**다음 단계:**
- 실전에서 사용해보기
- 팀 워크플로우에 통합
- 자신만의 스크립트 만들기
