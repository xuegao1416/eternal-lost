import { Target } from 'lucide-react';

export function ProxyInput({
  proxyUrl,
  onProxyUrlChange,
  onApply,
}: {
  proxyUrl: string;
  onProxyUrlChange: (url: string) => void;
  onApply: () => void;
}) {
  return (
    <div
      style={{
        marginTop: '24px',
        padding: '20px',
        background: 'var(--paper-light)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
      }}
    >
      <div style={{ fontWeight: '600', fontSize: 'var(--text-md)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Target size={16} />
        已经部署好了？直接填入代理地址
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={proxyUrl}
          onChange={e => onProxyUrlChange(e.target.value)}
          placeholder="https://你的worker名字.workers.dev"
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--paper-warm)',
            color: 'var(--ink)',
            fontSize: 'var(--text-sm)',
            outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--stamp-red)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        />
        <button
          onClick={onApply}
          disabled={!proxyUrl.trim()}
          style={{
            padding: '10px 20px',
            background: proxyUrl.trim() ? 'var(--stamp-red)' : 'var(--paper-warm)',
            color: proxyUrl.trim() ? 'var(--paper-light)' : 'var(--ink-muted)',
            border: 'none',
            borderRadius: '4px',
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            cursor: proxyUrl.trim() ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          应用
        </button>
      </div>
    </div>
  );
}
