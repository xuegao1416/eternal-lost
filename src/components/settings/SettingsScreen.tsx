import { useState, useRef, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useConfigStore } from '../../stores/configStore';
import GeneralSettingsTab from './GeneralSettingsTab';
import ApiSettingsTab from './ApiSettingsTab';
import PresetSettingsTab from './PresetSettingsTab';
import ImageGenSettingsTab from './ImageGenSettingsTab';
import type { ApiSettingsRef } from './apiSettings';

const TABS = [
  { id: 'general', label: '通用' },
  { id: 'api', label: 'API' },
  { id: 'preset', label: '预设' },
  { id: 'imagegen', label: '文生图' },
];

export default function SettingsScreen() {
  const { actions } = useGame();
  const setApiConfig = useConfigStore(s => s.setApiConfig);
  const apiRef = useRef<ApiSettingsRef>(null);
  const [tab, setTab] = useState('general');

  const handleBack = useCallback(() => {
    actions.setScreen('menu');
  }, [actions]);

  const handleSaveApi = useCallback(() => {
    const values = apiRef.current?.getValues();
    if (values) setApiConfig(values.config);
    actions.setScreen('menu');
  }, [actions, setApiConfig]);

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button className="btn-ghost btn-icon" onClick={handleBack}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="settings-header__title">设置</h1>
      </div>

      <div className="settings-body">
        <div className="settings-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={'settings-tab' + (tab === t.id ? ' settings-tab--active' : '')}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {tab === 'general' && <GeneralSettingsTab />}
          {tab === 'api' && (
            <ApiSettingsTab
              ref={apiRef}
              initialConfig={null}
              onSave={handleSaveApi}
              onBack={handleBack}
            />
          )}
          {tab === 'preset' && <PresetSettingsTab />}
          {tab === 'imagegen' && <ImageGenSettingsTab />}
        </div>
      </div>
    </div>
  );
}