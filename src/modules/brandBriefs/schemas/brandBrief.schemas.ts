import { z } from "zod";

export const updateBrandBriefSchema = z
  .object({
    brandName: z.string().min(1).optional(),
    industry: z.string().min(1).optional(),
    tagline: z.string().optional(),
    description: z.string().optional(),
    mission: z.string().optional(),
    vision: z.string().optional(),
    coreValues: z.array(z.string()).optional(),
    positioning: z.string().optional(),
    primaryAudience: z.string().optional(),
    secondaryAudience: z.string().optional(),
    customerProblems: z.string().optional(),
    desiredImpression: z.string().optional(),
    brandTone: z.string().optional(),
    brandPersonality: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    avoidKeywords: z.array(z.string()).optional(),
    preferredStyle: z.string().optional(),
    preferredColor: z.string().optional(),
    preferredSymbol: z.string().optional(),
    typographyDirection: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "변경할 값이 없습니다." });

export const restoreBrandBriefVersionSchema = z.object({
  versionNumber: z.number().int().positive(),
});
