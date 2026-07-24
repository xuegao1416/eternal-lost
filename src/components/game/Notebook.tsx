// ============================================================
//  笔记本面板 — 记录发现的规则和观察
// ============================================================
import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { BookOpen, AlertTriangle, Eye, Compass, Shield, Filter } from 'lucide-react';

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

const ALL_CATEGORIES = ['全部', 'rule', 'observation', 'entity', 'location', 'survival'] as const;

export default function Notebook() {
  const { state } = useGame();
  const { notebook, discoveredRules } = state.exploration;
  const [filter, setFilter] = useState<string>('全部');

  // 过滤笔记本条目
  const filteredEntries = filter === '全部'
    ? notebook
    : notebook.filter(e => e.category === filter);

  // 统计各类型数量
  const categoryCounts: Record<string, number> = {};
  for (const entry of notebook) {
    categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
  }

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
      <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span>笔记</span>
        <Filter size={10} style={{ color: 'var(--ink-muted)' }} />
      </div>

      {/* 过滤标签 */}
      {notebook.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 'var(--space-1)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-3)',
        }}>
          {ALL_CATEGORIES.map(cat => {
            const isActive = filter === cat;
            const count = cat === '全部' ? notebook.length : (categoryCounts[cat] || 0);
            if (cat !== '全部' && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '1px 6px',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--ink)' : 'var(--paper-warm)',
                  color: isActive ? 'var(--paper-light)' : 'var(--ink-faded)',
                  border: `1px solid ${isActive ? 'var(--ink)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all var(--motion-fast)',
                }}
              >
                {cat === '全部' ? '全部' : CATEGORY_LABELS[cat]}{count > 0 ? ` ${count}` : ''}
              </button>
            );
          })}
        </div>
      )}

      {filteredEntries.length === 0 ? (
        <p style={{
          color: 'var(--ink-muted)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-mono)',
          fontStyle: 'italic',
        }}>
          {notebook.length === 0
            ? '还没有记录。你的探索将会被自动记录在这里。'
            : '该分类下暂无记录。'}
        </p>
      ) : (
        filteredEntries.map(entry => {
          const Icon = CATEGORY_ICONS[entry.category] || BookOpen;
          const importanceClass = IMPORTANCE_CLASS_MAP[entry.importance] || 'notebook-entry--discovered';
          return (
            <div
              key={entry.id}
              className={`notebook-entry ${importanceClass}`}
            >
              <div className="notebook-entry__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <Icon size={12} />
                <span>{CATEGORY_LABELS[entry.category] || entry.category}</span>
              </div>
              <div style={{ marginTop: 'var(--space-1)' }}>{entry.content}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
