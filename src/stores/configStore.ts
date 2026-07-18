// ============================================================
//  配置 Store — UI 设置 + API 配置
// ============================================================
import { create } from 'zustand';
import type { ApiConfig } from '@/api/types';
import { STORAGE_KEYS } from '@/config/storageKeys';
import { seal, unseal, isSealed } from '@/security/keyVault';

// ─── 类型 ───

export type Theme = 'backrooms' | 'dark' | 'light';
export type FontFamily = 'yahei' | 'source';
export type FontSize = '小' | '中' | '大';
export type LineHeight = '紧凑' | '舒适' | '宽松';
export type Language = 'zh-CN' | 'en';

export interface UISettings {
  language: Language;
  theme: Theme;
  font: FontFamily;
  uiFontSize: FontSize;
  bodyFontSize: FontSize;
  lineHeight: LineHeight;
  autoScroll: boolean;
}

// ─── 常量 ───

const STORAGE_KEY = STORAGE_KEYS.UI_SETTINGS;
const API_STORAGE_KEY = STORAGE_KEYS.API_CONFIG;

const DEFAULT_SETTINGS: UISettings = {
  language: 'zh-CN',
  theme: 'backrooms',
  font: 'yahei',
  uiFontSize: '中',
  bodyFontSize: '中',
  lineHeight: '舒适',
  autoScroll: true,
};

const FONT_MAP: Record<FontFamily, string> = {
  yahei: "'Microsoft YaHei', 'PingFang SC', sans-serif",
  source: "'Source Han Sans SC', 'Noto Sans SC', sans-serif",
};

const UI_FONT_SIZE_MAP: Record<FontSize, string> = { '小': '12px', '中': '14px', '大': '16px' };
const BODY_FONT_SIZE_MAP: Record<FontSize, string> = { '小': '13px', '中': '15px', '大': '17px' };
const LINE_HEIGHT_MAP: Record<LineHeight, string> = { '紧凑': '1.4', '舒适': '1.6', '宽松': '1.8' };

// ─── 翻译 ───

const translations: Record<Language, Record<string, string>> = {
  'zh-CN': {
    'settings.title': '设置',
    'settings.back': '← 返回',
    'settings.ui': '界面设置',
    'settings.api': 'API 设置',
    'settings.image': '生图设置',
    'settings.preset': '预设设置',
    'settings.language': '语言',
    'settings.theme': '主题',
    'settings.font': '字体',
    'settings.uiFontSize': '界面字体',
    'settings.uiFontSize.desc': 'UI 元素的字体大小',
    'settings.bodyFontSize': '正文字体',
    'settings.bodyFontSize.desc': '聊天消息的字体大小',
    'settings.lineHeight': '正文行距',
    'settings.autoScroll': '正文自动滚动',
    'settings.provider': 'Provider',
    'settings.baseUrl': 'Base URL',
    'settings.baseUrl.desc': 'API 端点地址',
    'settings.apiKey': 'API Key',
    'settings.apiKey.desc': '密钥',
    'settings.model': 'Model',
    'settings.model.desc': '模型名称',
    'settings.test': '测试连接',
    'settings.testing': '测试中...',
    'theme.backrooms': '后室',
    'theme.dark': '玄夜',
    'theme.light': '拂晓',
    'font.yahei': '雅黑',
    'font.source': '思源黑体',
    'common.small': '小',
    'common.medium': '中',
    'common.large': '大',
    'common.compact': '紧凑',
    'common.comfortable': '舒适',
    'common.loose': '宽松',
    'common.cancel': '取消',
    'common.confirm': '确定',
    'common.save': '保存',
  },
  'en': {
    'settings.title': 'Settings',
    'settings.back': '← Back',
    'settings.ui': 'Interface',
    'settings.api': 'API Settings',
    'settings.image': 'Image Gen',
    'settings.preset': 'Presets',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.font': 'Font',
    'settings.uiFontSize': 'UI Font Size',
    'settings.uiFontSize.desc': 'Font size for UI elements',
    'settings.bodyFontSize': 'Body Font Size',
    'settings.bodyFontSize.desc': 'Font size for chat messages',
    'settings.lineHeight': 'Line Height',
    'settings.autoScroll': 'Auto Scroll',
    'settings.provider': 'Provider',
    'settings.baseUrl': 'Base URL',
    'settings.baseUrl.desc': 'API endpoint URL',
    'settings.apiKey': 'API Key',
    'settings.apiKey.desc': 'Secret key',
    'settings.model': 'Model',
    'settings.model.desc': 'Model name',
    'settings.test': 'Test Connection',
    'settings.testing': 'Testing...',
    'theme.backrooms': 'Backrooms',
    'theme.dark': 'Nocturne',
    'theme.light': 'Dawn',
    'font.yahei': 'YaHei',
    'font.source': 'Source Han',
    'common.small': 'S',
    'common.medium': 'M',
    'common.large': 'L',
    'common.compact': 'Compact',
    'common.comfortable': 'Comfortable',
    'common.loose': 'Loose',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
  },
};

