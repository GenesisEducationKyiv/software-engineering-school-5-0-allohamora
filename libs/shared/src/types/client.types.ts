import { Client } from 'nice-grpc';
import { WeatherServiceDefinition } from '@weather-subscription/proto/weather';
import { SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';

export type WeatherClient = Client<WeatherServiceDefinition>;
export type SubscriptionClient = Client<SubscriptionServiceDefinition>;
