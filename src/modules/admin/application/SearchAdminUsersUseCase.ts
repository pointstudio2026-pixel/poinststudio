import type { AdminRepository } from "@/modules/admin/domain/AdminRepository";
import type { AdminUserSearchResult } from "@/modules/admin/domain/Admin";

export class SearchAdminUsersUseCase {
  constructor(private readonly adminRepository: AdminRepository) {}

  async execute(input: { query?: string; limit?: number }): Promise<AdminUserSearchResult[]> {
    return this.adminRepository.searchUsers(input.query ?? "", input.limit ?? 20);
  }
}
