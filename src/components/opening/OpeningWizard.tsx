// ============================================================
//  开场向导 — SCP 档案风（角色创建流程）
//  4 步：身份档案 → 随身物品 → 性格评估 → 档案确认
// ============================================================
import { useState, useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameStore } from '../../stores/gameStore';
import { useSaveStore } from '../../stores/saveStore';
import type { CharacterProfile } from '../../data/level-schema';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  Briefcase,
  Brain,
  ClipboardCheck,
  Lock,
  AlertTriangle,
} from 'lucide-react';

// ─── 步骤定义 ───
const STEPS = [
  { label: '身份档案', icon: FileText, section: 'SECTION-A' },
  { label: '随身物品', icon: Briefcase, section: 'SECTION-B' },
  { label: '性格评估', icon: Brain, section: 'SECTION-C' },
  { label: '档案确认', icon: ClipboardCheck, section: 'FINAL' },
];

// ─── 职业 + 对应起始物品 ───
const OCCUPATIONS = [
  { label: '请选择职业...', value: '', items: '' },
  {
    label: '上班族',
    value: '上班族',
    desc: '朝九晚五，习惯了格子间和荧光灯',
    items: '工牌（照片已模糊）、一支廉价圆珠笔、半包纸巾',
  },
  {
    label: '学生',
    value: '学生',
    desc: '还在读书，对世界充满好奇',
    items: '一本写满笔记的教材、一支荧光笔、耳机（左耳不响）',
  },
  {
    label: '医护人员',
    value: '医护人员',
    desc: '习惯了消毒水的气味和深夜的急诊',
    items: '一支笔灯、一副乳胶手套、手机（有3条未读消息）',
  },
  {
    label: '建筑工人',
    value: '建筑工人',
    desc: '对墙壁和结构有本能的敏感',
    items: '一把卷尺、一包皱巴巴的烟、打火机（快没气了）',
  },
  {
    label: '程序员',
    value: '程序员',
    desc: '习惯了熬夜和盯着屏幕',
    items: '一台旧笔记本电脑（电量12%）、能量饮料空罐、U盘',
  },
  {
    label: '外卖员',
    value: '外卖员',
    desc: '对路线和方向很敏感',
    items: '一部导航手机（无信号）、一件反光背心、一瓶矿泉水',
  },
  {
    label: '教师',
    value: '教师',
    desc: '习惯观察和记录',
    items: '一个红笔批改过的作业本、老花镜、一串钥匙（不知道开什么）',
  },
  {
    label: '自由职业',
    value: '自由职业者',
    desc: '时间灵活但常常独处',
    items: '一本空白速写本、一盒彩色铅笔、一块吃了一半的巧克力',
  },
  {
    label: '退休人员',
    value: '退休人员',
    desc: '经历过很多事，不太容易慌',
    items: '一张泛黄的全家福、一瓶速效救心丸、一把折叠伞',
  },
  {
    label: '无业',
    value: '无业',
    desc: '暂时没有工作，时间多得发慌',
    items: '一部电量满格但没信号的手机、一把指甲刀、打火机',
  },
];

// ─── 可选额外物品（Step 2 玩家自选 2~3 件） ───
const BONUS_ITEMS = [
  { id: 'lighter', name: '打火机', desc: '能制造光亮，也能点燃什么' },
  { id: 'rope', name: '一截绳子', desc: '约两米长，还算结实' },
  { id: 'tape', name: '一卷胶带', desc: '用途广泛，还剩大半卷' },
  { id: 'mirror', name: '一面小镜子', desc: '碎了一个角，能反射光线' },
  { id: 'knife', name: '一把折叠刀', desc: '不太锋利，但总比没有强' },
  { id: 'compass', name: '一个指南针', desc: '指针一直在转，但也许有用' },
  { id: 'whistle', name: '一只哨子', desc: '能发出尖锐的声音' },
  { id: 'notebook', name: '一本小笔记本', desc: '空白的，可以记录什么' },
  { id: 'candy', name: '几颗糖果', desc: '甜食能让人镇定下来' },
  { id: 'bandage', name: '几片创可贴', desc: '聊胜于无的急救物资' },
];

