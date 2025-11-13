import React from 'react';
import * as feather from 'feather-icons';

export interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 16, 
  className = '',
  color = 'currentColor'
}) => {
  const iconSvg = feather.icons[name as keyof typeof feather.icons];
  
  if (!iconSvg) {
    console.warn(`Icon "${name}" not found in feather-icons`);
    return null;
  }

  const svgString = iconSvg.toSvg({
    width: size,
    height: size,
    color: color,
    class: className
  });

  return (
    <span
      dangerouslySetInnerHTML={{ __html: svgString }}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    />
  );
};

export default Icon;

