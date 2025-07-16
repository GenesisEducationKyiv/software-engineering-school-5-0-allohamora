import { EmailService } from 'src/services/email.service.js';
import { sendSubscribeEmail, sendWeatherUpdateEmail, SubscribeService } from '@weather-subscription/queue';

export const makeEmailSubscriptions = async (subscribeService: SubscribeService, emailService: EmailService) => {
  await subscribeService.subscribe(sendSubscribeEmail, async (payload) => {
    await emailService.sendSubscribeEmail(payload);
  });

  await subscribeService.subscribe(sendWeatherUpdateEmail, async (payload) => {
    await emailService.sendWeatherUpdateEmail(payload);
  });
};