// ─── CSS 变量应用 ───

function applySettings(settings: UISettings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.style.setProperty('--font-family', FONT_MAP[settings.font]);
  root.style.setProperty('--font-display', "'Noto Serif SC', 'Source Han Serif SC', 'STSong', serif");
  root.style.setProperty('--font-body', FONT_MAP[settings.font]);
  root.style.setProperty('--ui-font-size', UI_FONT_SIZE_MAP[settings.uiFontSize]);
  root.style.setProperty('--body-font-size', BODY_FONT_SIZE_MAP[settings.bodyFontSize]);
  root.style.setProperty('--body-line-height', LINE_HEIGHT_MAP[settings.lineHeight]);
  root.lang = settings.language;
}

// ─── 持久化读取 ───

function loadUISettings(): UISettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SETTINGS;
}

async function loadApiConfig(): Promise<ApiConfig | null> {
  try {
    const saved = localStorage.getItem(API_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as ApiConfig;
    if (!parsed || typeof parsed !== 'object') return null;
    const storedKey = parsed.apiKey ?? '';
    if (storedKey && !isSealed(storedKey)) {
      const sealed = await seal(storedKey);
      localStorage.setItem(API_STORAGE_KEY, JSON.stringify({ ...parsed, apiKey: sealed }));
    }
    return { ...parsed, apiKey: await unseal(storedKey) };
  } catch {
    return null;
  }
}

// ─── Store ───

interface ConfigState {
  settings: UISettings;
  apiConfig: ApiConfig | null;
  updateSettings: <K extends keyof UISettings>(key: K, value: UISettings[K]) => void;
  setApiConfig: (config: ApiConfig) => void;
  initApiConfig: () => void;
  t: (key: string) => string;
  initialize: () => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  settings: loadUISettings(),
  apiConfig: null,

  updateSettings: (key, value) => {
    set(state => {
      const newSettings = { ...state.settings, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      applySettings(newSettings);
      return { settings: newSettings };
    });
  },

  setApiConfig: async (config) => {
    const sealed: ApiConfig = { ...config, apiKey: await seal(config.apiKey) };
    localStorage.setItem(API_STORAGE_KEY, JSON.stringify(sealed));
    set({ apiConfig: config });
  },

  initApiConfig: () => {
    loadApiConfig()
      .then((cfg) => { if (cfg) set({ apiConfig: cfg }); })
      .catch((err) => console.warn('[configStore] 初始化 API 配置失败:', err));
  },

  t: (key) => {
    const { settings } = get();
    return translations[settings.language]?.[key] ?? key;
  },

  initialize: () => {
    const { settings } = get();
    applySettings(settings);
  },
}));

useConfigStore.getState().initApiConfig();
