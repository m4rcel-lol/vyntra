// Frontend-only analytics dataset for charts, stat cards and tables.

const days = 30;
const today = new Date();

export const viewsOverTime = Array.from({ length: days }).map((_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - (days - 1 - i));
  const base = 1800 + Math.sin(i / 3) * 600 + i * 42;
  const views = Math.round(base + Math.random() * 400);
  const visitors = Math.round(views * (0.58 + Math.random() * 0.08));
  return { date: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), views, visitors };
});

export const clicksOverTime = viewsOverTime.map((d) => ({
  ...d,
  clicks: Math.round(d.views * (0.18 + Math.random() * 0.06)),
}));

export const analyticsTotals = {
  views: viewsOverTime.reduce((a, b) => a + b.views, 0),
  uniqueVisitors: viewsOverTime.reduce((a, b) => a + b.visitors, 0),
  linkClicks: clicksOverTime.reduce((a, b) => a + b.clicks, 0),
  ctr: 21.4,
  viewsDelta: 12.6,
  visitorsDelta: 8.1,
  clicksDelta: -3.2,
  ctrDelta: 1.4,
};

export const topCountries = [
  { country: 'United States', code: 'US', value: 38420 },
  { country: 'Germany', code: 'DE', value: 21130 },
  { country: 'Japan', code: 'JP', value: 18760 },
  { country: 'United Kingdom', code: 'GB', value: 14210 },
  { country: 'Brazil', code: 'BR', value: 11890 },
  { country: 'Canada', code: 'CA', value: 9320 },
];

export const deviceTypes = [
  { name: 'Mobile', value: 61 },
  { name: 'Desktop', value: 32 },
  { name: 'Tablet', value: 7 },
];

export const browsers = [
  { name: 'Chrome', value: 54 },
  { name: 'Safari', value: 26 },
  { name: 'Firefox', value: 11 },
  { name: 'Edge', value: 6 },
  { name: 'Other', value: 3 },
];

export const referrers = [
  { name: 'Instagram', value: 31240 },
  { name: 'Direct', value: 24110 },
  { name: 'X / Twitter', value: 18920 },
  { name: 'TikTok', value: 14380 },
  { name: 'YouTube', value: 9870 },
  { name: 'Discord', value: 6210 },
];

export const mostClickedLinks = [
  { label: 'Instagram', clicks: 12840, icon: 'Instagram' },
  { label: 'YouTube', clicks: 9410, icon: 'Youtube' },
  { label: 'Portfolio', clicks: 7220, icon: 'Globe' },
  { label: 'X / Twitter', clicks: 5980, icon: 'Twitter' },
  { label: 'Spotify', clicks: 4310, icon: 'Music' },
];

export const templateImports = viewsOverTime.slice(-14).map((d) => ({
  label: d.label,
  imports: Math.round(40 + Math.random() * 120),
}));
