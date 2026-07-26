import type { MessageKey } from "@/shared/i18n/messages/types";
import type { EditPresetKeyDto } from "@/services/edits-service";

// EDIT_PRESET_OPTIONS(edits-service.ts)/EDIT_PRESETS(modules/edits/domain/EditPresets.ts)의
// key는 실제 저장/AI 프롬프트 조립에 쓰이는 값이라 바꾸지 않는다 -- 화면에
// 보여줄 때만 이 표로 번역 문구를 찾는다(DELIVERABLE_TYPE_LABEL_KEYS와
// 동일한 패턴). 두 파일이 같은 10개 key를 갖고 있어 하나의 표를 공유한다.
export const EDIT_PRESET_LABEL_KEYS: Record<EditPresetKeyDto, MessageKey> = {
  simpler: "editPresets.simpler",
  more_luxurious: "editPresets.moreLuxurious",
  more_minimal: "editPresets.moreMinimal",
  more_dynamic: "editPresets.moreDynamic",
  change_color: "editPresets.changeColor",
  emphasize_typography: "editPresets.emphasizeTypography",
  icon_only: "editPresets.iconOnly",
  symbol_only: "editPresets.symbolOnly",
  layout_change: "editPresets.layoutChange",
  regenerate: "editPresets.regenerate",
};
