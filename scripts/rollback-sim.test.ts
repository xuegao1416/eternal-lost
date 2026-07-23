// 模拟测试：回滚行为验证
// 验证：回滚到某轮次时，物品/规则/层级/轮数是否全部回滚

import { useGameStore } from '../src/stores/gameStore';

function snapshot() {
  const s = useGameStore.getState();
  return {
    round: s.round,
    survivalTime: s.exploration.survivalTime,
    level: s.exploration.currentLevelId,
    inventory: s.exploration.inventory.length,
    rules: s.exploration.discoveredRules.length,
    msgCount: s.messages.length,
  };
}

function log(label: string, s: any) {
  console.log(`${label}: 轮=${s.round} 存活=${s.survivalTime} 层级=${s.level} 物品=${s.inventory} 规则=${s.rules} 消息数=${s.msgCount}`);
}

let pass = 0;
let fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ ${msg}`); }
}

async function main() {
  const store = useGameStore.getState();

  console.log('\n=== 模拟：第1层开始 ===');
  store.startNewGame();
  log('初始', snapshot());

  // 第1轮：用户发消息 + AI 回复（模拟获得了物品 + 规则 + 层级切换）
  // 模拟 user 消息
  const s1 = useGameStore.getState();
  store.addMessage({ role: 'user', content: '我向前走', snapshot: s1.exploration, round: s1.round });
  // 模拟 AI 回复（含游戏动作）
  const aiSnapshot1 = useGameStore.getState().exploration;
  const aiRound1 = useGameStore.getState().round;
  store.addMessage({ id: 'a1', role: 'assistant', content: '你捡到了一个苹果', snapshot: aiSnapshot1, round: aiRound1 });
  store.addInventoryItem({ id: 'i1', name: '苹果', description: '红苹果', quantity: 1, usable: true, foundAt: 'level-0' });
  store.addDiscoveredRule({ id: 'r1', content: '不要直视黑暗', source: 'observed', confidence: 'confirmed' });
  store.incrementSurvivalTime();
  store.incrementRound();
  log('第1轮后', snapshot());

  // 第2轮：获得另一个物品
  const s2 = useGameStore.getState();
  store.addMessage({ role: 'user', content: '我继续探索', snapshot: s2.exploration, round: s2.round });
  const aiSnapshot2 = useGameStore.getState().exploration;
  const aiRound2 = useGameStore.getState().round;
  store.addMessage({ id: 'a2', role: 'assistant', content: '你找到了钥匙', snapshot: aiSnapshot2, round: aiRound2 });
  store.addInventoryItem({ id: 'i2', name: '钥匙', description: '生锈的钥匙', quantity: 1, usable: true, foundAt: 'level-0' });
  store.incrementSurvivalTime();
  store.incrementRound();
  log('第2轮后', snapshot());

  // 第3轮：层级切换到 level-1 + 获得物品
  const s3 = useGameStore.getState();
  store.addMessage({ role: 'user', content: '我走向出口', snapshot: s3.exploration, round: s3.round });
  const aiSnapshot3 = useGameStore.getState().exploration;
  const aiRound3 = useGameStore.getState().round;
  store.addMessage({ id: 'a3', role: 'assistant', content: '你进入了管道迷宫', snapshot: aiSnapshot3, round: aiRound3 });
  store.setCurrentLevel('level-1');
  store.addInventoryItem({ id: 'i3', name: '扳手', description: '旧扳手', quantity: 1, usable: true, foundAt: 'level-1' });
  store.incrementSurvivalTime();
  store.incrementRound();
  log('第3轮后(已到Level1)', snapshot());

  console.log('\n=== 测试1：回滚到第1轮的 user 消息（重新发送场景）===');
  // 找第1轮的 user 消息
  const firstUser = useGameStore.getState().messages.find(m => m.role === 'user' && m.content === '我向前走')!;
  // 模拟 handleResend 逻辑：先回滚状态，再删消息
  store.rollbackToMessageSnapshot(firstUser.id);
  store.deleteMessagesFrom(firstUser.id);
  log('回滚到「我向前走」后', snapshot());
  assert(useGameStore.getState().round === 0, '轮数回到 0（重发后 AI 回复会变成第1轮）');
  assert(useGameStore.getState().exploration.currentLevelId === 'level-0', '层级回到 level-0');
  assert(useGameStore.getState().exploration.inventory.length === 0, '物品全部回滚（0个）');
  assert(useGameStore.getState().exploration.discoveredRules.length === 0, '规则全部回滚（0条）');
  assert(useGameStore.getState().messages.length === 1, '仅保留开局系统消息（等待用户重新发送）');

  console.log('\n=== 测试2：恢复到第3轮再回滚到 assistant 消息（从此处重新开始）===');
  // 重新模拟到第3轮
  const r1 = useGameStore.getState();
  store.addMessage({ role: 'user', content: '我向前走', snapshot: r1.exploration, round: r1.round });
  const ra1 = useGameStore.getState().exploration;
  const rr1 = useGameStore.getState().round;
  store.addMessage({ id: 'a1', role: 'assistant', content: '你捡到了一个苹果', snapshot: ra1, round: rr1 });
  store.addInventoryItem({ id: 'i1', name: '苹果', description: '红苹果', quantity: 1, usable: true, foundAt: 'level-0' });
  store.incrementSurvivalTime();
  store.incrementRound();

  const r2 = useGameStore.getState();
  store.addMessage({ role: 'user', content: '我继续探索', snapshot: r2.exploration, round: r2.round });
  const ra2 = useGameStore.getState().exploration;
  const rr2 = useGameStore.getState().round;
  store.addMessage({ id: 'a2', role: 'assistant', content: '你找到了钥匙', snapshot: ra2, round: rr2 });
  store.addInventoryItem({ id: 'i2', name: '钥匙', description: '生锈的钥匙', quantity: 1, usable: true, foundAt: 'level-0' });
  store.incrementSurvivalTime();
  store.incrementRound();

  const r3 = useGameStore.getState();
  store.addMessage({ role: 'user', content: '我走向出口', snapshot: r3.exploration, round: r3.round });
  const ra3 = useGameStore.getState().exploration;
  const rr3 = useGameStore.getState().round;
  store.addMessage({ id: 'a3', role: 'assistant', content: '你进入了管道迷宫', snapshot: ra3, round: rr3 });
  store.setCurrentLevel('level-1');
  store.addInventoryItem({ id: 'i3', name: '扳手', description: '旧扳手', quantity: 1, usable: true, foundAt: 'level-1' });
  store.incrementSurvivalTime();
  store.incrementRound();
  log('重跑到第3轮', snapshot());

  // 回滚到 a1（第1轮的 assistant 消息）
  store.restoreFromMessage('a1');
  log('回滚到「你捡到了一个苹果」后', snapshot());
  assert(useGameStore.getState().round === 0, '轮数回到 0');
  assert(useGameStore.getState().exploration.currentLevelId === 'level-0', '层级回到 level-0');
  assert(useGameStore.getState().exploration.inventory.length === 0, '物品回滚（苹果是这条回复产生的，回滚后消失）');
  assert(useGameStore.getState().messages.find(m => m.id === 'a1') === undefined, 'a1 及之后消息被删除');

  console.log(`\n=== 结果：${pass} 通过, ${fail} 失败 ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
