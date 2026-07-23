// ============================================================
//  设置页共享 UI 原语 — SCP 档案风
// ============================================================

/* ─── Section ─── */
export function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="setting-section">
      <div className="setting-section__title">
        <span className="section-icon">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

/* ─── SettingRow ─── */
export function SettingRow({ label, desc, children, stacked }: { label: string; desc?: string; children: React.ReactNode; stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="setting-row setting-row--stacked">
        <div>
          <div className="setting-row__label">{label}</div>
          {desc && <div className="setting-row__desc">{desc}</div>}
        </div>
        <div className="setting-row__control">{children}</div>
      </div>
    );
  }
  return (
    <div className="setting-row">
      <div>
        <div className="setting-row__label">{label}</div>
        {desc && <div className="setting-row__desc">{desc}</div>}
      </div>
      <div className="setting-row__control">{children}</div>
    </div>
  );
}

/* ─── SegmentedControl（分段选择） ─── */
export function SegmentedControl({ options, value, onChange }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="segmented-control">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={'segmented-control-btn' + (value === opt.value ? ' active' : '')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Select（打字机风格下拉） ─── */
export function Select({ options, value, onChange, width }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  width?: string;
}) {
  return (
    <div className="setting-select-wrap" style={width ? { width } : undefined}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="setting-select"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <span className="setting-select-arrow">▼</span>
    </div>
  );
}

/* ─── Toggle 开关 ─── */
export function Toggle({ value, onChange, ariaLabel = '' }: { value: boolean; onChange: (v: boolean) => void; ariaLabel?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={'toggle-switch' + (value ? ' on' : '')}
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
    >
      <div className="toggle-switch-knob" />
    </button>
  );
}

/* ─── Checkbox（[×] 风格） ─── */
export function Checkbox({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="setting-checkbox">
      <span className="setting-checkbox__box">{value ? '×' : ' '}</span>
      <span>{label}</span>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="setting-checkbox__input" />
    </label>
  );
}

/* ─── FieldGrid ─── */
export function FieldGrid({ children, columns = 2 }: { children: React.ReactNode; columns?: 1 | 2 }) {
  return (
    <div className={'field-grid' + (columns === 1 ? ' field-grid--single' : '')}>
      {children}
    </div>
  );
}

/* ─── Field ─── */
export function Field({ label, hint, children, span }: {
  label: string; hint?: string; children: React.ReactNode; span?: 1 | 2;
}) {
  return (
    <div className={'field-wrap' + (span === 2 ? ' field-wrap--span2' : '')}>
      <label className="field-wrap__label">{label}</label>
      {children}
      {hint && <span className="field-wrap__hint">{hint}</span>}
    </div>
  );
}

/* ─── Collapsible ─── */
export function Collapsible({ title, desc, children, defaultOpen = false }: {
  title: string; desc?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="collapsible">
      <summary>
        {title}
        {desc && <span className="collapsible__desc">{desc}</span>}
      </summary>
      <div className="collapsible__body">
        {children}
      </div>
    </details>
  );
}

/* ─── TextArea ─── */
export function TextArea({ value, onChange, placeholder, rows = 6, mono = false }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      spellCheck={false}
      className={'textarea-field' + (mono ? ' textarea-field--mono' : '')}
    />
  );
}

/* ─── Button ─── */
export function Button({ children, onClick, primary = false, disabled = false, icon }: {
  children: React.ReactNode; onClick?: () => void;
  primary?: boolean; disabled?: boolean; icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={primary ? 'btn btn-primary btn-sm' : 'btn btn-bracket btn-sm'}
    >
      {icon}{children}
    </button>
  );
}

/* ─── Slider ─── */
export function Slider({ label, value, onChange, min, max, step = 1, unit = '' }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="setting-slider" style={{ flexDirection: 'column', gap: '6px', maxWidth: '100%' }}>
      <div className="setting-slider-header">
        <span className="field-wrap__label">{label}</span>
        <span className="setting-slider__value">{value}{unit}</span>
      </div>
      <div className="setting-slider__track">
        <div className="setting-slider__thumb" style={{ left: pct + '%' }} />
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
