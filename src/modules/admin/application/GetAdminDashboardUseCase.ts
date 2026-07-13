import type { AdminRepository } from "@/modules/admin/domain/AdminRepository";
import type { QueueInspectable } from "@/modules/admin/domain/QueueInspectable";
import type { AdminDashboardSummary, ProviderHealthStatus, QueueStatusEntry } from "@/modules/admin/domain/Admin";
import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import type { ImageGenerationProvider } from "@/shared/ai/ImageGenerationProvider";
import type { MockupRenderProvider } from "@/shared/ai/MockupRenderProvider";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function toQueueStatus(
  queue: "image_generation" | "image_edit" | "mockup_render" | "export",
  instance: QueueInspectable,
): Promise<QueueStatusEntry> {
  const counts = await instance.getJobCounts("waiting", "active", "completed", "failed", "delayed");
  return {
    queue,
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    delayed: counts.delayed ?? 0,
  };
}

async function toProviderHealth(
  provider: ProviderHealthStatus["provider"],
  instance: { name: string; health(): Promise<boolean> },
): Promise<ProviderHealthStatus> {
  const healthy = await instance.health().catch(() => false);
  return { provider, name: instance.name, healthy };
}

/**
 * "Provider Status 카드는 기본 health() 어댑터 호출 수준으로 축소" (scope
 * decision recorded when this MVP plan was first approved) -- no
 * fine-grained latency/cost-per-call monitoring, just up/down.
 */
export class GetAdminDashboardUseCase {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly textCompletionProvider: TextCompletionProvider,
    private readonly imageGenerationProvider: ImageGenerationProvider,
    private readonly mockupRenderProvider: MockupRenderProvider,
    private readonly imageGenerationQueue: QueueInspectable,
    private readonly imageEditQueue: QueueInspectable,
    private readonly mockupRenderQueue: QueueInspectable,
    private readonly exportQueue: QueueInspectable,
  ) {}

  async execute(): Promise<AdminDashboardSummary> {
    const since24h = new Date(Date.now() - ONE_DAY_MS);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [dailyActiveUsers, newProjectsToday, planDistribution, errorRates, providerHealth, queueStatus] =
      await Promise.all([
        this.adminRepository.countDailyActiveUsers(since24h),
        this.adminRepository.countNewProjectsSince(startOfToday),
        this.adminRepository.planDistribution(),
        this.adminRepository.errorRates(since24h),
        Promise.all([
          toProviderHealth("text_completion", this.textCompletionProvider),
          toProviderHealth("image_generation", this.imageGenerationProvider),
          toProviderHealth("mockup_render", this.mockupRenderProvider),
        ]),
        Promise.all([
          toQueueStatus("image_generation", this.imageGenerationQueue),
          toQueueStatus("image_edit", this.imageEditQueue),
          toQueueStatus("mockup_render", this.mockupRenderQueue),
          toQueueStatus("export", this.exportQueue),
        ]),
      ]);

    return { dailyActiveUsers, newProjectsToday, planDistribution, providerHealth, queueStatus, errorRates };
  }
}
