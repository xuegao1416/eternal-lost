import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { fetchModels, testConnection } from '../../api/client';
import type { ApiConfig, ApiProvider } from '../../api/types';
import { useConfigStore } from '../../stores/configStore';
import { type ApiPreset, loadPresets } from './apiPresetUtils';
import { ProviderForm, ConnectionTest, PROVIDERS } from './apiSettings';
import type { ApiSettingsRef, ApiSettingsTabProps } from './apiSettings';
export type { ApiSettingsRef };

const DEFAULT_CONFIG: ApiConfig = {
  apiKey: '', baseUrl: '', model: '', provider: 'openai',
  temperature: 1.2, topP: 0.65, topK: 45, maxTokens: 60000,
  contextSize: 2000000, stream: true, reasoningEffort: '关闭',
};

const ApiSettingsTab = forwardRef<ApiSettingsRef, ApiSettingsTabProps>(
  (props = {}, ref) => {
    const { initialConfig, t: tProp, onSave, onBack } = props;
    const storeT = useConfigStore(s => s.t);
    const t = tProp || storeT;
    const [config, setConfig] = useState<ApiConfig>(initialConfig || DEFAULT_CONFIG);
    const [models, setModels] = useState<string[]>([]);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState('');
    const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
    const [loadingModels, setLoadingModels] = useState(false);
    const [presets, setPresets] = useState<ApiPreset[]>(loadPresets);

    useImperativeHandle(ref, () => ({ getValues: () => ({ config }) }));

    const set = useCallback(
      <K extends keyof ApiConfig>(key: K, val: ApiConfig[K]) =>
        setConfig(prev => ({ ...prev, [key]: val })),
      [],
    );

    const handleTest = useCallback(async () => {
      setTesting(true);
      setTestResult('');
      setTestSuccess(null);
      const result = await testConnection(config);
      setTestSuccess(result.success);
      setTestResult(result.message);
      setTesting(false);
    }, [config]);

    const handleFetchModels = useCallback(async () => {
      setLoadingModels(true);
      try {
        const list = await fetchModels(config);
        setModels(list);
        if (list.length > 0 && !config.model) set('model', list[0]);
      } catch (err: unknown) {
        setTestSuccess(false);
        setTestResult(`获取模型失败: ${err instanceof Error ? err.message : String(err)}`);
      }
      setLoadingModels(false);
    }, [config, set]);

    const handleLoadPreset = useCallback((presetConfig: ApiConfig) => {
      setConfig({ ...presetConfig });
    }, []);

    return (
      <div className="setting-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div className="setting-section__title" style={{ marginBottom: 0 }}>参数配置</div>
          <div className="setting-select-wrap" style={{ width: 'auto' }}>
            <select
              value={config.provider}
              onChange={e => set('provider', e.target.value as ApiProvider)}
              className="setting-select"
            >
              {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <span className="setting-select-arrow">▼</span>
          </div>
        </div>
        <ProviderForm
          config={config} set={set}
          models={models} setModels={setModels}
          loadingModels={loadingModels} onFetchModels={handleFetchModels}
          presets={presets} setPresets={setPresets}
          onLoadPreset={handleLoadPreset}
        />
        <ConnectionTest
          testing={testing} testResult={testResult} testSuccess={testSuccess}
          onTest={handleTest} t={t} onSave={onSave} onBack={onBack}
        />
      </div>
    );
  },
);

export default ApiSettingsTab;
