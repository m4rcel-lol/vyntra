import { socialApi } from '@/services/backend';

export const socialService = {
  myFriends: () => socialApi.myFriends(),
  publicFriends: (username) => socialApi.publicFriends(username),
  addFriend: (username) => socialApi.addFriend(username),
  removeFriend: (username) => socialApi.removeFriend(username),
  conversations: () => socialApi.conversations(),
  conversation: (id) => socialApi.conversation(id),
  sendMessage: (username, body) => socialApi.sendMessage(username, body),
};
