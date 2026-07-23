import { CheckCircle, XCircle } from 'lucide-react';

interface Props {
  testing: boolean;
  testResult: string;
  testSuccess: boolean | null;
  onTest: () => void;
  t: (key: string) => string;
  onSave?: () => void;
  onBack?: () => void;
}

export default function ConnectionTest({ testing, testResult, testSuccess, onTest, t, onSave, onBack }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button
        onClick={onTest}
        disabled={testing}
        style={{
          padding: '8px 18px', fontSize: 'var(--text-md)', fontWeight: '500',
          border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
          background: 'var(--paper-light)', color: 'var(--ink)',
        }}
      >
        {testing ? t('settings.testing') : '测试连接'}
      </button>
      {testResult && (
        <span style={{ fontSize: 'var(--text-base)', flex: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {testSuccess === true && <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0 }} />}
          {testSuccess === false && <XCircle size={14} color="var(--stamp-red)" style={{ flexShrink: 0 }} />}
          {testResult}
        </span>
      )}
      <div style={{ flex: 1 }} />
      {onBack && (
        <button
          onClick={onBack}
          style={{
            padding: '8px 20px', fontSize: 'var(--text-md)', fontWeight: '500',
            border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
            background: 'var(--paper-light)', color: 'var(--ink)',
          }}
        >
          返回
        </button>
      )}
      {onSave && (
        <button
          onClick={onSave}
          style={{
            padding: '8px 28px', fontSize: 'var(--text-md)', fontWeight: '600',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            background: 'var(--stamp-red)', color: 'var(--paper-light)',
          }}
        >
          保存配置
        </button>
      )}
    </div>
  );
}
