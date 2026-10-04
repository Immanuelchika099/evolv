'use client';

import { useId } from 'react';

import './HoldButton.css';

export default function HoldButton({
  children = 'Delete',
  icon = null,
  backgroundColor = '#27272a',
  textColor = '#f5f5f5',
  size = 'md',
  radius = 14,
  disabled = false,
  onHold,
  onTap,
  className = ''
}) {
  const hintId = useId();

  const handleClick = () => {
    if (disabled) return;
    onTap?.();
    onHold?.();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={`hold-button hold-button--${size}${className ? ` ${className}` : ''}`}
      aria-describedby={hintId}
      style={{
        '--hb-radius': `${radius}px`,
        '--hb-bg': backgroundColor,
        '--hb-text': textColor
      }}
      onClick={handleClick}
    >
      {icon ? <span className="hold-button__icon">{icon}</span> : null}
      <span className="hold-button__text">{children}</span>
      <span id={hintId} className="hold-button__sr">Button</span>
    </button>
  );
}
