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

const IMPORTANCE_CLASS_MAP: Record<string, string> = {
  critical: 'notebook-entry--danger',
  high: 'notebook-entry--warn',
  medium: 'notebook-entry--discovered',
  low: 'notebook-entry--undiscovered',
};

export default function Notebook() {
  const { state } = useGame();
  const { notebook, discoveredRules } = state.exploration;

  return (
    <div className="panel">
      {/* 已发现的规则 */}
      {discoveredRules.length > 0 && (
        <>
          <div className="panel__title">
            已发现的规则
          </div>
          {discoveredRules.map(rule => (
            <div key={rule.id} className="notebook-entry notebook-entry--discovered">
              <div>{rule.content}</div>
              <div className="notebook-entry__label">
                可信度: {rule.confidence === 'confirmed' ? '已确认' : rule.confidence === 'suspected' ? '疑似' : '传闻'}
                · 来源: {rule.source === 'observed' ? '观察' : rule.source === 'told' ? '告知' : rule.source === 'discovered' ? '发现' : '幸存'}
              </div>
            </div>
          ))}
        </>
      )}

      {/* 笔记本条目 */}
      <div className="panel__title">
        笔记
      </div>
      {notebook.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
          还没有记录。你的探索将会被自动记录在这里。
        </p>
      ) : (
        notebook.map(entry => {
          const Icon = CATEGORY_ICONS[entry.category] || BookOpen;
          const importanceClass = IMPORTANCE_CLASS_MAP[entry.importance] || 'notebook-entry--discovered';
          return (
            <div
              key={entry.id}
              className={`notebook-entry ${importanceClass}`}
            >
              <div className="notebook-entry__label">
                <Icon size={12} />
                {' '}{CATEGORY_LABELS[entry.category] || entry.category}
              </div>
              {entry.content}
            </div>
          );
        })
      )}
    </div>
  );
}
