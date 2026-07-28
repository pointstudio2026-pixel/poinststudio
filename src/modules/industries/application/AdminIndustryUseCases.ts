import type { IndustryRepository } from "@/modules/industries/domain/IndustryRepository";
import type { CreateIndustryInput, Industry, UpdateIndustryInput } from "@/modules/industries/domain/Industry";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export class ListAllIndustriesUseCase {
  constructor(private readonly industryRepository: IndustryRepository) {}
  async execute(): Promise<Industry[]> {
    return this.industryRepository.listAll();
  }
}

export class CreateIndustryUseCase {
  constructor(private readonly industryRepository: IndustryRepository) {}
  async execute(input: CreateIndustryInput): Promise<Industry> {
    const existing = await this.industryRepository.findByName(input.name);
    if (existing) {
      throw new ValidationError("이미 존재하는 업종 이름입니다.", undefined, "INDUSTRY-001");
    }
    return this.industryRepository.create(input);
  }
}

export class UpdateIndustryUseCase {
  constructor(private readonly industryRepository: IndustryRepository) {}
  async execute(id: string, input: UpdateIndustryInput): Promise<Industry> {
    const existing = await this.industryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("업종을 찾을 수 없습니다.", "INDUSTRY_NOT_FOUND");
    }
    return this.industryRepository.update(id, input);
  }
}

export class DeleteIndustryUseCase {
  constructor(private readonly industryRepository: IndustryRepository) {}
  async execute(id: string): Promise<void> {
    const existing = await this.industryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("업종을 찾을 수 없습니다.", "INDUSTRY_NOT_FOUND");
    }
    await this.industryRepository.delete(id);
  }
}
