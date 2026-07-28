import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { industriesContainer } from "@/modules/industries/container";

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const industries = await industriesContainer.listAllIndustriesUseCase.execute();
    return apiSuccess({ industries });
  } catch (err) {
    return toApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      throw new ValidationError("업종 이름을 입력해주세요.", undefined, "INDUSTRY-002");
    }
    if (typeof body.seoSlug !== "string" || !body.seoSlug.trim()) {
      throw new ValidationError("SEO 슬러그를 입력해주세요.", undefined, "INDUSTRY-003");
    }
    if (typeof body.category !== "string" || !body.category.trim()) {
      throw new ValidationError("카테고리를 입력해주세요.", undefined, "INDUSTRY-004");
    }
    if (typeof body.description !== "string" || !body.description.trim()) {
      throw new ValidationError("설명을 입력해주세요.", undefined, "INDUSTRY-005");
    }

    const industry = await industriesContainer.createIndustryUseCase.execute({
      name: body.name,
      seoSlug: body.seoSlug,
      category: body.category,
      description: body.description,
      recommendedColors: parseStringArray(body.recommendedColors),
      recommendedLogoStyles: parseStringArray(body.recommendedLogoStyles),
      recommendedTypography: parseStringArray(body.recommendedTypography),
      recommendedPersonality: parseStringArray(body.recommendedPersonality),
      recommendedKeywords: parseStringArray(body.recommendedKeywords),
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });
    return apiSuccess({ industry }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
