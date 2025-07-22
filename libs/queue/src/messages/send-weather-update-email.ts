import { Message } from './message.js';

export const sendWeatherUpdateEmail = new Message<{
  to: string[];
  city: string;
  unsubscribeLink: string;
  temperature: number;
  humidity: number;
  description: string;
}>('send-weather-update-email');
