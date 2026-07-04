import Link from "next/link";
import GradeBadge from "@/components/GradeBadge";
import Logo from "@/components/Logo";
import SeverityBadge from "@/components/SeverityBadge";
import { getSessionUser } from "@/lib/auth";
import { findDemoCompany } from "@/lib/demo-data";
import { fmtPct } from "@/lib/format";
import { evaluateHealth } from "@/lib/health";
import { PLANS } from "@/lib/plans";
import { tagFilings } from "@/lib/risk-tags";

export default async function LandingPage() {
  const user = await getSessionUser();

  // 히어로 데모 카드 — 실제 평가 엔진으로 가상 위험기업을 채점한 결과를 그대로 보여준다
  const risky = findDemoCompany("900001")!;
  const riskyFilings = tagFilings(risky.filings);
  const riskyHealth = evaluateHealth(risky.years, riskyFilings);
  const safe = findDemoCompany("005930")!;
  const safeHealth = evaluateHealth(safe.years, tagFilings(safe.filings));

  return (
    <div className="min-h-screen">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
          <Logo />
          <nav className="hidden items-center gap-5 text-sm text-mut sm:flex">
            <a href="#features" className="hover:text-ink">기능</a>
            <a href="#pricing" className="hover:text-ink">요금</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            {user ? (
              <Link href="/dashboard" className="rounded-lg bg-brand px-4 py-1.5 font-semibold text-white hover:bg-brand2">
                대시보드로
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-mut hover:text-ink">로그인</Link>
                <Link href="/signup" className="rounded-lg bg-brand px-4 py-1.5 font-semibold text-white hover:bg-brand2">
                  무료로 시작
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 히어로 ── */}
      <section className="hero-grid border-b border-line">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line2 bg-surface px-3 py-1 text-xs text-mut">
              <span className="size-1.5 rounded-full bg-ok" />
              DART 전자공시 기반 · dartlab 오픈소스 분석 엔진
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              거래처가 무너지기 전에,
              <br />
              <span className="text-brand">공시가 먼저</span> 말해줍니다
            </h1>
            <p className="mt-5 max-w-lg text-lg text-mut">
              유상증자, 감사의견, 소송, 회생절차 — 부도의 전조는 항상 공시에 먼저 나타납니다.
              공시레이더는 거래처·투자기업의 재무건전성을 20단계 등급으로 채점하고, 위험 공시를 자동으로 태깅해 알려드립니다.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand2">
                무료로 시작하기
              </Link>
              <a href="#features" className="rounded-lg border border-line px-6 py-3 text-mut hover:text-ink">
                기능 살펴보기
              </a>
            </div>
            <p className="mt-4 text-xs text-dim">카드 등록 없이 30초 만에 시작 · 관심기업 3개까지 무료</p>
          </div>

          {/* 데모 카드 — 평가 엔진 실제 출력 */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-bad/30 bg-surface p-5 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dim">{risky.code} · {risky.sector} · 데모</p>
                  <p className="text-lg font-semibold">{risky.name}</p>
                </div>
                <div className="text-right">
                  <GradeBadge grade={riskyHealth.grade} size="lg" />
                  <p className="mt-1 text-xs text-mut num">1년 부도확률 ~{riskyHealth.pd}%</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {riskyFilings
                  .filter((f) => f.tags.some((t) => t.severity !== "positive"))
                  .slice(0, 3)
                  .map((f) => {
                    const tag = f.tags.find((t) => t.severity !== "positive")!;
                    return (
                      <div key={f.title} className="flex items-center gap-2 rounded-lg border border-line bg-bg/60 px-3 py-2 text-sm">
                        <SeverityBadge severity={tag.severity} label={tag.label} />
                        <span className="flex-1 truncate text-mut">{f.title}</span>
                        <span className="num text-xs text-dim">{f.date.slice(5).replace("-", ".")}</span>
                      </div>
                    );
                  })}
              </div>
              <p className="mt-3 text-xs text-mut">{riskyHealth.signals[0]}</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-5 py-3">
              <div>
                <p className="text-xs text-dim">{safe.code} · 비교</p>
                <p className="font-semibold">{safe.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-mut">
                  부채비율 <span className="num text-ink">{fmtPct((safe.years[0].liabilities! / safe.years[0].equity!) * 100, 0)}</span>
                </span>
                <GradeBadge grade={safeHealth.grade} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 문제 제기 ── */}
      <section className="border-b border-line bg-surface/40">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          {[
            ["연쇄 부도의 시작", "거래처 하나의 부실이 어음·매출채권을 타고 내 회사의 유동성 위기가 됩니다. 신호는 늦게 오지 않았습니다 — 늦게 봤을 뿐입니다."],
            ["공시는 이미 말하고 있다", "유상증자 반복, 감사범위 한정, 소송, 최대주주 변경. 부실 기업의 전형적 경로는 DART 공시에 순서대로 기록됩니다."],
            ["비싼 신용정보의 대안", "기업 신용정보 서비스는 연 수백만 원. 공시레이더는 공개 데이터인 전자공시를 자동 분석해 월 커피 몇 잔 값으로 제공합니다."],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="mb-2 font-semibold text-brand2">{title}</h3>
              <p className="text-sm leading-relaxed text-mut">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 기능 ── */}
      <section id="features" className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold">종목코드 하나. 기업의 전체 리스크.</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-mut">
            오픈소스 dartlab 이 증명한 공시 수평화 기술 위에, 실무자를 위한 모니터링 서비스를 얹었습니다.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {[
              ["재무건전성 20단계 등급", "수익성·재무구조·현금창출력·추세 4축을 신용평가 방법론(선형 보간 스코어카드)으로 채점해 AAA~D 등급과 1년 부도확률 추정치를 제공합니다."],
              ["위험 공시 자동 태깅", "부도·회생·감사의견·유상증자·소송 등 18종 리스크 패턴으로 공시 제목을 분류합니다. 위험 공시는 등급에 즉시 반영되고 알림 피드에 쌓입니다."],
              ["항목 × 연도 재무 격자", "회사마다 다른 계정과목을 연도 축으로 수평화한 재무상태표·손익계산서·현금흐름표. 작년과 올해를 같은 행에서 비교합니다."],
              ["CSV · REST API", "Pro 는 재무제표 CSV 다운로드, Business 는 등급·시그널·공시를 JSON 으로 받는 REST API 를 제공합니다. 내부 시스템에 바로 연동하세요."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-line bg-surface p-6">
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-mut">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 요금 ── */}
      <section id="pricing" className="border-b border-line bg-surface/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold">요금</h2>
          <p className="mt-3 text-center text-mut">부가세 별도 · 언제든 해지 가능</p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {Object.values(PLANS).map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border p-6 ${
                  plan.id === "PRO" ? "border-brand bg-surface shadow-xl shadow-brand/10" : "border-line bg-surface"
                }`}
              >
                {plan.id === "PRO" && (
                  <span className="mb-3 self-start rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">
                    가장 인기
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-xs text-mut">{plan.tagline}</p>
                <p className="mt-4 text-3xl font-bold num">
                  {plan.price === 0 ? "₩0" : `₩${plan.price.toLocaleString("ko-KR")}`}
                  <span className="text-sm font-normal text-mut">/월</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-mut">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-ok">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={user ? "/billing" : "/signup"}
                  className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-semibold ${
                    plan.id === "PRO"
                      ? "bg-brand text-white hover:bg-brand2"
                      : "border border-line text-mut hover:text-ink"
                  }`}
                >
                  {plan.price === 0 ? "무료로 시작" : `${plan.name} 시작하기`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-b border-line">
        <div className="mx-auto w-full max-w-3xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold">자주 묻는 질문</h2>
          <div className="mt-10 space-y-6">
            {[
              ["데이터는 어디서 오나요?", "금융감독원 전자공시시스템(DART) OpenAPI 의 공시 목록과 재무제표 전 계정 데이터를 사용합니다. 오픈소스 dartlab 프로젝트의 데이터 파이프라인·신용 평가 방법론을 서비스에 맞게 이식했습니다."],
              ["등급은 신용평가사 등급인가요?", "아닙니다. 공개 재무 데이터와 공시 패턴만으로 산출한 참고용 추정치입니다. 신용평가사의 공식 등급이나 여신 심사 결과를 대체할 수 없으며, 투자·거래 판단의 보조 자료로만 활용하세요."],
              ["비상장 거래처도 조회되나요?", "현재는 DART 에 재무제표를 공시하는 상장사(KOSPI·KOSDAQ) 중심입니다. 감사보고서를 제출하는 비상장 외감법인은 로드맵에 있습니다."],
              ["해지는 어떻게 하나요?", "결제한 기간이 끝나면 자동으로 Free 플랜으로 전환됩니다. 별도의 해지 절차나 위약금이 없습니다."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-xl border border-line bg-surface p-5">
                <h3 className="font-semibold">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mut">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA + 푸터 ── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">오늘 등록한 거래처가, 내일의 손실을 막습니다</h2>
        <Link href="/signup" className="mt-6 inline-block rounded-lg bg-brand px-8 py-3 font-semibold text-white hover:bg-brand2">
          무료로 시작하기
        </Link>
      </section>
      <footer className="border-t border-line py-8 text-center text-xs leading-relaxed text-dim">
        <p>공시레이더 · 데이터 출처: 금융감독원 전자공시시스템(DART) · 분석 엔진: dartlab (Apache-2.0) 이식</p>
        <p className="mt-1">본 서비스가 제공하는 등급·점수·시그널은 참고용 추정치로, 투자 권유나 신용 평가 결과가 아닙니다.</p>
      </footer>
    </div>
  );
}
