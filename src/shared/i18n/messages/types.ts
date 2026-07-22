import type { ko } from "@/shared/i18n/messages/ko";

/**
 * Maps every string leaf of the Korean tree to `string`, recursively -- other
 * locales must match the SHAPE, not the literal Korean values. Assigning an
 * object literal directly to this type (`export const en: Messages = {...}`)
 * makes both a missing key and a typo'd/extra key a compile error (required
 * property + excess-property checks), so `npx tsc --noEmit` is the drift
 * guard between all 5 locale files -- no separate script needed.
 */
export type MessageShape<T> = { [K in keyof T]: T[K] extends string ? string : MessageShape<T[K]> };
export type Messages = MessageShape<typeof ko>;

/** Dot-path union over the Korean tree, e.g. "nav.myProjects" | "home.hero.title" | ... */
type DotPaths<T> = T extends string
  ? never
  : { [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}` }[keyof T & string];
export type MessageKey = DotPaths<typeof ko>;
