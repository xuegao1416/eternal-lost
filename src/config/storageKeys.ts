// ============================================================
//  localStorage Key 注册表 — 永恒迷途录
// ============================================================

const PREFIX = 'eternal_lost_';

export const STORAGE_KEYS = {
  UI_SETTINGS: `${PREFIX}ui_settings`,
  API_CONFIG: `${PREFIX}api_config`,
  API_PRESETS: `${PREFIX}api_presets`,
  VARIABLE_ENABLED: `${PREFIX}variable_enabled`,
  PRESET_PACKS: `${PREFIX}preset_packs`,
  ACTIVE_PRESET: `${PREFIX}active_preset`,
  ACTIVE_PRESET_ID: `${PREFIX}active_preset_id`,
  BUILTIN_OVERRIDES: `${PREFIX}builtin_overrides`,
  MEMORY_CONFIG: `${PREFIX}memory_config`,
  IMAGE_GEN_CONFIG: `${PREFIX}image_gen_config`,
  IMAGE_CONFIG: `${PREFIX}image_config`,
  PROXY_URL: `${PREFIX}proxy_url`,
  PIPELINE_CONFIG: `${PREFIX}pipeline_config`,
} as const;
