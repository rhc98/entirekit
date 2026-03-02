[English](commands.md)

# EntireKit 도구 - Git Alias 명령어 참조

이 문서는 EntireKit 시스템에서 제공하는 모든 git alias 명령어에 대한 포괄적인 참조입니다.

## 개요

설치 후 다음 8개의 git alias 명령어를 사용할 수 있습니다:

| 명령어 | 목적 | 반환값 |
|--------|------|--------|
| `git entirekit stats` | 최근 10개 checkpoint의 통계 분석 | 토큰, AI 기여도, 파일 통계 |
| `git entirekit search` | checkpoint에서 키워드 검색 | 관련 prompt, 파일 수정 이력 |
| `git entirekit recent` | 최근 10개 checkpoint 목록 | commit hash, commit message |
| `git entirekit today` | 오늘 생성된 checkpoint 목록 | commit hash, commit message |
| `git entirekit yesterday` | 어제 생성된 checkpoint 목록 | commit hash, commit message |
| `git entirekit week` | 최근 1주일 checkpoint 목록 | commit hash, commit message |
| `git entirekit diff` | 두 checkpoint 간 상세 비교 | 토큰 사용량, 파일, AI 기여도 |
| `git entirekit report` | HTML 리포트 생성 (예정) | HTML 파일 경로 |

## 설치

모든 alias는 `git config --local` 로 프로젝트 단위로 설정됩니다.

```bash
# 프로젝트 루트에서 설치
npx entirekit install
```

설치 완료 후 모든 명령어를 즉시 사용할 수 있습니다.

---

## 명령어 상세 가이드

### 1. git entirekit stats

**목적**: 최근 checkpoint들의 통계를 종합적으로 분석합니다.

**문법**
```bash
git entirekit stats
```

**구현**
- 명령어: `git entirekit stats`
- 동작: `entire/checkpoints/v1` 브랜치의 최근 10개 commit을 분석

**출력 형식**

```
📊 Checkpoint 브랜치 분석 도구
================================

💰 토큰 사용량 통계 (최근 10개 checkpoint):
  Input tokens: 1,380
  Output tokens: 3,220
  Cache read tokens: 27,659,090
  Total API calls: 470
  Sessions analyzed: 10

🤖 AI 기여도 분석 (최근 10개 checkpoint):
  Total agent lines: 450
  Total human modified: 160
  Average AI contribution: 73.7%
  Sessions with changes: 8

📝 가장 많이 터치된 파일 TOP 10:
      8 src/app/components/Button.tsx
      6 src/app/layout.tsx
      5 src/styles/globals.css
      ...

📋 최근 5개 세션 요약:
--- Session 1 (a3f2b1c) ---
[프롬프트 처음 5줄 표시]
Date: 2026-02-13
Branch: feature/260213_1700
...
```

**실제 예시**

```bash
$ git entirekit stats
```

출력에서 확인 가능한 정보:
- **토큰 사용량**: API 비용 추정
- **API 호출 수**: 세션당 평균 몇 번 AI와 상호작용했는지
- **AI 기여도**: 인간이 수정한 코드 vs AI가 작성한 코드의 비율
- **파일 변경 현황**: 어떤 파일이 자주 수정되는지

**일반적인 사용 사례**

1. **주간 회고 준비**
   ```bash
   git entirekit stats  # 한 주 동안의 생산성 지표 확인
   ```

2. **팀 리뷰 준비**
   ```bash
   # AI 기여도를 팀에 공유
   git entirekit stats | grep "Average AI contribution"
   ```

3. **비용 추정**
   ```bash
   git entirekit stats | head -6  # 토큰 사용량만 확인
   ```

**팁과 주의사항**

- 최근 10개 checkpoint만 분석합니다 (성능상 이유)
- `jq` 명령어가 필요합니다 (설치 스크립트에서 확인)
- metadata.json 파일이 없으면 해당 세션은 제외됩니다
- 토큰 수는 천 단위로 쉼표가 표시됩니다 (예: `1,380`)

---

### 2. git entirekit search

