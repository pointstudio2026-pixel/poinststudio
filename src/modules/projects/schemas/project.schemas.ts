import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "프로젝트 이름을 입력해주세요.")
    .max(100, "프로젝트 이름은 100자 이하여야 합니다."),
});

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .min(1, "프로젝트 이름을 입력해주세요.")
      .max(100, "프로젝트 이름은 100자 이하여야 합니다.")
      .optional(),
    isFavorite: z.boolean().optional(),
    archived: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "변경할 값이 없습니다.",
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
