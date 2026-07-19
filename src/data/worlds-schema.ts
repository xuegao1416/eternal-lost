// ============================================================
//  世界书条目定义类型（兼容酒馆格式）
// ============================================================

/** 世界书条目定义（SillyTavern 兼容格式） */
export interface WorldBookEntryDef {
  uid?: string;
  comment: string;
  content: string;
  constant: boolean;
  disable?: boolean;
  key?: string[];
  keysecondary?: string[];
  exclude_key?: string[];
  position?: 'before_char' | 'after_char' | 'atDepth';
  order?: number;
  depth?: number;
  probability?: number;
  useProbability?: boolean;
  excludeRecursion?: boolean;
  preventRecursion?: boolean;
  group?: string;
  useGroupScoring?: boolean;
  groupWeight?: number;
  selectiveLogic?: number;
  scanDepth?: number;
  caseSensitive?: boolean;
  matchWholeWords?: boolean;
  entryType?: string;
  meta?: Record<string, unknown>;
}