**목적**: checkpoint들을 키워드로 검색하여 과거 작업 내역을 찾습니다.

**문법**
```bash
git entirekit search "<검색어>"
```

**구현**
- 명령어: `git entirekit search`
- 동작: prompt.txt, context.md, files_touched 세 곳에서 검색

**파라미터**

| 파라미터 | 설명 | 예시 |
|---------|------|------|
| `검색어` | 찾을 텍스트 (대소문자 무관) | `"login"`, `"버그 수정"` |

**출력 형식**

```
🔍 '검색어' 검색 중...
================================

📝 관련 프롬프트:

[2026-02-13] Checkpoint: ac03096
---
사용자 입력 프롬프트의 처음 5줄...

[2026-02-12] Checkpoint: f7e2c45
---
다른 checkpoint의 prompt 내용...

📂 관련 파일 수정 이력:

[2026-02-13] Checkpoint: ac03096
Files touched:
  - src/app/auth/login/page.tsx
  - src/components/LoginForm.tsx
```

**실제 예시**

```bash
# 로그인 관련 작업 검색
$ git entirekit search "login"

🔍 'login' 검색 중...
================================

📝 관련 프롬프트:

[2026-02-13] Checkpoint: ac03096
---
@src/app/[locale]/(auth)/login/page.tsx 로그인 액션 관련해서...
1. NEXT_PUBLIC_API_URL 의 swagger 분석해서...

📂 관련 파일 수정 이력:

[2026-02-13] Checkpoint: ac03096
Files touched:
  - src/app/auth/login/page.tsx
  - src/types/auth.ts
```

```bash
# OG 이미지 최적화 관련 검색
$ git entirekit search "og"

# 특정 버그 증상으로 검색
$ git entirekit search "로딩 안됨"

# 파일 이름으로 검색
$ git entirekit search "Button.tsx"
```

**검색 범위**

1. **프롬프트 (prompt.txt)**
   - 사용자가 요청한 작업 내용
   - AI와의 대화 내용 일부

2. **컨텍스트 (context.md)**
   - 작업 당시의 프로젝트 상태
   - 의존성 정보
   - 구조 설명

3. **수정된 파일 (files_touched)**
   - 작업에서 변경된 파일 목록
   - 정확한 파일 경로

**일반적인 사용 사례**

1. **비슷한 버그 찾기**
   ```bash
   git entirekit search "에러 메시지"
   # 과거에 비슷한 에러를 처리한 방법 확인
   ```

2. **기능 개발 이력 조회**
   ```bash
   git entirekit search "결제"
   # 결제 기능을 언제 개발했고 어떤 파일들을 수정했는지 확인
   ```

3. **특정 파일의 변경 이력**
   ```bash
   git entirekit search "api.ts"
   # 이 파일이 언제, 어떤 작업에서 수정되었는지 확인
   ```

4. **팀원에게 작업 설명**
   ```bash
   git entirekit search "인증"
   # 관련 모든 작업 내역을 검색해서 팀원에게 공유
   ```

**팁과 주의사항**

- 검색은 **대소문자를 구분하지 않습니다** (`-i` flag 사용)
- 최근 20개 checkpoint에서만 검색합니다 (성능상 이유)
- 정규표현식은 지원하지 않고 일반 문자열 검색만 지원합니다
- 빈 검색어는 오류를 반환합니다
- 한글 검색도 지원합니다

---

### 3. git entirekit recent

**목적**: 최근 10개 checkpoint를 간단한 목록 형태로 표시합니다.

**문법**
```bash
git entirekit recent
```

**구현**
- 직접 git 명령어: `log entire/checkpoints/v1 --oneline -10`
- 추가 파싱 없음 (순수 git 출력)

**출력 형식**

```
abc1234 feat(og): optimize asset OG image generation
def5678 fix(og): add explicit image dimensions to OpenGraph metadata
ghi9012 Merge branch 'feature/page_transition' into 'master'
jkl3456 feat: improve UX with page transitions and restructured asset routes
mno7890 Merge branch 'feature/260213' into 'master'
pqr1234 perf: cleanup unused dependencies
stu5678 refactor: extract common layout logic
vwx9012 fix: resolve CSS module conflicts
yza3456 docs: update README with new API endpoints
bcd7890 feat: add error boundary component
```

