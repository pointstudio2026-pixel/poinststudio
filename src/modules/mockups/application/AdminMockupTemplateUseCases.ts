import type { MockupCategory, MockupTemplate } from "@/modules/mockups/domain/Mockup";
import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import { resolveFileStorage } from "@/shared/storage/fileStorageRouter";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export class ListAllMockupTemplatesUseCase {
  constructor(private readonly mockupTemplateRepository: MockupTemplateRepository) {}
  async execute(): Promise<MockupTemplate[]> {
    return this.mockupTemplateRepository.listAll();
  }
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "template"
  );
}

export interface CreateMockupTemplateFromImageInput {
  category: MockupCategory;
  name: string;
  description: string;
  imageDataUri: string;
  placementArea: { xPct: number; yPct: number; widthPct: number; heightPct: number };
  fullDesignPlacementArea?: { xPct: number; yPct: number; widthPct: number; heightPct: number } | null;
  keywords: string[];
  containsKoreanText: boolean;
  isGeneric: boolean;
}

/**
 * 관리자 확인("확인" 클릭) 시점에만 호출된다 -- 생성/재생성 단계(Generate
 * UseCase)에서는 아무것도 실제 스토리지/DB에 쓰지 않으므로, 반려된 시도들은
 * 비용만 발생하고 흔적을 남기지 않는다(기존 배치 스크립트 감사 흐름과
 * 동일한 원칙). 이미지가 실제 오브젝트 스토리지에 저장되고 DB에 즉시
 * 반영되므로, 커밋/배포/재시딩 없이 바로 실사용 목업 대시보드에 나타난다
 * (memory 문서의 "일반 사용자들이 보는 목업 창에서 바로 바뀌도록" 요구사항).
 */
export class CreateMockupTemplateUseCase {
  constructor(private readonly mockupTemplateRepository: MockupTemplateRepository) {}

  async execute(input: CreateMockupTemplateFromImageInput): Promise<MockupTemplate> {
    const match = /^data:([^;]+);base64,(.+)$/s.exec(input.imageDataUri);
    if (!match) throw new ValidationError("이미지 데이터 형식이 올바르지 않습니다.");
    const [, contentType, base64] = match;
    const buffer = Buffer.from(base64!, "base64");

    const fileStorage = resolveFileStorage();
    const saved = await fileStorage.save(`mockup-templates/${crypto.randomUUID()}`, buffer, contentType!);
    const backgroundUrl = `/api/content/images/${saved.key}`;

    const slug = `${input.category.replace(/_/g, "-")}-${slugify(input.name)}-${crypto.randomUUID().slice(0, 8)}`;

    return this.mockupTemplateRepository.create({
      category: input.category,
      name: input.name,
      slug,
      description: input.description,
      backgroundUrl,
      placementArea: input.placementArea,
      fullDesignPlacementArea: input.fullDesignPlacementArea ?? null,
      keywords: input.keywords,
      containsKoreanText: input.containsKoreanText,
      isGeneric: input.isGeneric,
    });
  }
}

export class DeleteMockupTemplateUseCase {
  constructor(private readonly mockupTemplateRepository: MockupTemplateRepository) {}

  /** 실사용 참조(mockup_projects/standalone_mockups)가 있으면 hidden 처리,
   * 없으면 완전 삭제 -- memory 문서 규칙 9, 관리자가 매번 직접 판단할
   * 필요 없이 자동 결정. */
  async execute(id: string): Promise<{ mode: "hidden" | "deleted" }> {
    const existing = await this.mockupTemplateRepository.findById(id);
    if (!existing) throw new NotFoundError("템플릿을 찾을 수 없습니다.", "MOCKUP_TEMPLATE_NOT_FOUND");

    const usages = await this.mockupTemplateRepository.countUsages(id);
    if (usages > 0) {
      await this.mockupTemplateRepository.hide(id);
      return { mode: "hidden" };
    }
    await this.mockupTemplateRepository.hardDelete(id);
    return { mode: "deleted" };
  }
}
