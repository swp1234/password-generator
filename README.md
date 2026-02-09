# 비밀번호 생성기 (Password Generator)

안전한 랜덤 비밀번호를 생성하는 웹 앱입니다. 다국어 지원 (12개 언어), PWA 기능, AdSense 광고 통합을 포함합니다.

## 기능

- **비밀번호 생성**: crypto.getRandomValues()를 사용한 암호학적으로 안전한 랜덤 생성
- **커스터마이즈 옵션**:
  - 비밀번호 길이 (8~64자)
  - 대문자, 소문자, 숫자, 특수문자 토글
- **실시간 강도 표시**: 약함/보통/좋음/매우강함 (색상 바 포함)
- **원클릭 복사**: Clipboard API 사용
- **복사 완료 피드백**: 애니메이션 및 햅틱 피드백
- **비밀번호 히스토리**: 최근 5개 저장 (세션 내 또는 localStorage)
- **비밀번호 표시/숨김**: 토글로 비밀번호 보이기/숨기기
- **다국어 지원**: 12개 언어 (한국어, 영어, 중국어, 힌디어, 러시아어, 일본어, 스페인어, 포르투갈어, 인도네시아어, 터키어, 독일어, 프랑스어)
- **PWA**: 오프라인 지원, 설치 가능
- **반응형 디자인**: 모바일 (360px~) 및 데스크톱 지원

## 파일 구조

```
password-generator/
├── index.html              # 메인 HTML (GA4, AdSense, PWA, OG태그)
├── manifest.json           # PWA 매니페스트
├── sw.js                   # Service Worker
├── icon-192.svg            # PWA 아이콘 (192x192)
├── icon-512.svg            # PWA 아이콘 (512x512)
├── css/
│   └── style.css           # 다크모드, 반응형 스타일
├── js/
│   ├── app.js              # 메인 앱 로직
│   ├── i18n.js             # 다국어 로더
│   └── locales/
│       ├── ko.json         # 한국어
│       ├── en.json         # English
│       ├── zh.json         # 中文
│       ├── hi.json         # हिन्दी
│       ├── ru.json         # Русский
│       ├── ja.json         # 日本語
│       ├── es.json         # Español
│       ├── pt.json         # Português
│       ├── id.json         # Bahasa Indonesia
│       ├── tr.json         # Türkçe
│       ├── de.json         # Deutsch
│       └── fr.json         # Français
└── README.md               # 이 파일
```

## 설치 및 사용

### 로컬 테스트

```bash
# 프로젝트 디렉토리로 이동
cd projects/password-generator

# 로컬 서버 실행
python -m http.server 8000

# 브라우저에서 http://localhost:8000 열기
```

### 직접 열기

```bash
# Windows
start index.html

# Mac
open index.html

# Linux
xdg-open index.html
```

## 디자인

### 색상 팔레트

- **기본색**: #2980b9 (파란색 - 보안 및 신뢰)
- **배경**: #0f0f23 (어두운 자주색)
- **표면**: #1a1a2e, #242442
- **텍스트**: #ffffff (주요), #b0b0d8 (보조)

### 2026 UI/UX 트렌드 적용

1. **Glassmorphism 2.0**: 반투명 카드 및 배경 필터
2. **Microinteractions**: 호버, 탭, 복사 애니메이션
3. **Dark Mode First**: 다크 모드 기본값
4. **Minimalist Flow**: 간결한 레이아웃, 충분한 화이트스페이스
5. **Progress & Statistics**: 강도 바 및 시각적 피드백
6. **Personalization**: localStorage에 언어 설정 저장
7. **Accessibility**: 44px 터치 타겟, 색상 대비

## 기술 스택

- **HTML5**: 시맨틱 마크업
- **CSS3**: 그래디언트, 애니메이션, Flexbox, Grid, 반응형
- **Vanilla JavaScript**: 프레임워크 없음
- **Service Worker**: PWA 지원
- **Crypto API**: 보안 난수 생성
- **Clipboard API**: 원클릭 복사
- **localStorage**: 비밀번호 히스토리 및 언어 설정 저장
- **Google Analytics 4**: 사용자 추적
- **AdSense**: 광고 수익 (상단/하단 배너 및 인피드)

