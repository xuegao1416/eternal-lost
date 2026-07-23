import { useState, useCallback } from 'react';

interface Props {
  avatarUrl: string;
  name: string;
  title: string;
  text: string;
  action: string;
}

/**
 * 内联对话头像卡片 — 渲染 [SPEAK] 格式的对话
 * 气泡式布局：头像嵌入名称标签，对话内容在下方
 */
export default function InlineDialogueCard({ avatarUrl: initialUrl, name, title, text, action }: Props) {
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  const showAvatar = initialUrl && !imgError;
  const initial = name ? name.charAt(0) : '?';

  return (
    <div className="dialogue-card">
      {/* 名称标签区 */}
      <div className="dialogue-card__header">
        {/* 头像 */}
        <div className="dialogue-card__avatar">
          {showAvatar ? (
            <img
              src={initialUrl}
              alt={`${name}头像`}
              className="dialogue-card__avatar-img"
              onError={handleImgError}
            />
          ) : (
            <span className="dialogue-card__avatar-fallback">
              {initial}
            </span>
          )}
        </div>

        {/* 名称 + 称号 */}
        <div className="dialogue-card__name-info">
          <span className="dialogue-card__name">
            {name}
          </span>
          {title && (
            <span className="dialogue-card__title">
              {title}
            </span>
          )}
        </div>
      </div>

      {/* 对话气泡 */}
      <div className="dialogue-card__bubble">
        {/* 气泡尖角 */}
        <div className="dialogue-card__bubble-arrow" />
        <div className="dialogue-card__bubble-arrow-inner" />

        {/* 对话文本 */}
        <div className="dialogue-card__text">
          {text}
        </div>

        {/* 动作描述 */}
        {action && (
          <div className="dialogue-card__action">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
