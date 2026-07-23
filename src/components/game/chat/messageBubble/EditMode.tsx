import { useRef, useCallback, useEffect } from 'react';

interface EditModeProps {
  editText: string;
  setEditText: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function EditMode({ editText, setEditText, onConfirm, onCancel }: EditModeProps) {
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    editRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onConfirm();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onConfirm, onCancel]);

  return (
    <div className="edit-mode">
      <textarea
        ref={editRef}
        className="edit-mode__textarea"
        value={editText}
        onChange={e => setEditText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="edit-mode__actions">
        <button
          onClick={onCancel}
          className="btn btn-bracket"
        >取消</button>
        <button
          onClick={onConfirm}
          className="btn btn-primary btn-sm"
        >保存</button>
      </div>
    </div>
  );
}
