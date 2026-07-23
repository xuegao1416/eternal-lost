// ============================================================
//  开场向导 — SCP 档案风（角色创建流程）
// ============================================================
import { useState, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameStore } from '../../stores/gameStore';
import { useSaveStore } from '../../stores/saveStore';
import type { CharacterProfile } from '../../data/level-schema';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';

const STEPS = ['身份档案', '随身物品', '性格评估'];

const BACKGROUNDS = [
  { label: '请选择...', value: '' },
  { label: '上班族', value: '一个普通的上班族，每天朝九晚五' },
  { label: '学生', value: '一个还在读书的学生' },
  { label: '医生/护士', value: '医护人员，习惯了消毒水的气味' },
  { label: '建筑工人', value: '建筑工人，对墙壁和结构有本能的敏感' },
  { label: '程序员', value: '程序员，习惯了熬夜和盯着屏幕' },
  { label: '外卖员', value: '外卖员，对路线和方向很敏感' },
  { label: '教师', value: '教师，习惯观察和记录' },
  { label: '自由职业', value: '自由职业者，时间很灵活但常常独处' },
  { label: '退休人员', value: '退休了，经历过很多事，不太容易慌' },
  { label: '无业', value: '暂时没有工作，时间多得发慌' },
];

const QUESTIONS = [
  {
    q: '黑暗中传来脚步声，你的第一反应是？',
    options: [
      { label: '靠近观察', value: '面对未知会选择靠近观察' },
      { label: '屏住呼吸不动', value: '遇到危险时本能是屏住呼吸静观其变' },
      { label: '转身就跑', value: '面对危险第一反应是跑' },
    ],
  },
  {
    q: '你发现一扇上锁的门，旁边有根铁棍，你会？',
    options: [
      { label: '砸开它', value: '遇到障碍倾向于直接解决' },
      { label: '找别的路', value: '遇到障碍倾向于绕开' },
      { label: '在门口等着看情况', value: '遇到不确定的情况倾向于等待和观察' },
    ],
  },
  {
    q: '你找到一瓶没有标签的液体，你会？',
    options: [
      { label: '尝一口试试', value: '对未知事物好奇心强，愿意冒险尝试' },
      { label: '带着但不喝', value: '谨慎但不浪费，会收集可能有用的东西' },
      { label: '不碰', value: '对未知事物非常谨慎，宁可错过也不冒险' },
    ],
  },
];

export default function OpeningWizard() {
  const { actions } = useGame();
  const [step, setStep] = useState(0);

  // Step 1
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [background, setBackground] = useState('');

  // Step 2
  const [appearance, setAppearance] = useState('');
  const [items, setItems] = useState('');

  // Step 3
  const [answers, setAnswers] = useState<string[]>(['', '', '']);

  const setAnswer = useCallback((qi: number, value: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[qi] = value;
      return next;
    });
  }, []);

  const canNext = step === 0
    ? name.trim() && gender && background
    : step === 1
    ? appearance.trim() && items.trim()
    : answers.every(a => a);

  const handleFinish = useCallback(async () => {
    const profile: CharacterProfile = {
      name: name.trim(),
      gender,
      background,
      appearance: appearance.trim(),
      items: items.trim(),
      personality: answers.join('；'),
    };

    // 进入游戏 + 创建初始存档（走 Omni 的 createNewGame + performSave）
    const saveStore = useSaveStore.getState();
    const saveName = `${name.trim()}的旅程`;
    await saveStore.createNewGame(saveName);
    actions.startNewGame(profile);
    const gs = useGameStore.getState();
    await saveStore.performSave({
      id: saveStore.currentSaveId!,
      name: saveName,
      timestamp: Date.now(),
      messages: gs.messages,
      exploration: gs.exploration,
      currentLevelId: gs.exploration.currentLevelId,
      characterProfile: profile,
    });
  }, [name, gender, background, appearance, items, answers, actions]);

  const progressChars = STEPS.map((_, i) => i <= step ? '█' : '░').join('');

  return (
    <div className="wizard-screen">
      <div className="wizard-container">
        <p className="wizard-step-indicator">
          {STEPS[step]} · 第 {step + 1}/{STEPS.length} 步
        </p>

        <p className="wizard-progress">
          <span className="wizard-progress__done">{progressChars.slice(0, step + 1)}</span>
          <span className="wizard-progress__pending">{progressChars.slice(step + 1)}</span>
        </p>

        <div className="wizard-card">
          {step === 0 && (
            <>
              <h2 className="wizard-card__title">身份档案</h2>
              <p className="wizard-card__subtitle">—— 在进入这里之前，你是谁？</p>

              <div className="wizard-input-wrap">
                <input
                  className="input-field"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="输入你的名字..."
                  autoFocus
                />
                <span className="cursor-blink" />
              </div>

              <div className="wizard-radio-group">
                {['男', '女', '其他'].map(g => (
                  <label key={g} className={`wizard-radio ${gender === g ? 'wizard-radio--selected' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      className="wizard-radio__input"
                    />
                    <span className="wizard-radio__marker">
                      {gender === g ? '(○)' : '( )'}
                    </span>
                    {g}
                  </label>
                ))}
              </div>

              <div className="setting-field">
                <label className="setting-field__label">职业背景</label>
                <div className="setting-select-wrap">
                  <select
                    className="setting-select"
                    value={background}
                    onChange={e => setBackground(e.target.value)}
                  >
                    {BACKGROUNDS.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                  <span className="setting-select-arrow">▼</span>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="wizard-card__title">随身物品</h2>
              <p className="wizard-card__subtitle">—— 你穿着什么？口袋里有什么？</p>

              <div className="setting-field">
                <label className="setting-field__label">穿着</label>
                <textarea
                  className="textarea-field"
                  value={appearance}
                  onChange={e => setAppearance(e.target.value)}
                  placeholder="比如：一件灰色卫衣，牛仔裤，一双旧运动鞋..."
                  rows={3}
                />
              </div>

              <div className="setting-field">
                <label className="setting-field__label">携带物品</label>
                <textarea
                  className="textarea-field"
                  value={items}
                  onChange={e => setItems(e.target.value)}
                  placeholder="比如：手机（电量 23%）、半包口香糖、一把钥匙..."
                  rows={3}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="wizard-card__title">性格评估</h2>
              <p className="wizard-card__subtitle">—— 看看你的本能反应</p>

              <div className="wizard-radio-group">
                {QUESTIONS.map((q, qi) => (
                  <div key={qi} style={{ marginBottom: 'var(--space-5)' }}>
                    <p className="setting-field__label">{q.q}</p>
                    {q.options.map(opt => (
                      <label
                        key={opt.value}
                        className={`wizard-radio ${answers[qi] === opt.value ? 'wizard-radio--selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`q${qi}`}
                          value={opt.value}
                          checked={answers[qi] === opt.value}
                          onChange={() => setAnswer(qi, opt.value)}
                          className="wizard-radio__input"
                        />
                        <span className="wizard-radio__marker">
                          {answers[qi] === opt.value ? '(○)' : '( )'}
                        </span>
                        {opt.label}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="wizard-actions">
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={14} /> 上一步
            </button>
          ) : (
            <div />
          )}
          {step < 2 ? (
            <button
              className="btn btn-primary"
              disabled={!canNext}
              onClick={() => setStep(s => s + 1)}
            >
              下一步 <ChevronRight size={14} />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!canNext}
              onClick={handleFinish}
            >
              <FileText size={14} /> 开始探索
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
