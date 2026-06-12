import { mockUsers } from './users.mock';
import { PORTRAITS, WALLPAPERS } from './assets';

export const platformStats = {
  totalUsers: 248120,
  activeProfiles: 191340,
  templates: 4820,
  reportsOpen: 23,
  usersDelta: 4.2,
  profilesDelta: 3.1,
  templatesDelta: 9.7,
  reportsDelta: -12.0,
};

export const adminUsers = [
  { id: 'u1', username: 'nova', email: 'nova@vyntra.sarl', role: 'user', plan: 'Unlimited', status: 'active', joined: '2023-03-14', reports: 0, avatar: PORTRAITS.p5 },
  { id: 'u2', username: 'kairo', email: 'kairo@vyntra.sarl', role: 'user', plan: 'Unlimited', status: 'active', joined: '2023-08-02', reports: 1, avatar: PORTRAITS.p6 },
  { id: 'u3', username: 'lumen', email: 'lumen@vyntra.sarl', role: 'moderator', plan: 'Unlimited', status: 'active', joined: '2024-01-21', reports: 0, avatar: PORTRAITS.p1 },
  { id: 'u4', username: 'echo', email: 'echo@vyntra.sarl', role: 'user', plan: 'Unlimited', status: 'suspended', joined: '2024-05-10', reports: 4, avatar: PORTRAITS.p4 },
  { id: 'u5', username: 'arc', email: 'arc@vyntra.sarl', role: 'user', plan: 'Unlimited', status: 'active', joined: '2024-06-18', reports: 0, avatar: PORTRAITS.p7 },
  { id: 'u6', username: 'mira', email: 'mira@vyntra.sarl', role: 'user', plan: 'Unlimited', status: 'pending', joined: '2024-09-01', reports: 2, avatar: PORTRAITS.p3 },
];

export const reportQueue = [
  { id: 'r1', type: 'Profile', target: '@echo', reason: 'Impersonation', reporter: '@nova', status: 'open', date: '2025-02-14T10:20:00Z', severity: 'high' },
  { id: 'r2', type: 'Template', target: 'Neon Tokyo', reason: 'Copyright', reporter: '@arc', status: 'open', date: '2025-02-13T18:02:00Z', severity: 'medium' },
  { id: 'r3', type: 'Profile', target: '@mira', reason: 'NSFW background', reporter: '@kairo', status: 'reviewing', date: '2025-02-12T09:41:00Z', severity: 'high' },
  { id: 'r4', type: 'Link', target: '@echo → external', reason: 'Phishing link', reporter: '@lumen', status: 'open', date: '2025-02-11T22:15:00Z', severity: 'critical' },
  { id: 'r5', type: 'Template', target: 'Prism', reason: 'Spam', reporter: '@nova', status: 'resolved', date: '2025-02-10T13:30:00Z', severity: 'low' },
];

export const moderationProfiles = [
  { id: 'm1', username: 'echo', displayName: 'Echo', avatar: PORTRAITS.p4, banner: WALLPAPERS.cyber2, flags: 4, reason: 'Multiple impersonation reports' },
  { id: 'm2', username: 'mira', displayName: 'Mira', avatar: PORTRAITS.p3, banner: WALLPAPERS.anime1, flags: 2, reason: 'Background under review' },
];

export const moderationTemplates = [
  { id: 'mt1', name: 'Neon Tokyo', author: 'kairo', preview: WALLPAPERS.cyber1, flags: 1, reason: 'Possible copyrighted art' },
  { id: 'mt2', name: 'Prism', author: 'echo', preview: WALLPAPERS.mesh1, flags: 3, reason: 'Reported as spam clone' },
];

export const announcements = [
  { id: 'a1', title: 'New: Video backgrounds', body: 'All users can now set compressed MP4 video backgrounds.', date: '2025-02-09', active: true },
  { id: 'a2', title: 'Scheduled maintenance', body: 'Brief downtime on Feb 20, 02:00 UTC.', date: '2025-02-06', active: false },
];

export const auditLog = [
  { id: 'al1', actor: '@lumen', action: 'Suspended user', target: '@echo', date: '2025-02-14T11:00:00Z' },
  { id: 'al2', actor: '@admin', action: 'Removed template', target: 'Prism', date: '2025-02-13T16:20:00Z' },
  { id: 'al3', actor: '@lumen', action: 'Assigned badge', target: '@nova → Top Creator', date: '2025-02-12T08:05:00Z' },
  { id: 'al4', actor: '@admin', action: 'Resolved report', target: '#r5', date: '2025-02-10T14:00:00Z' },
  { id: 'al5', actor: '@lumen', action: 'Approved profile', target: '@arc', date: '2025-02-09T19:45:00Z' },
];

export { mockUsers };
