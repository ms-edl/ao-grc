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

// Commonly used icons as components
export const SearchIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <Icon name="search" size={size} className={className} />
);

export const CheckIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <Icon name="check" size={size} className={className} />
);

export const ChevronsUpDownIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <Icon name="chevrons-up-down" size={size} className={className} />
);

export const XIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <Icon name="x" size={size} className={className} />
);

export const WifiIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <Icon name="wifi" size={size} className={className} />
);

export const SmartphoneIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <Icon name="smartphone" size={size} className={className} />
);