**실제 예시**

```bash
# 빠르게 최근 작업 확인
$ git entirekit recent

# 결과에서 특정 commit hash 복사해서 다른 명령어에 사용
$ git entirekit recent | head -1 | cut -d' ' -f1
abc1234
```

**일반적인 사용 사례**

1. **빠른 최근 작업 확인**
   ```bash
   git entirekit recent  # 최근 작업을 한눈에 확인
   ```

2. **특정 checkpoint의 상세 정보 확인**
   ```bash
   git entirekit recent          # 목록 확인
   git show abc1234:.entire/...  # 원하는 checkpoint의 상세 정보 조회
   ```

3. **git entirekit diff의 hash 찾기**
   ```bash
   git entirekit recent          # 비교할 두 hash 확인
   git entirekit diff abc1234 def5678  # 두 checkpoint 비교
   ```

**팁과 주의사항**

- 가장 빠른 명령어 (추가 파싱 없음)
- 정확히 10개만 표시합니다
- `--oneline` 포맷: `<hash> <message>`
- commit message는 첫 줄만 표시됩니다
- `entire/checkpoints/v1` 브랜치가 없으면 에러

---

### 4. git entirekit today

**목적**: 오늘 생성된 모든 checkpoint를 표시합니다.

**문법**
```bash
git entirekit today
```

**구현**
- 직접 git 명령어: `log entire/checkpoints/v1 --since=today --oneline`
- 필터: 자정(00:00)부터 현재 시각까지

**출력 형식**

```
abc1234 feat(og): optimize asset OG image generation
def5678 fix(og): add explicit image dimensions to OpenGraph metadata
ghi9012 docs: update API documentation
```

또는 작업이 없으면:
```
(결과 없음)
```

**실제 예시**

```bash
# 오늘 무엇을 했는지 확인
$ git entirekit today

abc1234 feat(og): optimize asset OG image generation
def5678 fix(og): add explicit image dimensions to OpenGraph metadata

# 오늘의 작업 수 세기
$ git entirekit today | wc -l
2
```

**일반적인 사용 사례**

1. **업무 마무리 시간에 오늘 작업 정리**
   ```bash
   git entirekit today  # "오늘 이 정도 했네"
   ```

2. **스탠드업 미팅 준비**
   ```bash
   git entirekit today  # 팀에 공유할 업무 현황 확인
   ```

3. **일일 리포트 작성**
   ```bash
   echo "Today's work:" >> report.txt
   git entirekit today >> report.txt
   ```

**시간대 처리**

- `--since=today`는 시스템 시간대 기준 자정부터 시작
- 예: 한국 시간 2026-02-13 00:00 ~ 23:59:59

**팁과 주의사항**

- 시스템 타임존을 따릅니다
- commit author date를 기준으로 필터링합니다
- 오늘의 작업이 없으면 아무것도 출력되지 않습니다
- git 설정의 `user.name`, `user.email`과 무관함

---

### 5. git entirekit yesterday

**목적**: 어제 생성된 모든 checkpoint를 표시합니다.

**문법**
```bash
git entirekit yesterday
```

**구현**
- 직접 git 명령어: `log entire/checkpoints/v1 --since=yesterday --until=today --oneline`
- 필터: 어제 자정부터 오늘 자정까지

**출력 형식**

```
jkl3456 feat: improve UX with page transitions
mno7890 Merge branch 'feature/260213' into 'master'
pqr1234 perf: cleanup unused dependencies
stu5678 refactor: extract common layout logic
```

또는 작업이 없으면:
```
(결과 없음)
```

**실제 예시**

```bash
# 아침에 어제 뭐 했는지 확인
$ git entirekit yesterday

jkl3456 feat: improve UX with page transitions
mno7890 Merge branch 'feature/260213' into 'master'
pqr1234 perf: cleanup unused dependencies

# 어제의 작업을 보기 좋게 정렬
$ git entirekit yesterday | sort
```

