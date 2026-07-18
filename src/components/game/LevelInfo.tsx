// ============================================================
//  层级信息栏 — 显示当前层级和存活时间
// ============================================================
import { useGame } from '../../context/GameContext';
import { Clock, Skull } from 'lucide-react';

export default function LevelInfo() {
  const { state } = useGame();
  const level = state.currentLevel;

  return (
    <div className="level-info-bar">
      <span className="level-info-bar__level-name fluorescent-tube">
        {level?.name ?? '未知位置'}
      </span>
      {level?.survivalDifficulty && (
        <>
          <span className="level-info-bar__separator">|</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
            {level.survivalDifficulty}
          </span>
        </>
      )}
      <span className="level-info-bar__separator">|</span>
      <span className="level-info-bar__time" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Clock size={12} />
        {state.exploration.survivalTime} 轮
      </span>
      {state.exploration.deathCount > 0 && (
        <>
          <span className="level-info-bar__separator">|</span>
          <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Skull size={12} />
            {state.exploration.deathCount}
          </span>
        </>
      )}
      <span style={{ flex: 1 }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
        情绪: {state.exploration.currentMood}
      </span>
    </div>
  );
}
