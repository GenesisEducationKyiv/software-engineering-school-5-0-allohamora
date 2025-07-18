import { Client } from 'nice-grpc';
import { WeatherServiceDefinition } from '@weather-subscription/proto/weather';
import { SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';
import { EmailServiceDefinition } from '@weather-subscription/proto/email';

export type WeatherClient = Client<WeatherServiceDefinition>;
export type SubscriptionClient = Client<SubscriptionServiceDefinition>;
export type EmailClient = Client<EmailServiceDefinition>;