**일반적인 사용 사례**

1. **매일 아침 업무 시작 전 리마인드**
   ```bash
   git entirekit yesterday  # 어제 뭘 했는지 확인하고 오늘 업무 계획
   ```

2. **주간 회의 준비**
   ```bash
   for day in {0..4}; do
     echo "=== Day $((day+1)) ==="
     git log --since="$day days ago" --until="$((day-1)) days ago" ...
   done
   ```

3. **팀과 일일 standup**
   ```bash
   echo "Yesterday's work:"
   git entirekit yesterday | sed 's/^/  - /'
   ```

**시간대 처리**

- `--since=yesterday --until=today`는 정확히 24시간을 의미
- 예: 2026-02-13 00:00 ~ 2026-02-14 00:00

**팁과 주의사항**

- 현재 시간이 새벽 3시라면, "어제"는 전날을 의미합니다
- 시스템 타임존에 따라 결과가 달라질 수 있습니다
- 마지막 하루 동안 작업이 없으면 아무것도 출력되지 않습니다

---

### 6. git entirekit week

**목적**: 최근 1주일(7일) 동안 생성된 모든 checkpoint를 표시합니다.

**문법**
```bash
git entirekit week
```

**구현**
- 직접 git 명령어: `log entire/checkpoints/v1 --since='1 week ago' --oneline`
- 필터: 7일 전부터 현재까지

**출력 형식**

```
abc1234 feat(og): optimize asset OG image generation
def5678 fix(og): add explicit image dimensions to OpenGraph metadata
ghi9012 docs: update API documentation
jkl3456 feat: improve UX with page transitions
mno7890 Merge branch 'feature/260213' into 'master'
pqr1234 perf: cleanup unused dependencies
stu5678 refactor: extract common layout logic
```

**실제 예시**

```bash
# 주간 회고 준비
$ git entirekit week

# 이번 주의 작업 통계
$ git entirekit week | wc -l
7

# 주간 작업을 마크다운 형식으로 정리
$ echo "## 이번 주 작업" && git entirekit week | sed 's/^/- /'
```

**일반적인 사용 사례**

1. **금요일 주간 회고**
   ```bash
   git entirekit week  # 이 주의 모든 작업 확인
   ```

2. **주간 보고서 작성**
   ```bash
   git entirekit week | sed 's/^/  /' > weekly-report.txt
   ```

3. **팀 주간 미팅**
   ```bash
   echo "Team's work this week:"
   git entirekit week | head -20  # 너무 많으면 최신 20개만
   ```

4. **생산성 분석**
   ```bash
   git entirekit week | wc -l  # 이번 주 checkpoint 수
   git entirekit stats         # 토큰 사용량과 함께
   ```

**시간대 처리**

- `--since='1 week ago'`는 정확히 604,800초(7일) 전부터
- 예: 현재가 2026-02-13 15:30이면 2026-02-06 15:30부터

**팁과 주의사항**

- 가장 유연한 시간 필터 명령어
- 일주일에 여러 checkpoint가 있으면 모두 표시됩니다
- 순서는 최신순입니다 (최근 것이 위)
- 전체 리포트를 원하면 `git entirekit stats`와 함께 사용

---

### 7. git entirekit diff

**목적**: 두 checkpoint 간의 상세한 차이를 비교합니다.

**문법**
```bash
git entirekit diff <checkpoint1_hash> <checkpoint2_hash>
```

**구현**
- 명령어: `git entirekit diff`
- 동작: 각 checkpoint의 metadata.json에서 정보 추출

**파라미터**

| 파라미터 | 설명 | 예시 |
|---------|------|------|
| `checkpoint1_hash` | 첫 번째 비교 대상 (짧은 hash 가능) | `abc1234` 또는 `abc12345678...` |
| `checkpoint2_hash` | 두 번째 비교 대상 (짧은 hash 가능) | `def5678` 또는 `def56789012...` |

**출력 형식**