// ─── 性格评估问题（5 题） ───
const QUESTIONS = [
  {
    q: '黑暗中传来脚步声。不是你的。你的第一反应是——',
    options: [
      { label: '屏住呼吸，一动不动', value: '遇到威胁时本能是屏息静止，等待危险过去' },
      { label: '寻找最近的藏身处', value: '面对危险第一反应是隐藏而非逃跑' },
      { label: '朝声音的反方向跑', value: '面对未知威胁的本能是立刻远离' },
      { label: '捡起手边能用的东西', value: '面对威胁时会本能地武装自己' },
    ],
  },
  {
    q: '你发现一扇上锁的门。门缝里透出微弱的光。旁边有一根铁棍。你会——',
    options: [
      { label: '用铁棍砸开它', value: '遇到障碍倾向于直接暴力解决' },
      { label: '趴在门缝上听', value: '遇到障碍时先收集信息再行动' },
      { label: '继续找别的路', value: '遇到障碍倾向于绕开而非对抗' },
      { label: '在门口等着', value: '面对不确定时倾向于被动等待' },
    ],
  },
  {
    q: '你找到一瓶没有标签的液体。闻起来不像水。瓶身上刻着一个你不认识的符号。你会——',
    options: [
      { label: '尝一小口', value: '对未知事物好奇心极强，愿意冒险尝试' },
      { label: '装进包里但不喝', value: '谨慎但不浪费，会收集可能有用的东西' },
      { label: '倒掉，装别的液体', value: '务实主义者，容器比内容物更有价值' },
      { label: '不碰，原路返回', value: '对未知事物极度谨慎，宁可错过也不冒险' },
    ],
  },
  {
    q: '你听到远处有人在喊救命。声音很微弱，像是从墙壁另一边传来的。你会——',
    options: [
      { label: '朝着声音走去', value: '听到求救声会选择回应，哪怕有危险' },
      { label: '大声回应，但不移动', value: '愿意帮助但不会贸然行动' },
      { label: '假装没听到', value: '在危险环境中优先保证自身安全' },
      { label: '记下方位，继续走', value: '冷静理性，会评估形势后再决定' },
    ],
  },
  {
    q: '你已经走了很久。腿很疼。面前是一条无尽的走廊，身后是你来时的路。荧光灯在头顶嗡嗡作响。你——',
    options: [
      { label: '继续往前走', value: '面对困境选择坚持前进，不走回头路' },
      { label: '原路返回', value: '面对未知的前路时倾向于退回已知' },
      { label: '坐下来休息', value: '在压力下能保持冷静，懂得保存体力' },
      { label: '用力敲打墙壁', value: '面对绝望时会尝试任何可能的方法' },
    ],
  },
];

