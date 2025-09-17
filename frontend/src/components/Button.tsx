import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  href?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  href,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    warning: 'btn-warning',
    danger: 'btn-danger',
  };
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
    (loading || disabled) && 'opacity-50 cursor-not-allowed'
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {loading && (
        <div className="spinner w-4 h-4 mr-2" />
      )}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
      {!loading && !icon && variant === 'primary' && (
        <ArrowRightIcon className="ml-2 h-4 w-4" />
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={classes}
      disabled={loading || disabled}
      {...props}
    >
      {content}
    </button>
  );
};