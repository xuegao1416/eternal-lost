// ============================================================
//  头像 — 旧监控照片 / 证件徽章风格
// ============================================================
import { useMemo, useState } from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** 可选的头像图片 URL */
  imageSrc?: string | null;
}

const SIZE_MAP = { sm: 28, md: 36, lg: 48 } as const;
const FONT_MAP = { sm: '0.65rem', md: '0.8rem', lg: '1rem' } as const;

// 6 种旧档案色调 — 名字哈希选择，保证同一人颜色一致
const ARCHIVE_TONES = [
  { bg: '#D4C9B8', border: '#B8A898' },  // 旧纸色
  { bg: '#C9B8A8', border: '#A89888' },  // 褐色档案
  { bg: '#B8C4C9', border: '#98A8B8' },  // 褪色蓝墨
  { bg: '#C9C4B8', border: '#B8A898' },  // 灰档案
  { bg: '#C4C9B8', border: '#A8B898' },  // 淡绿档案
  { bg: '#C9B8B8', border: '#B89898' },  // 淡红档案
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function Avatar({ name, size = 'md', className, imageSrc }: AvatarProps) {
  const px = SIZE_MAP[size];
  const [imgFailed, setImgFailed] = useState(false);

  const initial = useMemo(() => {
    if (!name) return '?';
    const first = name.trim()[0] || '?';
    return first;
  }, [name]);

  const tone = useMemo(() => ARCHIVE_TONES[hashCode(name) % ARCHIVE_TONES.length], [name]);

  const showImage = imageSrc && !imgFailed;

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        minWidth: px,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: showImage ? 'none' : tone.bg,
        border: `1px solid ${tone.border}`,
        fontSize: FONT_MAP[size],
        fontFamily: 'var(--font-mono)',
        color: 'var(--ink)',
        fontWeight: 600,
        overflow: 'hidden',
      }}
    >
      {showImage ? (
        <>
          <img
            src={imageSrc}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'grayscale(30%) contrast(1.1)',
            }}
            onError={() => setImgFailed(true)}
          />
          {/* 旧监控照片效果 — 扫描线 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
            pointerEvents: 'none',
          }} />
        </>
      ) : (
        <>
          {initial}
          {/* 证件徽章角落装饰 */}
          {size === 'lg' && (
            <>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6px',
                height: '6px',
                borderTop: `1px solid ${tone.border}`,
                borderLeft: `1px solid ${tone.border}`,
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '6px',
                height: '6px',
                borderBottom: `1px solid ${tone.border}`,
                borderRight: `1px solid ${tone.border}`,
              }} />
            </>
          )}
        </>
      )}
    </div>
  );
}
