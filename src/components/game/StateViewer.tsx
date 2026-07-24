// ============================================================
//  状态检视器 — 探索状态的 SCP 档案式可视化面板
//  以机密档案的风格展示 ExplorationState 全部字段
// ============================================================
import { useState, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getLevelById } from '../../data/levels';
import {
  ChevronDown, ChevronRight,
  Map, Clock, Brain, Shield, Backpack,
  BookOpen, User, Skull, LogOut, Globe,
  AlertTriangle, Eye, Compass,
} from 'lucide-react';

// ── 常量映射 ──────────────────────────────

const CONFIDENCE_LABEL: Record<string, string> = {
  confirmed: '已确认',
  suspected: '疑似',
  rumor: '传闻',
};

const SOURCE_LABEL: Record<string, string> = {
  observed: '观察',
  told: '告知',
  discovered: '发现',
  survived: '幸存',
};

const CONFIDENCE_STYLE: Record<string, { color: string; bg: string }> = {
  confirmed: { color: 'var(--success)', bg: 'var(--success-bg)' },
  suspected: { color: 'var(--warn)', bg: 'var(--warn-bg)' },
  rumor:     { color: 'var(--stamp-red)', bg: 'var(--stamp-red-bg)' },
};

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

const IMPORTANCE_STYLE: Record<string, { color: string; border: string }> = {
  critical: { color: 'var(--stamp-red)', border: 'var(--stamp-red)' },
  high:     { color: 'var(--warn)', border: 'var(--stain-warm)' },
  medium:   { color: 'var(--ink)', border: 'var(--border)' },
  low:      { color: 'var(--ink-muted)', border: 'var(--ink-muted)' },
};

// ── 子组件：可折叠区块 ─────────────────────

