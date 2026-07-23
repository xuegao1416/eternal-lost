import { useMemo, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../../../stores/gameStore';
import { parseContent } from '../../../../utils/markdown';
import { processRegexScripts } from '../../../../utils/regexScripts';
import { getBuiltinDisplayScripts, getBuiltinPreset } from '../../../../data/builtinPresets';
import { usePresetStore, applyOverrides } from '../../../../stores/presetStore';
import type { PresetPack } from '../../../../data/builtinPresets';
import type { RegexScript } from '../../../../utils/regexScripts';

export type RenderedContent =
  | { type: 'html'; content: string }
  | { type: 'iframe'; content: string }
  | null;

/**
 * 渲染管线 Hook：正则脚本处理 + Markdown 解析，返回最终可渲染内容。
 */
export function useRenderedContent(
  message: ChatMessage,
  isUser: boolean,
  isStreaming: boolean,
): { renderedContent: RenderedContent; iframeRef: React.RefObject<HTMLIFrameElement | null> } {
  const builtinDisplay = useMemo(() => getBuiltinDisplayScripts(), []);

  const activePresetId = usePresetStore((s: { activePresetId: string | null }) => s.activePresetId);
  const userPresets = usePresetStore((s: { userPresets: PresetPack[] }) => s.userPresets);
  const builtinOverrides = usePresetStore((s: { builtinOverrides: Record<string, Record<string, boolean>> }) => s.builtinOverrides);

  const activePreset = useMemo(() => {
    if (activePresetId) {
      const found = userPresets.find((p: PresetPack) => p.id === activePresetId);
      if (found) return found;
      const builtin = getBuiltinPreset(activePresetId);
      return applyOverrides(builtin, builtinOverrides);
    }
    return applyOverrides(getBuiltinPreset('default'), builtinOverrides);
  }, [activePresetId, userPresets, builtinOverrides]);

  const presetDisplayScripts = (activePreset?.regexScripts || []).filter(
    (s: RegexScript) => (s.markdownOnly || (!s.markdownOnly && !s.promptOnly)) && !s.disabled,
  );

  const displayScripts = useMemo(
    () => [...builtinDisplay, ...presetDisplayScripts],
    [builtinDisplay, presetDisplayScripts],
  );

  const renderedContent = useMemo(() => {
    if (isUser) return null;
    const raw = message.content || '';
    if (!raw) return { type: 'html' as const, content: '' };
    const cleaned = processRegexScripts(raw, displayScripts);
    if (!cleaned.trim()) return { type: 'html' as const, content: '' };
    return parseContent(cleaned, { isStreaming });
  }, [isUser, message.content, isStreaming, displayScripts]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (renderedContent?.type !== 'iframe') return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'iframe-resize' && iframeRef.current) {
        iframeRef.current.style.height = `${e.data.height}px`;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [renderedContent?.type]);

  return { renderedContent, iframeRef };
}

/**
 * 获取 displayScripts，供外部使用。
 */
export function useDisplayScripts() {
  const builtinDisplay = useMemo(() => getBuiltinDisplayScripts(), []);
  const activePresetId = usePresetStore((s: { activePresetId: string | null }) => s.activePresetId);
  const userPresets = usePresetStore((s: { userPresets: PresetPack[] }) => s.userPresets);
  const builtinOverrides = usePresetStore((s: { builtinOverrides: Record<string, Record<string, boolean>> }) => s.builtinOverrides);

  const activePreset = useMemo(() => {
    if (activePresetId) {
      const found = userPresets.find((p: PresetPack) => p.id === activePresetId);
      if (found) return found;
      const builtin = getBuiltinPreset(activePresetId);
      return applyOverrides(builtin, builtinOverrides);
    }
    return applyOverrides(getBuiltinPreset('default'), builtinOverrides);
  }, [activePresetId, userPresets, builtinOverrides]);

  const presetDisplayScripts = (activePreset?.regexScripts || []).filter(
    (s: RegexScript) => (s.markdownOnly || (!s.markdownOnly && !s.promptOnly)) && !s.disabled,
  );

  return useMemo(() => [...builtinDisplay, ...presetDisplayScripts], [builtinDisplay, presetDisplayScripts]);
}
