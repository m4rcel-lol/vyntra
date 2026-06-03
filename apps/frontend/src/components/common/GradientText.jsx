import { cn } from '@/lib/utils';

// Contrast-safe metallic text (white -> light gray). Use for hero words only.
export const GradientText = ({ as: Tag = 'span', className, children, ...props }) => (
  <Tag className={cn('text-chrome', className)} {...props}>
    {children}
  </Tag>
);
