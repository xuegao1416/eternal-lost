// ============================================================
//  层级信息栏 — 显示当前层级和存活时间
// ============================================================
import { useGame } from '../../context/GameContext';
import { Clock, Skull, Backpack } from 'lucide-react';

interface Props {
  /** 紧凑模式（移动端顶部栏内嵌） */
  compact?: boolean;
}

export default function LevelInfo({ compact = false }: Props) {
  const { state } = useGame();
  const level = state.currentLevel;
  const inventoryCount = state.exploration.inventory.length;

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--ink-faded)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ color: 'var(--stamp-red)', fontWeight: 600 }}>
          #{level?.id ?? '???'}
        </span>
        <span style={{ color: 'var(--ink)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {level?.name ?? '未知位置'}
        </span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          <Clock size={10} />
          {state.exploration.survivalTime}轮
        </span>
        {state.exploration.deathCount > 0 && (
          <>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--stamp-red)' }}>
              <Skull size={10} />
              {state.exploration.deathCount}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="game-info-bar">
      <span className="game-info-bar__id">#{level?.id ?? '???'}</span>
      <span className="game-info-bar__name">{level?.name ?? '未知位置'}</span>
      {level?.survivalDifficulty && (
        <>
          <span className="game-info-bar__separator">|</span>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: level.survivalDifficulty.includes('致命') || level.survivalDifficulty.includes('5')
              ? 'var(--stamp-red)'
              : 'var(--ink-faded)',
          }}>
            {level.survivalDifficulty}
          </span>
        </>
      )}
      <span className="game-info-bar__separator">|</span>
      <span className="game-info-bar__stability">
        <Clock size={12} />
        {state.exploration.survivalTime} 轮
      </span>
      {inventoryCount > 0 && (
        <>
          <span className="game-info-bar__separator">|</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            fontSize: 'var(--text-xs)',
            color: 'var(--ink-faded)',
          }}>
            <Backpack size={12} />
            {inventoryCount}
          </span>
        </>
      )}
      {state.exploration.deathCount > 0 && (
        <>
          <span className="game-info-bar__separator">|</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            color: 'var(--stamp-red)',
          }}>
            <Skull size={12} />
            {state.exploration.deathCount}
          </span>
        </>
      )}
      <span className="game-info-bar__separator">|</span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faded)' }}>
        情绪: {state.exploration.currentMood}
      </span>
    </div>
  );
}
