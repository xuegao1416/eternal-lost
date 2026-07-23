// 正文生图内联按钮 — 点击触发图片生成，完成后内联展示
import { useState, useCallback, useEffect, useRef } from 'react';
import { useImageGen } from '../../../hooks/useImageGen';
import { getGenerationConfigError } from '../../../api/imageGen';
import { ImageIcon, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// ─── 全局状态缓存（跨渲染周期持久化） ───
interface CachedState {
  status: 'idle' | 'generating' | 'done' | 'error';
  imageUrl: string;
  errorMsg: string;
  taskId: string | null;
}
const globalImageStateCache = new Map<string, CachedState>();

interface Props {
  prompt: string;
  msgId?: string | number;
}

export default function InlineImageGenButton({ prompt, msgId }: Props) {
  const { config, generateAndSave, getImageUrl } = useImageGen();
  const cacheKey = `${msgId || 'unknown'}::${prompt}`;

  const cached = globalImageStateCache.get(cacheKey);
  const [status, setStatus] = useState<CachedState['status']>(cached?.status || 'idle');
  const [imageUrl, setImageUrl] = useState(cached?.imageUrl || '');
  const [errorMsg, setErrorMsg] = useState(cached?.errorMsg || '');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const updateState = useCallback((patch: Partial<CachedState>) => {
    const prev = globalImageStateCache.get(cacheKey) || { status: 'idle', imageUrl: '', errorMsg: '', taskId: null };
    const next = { ...prev, ...patch };
    globalImageStateCache.set(cacheKey, next);
    if (mountedRef.current) {
      if (patch.status !== undefined) setStatus(patch.status);
      if (patch.imageUrl !== undefined) setImageUrl(patch.imageUrl);
      if (patch.errorMsg !== undefined) setErrorMsg(patch.errorMsg);
    }
  }, [cacheKey]);

  const handleClick = useCallback(async () => {
    if (status === 'generating' || status === 'done') return;

    const configError = getGenerationConfigError(config);
    if (configError) {
      updateState({ status: 'error', errorMsg: configError });
      return;
    }

    updateState({ status: 'generating', errorMsg: '' });

    try {
      const result = await generateAndSave(
        prompt,
        { category: 'story' },
        (s) => {
          if (s === 'generating' && mountedRef.current) {
            updateState({ status: 'generating' });
          }
        },
      );

      let url = result?.imageUrl || '';
      if (!url && result?.imageBlobKey) {
        url = await getImageUrl(result) || '';
      }
      if (url) {
        updateState({ status: 'done', imageUrl: url, taskId: result!.id });
      } else {
        updateState({ status: 'error', errorMsg: '生成完成但未返回图片' });
      }
    } catch (e) {
      updateState({ status: 'error', errorMsg: (e as Error).message || '生图失败' });
    }
  }, [status, config, prompt, generateAndSave, getImageUrl, updateState]);

  const handleRetry = useCallback(() => {
    updateState({ status: 'idle', imageUrl: '', errorMsg: '' });
  }, [updateState]);

  const getBtnClass = () => {
    let cls = 'inline-image-gen__btn';
    if (status === 'generating') cls += ' inline-image-gen__btn--generating';
    else if (status === 'error') cls += ' inline-image-gen__btn--error';
    return cls;
  };

  // ─── 已完成：显示图片 ───
  if (status === 'done' && imageUrl) {
    return (
      <div className="inline-image-gen__image-wrapper">
        <img
          src={imageUrl}
          alt={prompt}
          className="inline-image-gen__image"
          loading="lazy"
        />
        <div className="inline-image-gen__retry-bar">
          <button onClick={handleRetry} className="inline-image-gen__retry-btn" title="重新生成">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>
    );
  }

  // ─── 生成中 / 等待 / 错误 ───
  return (
    <div className="inline-image-gen">
      <button
        onClick={status === 'error' ? handleRetry : handleClick}
        disabled={status === 'generating'}
        className={getBtnClass()}
      >
        {status === 'generating' ? (
          <>
            <Loader2 size={14} className="inline-image-gen__spinner" />
            生成中...
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle size={14} />
            重试生图
          </>
        ) : (
          <>
            <ImageIcon size={14} />
            点击生图
          </>
        )}
      </button>
      {status === 'error' && errorMsg && (
        <div className="inline-image-gen__error-text">
          <AlertCircle size={12} />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
