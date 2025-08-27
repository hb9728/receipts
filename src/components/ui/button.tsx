import * as React from 'react';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid'|'outline', size?: 'sm'|'md' };
export function Button({ className='', variant='solid', size='md', ...props }: Props) {
  const base = 'rounded-xl border transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = variant === 'outline'
    ? 'border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-100'
    : 'border-neutral-700 bg-neutral-100 text-neutral-900 hover:bg-white';
  const sizes = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2';
  return <button className={`${base} ${variants} ${sizes} ${className}`} {...props} />;
}
