import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin } from "@/shared/auth/session";
import { industriesContainer } from "@/modules/industries/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const industry = await industriesContainer.updateIndustryUseCase.execute(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      seoSlug: typeof body.seoSlug === "string" ? body.seoSlug : undefined,
      category: typeof body.category === "string" ? body.category : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      recommendedColors: parseStringArray(body.recommendedColors),
      recommendedLogoStyles: parseStringArray(body.recommendedLogoStyles),
      recommendedTypography: parseStringArray(body.recommendedTypography),
      recommendedPersonality: parseStringArray(body.recommendedPersonality),
      recommendedKeywords: parseStringArray(body.recommendedKeywords),
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });
    return apiSuccess({ industry });
  } catch (err) {
    return toApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    requireAdmin(request);
    const { id } = await params;
    await industriesContainer.deleteIndustryUseCase.execute(id);
    return apiSuccess({ ok: true });
  } catch (err) {
    return toApiError(err);
  }
}
