export type PlanId = "FREE" | "PRO" | "BUSINESS";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // 월 요금 (KRW)
  watchLimit: number; // 관심기업 수 (Infinity = 무제한)
  csvExport: boolean;
  apiAccess: boolean;
  tagline: string;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: "FREE",
    name: "Free",
    price: 0,
    watchLimit: 3,
    csvExport: false,
    apiAccess: false,
    tagline: "공시 모니터링을 처음 시작하는 분",
    features: [
      "관심기업 3개",
      "재무건전성 점수·등급",
      "공시 리스크 태그",
      "재무제표 3개년 조회",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    price: 29000,
    watchLimit: 30,
    csvExport: true,
    apiAccess: false,
    tagline: "거래처·포트폴리오를 상시 관리하는 실무자",
    features: [
      "관심기업 30개",
      "위험 공시 알림 피드",
      "재무제표 CSV 다운로드",
      "건전성 4축 상세 분석",
      "이메일 문의 지원",
    ],
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    price: 99000,
    watchLimit: Number.POSITIVE_INFINITY,
    csvExport: true,
    apiAccess: true,
    tagline: "여신·구매·리스크 관리 팀",
    features: [
      "관심기업 무제한",
      "REST API 액세스",
      "Pro 의 모든 기능",
      "우선 기술 지원",
    ],
  },
};

export const PLAN_DURATION_DAYS = 31;

export function planOf(id: string | null | undefined): Plan {
  if (id === "PRO" || id === "BUSINESS") return PLANS[id];
  return PLANS.FREE;
}

/** 만료 반영 실효 플랜: 유료 플랜이 만료됐으면 FREE 로 강등 */
export function effectivePlan(planId: string | null, expiresAt: string | null): Plan {
  const plan = planOf(planId);
  if (plan.id === "FREE") return plan;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return PLANS.FREE;
  return plan;
}
