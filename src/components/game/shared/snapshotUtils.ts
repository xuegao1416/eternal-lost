/**
 * 快照相关共享类型与工具函数
 *
 * 用于消息回滚恢复 — 每条消息携带 ExplorationState 快照
 */

import type { ExplorationState } from '../../../data/level-schema';

// ── 快照层 ──

export interface SnapshotLayer {
  id: string;
  msgIndex: number;
  snapshot: ExplorationState;
  snapshotTime: number;
  isInitial: boolean;
  content?: string; // AI 消息摘要
}

// ── 工具函数 ──

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function getSnapshotPreview(snapshot: ExplorationState): string {
  try {
    const parts: string[] = [];
    if (snapshot.currentLevelId) parts.push(snapshot.currentLevelId);
    if (snapshot.survivalTime !== undefined) parts.push(`${snapshot.survivalTime}轮`);
    if (snapshot.inventory.length > 0) parts.push(`${snapshot.inventory.length}物`);
    if (snapshot.discoveredRules.length > 0) parts.push(`${snapshot.discoveredRules.length}则`);
    if (snapshot.currentMood) parts.push(snapshot.currentMood);
    return parts.join(' · ') || '';
  } catch { return ''; }
}
