import React, { forwardRef } from 'react';

const Input = forwardRef(({
  id,
  label,
  type = 'text',
  placeholder,
  error,
  className = '',
  ...rest
}, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--text-color)]">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 rounded-xl text-sm
          bg-[var(--surface-color)]
          text-[var(--text-color)]
          placeholder:text-[var(--text-muted-color)]
          border transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[#FF4D2E]/50 focus:border-[#FF4D2E]
          ${error ? 'border-red-500 focus:ring-red-500/30' : 'border-[var(--text-muted-color)]/20 hover:border-[var(--text-muted-color)]/40'}
          ${className}
        `}
        {...rest}
      />
      {error && (
        <p className="text-xs text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
