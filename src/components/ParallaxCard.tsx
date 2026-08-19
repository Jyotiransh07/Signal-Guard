import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const ParallaxCard: React.FC<Props> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border transition-all duration-150 ${className}`}
    >
      {children}
    </div>
  );
};
