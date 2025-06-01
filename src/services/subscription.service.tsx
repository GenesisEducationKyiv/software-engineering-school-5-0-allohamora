import { Frequency } from 'src/db.schema.js';
import { sign, verify } from './jwt.service.js';
import {
  createSubscription,
  isSubscriptionExists,
  iterateSubscriptions,
  removeSubscriptionById,
} from 'src/repositories/subscription.repository.js';
import { APP_URL } from 'src/config.js';
import { Exception, ExceptionCode } from 'src/exception.js';
import { createLogger } from 'src/libs/pino.lib.js';
import { sendEmail } from 'src/libs/email.lib.js';
import { SubscribeTemplate, SubscribeTemplateText } from 'src/templates/subscribe.template.js';
import { getWeather, validateCity } from './weather.service.js';
import { WeatherUpdateTemplate, WeatherUpdateTemplateText } from 'src/templates/weather-update.template.js';

const logger = createLogger('subscription.service');

export type SubscribeOptions = {
  email: string;
  city: string;
  frequency: Frequency;
};

const checkIsSubscriptionExists = async (email: string) => {
  if (await isSubscriptionExists(email)) {
    throw new Exception(ExceptionCode.ALREADY_EXISTS, 'Subscription already exists');
  }
};

export const subscribe = async (options: SubscribeOptions) => {
  await checkIsSubscriptionExists(options.email);

  await validateCity(options.city);

  const token = await sign(options);
  const confirmationLink = `${APP_URL}/api/confirm/${token}`;

  const template = <SubscribeTemplate {...options} confirmationLink={confirmationLink} />;

  await sendEmail({
    to: [options.email],
    title: `Confirm your weather subscription for ${options.city}`,
    html: template.toString(),
    text: SubscribeTemplateText({ ...options, confirmationLink }),
  });

  logger.info({ email: options.email, city: options.city }, 'Confirmation email sent');
};

export const confirm = async (token: string) => {
  const options = await verify<SubscribeOptions>(token);

  await checkIsSubscriptionExists(options.email);

  await createSubscription(options);
};

export const unsubscribe = async (subscriptionId: string) => {
  await removeSubscriptionById(subscriptionId);
};

export const handleWeatherSubscription = (frequency: Frequency) => {
  return async () => {
    logger.info({ msg: 'handling weather subscription has been started', frequency });

    for await (const subscriptions of iterateSubscriptions(frequency)) {
      for (const { id, email, city } of subscriptions) {
        const weather = await getWeather(city);
        const unsubscribeLink = `${APP_URL}/api/unsubscribe/${id}`;

        const props = {
          city,
          unsubscribeLink,
          ...weather,
        }

        const template = <WeatherUpdateTemplate {...props} />;

        await sendEmail({
          to: [email],
          title: `Weather update for ${city}`,
          html: template.toString(),
          text: WeatherUpdateTemplateText(props),
        });
      }
    }

    logger.info({ msg: 'handling weather subscription has been finished', frequency });
  };
};
