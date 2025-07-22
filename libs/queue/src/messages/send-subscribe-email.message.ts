import { Message } from './message.js';

export const sendSubscribeEmail = new Message<{
  to: string[];
  city: string;
  confirmationLink: string;
}>('send-subscribe-email');