interface SectionProps {
  title: string;
  icon: typeof Map;
  count?: number;
  defaultOpen?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon: Icon, count, defaultOpen = false, danger = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid var(--border-light)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          width: '100%',
          padding: 'var(--space-3) var(--space-4)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: danger ? 'var(--stamp-red)' : 'var(--ink)',
          textAlign: 'left',
          letterSpacing: '0.02em',
          transition: 'background var(--motion-fast)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-warm)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Icon size={14} style={{ color: danger ? 'var(--stamp-red)' : 'var(--ink-faded)', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{title}</span>
        {count !== undefined && (
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--ink-muted)',
            fontWeight: 400,
          }}>
            [{count}]
          </span>
        )}
      </button>
      {open && (
        <div style={{ padding: '0 var(--space-4) var(--space-4) var(--space-8)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── 子组件：数据行 ─────────────────────────

function DataRow({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: 'var(--space-1) 0',
      fontFamily: mono ? 'var(--font-mono)' : undefined,
      fontSize: 'var(--text-sm)',
    }}>
      <span style={{ color: 'var(--ink-faded)' }}>{label}</span>
      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ── 印章装饰 ───────────────────────────────

function Stamp({ text, color = 'var(--stamp-red)', rotate = -6 }: { text: string; color?: string; rotate?: number }) {
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      fontWeight: 700,
      color,
      border: `2px solid ${color}`,
      borderRadius: 'var(--radius-sm)',
      padding: '1px 6px',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      transform: `rotate(${rotate}deg)`,
      opacity: 0.7,
      lineHeight: 1.4,
      userSelect: 'none',
    }}>
      {text}
    </span>
  );
}

// ── 主组件 ─────────────────────────────────

export default function StateViewer() {
  const exploration = useGameStore(s => s.exploration);
  const currentLevel = useGameStore(s => s.currentLevel);

  const levelName = currentLevel?.name ?? getLevelById(exploration.currentLevelId)?.name ?? '???';
  const levelDifficulty = currentLevel?.survivalDifficulty ?? getLevelById(exploration.currentLevelId)?.survivalDifficulty;

  const formatTime = useCallback((t: number) => {
    if (t < 60) return `${t} 轮`;
    const h = Math.floor(t / 60);
    const m = t % 60;
    return `${h}时${m}轮`;
  }, []);

  const hasProfile = exploration.characterProfile !== null;
  const hasDeath = exploration.deathCount > 0;

  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      color: 'var(--ink)',
    }}>
      {/* ── 档案头部 ── */}
      <div style={{
        padding: 'var(--space-4)',
        borderBottom: '2px solid var(--ink)',
        background: 'var(--paper-warm)',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-2)',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--ink-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            探索状态档案
          </span>
          <Stamp text="CLASSIFIED" />
        </div>

        {/* 层级标识 */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-1)',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--stamp-red)',
            fontWeight: 700,
          }}>
            #{exploration.currentLevelId}
          </span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--ink)',
          }}>
            {levelName}
          </span>
        </div>

        {levelDifficulty && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: levelDifficulty.includes('4') || levelDifficulty.includes('致命')
              ? 'var(--stamp-red)' : 'var(--ink-faded)',
          }}>
            {levelDifficulty}
          </span>
        )}

        {/* 右下角机密印章 */}
        <div style={{
          position: 'absolute',
          bottom: 'var(--space-2)',
          right: 'var(--space-3)',
          opacity: 0.15,
        }}>
          <Stamp text="CONFIDENTIAL" rotate={-12} />
        </div>
      </div>

      {/* ── 存活概况 ── */}
      <CollapsibleSection title="存活概况" icon={Clock} defaultOpen count={undefined}>
        <DataRow label="存活时间" value={formatTime(exploration.survivalTime)} />
        <DataRow label="当前情绪" value={exploration.currentMood} />
        <DataRow label="已访问层级" value={`${exploration.visitedLevels.length} 个`} />
        {hasDeath && (
          <DataRow label="死亡次数" value={
            <span style={{ color: 'var(--stamp-red)', fontWeight: 700 }}>
              {exploration.deathCount}
            </span>
          } />
        )}
        {exploration.escapeAttempts > 0 && (
          <DataRow label="逃脱尝试" value={exploration.escapeAttempts} />
        )}
      </CollapsibleSection>

      {/* ── 已发现规则 ── */}
      <CollapsibleSection
        title="已发现规则"
        icon={Shield}
        count={exploration.discoveredRules.length}
        defaultOpen={exploration.discoveredRules.length > 0}
      >
        {exploration.discoveredRules.length === 0 ? (
          <EmptyHint text="尚未发现任何规则。探索以获取情报。" />
        ) : (
          exploration.discoveredRules.map(rule => {
            const cs = CONFIDENCE_STYLE[rule.confidence] ?? CONFIDENCE_STYLE.suspected;
            return (
              <div key={rule.id} style={{
                padding: 'var(--space-2) var(--space-3)',
                background: cs.bg,
                borderLeft: `3px solid ${cs.color}`,
                marginBottom: 'var(--space-2)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
              }}>
                <div style={{ color: 'var(--ink)', lineHeight: 1.5 }}>
                  {rule.content}
                </div>
                <div style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  marginTop: 'var(--space-1)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--ink-faded)',
                }}>
                  <span>来源: {SOURCE_LABEL[rule.source] ?? rule.source}</span>
                  <span style={{ color: cs.color, fontWeight: 600 }}>
                    {CONFIDENCE_LABEL[rule.confidence] ?? rule.confidence}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CollapsibleSection>

      {/* ── 背包 ── */}
      <CollapsibleSection title="背包" icon={Backpack} count={exploration.inventory.length}>
        {exploration.inventory.length === 0 ? (
          <EmptyHint text="背包为空。在探索中搜寻物资。" />
        ) : (
          exploration.inventory.map(item => (
            <div key={item.id} style={{
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--paper-warm)',
              borderLeft: '3px solid var(--border)',
              marginBottom: 'var(--space-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.name}</span>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--ink-faded)',
                }}>
                  x{item.quantity}
                </span>
              </div>
              <div style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--ink-muted)',
                marginTop: 'var(--space-1)',
              }}>
                {item.description}
              </div>
              <div style={{
                display: 'flex',
                gap: 'var(--space-3)',
                marginTop: 'var(--space-1)',
                fontSize: 'var(--text-xs)',
                color: 'var(--ink-faded)',
              }}>
                <span>发现于: {item.foundAt}</span>
                {item.usable && <span style={{ color: 'var(--success)' }}>[可使用]</span>}
              </div>
            </div>
          ))
        )}
      </CollapsibleSection>

      {/* ── 笔记本 ── */}
      <CollapsibleSection title="笔记本" icon={BookOpen} count={exploration.notebook.length}>
        {exploration.notebook.length === 0 ? (
          <EmptyHint text="笔记本为空。探索记录将自动归档。" />
        ) : (
          exploration.notebook.map(entry => {
            const Icon = CATEGORY_ICONS[entry.category] || BookOpen;
            const imp = IMPORTANCE_STYLE[entry.importance] ?? IMPORTANCE_STYLE.medium;
            return (
              <div key={entry.id} style={{
                padding: 'var(--space-2) var(--space-3)',
                background: 'var(--paper-warm)',
                borderLeft: `3px solid ${imp.border}`,
                marginBottom: 'var(--space-2)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  fontSize: 'var(--text-xs)',
                  color: imp.color,
                  marginBottom: 'var(--space-1)',
                }}>
                  <Icon size={11} />
                  <span>{CATEGORY_LABELS[entry.category] ?? entry.category}</span>
                  {entry.importance === 'critical' && (
                    <Stamp text="URGENT" rotate={0} />
                  )}
                </div>
                <div style={{ color: 'var(--ink)', lineHeight: 1.5 }}>
                  {entry.content}
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--ink-muted)',
                  marginTop: 'var(--space-1)',
                }}>
                  层级: {entry.levelId} | {new Date(entry.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
      </CollapsibleSection>

      {/* ── 降临者档案 ── */}
      <CollapsibleSection title="降临者档案" icon={User} defaultOpen={hasProfile}>
        {!hasProfile ? (
          <EmptyHint text="无降临者档案记录。" />
        ) : (
          (() => {
            const p = exploration.characterProfile!;
            return (
              <>
                <DataRow label="姓名" value={p.name} />
                <DataRow label="性别" value={p.gender} />
                <DataRow label="背景" value={p.background} mono={false} />
                <DataRow label="外貌" value={p.appearance} mono={false} />
                <DataRow label="随身物品" value={p.items} mono={false} />
                <DataRow label="性格" value={p.personality} mono={false} />
              </>
            );
          })()
        )}
      </CollapsibleSection>

      {/* ── 已访问层级 ── */}
      <CollapsibleSection title="已访问层级" icon={Globe} count={exploration.visitedLevels.length}>
        {exploration.visitedLevels.length === 0 ? (
          <EmptyHint text="无访问记录。" />
        ) : (
          exploration.visitedLevels.map((lid, idx) => {
            const lvl = getLevelById(lid);
            const isCurrent = lid === exploration.currentLevelId;
            return (
              <div key={lid} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-1) var(--space-2)',
                background: isCurrent ? 'var(--stamp-red-bg)' : 'transparent',
                borderLeft: isCurrent ? '3px solid var(--stamp-red)' : '3px solid transparent',
                marginBottom: 'var(--space-1)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
              }}>
                <span style={{
                  color: isCurrent ? 'var(--stamp-red)' : 'var(--ink-muted)',
                  fontWeight: isCurrent ? 700 : 400,
                  minWidth: '2em',
                  fontSize: 'var(--text-xs)',
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span style={{
                  color: isCurrent ? 'var(--stamp-red)' : 'var(--ink)',
                  fontWeight: isCurrent ? 600 : 400,
                  flex: 1,
                }}>
                  {lvl?.name ?? lid}
                </span>
                {isCurrent && (
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--stamp-red)',
                    fontWeight: 600,
                  }}>
                    [当前]
                  </span>
                )}
                {lvl?.survivalDifficulty && (
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--ink-muted)',
                  }}>
                    {lvl.survivalDifficulty}
                  </span>
                )}
              </div>
            );
          })
        )}
      </CollapsibleSection>

      {/* ── 档案底部 ── */}
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--ink-muted)',
          letterSpacing: '0.05em',
        }}>
          档案更新: {new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </span>
        <Stamp text="VERIFIED" color="var(--success)" rotate={-3} />
      </div>
    </div>
  );
}

// ── 空状态提示 ─────────────────────────────

function EmptyHint({ text }: { text: string }) {
  return (
    <p style={{
      color: 'var(--ink-muted)',
      fontSize: 'var(--text-xs)',
      fontFamily: 'var(--font-mono)',
      fontStyle: 'italic',
      padding: 'var(--space-1) 0',
    }}>
      {text}
    </p>
  );
}
