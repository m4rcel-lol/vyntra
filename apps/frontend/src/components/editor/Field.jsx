import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const Field = ({ label, hint, htmlFor, children, className }) => (
  <div className={cn('space-y-2', className)}>
    {label && <Label htmlFor={htmlFor} className="text-sm">{label}</Label>}
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export const EditorSection = ({ title, description, children, className }) => (
  <div className={cn('space-y-4', className)}>
    {(title || description) && (
      <div>
        {title && <h3 className="font-display text-base font-semibold">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    )}
    {children}
  </div>
);