// ─── 样式工具 ───
const s = {
  // 全屏容器
  screen: {
    position: 'fixed' as const,
    inset: 0,
    background: 'var(--liminal-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    fontFamily: 'var(--font-mono)',
    color: 'var(--liminal-ink)',
    overflow: 'hidden',
  },

  // 档案纸主体
  paper: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: 680,
    maxHeight: '92vh',
    overflowY: 'auto' as const,
    background: 'var(--paper)',
    border: '1px solid var(--border)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    padding: '2rem 2.5rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--ink)',
    lineHeight: 1.7,
  },

  // 页眉
  header: {
    textAlign: 'center' as const,
    borderBottom: '2px solid var(--ink)',
    paddingBottom: '1rem',
    marginBottom: '1.5rem',
  },
  headerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: 'var(--ink)',
    margin: 0,
  },
  headerSub: {
    fontSize: 'var(--text-xs)',
    color: 'var(--ink-faded)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    marginTop: '0.25rem',
  },

  // 档案编号
  fileNumber: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 'var(--text-xs)',
    color: 'var(--ink-muted)',
    borderBottom: '1px dashed var(--border)',
    paddingBottom: '0.5rem',
    marginBottom: '1.25rem',
    fontFamily: 'var(--font-mono)',
  },

  // 进度条
  progress: {
    display: 'flex',
    gap: '6px',
    marginBottom: '1.5rem',
  },
  progressDot: (active: boolean, done: boolean): CSSProperties => ({
    flex: 1,
    height: 3,
    background: done ? 'var(--stamp-red)' : active ? 'var(--ink)' : 'var(--border)',
    transition: 'background 0.3s',
  }),

  // 步骤标题
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.25rem',
  },
  stepTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--ink)',
    margin: 0,
  },
  stepSection: {
    fontSize: 'var(--text-xs)',
    color: 'var(--stamp-red)',
    letterSpacing: '0.15em',
    marginBottom: '1rem',
  },
  stepSubtitle: {
    fontSize: 'var(--text-sm)',
    color: 'var(--ink-faded)',
    fontStyle: 'italic',
    marginBottom: '1.25rem',
    borderBottom: '1px solid var(--border-light)',
    paddingBottom: '0.75rem',
  },

  // 表单字段
  fieldGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-xs)',
    color: 'var(--ink-muted)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.25rem',
    fontFamily: 'var(--font-mono)',
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--ink-muted)',
    padding: '0.4rem 0',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-mono)',
    color: 'var(--ink)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    background: 'var(--paper-light)',
    border: '1px solid var(--border)',
    padding: '0.4rem 0.5rem',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-mono)',
    color: 'var(--ink)',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    borderRadius: 0,
  },
  textarea: {
    width: '100%',
    background: 'transparent',
    border: '1px solid var(--border-light)',
    padding: '0.5rem',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-mono)',
    color: 'var(--ink)',
    outline: 'none',
    resize: 'vertical' as const,
    lineHeight: 1.6,
    boxSizing: 'border-box' as const,
    minHeight: 60,
  },

  // 单选组
  radioRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  radioOption: (selected: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.3rem 0.65rem',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    border: `1px solid ${selected ? 'var(--ink)' : 'var(--border)'}`,
    background: selected ? 'var(--paper-warm)' : 'transparent',
    color: selected ? 'var(--ink)' : 'var(--ink-faded)',
    transition: 'all 0.15s',
  }),

  // 问题块
  questionBlock: {
    marginBottom: '1.25rem',
    paddingBottom: '1rem',
    borderBottom: '1px dashed var(--border-light)',
  },
  questionText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--ink)',
    marginBottom: '0.5rem',
    lineHeight: 1.6,
  },
  questionNum: {
    color: 'var(--stamp-red)',
    fontWeight: 700,
    marginRight: '0.35rem',
  },

  // 额外物品网格
  bonusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  bonusItem: (selected: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '0.5rem 0.65rem',
    border: `1px solid ${selected ? 'var(--ink)' : 'var(--border-light)'}`,
    background: selected ? 'var(--paper-warm)' : 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-mono)',
  }),
  bonusName: {
    fontWeight: 700,
    color: 'var(--ink)',
    fontSize: 'var(--text-sm)',
  },
  bonusDesc: {
    color: 'var(--ink-muted)',
    fontSize: 'var(--text-xs)',
    marginTop: 2,
  },

  // 底部按钮栏
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border)',
  },
  btn: (variant: 'primary' | 'ghost' | 'danger'): CSSProperties => {
    const base: CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.45rem 1rem',
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-mono)',
      cursor: 'pointer',
      transition: 'all 0.15s',
      letterSpacing: '0.05em',
    };
    if (variant === 'primary')
      return {
        ...base,
        background: 'var(--ink)',
        color: 'var(--paper)',
        border: '1px solid var(--ink)',
      };
    if (variant === 'danger')
      return {
        ...base,
        background: 'var(--stamp-red)',
        color: 'var(--paper)',
        border: '1px solid var(--stamp-red)',
      };
    return {
      ...base,
      background: 'transparent',
      color: 'var(--ink-faded)',
      border: '1px solid var(--border)',
    };
  },

  // 密级标记
  classified: {
    position: 'absolute' as const,
    top: 12,
    right: 16,
    fontSize: 'var(--text-xs)',
    color: 'var(--stamp-red)',
    border: '1px solid var(--stamp-red)',
    padding: '1px 6px',
    letterSpacing: '0.15em',
    fontWeight: 700,
    transform: 'rotate(3deg)',
    opacity: 0.7,
  },

  // 确认页摘要行
  summaryRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.35rem',
    fontSize: 'var(--text-sm)',
    lineHeight: 1.6,
  },
  summaryLabel: {
    color: 'var(--ink-muted)',
    flexShrink: 0,
    minWidth: 80,
  },
  summaryValue: {
    color: 'var(--ink)',
  },

  // 打字机光标
  cursor: {
    display: 'inline-block',
    width: '0.55em',
    height: '1.1em',
    background: 'var(--ink)',
    marginLeft: 2,
    verticalAlign: 'text-bottom',
    animation: 'blink 0.8s step-end infinite',
  },
};

