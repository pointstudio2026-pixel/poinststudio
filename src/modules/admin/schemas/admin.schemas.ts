import { z } from "zod";

export const changeUserRoleSchema = z
  .object({
    role: z.enum(["designer", "admin"]),
    adminTier: z.enum(["super_admin", "manager", "support"]).optional(),
  })
  .refine((data) => (data.role === "admin" ? Boolean(data.adminTier) : !data.adminTier), {
    message: "role이 admin이면 adminTier가 필요하고, designer면 adminTier를 지정할 수 없습니다.",
  });

export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;

export const changeUserPlanSchema = z.object({
  planCode: z.enum(["free", "pro", "studio"]),
});

export type ChangeUserPlanInput = z.infer<typeof changeUserPlanSchema>;
