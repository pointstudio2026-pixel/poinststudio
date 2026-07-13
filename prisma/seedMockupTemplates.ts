import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Seeds the Mockup Studio's template library (18_PRD_MockupStudio.md /
 * Task-016). "템플릿은 확장 가능한 구조로 설계한다" -- lives in Postgres like
 * the Style Engine's taxonomy, not an in-code constant. Backgrounds are
 * deterministic inline SVGs (no real photo assets / object storage needed
 * for the MVP); each has a placement rect (in percent) where a logo gets
 * composited. Re-run with `npm run prisma:seed-mockup-templates`; it's
 * idempotent (upsert by slug).
 */

interface CategoryDef {
  category: string;
  label: string;
  aspect: number; // width / height, drives the background rect shape
  placement: { xPct: number; yPct: number; widthPct: number; heightPct: number };
  variants: { suffix: string; bg: string; fg: string }[];
}

const CATEGORIES: CategoryDef[] = [
  {
    category: "business_card",
    label: "Business Card",
    aspect: 1.75,
    placement: { xPct: 30, yPct: 35, widthPct: 40, heightPct: 30 },
    variants: [
      { suffix: "Cream", bg: "#fef3c7", fg: "#78350f" },
      { suffix: "Charcoal", bg: "#1f2937", fg: "#f9fafb" },
    ],
  },
  {
    category: "stationery",
    label: "Stationery",
    aspect: 0.77,
    placement: { xPct: 10, yPct: 8, widthPct: 30, heightPct: 15 },
    variants: [
      { suffix: "White", bg: "#ffffff", fg: "#111827" },
      { suffix: "Ivory", bg: "#fffbeb", fg: "#78350f" },
    ],
  },
  {
    category: "signboard",
    label: "Signboard",
    aspect: 2.5,
    placement: { xPct: 25, yPct: 25, widthPct: 50, heightPct: 50 },
    variants: [
      { suffix: "Navy", bg: "#0c1e3e", fg: "#f9fafb" },
      { suffix: "Wood", bg: "#7c4a1e", fg: "#fef3c7" },
    ],
  },
  {
    category: "packaging",
    label: "Packaging",
    aspect: 1,
    placement: { xPct: 25, yPct: 30, widthPct: 50, heightPct: 40 },
    variants: [
      { suffix: "Kraft", bg: "#b08968", fg: "#3f2a14" },
      { suffix: "White Box", bg: "#f5f5f4", fg: "#1c1917" },
    ],
  },
  {
    category: "coffee_cup",
    label: "Coffee Cup",
    aspect: 0.55,
    placement: { xPct: 25, yPct: 30, widthPct: 50, heightPct: 35 },
    variants: [
      { suffix: "White Cup", bg: "#fafaf9", fg: "#292524" },
      { suffix: "Kraft Cup", bg: "#c9a679", fg: "#3f2a14" },
    ],
  },
  {
    category: "shopping_bag",
    label: "Shopping Bag",
    aspect: 0.8,
    placement: { xPct: 25, yPct: 30, widthPct: 50, heightPct: 40 },
    variants: [
      { suffix: "Kraft Bag", bg: "#a9744f", fg: "#2b1a0e" },
      { suffix: "White Bag", bg: "#f5f5f4", fg: "#111827" },
    ],
  },
  {
    category: "t_shirt",
    label: "T-shirt",
    aspect: 0.9,
    placement: { xPct: 30, yPct: 25, widthPct: 40, heightPct: 30 },
    variants: [
      { suffix: "Light Gray", bg: "#e5e7eb", fg: "#111827" },
      { suffix: "Black", bg: "#111827", fg: "#f9fafb" },
    ],
  },
  {
    category: "mobile_app",
    label: "Mobile App",
    aspect: 0.5,
    placement: { xPct: 30, yPct: 12, widthPct: 40, heightPct: 20 },
    variants: [
      { suffix: "Dark UI", bg: "#111827", fg: "#f9fafb" },
      { suffix: "Light UI", bg: "#f9fafb", fg: "#111827" },
    ],
  },
  {
    category: "website_hero",
    label: "Website Hero",
    aspect: 1.9,
    placement: { xPct: 8, yPct: 10, widthPct: 25, heightPct: 25 },
    variants: [
      { suffix: "Light Section", bg: "#f3f4f6", fg: "#111827" },
      { suffix: "Dark Section", bg: "#0f172a", fg: "#f9fafb" },
    ],
  },
  {
    category: "social_media",
    label: "Social Media",
    aspect: 1,
    placement: { xPct: 30, yPct: 30, widthPct: 40, heightPct: 40 },
    variants: [
      { suffix: "Feed Square", bg: "#fef2f2", fg: "#7f1d1d" },
      { suffix: "Story", bg: "#ede9fe", fg: "#4c1d95" },
    ],
  },
];

const BASE_SIZE = 512;

function slugify(...parts: string[]): string {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildBackgroundSvg(def: CategoryDef, variant: CategoryDef["variants"][number]): string {
  const width = def.aspect >= 1 ? BASE_SIZE : Math.round(BASE_SIZE * def.aspect);
  const height = def.aspect >= 1 ? Math.round(BASE_SIZE / def.aspect) : BASE_SIZE;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" rx="${Math.round(Math.min(width, height) * 0.04)}" fill="${variant.bg}"/>` +
    `<text x="50%" y="95%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(height * 0.05)}" fill="${variant.fg}" opacity="0.6">${def.label} · ${variant.suffix}</text>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  let count = 0;
  for (const def of CATEGORIES) {
    for (const variant of def.variants) {
      const slug = slugify(def.category, variant.suffix);
      await prisma.mockupTemplate.upsert({
        where: { slug },
        create: {
          category: def.category,
          name: `${def.label} (${variant.suffix})`,
          slug,
          description: `${def.label} 목업 템플릿 -- ${variant.suffix} 배경에 로고를 자동 배치합니다.`,
          backgroundUrl: buildBackgroundSvg(def, variant),
          placementXPct: def.placement.xPct,
          placementYPct: def.placement.yPct,
          placementWidthPct: def.placement.widthPct,
          placementHeightPct: def.placement.heightPct,
        },
        update: {
          backgroundUrl: buildBackgroundSvg(def, variant),
          placementXPct: def.placement.xPct,
          placementYPct: def.placement.yPct,
          placementWidthPct: def.placement.widthPct,
          placementHeightPct: def.placement.heightPct,
        },
      });
      count++;
    }
  }

  console.log(`Seeded mockup templates: ${count} across ${CATEGORIES.length} categories`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
