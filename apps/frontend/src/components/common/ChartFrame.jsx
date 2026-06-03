import { useEffect, useRef, useState } from 'react';

/**
 * Robust replacement for Recharts' ResponsiveContainer (which intermittently
 * reports a -1 size under CRA). Measures its own width with a ResizeObserver
 * and renders children(width, height) with explicit numeric dimensions.
 */
export const ChartFrame = ({ height = 224, className, children }) => {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ width: '100%', height }}>
      {width > 0 ? children(width, height) : null}
    </div>
  );
};
