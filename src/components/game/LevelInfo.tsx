// ============================================================
//  层级信息栏 — 显示当前层级和存活时间
// ============================================================
import { useGame } from '../../context/GameContext';
import { Clock, Skull, Backpack } from 'lucide-react';

export default function LevelInfo() {
  const { state } = useGame();
  const level = state.currentLevel;
  const inventoryCount = state.exploration.inventory.length;

  return (
    <div className="game-info-bar">
      <span className="game-info-bar__id">#{level?.id ?? '???'}</span>
      <span className="game-info-bar__name">{level?.name ?? '未知位置'}</span>
      {level?.survivalDifficulty && (
        <>
          <span className="game-info-bar__separator">|</span>
          <span className="text-faded" style={{ fontSize: 'var(--text-xs)' }}>
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
          <span className="text-faded" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
            <Backpack size={12} />
            {inventoryCount}
          </span>
        </>
      )}
      {state.exploration.deathCount > 0 && (
        <>
          <span className="game-info-bar__separator">|</span>
          <span className="text-stamp" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Skull size={12} />
            {state.exploration.deathCount}
          </span>
        </>
      )}
      <span className="game-info-bar__separator">|</span>
      <span className="text-faded" style={{ fontSize: 'var(--text-xs)' }}>
        情绪: {state.exploration.currentMood}
      </span>
    </div>
  );
}
