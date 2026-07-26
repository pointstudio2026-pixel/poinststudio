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

export const generateGiftCodesSchema = z.object({
  planCode: z.enum(["pro", "studio"]),
  grantDays: z.coerce.number().int().min(1).max(365).default(31),
  count: z.coerce.number().int().min(1).max(500),
  batchLabel: z.string().trim().max(100).optional(),
  expiresAt: z.string().datetime().optional().or(z.literal("").transform(() => undefined)),
  maxRedemptions: z.coerce.number().int().min(1).max(100000).optional(),
});

export type GenerateGiftCodesInput = z.infer<typeof generateGiftCodesSchema>;
