// ============================================================
//  UISettingsContext — 代理 configStore，保持兼容接口
// ============================================================
import { createContext, useContext, type ReactNode } from 'react';
import { useConfigStore, type FontSize, type LineHeight, type Language, type Theme, type FontFamily } from '../stores/configStore';

export type { FontSize, LineHeight, Language, Theme, FontFamily };

interface UISettingsContextValue {
  settings: {
    language: Language;
    theme: Theme;
    font: string;
    uiFontSize: FontSize;
    bodyFontSize: FontSize;
    lineHeight: LineHeight;
    autoScroll: boolean;
  };
  update: <K extends string>(key: K, value: unknown) => void;
  t: (key: string) => string;
}

const UISettingsContext = createContext<UISettingsContextValue | null>(null);

export function UISettingsProvider({ children }: { children: ReactNode }) {
  const store = useConfigStore();

  const value: UISettingsContextValue = {
    settings: {
      language: store.settings.language,
      theme: store.settings.theme,
      font: store.settings.font,
      uiFontSize: store.settings.uiFontSize,
      bodyFontSize: store.settings.bodyFontSize,
      lineHeight: store.settings.lineHeight,
      autoScroll: store.settings.autoScroll,
    },
    update: (key, value) => {
      store.updateSettings(key as keyof typeof store.settings, value as never);
    },
    t: store.t,
  };

  return (
    <UISettingsContext.Provider value={value}>
      {children}
    </UISettingsContext.Provider>
  );
}

export function useUISettings(): UISettingsContextValue {
  const ctx = useContext(UISettingsContext);
  if (!ctx) throw new Error('useUISettings must be used within UISettingsProvider');
  return ctx;
}
