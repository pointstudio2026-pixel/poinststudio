import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { mockupsContainer } from "@/modules/mockups/container";
import { MOCKUP_CATEGORIES, type MockupCategory } from "@/modules/mockups/domain/Mockup";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const templates = await mockupsContainer.listAllMockupTemplatesUseCase.execute();
    return apiSuccess({ templates });
  } catch (err) {
    return toApiError(err);
  }
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function parsePlacementArea(value: unknown): { xPct: number; yPct: number; widthPct: number; heightPct: number } | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const { xPct, yPct, widthPct, heightPct } = v;
  if (![xPct, yPct, widthPct, heightPct].every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  return { xPct: xPct as number, yPct: yPct as number, widthPct: widthPct as number, heightPct: heightPct as number };
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body.imageDataUri !== "string" || !body.imageDataUri.startsWith("data:")) {
      throw new ValidationError("생성된 이미지 데이터가 없습니다.", undefined, "ADMIN_MOCKUP_CREATE-001");
    }
    if (typeof body.category !== "string" || !(MOCKUP_CATEGORIES as readonly string[]).includes(body.category)) {
      throw new ValidationError("카테고리가 올바르지 않습니다.", undefined, "ADMIN_MOCKUP_CREATE-002");
    }
    if (typeof body.name !== "string" || !body.name.trim()) {
      throw new ValidationError("이름을 입력해주세요.", undefined, "ADMIN_MOCKUP_CREATE-003");
    }
    if (typeof body.description !== "string" || !body.description.trim()) {
      throw new ValidationError("설명을 입력해주세요.", undefined, "ADMIN_MOCKUP_CREATE-004");
    }
    const placementArea = parsePlacementArea(body.placementArea);
    if (!placementArea) {
      throw new ValidationError("배치 영역(x/y/폭/높이)을 올바르게 입력해주세요.", undefined, "ADMIN_MOCKUP_CREATE-005");
    }
    const fullDesignPlacementArea = body.fullDesignPlacementArea ? parsePlacementArea(body.fullDesignPlacementArea) : null;

    const template = await mockupsContainer.createMockupTemplateUseCase.execute({
      category: body.category as MockupCategory,
      name: body.name,
      description: body.description,
      imageDataUri: body.imageDataUri,
      placementArea,
      fullDesignPlacementArea,
      keywords: parseStringArray(body.keywords),
      containsKoreanText: typeof body.containsKoreanText === "boolean" ? body.containsKoreanText : false,
      isGeneric: typeof body.isGeneric === "boolean" ? body.isGeneric : false,
    });
    return apiSuccess({ template }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
