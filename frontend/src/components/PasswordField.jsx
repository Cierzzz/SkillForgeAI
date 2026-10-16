import { useMemo, useState } from 'react';
import { IconEye } from './Icons.jsx';

/** Password input with reveal toggle and a live strength meter. */
export default function PasswordField({
  label,
  id,
  value,
  onChange,
  autoComplete = 'current-password',
  required = true,
  showMeter = false,
  hint,
  error,
}) {
  const [visible, setVisible] = useState(false);

  const strength = useMemo(() => {
    const v = String(value || '');
    let score = 0;
    if (v.length >= 10) score += 1;
    if (v.length >= 14) score += 1;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score += 1;
    if (/\d/.test(v)) score += 1;
    if (/[^A-Za-z0-9]/.test(v)) score += 1;
    const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    const colors = ['#fb7185', '#fb7185', '#fbbf24', '#fbbf24', '#34d399', '#34d399'];
    return { score, label: labels[score], color: colors[score] };
  }, [value]);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          id={id}
          name={id}
          className="input"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          minLength={required ? 10 : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className="reveal"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          <IconEye size={15} /> {visible ? 'Hide' : 'Show'}
        </button>
      </div>

      {showMeter && value ? (
        <div className="stack-sm">
          <div className="meter">
            <i style={{ width: `${(strength.score / 5) * 100}%`, background: strength.color }} />
          </div>
          <span className="tiny" style={{ color: strength.color }}>
            {strength.label} · needs 10+ characters, upper, lower, a number and a symbol
          </span>
        </div>
      ) : null}

      {error ? (
        <span id={`${id}-error`} className="hint hint-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="hint">{hint}</span>
      ) : null}
    </div>
  );
}