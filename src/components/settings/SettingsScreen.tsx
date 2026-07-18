// ============================================================
//  设置页面 — 通用 / API / 预设
// ============================================================
import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Cpu, Sliders, FileText } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useConfigStore } from '../../stores/configStore';
import GeneralSettingsTab from './GeneralSettingsTab';
import ApiSettingsTab from './ApiSettingsTab';
import PresetSettingsTab from './PresetSettingsTab';
import type { ApiSettingsRef } from './apiSettings';

type SettingsTab = 'general' | 'api' | 'preset';

const TABS: { id: SettingsTab; icon: typeof Sliders; label: string }[] = [
  { id: 'general', icon: Sliders, label: '通用' },
  { id: 'api', icon: Cpu, label: 'API' },
  { id: 'preset', icon: FileText, label: '预设' },
];

export default function SettingsScreen() {
  const { actions } = useGame();
  const { t } = useConfigStore();
  const apiConfig = useConfigStore(s => s.apiConfig);
  const setApiConfig = useConfigStore(s => s.setApiConfig);
  const [tab, setTab] = useState<SettingsTab>('general');

  const apiRef = useRef<ApiSettingsRef>(null);

  const handleSave = useCallback(() => {
    if (tab === 'api') {
      const apiValues = apiRef.current?.getValues();
      if (apiValues) setApiConfig(apiValues.config);
    }
    actions.setScreen('menu');
  }, [actions, setApiConfig, tab]);

  const handleBack = useCallback(() => {
    actions.setScreen('menu');
  }, [actions]);

  return (
    <div style={{
      height: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* 顶栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
      }}>
        <button className="btn-ghost" onClick={handleBack} style={{ minHeight: 40, padding: '4px 8px' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, flex: 1 }}>
          {t('settings.title')}
        </h1>
        <button className="btn-primary btn-sm" onClick={handleSave} style={{ minHeight: 36, padding: '6px 20px' }}>
          {t('common.save')}
        </button>
      </div>

      {/* Tab 切换 */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
      }}>
        {TABS.map(tabItem => {
          const Icon = tabItem.icon;
          return (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 20,
                border: '1px solid ' + (tab === tabItem.id ? 'var(--accent)' : 'var(--border)'),
                background: tab === tabItem.id ? 'var(--accent-dim)' : 'transparent',
                color: tab === tabItem.id ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 'var(--font-size-sm)',
                transition: 'all 150ms',
              }}
            >
              <Icon size={14} />
              {tabItem.label}
            </button>
          );
        })}
      </div>

      {/* 内容 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {tab === 'general' && <GeneralSettingsTab />}
        {tab === 'api' && (
          <ApiSettingsTab
            ref={apiRef}
            initialConfig={apiConfig}
            t={t}
            onSave={handleSave}
            onBack={handleBack}
          />
        )}
        {tab === 'preset' && <PresetSettingsTab />}
      </div>
    </div>
  );
}
