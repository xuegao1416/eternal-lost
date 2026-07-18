// ============================================================
//  笔记本面板 — 记录发现的规则和观察
// ============================================================
import { useGame } from '../../context/GameContext';
import { BookOpen, AlertTriangle, Eye, Compass, Shield } from 'lucide-react';

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  rule: Shield,
  observation: Eye,
  entity: AlertTriangle,
  location: Compass,
  survival: BookOpen,
};

const CATEGORY_LABELS: Record<string, string> = {
  rule: '规则',
  observation: '观察',
  entity: '实体',
  location: '地点',
  survival: '生存',
};

export default function Notebook() {
  const { state } = useGame();
  const { notebook, discoveredRules } = state.exploration;

  return (
    <div>
      {/* 已发现的规则 */}
      {discoveredRules.length > 0 && (
        <div className="panel-section">
          <div className="panel-section__title">
            <Shield size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            已发现的规则
          </div>
          {discoveredRules.map(rule => (
            <div key={rule.id} className="rule-card">
              <div>{rule.content}</div>
              <div className="rule-card__confidence">
                可信度: {rule.confidence === 'confirmed' ? '已确认' : rule.confidence === 'suspected' ? '疑似' : '传闻'}
                · 来源: {rule.source === 'observed' ? '观察' : rule.source === 'told' ? '告知' : rule.source === 'discovered' ? '发现' : '幸存'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 笔记本条目 */}
      <div className="panel-section">
        <div className="panel-section__title">
          <BookOpen size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          笔记
        </div>
        {notebook.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            还没有记录。你的探索将会被自动记录在这里。
          </p>
        ) : (
          notebook.map(entry => {
            const Icon = CATEGORY_ICONS[entry.category] || BookOpen;
            return (
              <div
                key={entry.id}
                className={`notebook-entry ${entry.importance === 'critical' ? 'notebook-entry--critical' : entry.importance === 'high' ? 'notebook-entry--high' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Icon size={12} />
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    {CATEGORY_LABELS[entry.category] || entry.category}
                  </span>
                </div>
                {entry.content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