```
📊 Checkpoint 비교: abc1234 vs def5678
================================

🔢 토큰 사용량 비교:
Checkpoint 1:
{
  "input_tokens": 1380,
  "output_tokens": 3220,
  "cache_read_tokens": 27659090,
  "api_call_count": 470
}

Checkpoint 2:
{
  "input_tokens": 2100,
  "output_tokens": 4150,
  "cache_read_tokens": 31245100,
  "api_call_count": 580
}

📝 수정된 파일 비교:
Checkpoint 1:
  - src/app/[locale]/(auth)/login/page.tsx
  - src/components/LoginForm.tsx

Checkpoint 2:
  - src/app/api/auth/route.ts
  - src/utils/auth.ts

🤖 AI 기여도 비교:
Checkpoint 1:
{
  "agent_lines": 450,
  "human_modified": 160,
  "agent_percentage": 73.7
}

Checkpoint 2:
{
  "agent_lines": 680,
  "human_modified": 200,
  "agent_percentage": 77.3
}
```

**실제 예시**

```bash
# 먼저 비교할 hash 찾기
$ git entirekit recent
abc1234 feat(og): optimize...
def5678 fix(og): add explicit...

# 두 checkpoint 비교
$ git entirekit diff abc1234 def5678

📊 Checkpoint 비교: abc1234 vs def5678
================================
[상세 비교 출력]

# 짧은 hash도 사용 가능
$ git entirekit diff abc def

# 더 오래된 작업과 비교
$ git entirekit week | tail -1 | cut -d' ' -f1  # 7일 전 hash 추출
pqr1234
$ git entirekit diff pqr1234 abc1234  # 1주일 진전도 확인
```

**비교 항목**

1. **토큰 사용량**
   - Input tokens: 사용자 입력 텍스트의 토큰 수
   - Output tokens: AI 출력 텍스트의 토큰 수
   - Cache read tokens: 프롬프트 캐시에서 읽은 토큰 수
   - API call count: 총 API 호출 횟수

2. **수정된 파일**
   - 해당 checkpoint에서 변경된 모든 파일 목록
   - 정확한 파일 경로 포함

3. **AI 기여도**
   - agent_lines: AI가 작성한 코드 라인 수
   - human_modified: 인간이 수정한 라인 수
   - agent_percentage: AI 기여도 백분율

**일반적인 사용 사례**

1. **두 버전의 코드 품질 비교**
   ```bash
   git entirekit diff abc1234 def5678
   # AI 기여도와 토큰 사용량 비교해서 효율성 분석
   ```

2. **진전도 추적**
   ```bash
   git entirekit diff $(git entirekit week | tail -1 | cut -d' ' -f1) $(git entirekit recent | head -1 | cut -d' ' -f1)
   # 1주일 동안의 진전도 확인
   ```

3. **리팩토링 전후 비교**
   ```bash
   # 리팩토링 전 checkpoint hash: a1b2c3d
   # 리팩토링 후 checkpoint hash: x9y8z7w
   git entirekit diff a1b2c3d x9y8z7w
   # 얼마나 많은 코드를 수정했는지 시각화
   ```

4. **버그 픽스 검증**
   ```bash
   # 버그 발견 당시 hash: bug001
   # 버그 픽스 후 hash: fix001
   git entirekit diff bug001 fix001
   # 어떤 파일을 수정했고 얼마나 변경했는지 확인
   ```

**팁과 주의사항**

- 짧은 hash (7자 이상)도 자동으로 인식합니다
- 순서가 중요하지 않습니다 (abc vs def = def vs abc)
- metadata.json이 없는 checkpoint는 비교 불가능
- JSON 형식이므로 `jq`를 이용해 파싱 가능:
  ```bash
  git entirekit diff abc def | grep -A5 "token_usage" | jq '.'
  ```

---

### 8. git entirekit report

**목적**: 모든 checkpoint 데이터를 시각화한 HTML 리포트를 생성합니다.

**문법**
```bash
git entirekit report [--limit <개수>] [--output <경로>]
```

**구현**
- 명령어: `git entirekit report`
- 기능: HTML 대시보드 생성

**파라미터**

