import type {
  BrandBrief,
  BrandBriefData,
  BrandBriefVersion,
  BrandBriefVersionSource,
} from "@/modules/brandBriefs/domain/BrandBrief";

export interface BrandBriefRepository {
  findByProjectId(projectId: string): Promise<BrandBrief | null>;
  /** Creates the brief and its first version (v1) in one step. */
  createWithFirstVersion(
    projectId: string,
    data: BrandBriefData,
    source: BrandBriefVersionSource,
    createdBy?: string,
  ): Promise<BrandBrief>;
  /** Appends a new version and makes it current — never overwrites a prior version. */
  addVersion(
    brandBriefId: string,
    data: BrandBriefData,
    source: BrandBriefVersionSource,
    createdBy?: string,
  ): Promise<BrandBrief>;
  listVersions(brandBriefId: string): Promise<BrandBriefVersion[]>;
  getVersion(brandBriefId: string, versionNumber: number): Promise<BrandBriefVersion | null>;
}
