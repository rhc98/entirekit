[English](quick-start.md)

# 빠른 시작 가이드

5분 안에 EntireKit 도구를 시작하는 방법입니다.

## 🎯 목표

이 가이드를 마치면:
- ✅ Checkpoint 도구 설치 완료
- ✅ 기본 명령어 3개 사용 가능
- ✅ 실무에서 바로 활용 가능

## 1️⃣ 설치 (30초)

```bash
# 프로젝트 루트에서
npx entirekit install
```

첫 checkpoint가 생성되기 전에도 `install`을 실행할 수 있습니다.
`stats`, `search`, `diff`, `report` 같은 분석 명령은 checkpoint가 필요합니다.

설치가 성공하면 이렇게 표시됩니다:
```
✨ 설치 완료!
사용 가능한 명령어:
  git entirekit stats
  git entirekit search <키워드>
  ...
```

## 2️⃣ 첫 번째 명령어 (1분)

### 통계 보기

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
  Average AI contribution: 73.7%
  ...
```

**이 정보로 알 수 있는 것:**
- 💰 AI 사용 비용 (토큰 수)
- 🤖 AI가 코드를 얼마나 작성했는지
- 📝 어떤 파일을 자주 수정하는지

## 3️⃣ 두 번째 명령어 (2분)

### 과거 작업 검색

막히거나 비슷한 문제를 과거에 해결한 적이 있다면:

```bash
git entirekit search "키워드"
```

**실제 예시:**
```bash
# "로그인" 관련 작업 찾기
git entirekit search "로그인"

# 출력:
# [2026-02-13] Checkpoint: ac03096
# ---
# @src/app/[locale]/(auth)/login/page.tsx 로그인 액션 관련해서...
# 1. NEXT_PUBLIC_API_URL 의 swagger 분석해서...
# 2. 기존 본인인증 로그인과 별개로...
```

**활용 팁:**
- 🐛 버그 이름으로 검색
- 📂 파일 이름으로 검색
- 🔑 기능 키워드로 검색

## 4️⃣ 세 번째 명령어 (1분)

### 최근 작업 목록

어제 뭐 했는지 기억이 안 날 때:

```bash
git entirekit yesterday
```

또는 최근 10개:
```bash
git entirekit recent
```

## 🎓 다음 단계

### 매일 루틴으로 만들기

**아침:**
```bash
git entirekit yesterday  # 어제 작업 리마인드
```

**작업 중 막힐 때:**
```bash
git entirekit search "관련 키워드"  # 과거 해결책 찾기
```

**하루 마무리:**
```bash
git entirekit today      # 오늘 뭐 했는지 확인
```

## 💡 실전 시나리오

### 시나리오 1: "이 버그 전에도 본 것 같은데..."

```bash
# 1. 버그 증상으로 검색
git entirekit search "로딩 안됨"

# 2. 관련 checkpoint 찾으면 전체 컨텍스트 확인
# 3. 당시 해결 방법 참고
```

### 시나리오 2: "AI가 작성한 코드 리뷰해야 하는데..."

```bash
# 1. 통계 확인
git entirekit stats

# 2. AI 기여도 높은 파일 확인
# 3. 해당 파일 집중 리뷰
```

### 시나리오 3: "팀원한테 어떻게 만들었는지 설명해야 하는데..."

```bash
# 1. 기능 키워드로 검색
git entirekit search "결제 기능"

# 2. 전체 개발 과정 (프롬프트, 대화, 코드) 공유
```

### 시나리오 4: "팀에 이번 달 작업 현황을 보여줘야 하는데..."

```bash
# 1. 시각적 리포트 생성
git entirekit report --limit 50 --output ~/monthly-report.html

# 2. 링크 공유 또는 파일 전달
# 3. 팀원이 브라우저에서 대시보드 확인
# 4. 토큰 사용량, AI 기여도, 파일 변경 현황 한눈에 파악
```

## 🔥 자주 쓰는 명령어 TOP 5+

### Top 5: 기본 명령어

1. **어제 작업 확인** - `git entirekit yesterday`
   매일 아침 어제 뭐 했는지 확인

2. **통계 조회** - `git entirekit stats`
   주간 회고 때 토큰 사용량, AI 기여도 확인

3. **키워드 검색** - `git entirekit search "키워드"`
   문제 발생 시 과거 해결책 찾기

4. **최근 목록** - `git entirekit recent`
   빠르게 최근 작업 확인

5. **주간 작업** - `git entirekit week`
   주말 회고용 일주일 작업 정리

### Bonus: HTML 리포트 생성

6. **시각화 대시보드** - `git entirekit report`
   전문적인 HTML 리포트를 브라우저에서 확인

   ```bash
   # 기본 사용 (자동으로 브라우저에서 열림)
   git entirekit report

   # 최근 20개만 포함해서 생성
   git entirekit report --limit 20

   # 팀과 공유하기 위해 데스크톱에 저장
   git entirekit report --output ~/Desktop/report.html
   ```

## ❓ 문제 해결

### "entire/checkpoints/v1 브랜치를 찾을 수 없습니다"

→ 아직 checkpoint가 생성되지 않았습니다.
이 상태에서는 `stats`, `search`, `diff`, `report` 같은 분석 명령이 동작하지 않습니다.
`install` 자체는 checkpoint 없이도 실행할 수 있습니다.

### "npx: command not found"

→ Node.js가 설치되지 않았거나 PATH에 없습니다. Node.js 20+ 설치 후 다시 시도하세요.

### "검색 결과가 없습니다"

→ 다른 키워드로 시도해보세요:
```bash
# 파일 이름
git entirekit search "Login"

# 기능 이름
git entirekit search "auth"

# 버그 증상
git entirekit search "에러"
```

## 🎉 완료!

이제 EntireKit 도구를 사용할 준비가 되었습니다!

**다음:**
- [고급 활용법](./advanced-usage.md) - 더 강력한 기능들
- [메인 README](../README.md) - 전체 문서

**팁:** Git alias는 프로젝트별로 설정되므로,
다른 프로젝트에서도 사용하려면 해당 프로젝트에서 `npx entirekit install`를 실행하세요.