| 파라미터 | 설명 | 기본값 | 예시 |
|---------|------|--------|------|
| `--limit` | 포함할 checkpoint 개수 (최신순) | 모두 | `--limit 50` |
| `--output` | 저장할 파일 경로 | 자동 생성 | `--output ~/report.html` |

**예상 출력 형식** (구현 시)

```
✅ 리포트 생성 완료!
📁 저장 위치: /Users/ryuhc/report_20260213.html
🌐 브라우저에서 열기...

리포트 내용:
- 📊 토큰 사용량 차트 (시계열)
- 🤖 AI 기여도 분포도
- 📝 파일 변경 히트맵
- 📈 생산성 지표
- 🎯 세션별 상세 정보
```

**예상 사용 예시**

```bash
# 기본값: 최신 순서로 모든 checkpoint 포함
git entirekit report

# 최근 20개만 포함
git entirekit report --limit 20

# 특정 경로에 저장
git entirekit report --output ~/Desktop/monthly-report.html

# 한 달 리포트
git entirekit report --limit 100 --output ~/monthly.html

# 팀과 공유 가능한 형식
git entirekit report --output ~/public_reports/$(date +%Y%m%d).html
```

**예상 리포트 포함 사항**

1. **요약 정보**
   - 총 checkpoint 개수
   - 기간 (가장 오래된 ~ 최신)
   - 총 토큰 사용량
   - 평균 AI 기여도

2. **차트 및 그래프**
   - 일별 checkpoint 수
   - 토큰 사용량 추세
   - AI 기여도 분포
   - 자주 수정된 파일

3. **세부 테이블**
   - 각 checkpoint의 메타데이터
   - 파일 변경 내역
   - API 호출 통계

4. **통계 분석**
   - 요일별 생산성
   - 파일별 변경 횟수
   - 세션별 효율성

**예상 일반적인 사용 사례**

1. **월간 성과 보고서**
   ```bash
   git entirekit report --limit 200 --output ~/monthly_$(date +%Y%m).html
   # 한 달간의 모든 작업을 시각화해서 리더기능 매니저에게 공유
   ```

2. **팀 대시보드**
   ```bash
   git entirekit report --output ~/team-dashboard.html
   # 팀 공유 디렉토리에 저장해서 누구나 접근 가능하게 설정
   ```

3. **주간 뉴스레터**
   ```bash
   git entirekit report --limit 50 --output ~/weekly-$(date +%Y-week%V).html
   # 매주 금요일에 실행해서 일주일 보고서 생성
   ```

4. **클라이언트 프리젠테이션**
   ```bash
   git entirekit report --output ~/client_demo.html
   # 시각적으로 아름다운 리포트로 진행 상황 설명
   ```

**팁과 주의사항**

- `git entirekit report`는 TypeScript CLI에 구현되어 있습니다
- `--export-json`, `--export-csv` 옵션으로 추가 산출물을 만들 수 있습니다
- 헤드리스 CI 환경에서는 `--no-open` 옵션을 사용하세요

---

## 명령어 조합 시나리오

### 시나리오 1: 아침 업무 시작

```bash
# 1. 어제 뭐 했는지 확인
git entirekit yesterday

# 2. 어제 한 작업 중 가장 최근 항목 확인
git entirekit recent | head -1

# 3. 필요하면 그 당시의 컨텍스트 상세 조회
# (checkpoint hash를 이용해 추가 조회)
```

### 시나리오 2: 버그 해결 방법 찾기

```bash
# 1. 비슷한 버그나 기능으로 검색
git entirekit search "로딩 오류"

# 2. 관련 checkpoint 발견
# → 해당 hash를 확인

# 3. 당시의 상세 정보 확인
# (필요시 entirekit diff로 다른 버전과 비교)
```

### 시나리오 3: 주간 회의 준비

```bash
# 1. 이번 주 전체 작업 확인
git entirekit week

# 2. 통계 데이터 수집
git entirekit stats

# 3. 리포트 생성 (구현 후)
git entirekit report --limit 50 --output ~/weekly-report.html
```

### 시나리오 4: 코드 리뷰 전 체크

