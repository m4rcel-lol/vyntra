import { PORTRAITS } from './assets';

/** @type {import('@/types').User[]} */
export const mockUsers = [
  {
    id: 'usr_01',
    username: 'nova',
    displayName: 'Nova Sterling',
    email: 'nova@vyntra.sarl',
    avatar: PORTRAITS.p5,
    role: 'user',
    plan: 'Unlimited',
    joinDate: '2023-03-14',
  },
  {
    id: 'usr_02',
    username: 'kairo',
    displayName: 'Kairo',
    email: 'kairo@vyntra.sarl',
    avatar: PORTRAITS.p6,
    role: 'user',
    plan: 'pro',
    joinDate: '2023-08-02',
  },
  {
    id: 'usr_03',
    username: 'lumen',
    displayName: 'Lumen',
    email: 'lumen@vyntra.sarl',
    avatar: PORTRAITS.p1,
    role: 'moderator',
    plan: 'pro',
    joinDate: '2024-01-21',
  },
];

// The signed-in user for the dashboard experience.
export const currentUser = mockUsers[0];
