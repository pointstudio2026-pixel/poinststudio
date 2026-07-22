import type { Locale } from "@/shared/i18n/locale";
import type { Messages } from "@/shared/i18n/messages/types";
import { ko } from "@/shared/i18n/messages/ko";
import { en } from "@/shared/i18n/messages/en";
import { ja } from "@/shared/i18n/messages/ja";
import { fr } from "@/shared/i18n/messages/fr";
import { de } from "@/shared/i18n/messages/de";

export const MESSAGES: Record<Locale, Messages> = { ko, en, ja, fr, de };
