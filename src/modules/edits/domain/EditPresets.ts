export type EditPresetKey =
  | "simpler"
  | "more_luxurious"
  | "more_minimal"
  | "more_dynamic"
  | "change_color"
  | "emphasize_typography"
  | "icon_only"
  | "symbol_only"
  | "layout_change"
  | "regenerate";

export interface EditPreset {
  key: EditPresetKey;
  label: string;
  instruction: string;
}

/** Task-014 "Default Edit Actions" -- the only edit vocabulary this task ships (no free-text prompt editing). */
export const EDIT_PRESETS: Record<EditPresetKey, EditPreset> = {
  simpler: {
    key: "simpler",
    label: "심플하게",
    instruction: "전체적으로 더 단순하고 절제된 형태로 조정한다.",
  },
  more_luxurious: {
    key: "more_luxurious",
    label: "더 고급스럽게",
    instruction: "더 고급스럽고 세련된 느낌으로 조정한다.",
  },
  more_minimal: {
    key: "more_minimal",
    label: "더 미니멀하게",
    instruction: "불필요한 요소를 줄이고 여백을 강조한 미니멀 스타일로 조정한다.",
  },
  more_dynamic: {
    key: "more_dynamic",
    label: "더 역동적으로",
    instruction: "더 역동적이고 에너지 있는 형태로 조정한다.",
  },
  change_color: {
    key: "change_color",
    label: "컬러 변경",
    instruction: "브랜드 톤에 맞는 다른 컬러 팔레트로 변경한다.",
  },
  emphasize_typography: {
    key: "emphasize_typography",
    label: "타이포 강조",
    instruction: "타이포그래피 요소를 더 강조한다.",
  },
  icon_only: {
    key: "icon_only",
    label: "아이콘만 수정",
    instruction: "아이콘 요소만 조정하고 나머지는 유지한다.",
  },
  symbol_only: {
    key: "symbol_only",
    label: "심볼만 수정",
    instruction: "심볼 요소만 조정하고 나머지는 유지한다.",
  },
  layout_change: {
    key: "layout_change",
    label: "레이아웃 변경",
    instruction: "전체적인 레이아웃 구성을 다르게 조정한다.",
  },
  regenerate: {
    key: "regenerate",
    label: "다시 생성",
    instruction: "동일한 방향성 안에서 완전히 새로운 대안을 생성한다.",
  },
};

export function isEditPresetKey(value: string): value is EditPresetKey {
  return value in EDIT_PRESETS;
}
