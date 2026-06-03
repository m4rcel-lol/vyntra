import * as Lucide from 'lucide-react';

// Resolve a lucide icon by name string (used by links, badges, etc.).
// Falls back to a neutral Link icon when the name is unknown.
export const Icon = ({ name, fallback = 'Link', ...props }) => {
  const Cmp = (name && Lucide[name]) || Lucide[fallback] || Lucide.Link;
  return <Cmp {...props} />;
};
