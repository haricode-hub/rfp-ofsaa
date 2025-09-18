import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: 'blue' | 'green' | 'purple' | 'none';
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  gradient = 'none',
  hover = true,
  onClick
}) => {
  const baseClasses = 'card';
  const gradientClasses = {
    blue: 'card-gradient-blue',
    green: 'card-gradient-green',
    purple: 'card-gradient-purple',
    none: '',
  };
  const hoverClasses = hover ? 'card-hover' : '';

  const classes = [
    baseClasses,
    gradientClasses[gradient],
    hoverClasses,
    onClick && 'cursor-pointer',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`p-6 pb-0 ${className}`}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
};