// ─── 打字机组件 ───
function TypewriterText({ text, speed = 35, onDone }: {
  text: string;
  speed?: number;
  onDone?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const done = idx >= text.length;

  useEffect(() => {
    if (done) { onDone?.(); return; }
    const t = setTimeout(() => setIdx(i => i + 1), speed);
    return () => clearTimeout(t);
  }, [idx, speed, done, onDone]);

  return (
    <span>
      {text.slice(0, idx)}
      {!done && <span style={s.cursor} />}
    </span>
  );
}

// ─── 档案编号生成 ───
function generateFileNumber(): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `BR-${y}${m}${d}-${hex}`;
}

// ─── 性别选项 ───
const GENDERS = ['男', '女', '其他'];
const AGE_RANGES = ['18-25', '26-35', '36-45', '46-55', '56+'];

// ============================================================
//  主组件
// ============================================================
export default function OpeningWizard() {
  const { actions } = useGame();

  // ── 全局状态 ──
  const [phase, setPhase] = useState<'intro' | 'form'>('intro');
  const [introDone, setIntroDone] = useState(false);
  const [step, setStep] = useState(0);
  const fileNumber = useMemo(() => generateFileNumber(), []);

  // ── Step 1: 身份档案 ──
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [appearance, setAppearance] = useState('');

  // ── Step 2: 随身物品 ──
  const [bonusItems, setBonusItems] = useState<string[]>([]);

  // ── Step 3: 性格评估 ──
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', '']);

  const setAnswer = useCallback((qi: number, value: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[qi] = value;
      return next;
    });
  }, []);

  // ── 职业选中后的起始物品 ──
  const occupationData = OCCUPATIONS.find(o => o.value === occupation);
  const startingItems = occupationData?.items ?? '';

  // ── 合并物品清单 ──
  const allItems = useMemo(() => {
    const parts: string[] = [];
    if (startingItems) parts.push(startingItems);
    const bonus = bonusItems.map(id => BONUS_ITEMS.find(b => b.id === id)?.name).filter(Boolean);
    if (bonus.length) parts.push(bonus.join('、'));
    return parts.join('；');
  }, [startingItems, bonusItems]);

  // ── 校验 ──
  const canNext = step === 0
    ? name.trim() && gender && age && occupation
    : step === 1
    ? true // 起始物品自动填充，额外物品可选
    : step === 2
    ? answers.every(a => a)
    : true;

  // ── 完成 ──
  const handleFinish = useCallback(async () => {
    const profile: CharacterProfile = {
      name: name.trim(),
      gender,
      age,
      occupation,
      background: occupationData?.desc ?? occupation,
      appearance: appearance.trim() || `一个${age}岁的${occupation}，${gender}性`,
      items: allItems,
      personality: answers.join('；'),
      fileNumber,
    };

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
  }, [name, gender, age, occupation, occupationData, appearance, allItems, answers, fileNumber, actions]);

  // ── 打字机介绍文本 ──
  const introText = `你醒了过来。

荧光灯在头顶嗡嗡作响，发出令人不安的白光。空气闻起来像旧地毯和潮湿的混凝土。你不记得自己是怎么到这里的。

面前有一张桌子。桌上放着一份表格和一支笔。

表格顶部印着几个褪色的红字：

[ 临 降 者 档 案 登 记 表 ]

请填写以下内容。`;

  // ── 进入表单 ──
  const handleIntroComplete = useCallback(() => {
    setIntroDone(true);
  }, []);

  // ── 按钮 hover 效果 ──
  const btnHover = (e: React.MouseEvent<HTMLButtonElement>, variant: 'primary' | 'ghost' | 'danger') => {
    if (variant === 'primary') {
      e.currentTarget.style.background = 'var(--ink-faded)';
    } else if (variant === 'danger') {
      e.currentTarget.style.background = 'var(--stamp-red-light)';
    } else {
      e.currentTarget.style.background = 'var(--paper-warm)';
    }
  };
  const btnLeave = (e: React.MouseEvent<HTMLButtonElement>, variant: 'primary' | 'ghost' | 'danger') => {
    if (variant === 'primary') {
      e.currentTarget.style.background = 'var(--ink)';
    } else if (variant === 'danger') {
      e.currentTarget.style.background = 'var(--stamp-red)';
    } else {
      e.currentTarget.style.background = 'transparent';
    }
  };

  // ══════════════════════════════════════════════
  //  渲染：打字机介绍
  // ══════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <div style={s.screen}>
        <style>{`
          @keyframes blink { 50% { opacity: 0; } }
        `}</style>
        <div style={{
          ...s.paper,
          maxWidth: 560,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}>
          <div style={{
            fontSize: 'var(--text-sm)',
            lineHeight: 2,
            color: 'var(--ink)',
            whiteSpace: 'pre-wrap',
            textAlign: 'left',
            width: '100%',
          }}>
            <TypewriterText
              text={introText}
              speed={40}
              onDone={handleIntroComplete}
            />
          </div>

          {introDone && (
            <button
              style={{
                ...s.btn('primary'),
                marginTop: '2rem',
                animation: 'fadeIn 0.5s ease',
              }}
              onClick={() => setPhase('form')}
              onMouseEnter={e => btnHover(e, 'primary')}
              onMouseLeave={e => btnLeave(e, 'primary')}
            >
              <FileText size={14} /> 开始填写
            </button>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  //  渲染：表单主体
  // ══════════════════════════════════════════════
  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;

  return (
    <div style={s.screen}>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ow-input:focus { border-bottom-color: var(--ink) !important; }
        .ow-select:focus { border-color: var(--ink) !important; }
        .ow-textarea:focus { border-color: var(--ink) !important; }
      `}</style>

      <div style={s.paper}>
        {/* 密级标记 */}
        <div style={s.classified}>
          <Lock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
          机密
        </div>

        {/* 页眉 */}
        <div style={s.header}>
          <h1 style={s.headerTitle}>降 临 者 档 案</h1>
          <p style={s.headerSub}>THE BACKROOMS &mdash; SUBJECT REGISTRATION FORM</p>
        </div>

        {/* 档案编号 */}
        <div style={s.fileNumber}>
          <span>档案编号: {fileNumber}</span>
          <span>登记日期: {new Date().toLocaleDateString('zh-CN')}</span>
        </div>

        {/* 进度条 */}
        <div style={s.progress}>
          {STEPS.map((_, i) => (
            <div key={i} style={s.progressDot(i === step, i < step)} />
          ))}
        </div>

        {/* 步骤标题 */}
        <div style={s.stepHeader}>
          <StepIcon size={16} color="var(--stamp-red)" />
          <h2 style={s.stepTitle}>{currentStep.label}</h2>
        </div>
        <p style={s.stepSection}>{currentStep.section}</p>

        {/* ── Step 0: 身份档案 ── */}
        {step === 0 && (
          <>
            <p style={s.stepSubtitle}>在进入这里之前，你是谁？</p>

            <div style={s.fieldGroup}>
              <label style={s.label}>姓名 *</label>
              <input
                className="ow-input"
                style={s.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="在此处签名..."
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ ...s.fieldGroup, flex: 1 }}>
                <label style={s.label}>性别 *</label>
                <div style={s.radioRow}>
                  {GENDERS.map(g => (
                    <label
                      key={g}
                      style={s.radioOption(gender === g)}
                      onClick={() => setGender(g)}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {gender === g ? '(○)' : '( )'}
                      </span>
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ ...s.fieldGroup, flex: 1 }}>
                <label style={s.label}>年龄段 *</label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="ow-select"
                    style={s.select}
                    value={age}
                    onChange={e => setAge(e.target.value)}
                  >
                    <option value="">请选择...</option>
                    {AGE_RANGES.map(a => (
                      <option key={a} value={a}>{a} 岁</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>职业 *</label>
              <select
                className="ow-select"
                style={s.select}
                value={occupation}
                onChange={e => setOccupation(e.target.value)}
              >
                {OCCUPATIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {occupationData?.desc && (
                <p style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--ink-muted)',
                  fontStyle: 'italic',
                  marginTop: '0.25rem',
                }}>
                  {occupationData.desc}
                </p>
              )}
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>外貌描述（选填）</label>
              <textarea
                className="ow-textarea"
                style={s.textarea}
                value={appearance}
                onChange={e => setAppearance(e.target.value)}
                placeholder="身高、体型、显著特征...留空将自动生成"
                rows={2}
              />
            </div>
          </>
        )}

        {/* ── Step 1: 随身物品 ── */}
        {step === 1 && (
          <>
            <p style={s.stepSubtitle}>你穿着什么？口袋里有什么？</p>

            {/* 起始物品（由职业决定） */}
            <div style={s.fieldGroup}>
              <label style={s.label}>
                <Shield size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                起始物品（根据职业自动获得）
              </label>
              <div style={{
                padding: '0.65rem 0.75rem',
                background: 'var(--paper-warm)',
                border: '1px solid var(--border)',
                fontSize: 'var(--text-sm)',
                color: 'var(--ink)',
                lineHeight: 1.7,
              }}>
                {startingItems || '（请先在上一步选择职业）'}
              </div>
            </div>

            {/* 额外物品选择 */}
            <div style={s.fieldGroup}>
              <label style={s.label}>
                <AlertTriangle size={10} style={{ marginRight: 4, verticalAlign: 'middle', color: 'var(--stamp-red)' }} />
                选择额外物品（2~3 件）
              </label>
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--ink-muted)',
                marginBottom: '0.5rem',
              }}>
                你翻了翻口袋和周围，还找到这些东西。选 {bonusItems.length}/3 件。
              </p>
              <div style={s.bonusGrid}>
                {BONUS_ITEMS.map(item => {
                  const selected = bonusItems.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      style={s.bonusItem(selected)}
                      onClick={() => {
                        setBonusItems(prev => {
                          if (prev.includes(item.id)) return prev.filter(id => id !== item.id);
                          if (prev.length >= 3) return prev;
                          return [...prev, item.id];
                        });
                      }}
                    >
                      <span style={s.bonusName}>
                        {selected ? '[x] ' : '[ ] '}{item.name}
                      </span>
                      <span style={s.bonusDesc}>{item.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: 性格评估 ── */}
        {step === 2 && (
          <>
            <p style={s.stepSubtitle}>以下问题没有正确答案。选择你最本能的反应。</p>

            {QUESTIONS.map((q, qi) => (
              <div key={qi} style={s.questionBlock}>
                <p style={s.questionText}>
                  <span style={s.questionNum}>Q{qi + 1}.</span>
                  {q.q}
                </p>
                <div style={s.radioRow}>
                  {q.options.map(opt => (
                    <label
                      key={opt.value}
                      style={{
                        ...s.radioOption(answers[qi] === opt.value),
                        flex: '1 1 calc(50% - 0.5rem)',
                        minWidth: 0,
                      }}
                      onClick={() => setAnswer(qi, opt.value)}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        {answers[qi] === opt.value ? '(○)' : '( )'}
                      </span>
                      <span style={{ fontSize: 'var(--text-xs)' }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── Step 3: 档案确认 ── */}
        {step === 3 && (
          <>
            <p style={s.stepSubtitle}>请确认以下信息。提交后将无法修改。</p>

            <div style={{
              border: '1px solid var(--border)',
              padding: '1rem 1.25rem',
              background: 'var(--paper-light)',
              marginBottom: '1rem',
            }}>
              <div style={{
                textAlign: 'center',
                borderBottom: '1px dashed var(--border)',
                paddingBottom: '0.5rem',
                marginBottom: '0.75rem',
              }}>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--stamp-red)',
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                }}>
                  降 临 者 档 案 摘 要
                </span>
              </div>

              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>档案编号:</span>
                <span style={{ ...s.summaryValue, color: 'var(--stamp-red)' }}>{fileNumber}</span>
              </div>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>姓名:</span>
                <span style={s.summaryValue}>{name}</span>
              </div>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>性别:</span>
                <span style={s.summaryValue}>{gender}</span>
              </div>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>年龄段:</span>
                <span style={s.summaryValue}>{age} 岁</span>
              </div>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>职业:</span>
                <span style={s.summaryValue}>{occupation} — {occupationData?.desc}</span>
              </div>
              {appearance && (
                <div style={s.summaryRow}>
                  <span style={s.summaryLabel}>外貌:</span>
                  <span style={s.summaryValue}>{appearance}</span>
                </div>
              )}

              <div style={{
                borderTop: '1px dashed var(--border)',
                margin: '0.75rem 0',
                paddingTop: '0.75rem',
              }}>
                <div style={s.summaryRow}>
                  <span style={s.summaryLabel}>随身物品:</span>
                  <span style={s.summaryValue}>{allItems}</span>
                </div>
              </div>

              <div style={{
                borderTop: '1px dashed var(--border)',
                margin: '0.75rem 0',
                paddingTop: '0.75rem',
              }}>
                <div style={{ ...s.summaryLabel, marginBottom: '0.25rem' }}>性格评估:</div>
                {answers.map((a, i) => (
                  <div key={i} style={{ ...s.summaryRow, paddingLeft: '0.5rem' }}>
                    <span style={{ color: 'var(--stamp-red)', fontSize: 'var(--text-xs)', minWidth: 28 }}>
                      Q{i + 1}:
                    </span>
                    <span style={{ ...s.summaryValue, fontSize: 'var(--text-xs)' }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'var(--stamp-red-bg)',
              border: '1px solid var(--stamp-red-dim)',
              fontSize: 'var(--text-xs)',
              color: 'var(--stamp-red)',
            }}>
              <AlertTriangle size={14} />
              警告：提交后档案将被锁定，不可更改。
            </div>
          </>
        )}

        {/* ── 底部按钮 ── */}
        <div style={s.actions}>
          {step > 0 ? (
            <button
              style={s.btn('ghost')}
              onClick={() => setStep(st => st - 1)}
              onMouseEnter={e => btnHover(e, 'ghost')}
              onMouseLeave={e => btnLeave(e, 'ghost')}
            >
              <ChevronLeft size={14} /> 上一步
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              style={{
                ...s.btn('primary'),
                opacity: canNext ? 1 : 0.4,
                cursor: canNext ? 'pointer' : 'not-allowed',
              }}
              disabled={!canNext}
              onClick={() => canNext && setStep(st => st + 1)}
              onMouseEnter={e => canNext && btnHover(e, 'primary')}
              onMouseLeave={e => btnLeave(e, 'primary')}
            >
              下一步 <ChevronRight size={14} />
            </button>
          ) : (
            <button
              style={s.btn('danger')}
              onClick={handleFinish}
              onMouseEnter={e => btnHover(e, 'danger')}
              onMouseLeave={e => btnLeave(e, 'danger')}
            >
              <Lock size={14} /> 锁定档案，开始探索
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
