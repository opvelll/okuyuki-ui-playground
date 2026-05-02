const fieldGroupClasses = "grid gap-1.5 text-sm text-slate-100/90";
const fieldClasses =
  "min-h-9 w-full border border-white/12 bg-slate-900/72 px-2.5 text-[0.76rem] text-slate-50 outline-none transition focus:border-sky-200/60 focus:ring-2 focus:ring-sky-300/40";
const toggleLabelClasses =
  "grid grid-cols-[1fr_auto] items-center gap-4 text-[0.76rem] text-slate-100/90";
const fieldHintClasses = "text-[0.68rem] leading-5 text-slate-300/72";
const attachedFieldHintClasses =
  "-mt-2 text-[0.68rem] leading-5 text-slate-300/72";
const colorFieldClasses = "h-9 w-12 border border-white/12 bg-slate-900/80 p-1";
export const sectionHeadingClasses =
  "text-[0.58rem] font-bold uppercase tracking-[0.22em] text-sky-100/62";
export const sectionBodyClasses = "grid gap-4 md:gap-5";
export const subsectionToggleClasses =
  "flex w-full items-center justify-between gap-3 border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left text-[0.74rem] font-semibold text-slate-100/90 transition hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-sky-300/50";

export function ToggleField({
  checked,
  id,
  label,
  onChange,
}: {
  checked: boolean;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={toggleLabelClasses} htmlFor={id}>
      <span>{label}</span>
      <span className="relative inline-flex items-center">
        <input
          aria-label={label}
          checked={checked}
          className="peer sr-only"
          id={id}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="block h-6 w-11 rounded-full bg-slate-400/35 transition peer-checked:bg-sky-300" />
        <span className="pointer-events-none absolute left-[3px] h-[18px] w-[18px] rounded-full bg-slate-50 transition peer-checked:translate-x-[18px]" />
      </span>
    </label>
  );
}

export function NumberField({
  hint,
  id,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  hint?: string;
  id: string;
  label: string;
  max?: string;
  min?: string;
  onChange: (value: string) => void;
  step: string;
  value: number;
}) {
  return (
    <label className={fieldGroupClasses} htmlFor={id}>
      <span>{label}</span>
      <input
        className={fieldClasses}
        id={id}
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="number"
        value={value}
      />
      {hint ? <span className={fieldHintClasses}>{hint}</span> : null}
    </label>
  );
}

export function SectionNote({ children }: { children: string }) {
  return <p className={attachedFieldHintClasses}>{children}</p>;
}

export function ColorField({
  hint,
  id,
  label,
  onChange,
  value,
}: {
  hint?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={fieldGroupClasses} htmlFor={id}>
      <span>{label}</span>
      <div className="grid grid-cols-[auto_1fr] items-center gap-3">
        <input
          className={colorFieldClasses}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={value}
        />
        <span className={fieldClasses}>{value}</span>
      </div>
      {hint ? <span className={fieldHintClasses}>{hint}</span> : null}
    </label>
  );
}