```bash
# 1. 최근 변경사항 확인
git entirekit recent

# 2. AI 기여도 확인
git entirekit stats | grep "Average AI contribution"

# 3. 상세 변경 파일 확인
git entirekit diff <이전> <최신>

# 4. 해당 파일들을 집중해서 리뷰
```

### 시나리오 5: 팀원에게 작업 설명

```bash
# 1. 해당 기능 키워드로 검색
git entirekit search "결제 기능"

# 2. 관련된 모든 checkpoint 표시
# 3. 각 checkpoint의 컨텍스트와 변경 파일 공유
```

---

## 명령어 참조 테이블

| 명령어 | 시간 범위 | 출력 형식 | 파싱 필요 | 구현 |
|--------|---------|--------|---------|------|
| `entirekit stats` | 최근 10개 | 텍스트 요약 | 예 | `git entirekit stats` |
| `entirekit search` | 최근 20개 | 텍스트 상세 | 예 | `git entirekit search` |
| `entirekit recent` | 제한 없음 | oneline | 선택 | `git log` |
| `entirekit today` | 오늘 | oneline | 아니오 | `git log` |
| `entirekit yesterday` | 어제 | oneline | 아니오 | `git log` |
| `entirekit week` | 7일간 | oneline | 아니오 | `git log` |
| `entirekit diff` | 두 개 선택 | JSON | 예 | `git entirekit diff` |
| `entirekit report` | 선택 가능 | HTML | 예 | `git entirekit report` |

---

## 문제 해결

### "entire/checkpoints/v1 브랜치를 찾을 수 없습니다"

**원인**: EntireKit 브랜치가 아직 생성되지 않았습니다.

**해결**:
```bash
# Claude Code CLI로 몇 가지 작업을 수행하면 자동 생성됨
# 또는 수동으로 브랜치 생성
git checkout --orphan entire/checkpoints/v1
```

### "jq: command not found"

**원인**: 필수 의존성인 jq가 설치되어 있지 않습니다.

**해결**:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

### "검색 결과가 없습니다"

**원인**: 검색 키워드가 없거나 다른 단어를 사용해야 합니다.

**해결**:
```bash
# 다른 키워드로 시도
git entirekit search "다른키워드"

# 파일 이름으로 검색
git entirekit search "page.tsx"

# 기능 이름
git entirekit search "auth"

# 최근 작업 먼저 확인
git entirekit recent
```

### 명령어가 실행되지 않음

**원인**: git alias가 설치되지 않았거나 config가 손상되었습니다.

**확인**:
```bash
# 설치된 alias 확인
git config --local --list | grep entirekit

# 재설치
npx entirekit install
```

### 출력이 너무 길거나 잘림

**원인**: 터미널 buffer 크기가 작거나 명령어 결과가 많습니다.

**해결**:
```bash
# 결과를 파일로 저장
git entirekit stats > stats.txt

# 페이지로 나누기
git entirekit recent | less

# 첫 N개만 확인
git entirekit recent | head -5
```

### 특정 파일의 변경 이력을 추적하고 싶음

**원인**: 단순 파일명 검색은 직접적인 diff를 제공하지 않습니다.

**해결**:
```bash
# 1. 파일명으로 검색해서 관련 checkpoint 찾기
git entirekit search "Button.tsx"

# 2. 두 checkpoint를 비교
git entirekit diff <hash1> <hash2>

# 3. 실제 파일 내용 비교 (git 기본 기능)
git diff <hash1> <hash2> -- src/Button.tsx
```

---

## 고급 팁

### 자동화: 일일 리포트 생성 (TypeScript/CLI)

```bash
mkdir -p ~/reports

npx entirekit report \
  --since 2026-02-13 \
  --until 2026-02-14 \
  --output ~/reports/checkpoint-2026-02-13.html \
  --no-open
```

### 자동화: 주간 리포트 (TypeScript/CLI)

```bash
mkdir -p ~/reports

npx entirekit report \
  --since 2026-02-10 \
  --until 2026-02-17 \
  --output ~/reports/checkpoint-week-07-2026.html \
  --no-open
```

### 데이터 추출: JSON 파싱

