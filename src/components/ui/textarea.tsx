import * as React from 'react';
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function T({ className='', ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 p-3 outline-none focus:ring-1 focus:ring-neutral-600 ${className}`}
        {...props}
      />
    );
  }
);
