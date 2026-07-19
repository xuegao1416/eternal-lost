// ============================================================
//  世界书索引 — 注册所有 Level 世界书
// ============================================================

import { registerLevelBooks } from '../../worldbook/levelWorldBook';
import { LEVEL_0_WORLD_BOOK } from './level-0';

// ─── 注册所有 Level 世界书 ───

const ALL_LEVEL_BOOKS = [
  LEVEL_0_WORLD_BOOK,
  // TODO: 后续添加更多 Level
  // LEVEL_1_WORLD_BOOK,
  // LEVEL_2_WORLD_BOOK,
  // ...
];

/** 初始化世界书系统 */
export function initWorldBookSystem(): void {
  registerLevelBooks(ALL_LEVEL_BOOKS);
  console.log(`[WorldBook] 已注册 ${ALL_LEVEL_BOOKS.length} 个 Level 世界书`);
}

/** 获取所有已注册的 Level ID */
export function getAvailableLevelIds(): string[] {
  return ALL_LEVEL_BOOKS.map(b => b.levelId);
}