## 주요 기능 상세

### 비밀번호 생성

```javascript
// crypto.getRandomValues() 사용으로 암호학적으로 안전
const array = new Uint32Array(length);
crypto.getRandomValues(array);
```

### 강도 계산

- 길이 기반 점수 (8자: 20점, 12자: +20점, 16자: +20점, 24자: +10점)
- 문자 종류 기반 점수 (대문자, 소문자, 숫자, 특수문자 각 10점)
- 총 100점 기준:
  - 약함: 0~25점
  - 보통: 25~50점
  - 좋음: 50~75점
  - 매우강함: 75~100점

### 다국어 지원

- 자동 언어 감지 (브라우저 언어 또는 저장된 설정)
- 12개 언어 JSON 파일
- `data-i18n` 속성 기반 자동 번역
- 언어 변경 시 UI 즉시 업데이트

### 히스토리

- 최근 5개 비밀번호 저장
- localStorage에 저장되어 새로고침 후에도 유지
- 각 항목 개별 복사 가능
- 전체 삭제 기능

## 광고 구조

```html
<!-- 상단 배너 광고 -->
<div class="ad-container ad-top">
    <div class="ad-placeholder">광고 영역</div>
</div>

<!-- 하단 배너 광고 -->
<div class="ad-container ad-bottom">
    <div class="ad-placeholder">광고 영역</div>
</div>
```

AdSense 계정 연동 후 `<ins>` 태그로 교체하여 수익화.

## SEO 최적화

- **메타태그**: description, keywords
- **Open Graph**: og:title, og:description, og:image, og:locale
- **Twitter Card**: twitter:card, twitter:title, twitter:description
- **Schema.org**: WebApplication 구조화된 데이터
- **Canonical**: 정확한 URL 지정
- **Hreflang**: 다국어 페이지 연결 (향후 추가)

## PWA 기능

### manifest.json

- 앱 이름, 설명, 아이콘
- 시작 URL, 표시 모드
- 테마 색상, 배경색
- 바로가기 (생성, 히스토리)

### Service Worker

- 설치, 활성화, 가져오기 이벤트
- 네트워크 우선, 캐시 폴백 전략
- 오프라인 지원

## 성능 최적화

- 최소화된 CSS/JavaScript (프로덕션에서)
- SVG 아이콘 (경량, 확장성)
- Lazy loading (필요한 경우)
- 효율적인 이벤트 리스너
- localStorage 기반 상태 관리 (빠른 로딩)

## 크로스 플랫폼 호환성

- **브라우저**: Chrome, Firefox, Safari, Edge
- **디바이스**: 데스크톱, 태블릿, 스마트폰
- **OS**: Windows, macOS, Linux, iOS, Android

## 주의사항

- **보안**: 생성된 비밀번호는 클라이언트 측에서만 처리 (서버 로깅 없음)
- **히스토리**: localStorage는 로컬 저장이므로 민감한 환경에서 주의
- **브라우저 호환성**: crypto.getRandomValues()는 모든 현대 브라우저에서 지원

## 라이센스

Open Source - 자유롭게 사용, 수정, 배포 가능

## 개발 로그

- **2026-02-10**: 초기 개발 완료
  - 기본 비밀번호 생성 기능
  - 커스터마이즈 옵션 (길이, 문자 종류)
  - 강도 표시 기능
  - 원클릭 복사 및 피드백
  - 히스토리 관리
  - 다국어 지원 (12개 언어)
  - PWA 및 오프라인 지원
  - 반응형 디자인
  - SEO 및 광고 통합

## 향후 개선 사항

- [ ] 비밀번호 강도 고급 옵션 (제외할 문자 등)
- [ ] 비밀번호 생성 속도 테스트
- [ ] 화면 캡처 방지 (민감한 환경용)
- [ ] 자동 생성 간격 설정
- [ ] 비밀번호 만료 알림
- [ ] 앱별 비밀번호 템플릿
- [ ] 인앱 결제 (광고 제거)

---

**개발자**: Fire Project Team
**플랫폼**: dopabrain.com
**카테고리**: 유틸리티/생산성
**상태**: 완성 (v1.0)
