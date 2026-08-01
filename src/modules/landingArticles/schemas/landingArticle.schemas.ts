import { z } from "zod";

const landingArticleImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().min(1),
});

const landingArticleIndustryFitSchema = z.object({
  industry: z.string().min(1),
  reason: z.string().min(1),
});

const landingArticleDetailSpecSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const landingArticleComboSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
});

const landingArticleFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const styleGuideContentSchema = z.object({
  definition: z.string().min(1),
  images: z.array(landingArticleImageSchema),
  industryFit: z.array(landingArticleIndustryFitSchema),
  detailSpec: z.array(landingArticleDetailSpecSchema),
  combos: z.array(landingArticleComboSchema),
  faq: z.array(landingArticleFaqSchema),
  ctaLabel: z.string().min(1),
  ctaHref: z.string().min(1),
});

const landingArticleTableSchema = z.object({
  caption: z.string().min(1),
  headers: z.array(z.string().min(1)).min(1),
  rows: z.array(z.array(z.string())).min(1),
});

const landingArticleInlineLinkSchema = z.object({
  afterParagraphIndex: z.number().int().min(0),
  label: z.string().min(1),
  href: z.string().min(1),
  external: z.boolean().optional(),
});

const faqArticleContentSchema = z.object({
  summary: z.string().min(1),
  body: z.array(z.string().min(1)).min(1),
  images: z.array(landingArticleImageSchema).default([]),
  keyPoints: z.array(landingArticleDetailSpecSchema),
  relatedQuestions: z.array(landingArticleComboSchema),
  ctaLabel: z.string().min(1),
  ctaHref: z.string().min(1),
  table: landingArticleTableSchema.optional(),
  inlineLinks: z.array(landingArticleInlineLinkSchema).optional(),
});

const whyAsterPageContentSchema = z.object({
  intro: z.string().min(1),
  benefits: z.array(z.object({ title: z.string().min(1), description: z.string().min(1) })).min(1),
  ctaLabel: z.string().min(1),
  ctaHref: z.string().min(1),
});

// category마다 콘텐츠 모양이 다르므로(스타일 가이드/FAQ/Why ASTER) 하나로
// 합치지 않고 union으로 검증한다 -- zod가 순서대로 시도해서 맞는 걸 고른다.
export const landingArticleContentSchema = z.union([
  styleGuideContentSchema,
  faqArticleContentSchema,
  whyAsterPageContentSchema,
]);

export const publishLandingArticleSchema = z.object({
  slug: z.string().min(1).max(160),
  category: z.string().min(1).max(60),
  locale: z.enum(["ko", "en", "ja", "fr", "de"]),
  title: z.string().min(1).max(200),
  displayTitle: z.string().min(1).max(200),
  metaDescription: z.string().min(1).max(300),
  status: z.enum(["draft", "published"]),
  content: landingArticleContentSchema,
});

export type PublishLandingArticleInput = z.infer<typeof publishLandingArticleSchema>;
