import type { AdminRepository, AuditLogFilter } from "@/modules/admin/domain/AdminRepository";
import type { AuditLogEntry } from "@/modules/admin/domain/Admin";

export class GetAuditLogsUseCase {
  constructor(private readonly adminRepository: AdminRepository) {}

  async execute(filter: AuditLogFilter): Promise<AuditLogEntry[]> {
    return this.adminRepository.listAuditLogs(filter);
  }
}