```bash
# 특정 checkpoint의 메타데이터 추출
HASH="abc1234"
git show $HASH:*/*/metadata.json | jq '.token_usage.input_tokens'

# 모든 AI 기여도 통계
git log entire/checkpoints/v1 --format="%H" | while read hash; do
  git show $hash:*/*/metadata.json 2>/dev/null | jq '.initial_attribution.agent_percentage // "N/A"'
done | jq -s 'add/length'
```

### 필터링: 특정 기간의 작업만 조회

```bash
# 지난 3일간의 작업
git log entire/checkpoints/v1 --since="3 days ago" --oneline

# 특정 날짜 범위
git log entire/checkpoints/v1 \
  --since="2026-02-01" \
  --until="2026-02-10" \
  --oneline
```

### 통합: 여러 명령어 조합

```bash
# 완전한 주간 분석
echo "=== WEEKLY ANALYSIS ==="
echo ""
echo "## Work Summary"
git entirekit week | sed 's/^/- /'
echo ""
echo "## Statistics"
git entirekit stats | head -10
echo ""
echo "## Top Modified Files"
git entirekit stats | grep -A10 "가장 많이 터치된"
```

---

## 설정 및 커스터마이징

### Alias 설정 확인

```bash
# 설치된 모든 checkpoint alias 확인
git config --local --list | grep alias.entirekit
```

**출력 예**:
```
alias.entirekit=!entirekit
...
```

### Alias 수정

설정된 alias를 변경하려면:

```bash
# 직접 수정 (예: entirekit recent의 개수를 20개로 변경)
git config --local alias.entirekit "log entire/checkpoints/v1 --oneline -20"

# 확인
git entirekit recent  # 20개 출력됨
```

### 전역 설정

다른 프로젝트에서도 사용하려면:

```bash
# --local 대신 --global 사용
git config --global alias.entirekit "log entire/checkpoints/v1 --oneline -10"

# 확인
git config --global --list | grep entirekit recent
```

**주의**: 프로젝트별로 다를 수 있으므로 일반적으로 `--local` 권장

### 명령어 동작 커스터마이징

내부 파일을 수정하지 말고 CLI 옵션을 사용하세요:

```bash
# 최근 20개 checkpoint 분석
git entirekit stats --limit 20

# 브랜치/날짜 필터 적용
git entirekit stats --branch feature/login --since 2026-01-01 --until 2026-01-31
```

---

## 성능 최적화

### 큰 저장소에서의 검색 최적화

많은 checkpoint가 있는 경우 검색이 느릴 수 있습니다.

내부 파일을 수정하지 말고 옵션을 사용하세요:
```bash
git entirekit search "<키워드>" --limit 10
```

### 캐싱

현재는 캐싱 기능이 없으므로, 필요하면 수동 캐싱:

```bash
# 자주 사용하는 통계를 저장
git entirekit stats > ~/cache/weekly-stats.txt

# 나중에 빠르게 참조
cat ~/cache/weekly-stats.txt
```

---

## 정리

| 명령어 | 가장 자주 사용하는 시점 | 대안 |
|--------|----------------------|------|
| `entirekit recent` | 빠른 확인 필요 | `entirekit today`, `entirekit week` |
| `entirekit today` | 매일 아침/저녁 | `entirekit recent` |
| `entirekit stats` | 주간 회의, 리뷰 | `entirekit diff` |
| `entirekit search` | 과거 작업 찾기 | git log grep |
| `entirekit diff` | 두 버전 상세 비교 | `entirekit stats` |
| `entirekit report` | 리포트 생성 | `entirekit stats` 출력 저장 |

---

## 추가 자료

- [빠른 시작 가이드](../../../../.entire/docs/quick-start.ko.md) - 5분 안에 시작하기
- [고급 활용법](../../../../.entire/docs/advanced-usage.ko.md) - 더 복잡한 시나리오
- [메인 README](../../../../README.ko.md) - 전체 문서
- [checkpoint 구조](./data-structure.ko.md) - 데이터 형식 상세

---

**마지막 업데이트**: 2026-02-13
**버전**: 1.0.0
