import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ...rest
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#FF4D2E] hover:bg-[#E03E22] active:scale-[0.98] text-white focus:ring-[#FF4D2E] shadow-lg shadow-[#FF4D2E]/20',
    secondary: 'bg-[var(--surface-color)] hover:bg-[#FF4D2E]/10 text-[var(--text-color)] border border-[var(--text-muted-color)]/20 focus:ring-[#FF4D2E]',
    ghost: 'text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--surface-color)] focus:ring-[#FF4D2E]',
  };

  const sizes = 'px-6 py-3 text-sm';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes} ${className}`}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
