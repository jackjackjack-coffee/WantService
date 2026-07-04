<div align="center">

<h1>공시레이더 (Gongsi Radar)</h1>

<p><b>거래처가 무너지기 전에, 공시가 먼저 말해줍니다.</b></p>
<p>DART 전자공시 기반 거래처·투자기업 재무 리스크 모니터링 SaaS</p>

</div>

---

## 무엇을 하는 서비스인가

거래처 하나의 부실은 어음·매출채권을 타고 내 회사의 유동성 위기가 됩니다. 부실의 전조 — 반복되는 유상증자, 감사범위 한정, 소송, 최대주주 변경 — 는 항상 **DART 공시에 먼저 기록**됩니다.

공시레이더는 관심기업(거래처·투자 종목)을 등록해두면:

1. **재무건전성 20단계 등급 (AAA~D)** — 수익성·재무구조·현금창출력·추세 4축을 신용평가 방법론(선형 보간 스코어카드)으로 채점, 1년 부도확률 추정치와 등급 전망까지 제공
2. **위험 공시 자동 태깅** — 부도·회생·감사의견·유상증자·소송 등 18종 리스크 패턴으로 공시 제목을 분류, 위험 공시는 등급에 즉시 반영
3. **알림 피드** — 관심기업 전체의 위험·주의 공시를 한 화면에서 추적
4. **항목 × 연도 재무 격자** — 재무상태표·손익계산서·현금흐름표를 연도 축으로 수평화해 비교
5. **CSV 다운로드 (Pro) · REST API (Business)** — 내부 시스템 연동

### 요금

| 플랜 | 가격 | 관심기업 | 주요 기능 |
|---|---|---|---|
| **Free** | ₩0 | 3개 | 등급·리스크 태그·재무 3개년 |
| **Pro** | ₩29,000/월 | 30개 | + 알림 피드 전체, CSV 다운로드 |
| **Business** | ₩99,000/월 | 무제한 | + REST API, 우선 지원 |

> 기업 신용정보 서비스(연 수백만 원)의 라이트 대안 포지셔닝. 공개 데이터(전자공시)를 자동 분석하므로 한계비용이 낮다.

## 기술 스택 · 아키텍처

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind CSS 4
- **SQLite** (better-sqlite3) — 사용자·관심기업·알림·결제 + OpenDART 응답 캐시. 단일 인스턴스 배포에 적합, 스케일아웃 시 Postgres 전환
- **인증** — bcrypt + jose JWT (HTTP-only 쿠키), `src/proxy.ts` 에서 보호 경로 가드
- **결제** — Toss Payments v2 (결제창 → 서버 승인). 키 미설정 시 데모 결제로 전체 흐름 시뮬레이션
- **데이터** — OpenDART OpenAPI (라이브 모드) 또는 번들 데모 데이터셋

```
src/
  lib/
    opendart.ts      OpenDART 클라이언트 (dartlab-lite client.py 이식 — corpCode zip 파싱, 재무/공시 조회)
    dart-service.ts  통합 데이터 표면 (라이브/데모) — dartlab 의 Company 파사드 개념
    scorecard.ts     dartlab credit 프리미티브 이식 (scoreMetric·axisScore·weightedScore·20등급표·PD·outlook)
    health.ts        4축 건전성 평가 엔진 + 공시 리스크 가산
    risk-tags.ts     공시 제목 리스크 분류기 (18종 패턴, critical/warning/positive)
    demo-data.ts     데모 데이터셋 (실존 4사 근사치 + 가상 위험기업 2사)
    db.ts / auth.ts / alerts.ts / plans.ts
  app/
    page.tsx                 랜딩 (평가 엔진 실출력 데모 카드 포함)
    dashboard/ company/[code]/ alerts/ billing/
    api/  auth · search · watchlist · alerts · payments · company/[code]/export · v1/company/[code]
```

## dartlab 과의 관계

본 서비스는 오픈소스 [dartlab](https://github.com/eddmpython/dartlab) (Apache-2.0) 의 개념과 방법론을 서비스 형태로 이식한 것입니다.

| dartlab 원본 | 공시레이더 이식 |
|---|---|
| `dartlab-lite/client.py` (OpenDART 클라이언트) | `src/lib/opendart.ts` |
| `credit/scoring/creditScorecard.py` (scoreMetric·weightedScore) | `src/lib/scorecard.ts` |
| `synth/creditGradeTable.py` (20단계 등급 + 1년 PD) | `src/lib/scorecard.ts` |
| `credit/features/_sectorThresholdsA.py` (부채비율·유동비율 기준표) | `src/lib/scorecard.ts` THRESHOLDS |
| `credit/_engineScoring.py` (OCF 축, 리스크 키워드 축) | `src/lib/health.ts`, `src/lib/risk-tags.ts` |
| `c.panel(topic)` — 항목 × 기간 격자 | `getPanel()` + `FinPanelTable` |

## 시작하기

```bash
npm install
npm run dev        # http://localhost:3000 — 키 없이 데모 모드로 동작
```

**데모 모드** (기본): 삼성전자·SK하이닉스·NAVER·현대차(샘플 수치) + 가상 위험기업 2사(한빛중공업·미래바이오)로 전체 흐름 체험. 결제도 데모 결제로 시뮬레이션.

**라이브 모드**: `.env.local` 에 키 설정 → 전체 상장사 실데이터 + Toss 테스트 결제.

```bash
cp .env.example .env.local
# DART_API_KEY=...            https://opendart.fss.or.kr 무료 발급
# NEXT_PUBLIC_TOSS_CLIENT_KEY / TOSS_SECRET_KEY   https://developers.tosspayments.com 테스트 키
# AUTH_SECRET=$(openssl rand -hex 32)
```

### Docker 배포

```bash
docker build -t gongsi-radar .
docker run -p 3000:3000 -v gongsi-radar-data:/app/data --env-file .env.local gongsi-radar
```

## 로드맵

- [ ] 이메일·슬랙 알림 (일간 다이제스트)
- [ ] Toss 빌링키 기반 자동 정기결제 (현재: 월 단위 수동 결제)
- [ ] 비상장 외감법인 감사보고서 커버
- [ ] 업종별 기준표 적용 (dartlab 의 sector thresholds 13종 이식)
- [ ] 분기 재무 반영, peer 비교

## 면책

본 서비스가 제공하는 등급·점수·시그널은 공개 데이터 기반 **참고용 추정치**이며, 신용평가사의 공식 등급이나 투자 권유가 아닙니다. 데모 모드의 실존 기업 수치는 근사치입니다.

---

데이터 출처: 금융감독원 전자공시시스템(DART) · 분석 방법론: [dartlab](https://github.com/eddmpython/dartlab) (Apache-2.0)
