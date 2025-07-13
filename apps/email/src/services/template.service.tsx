import { SubscribeTemplate, SubscribeTemplateText } from '../templates/subscribe.template.js';
import { WeatherUpdateTemplate, WeatherUpdateTemplateText } from '../templates/weather-update.template.js';

export type Template = {
  title: string;
  html: string;
  text: string;
};

export type GetSubscribeTemplateOptions = {
  city: string;
  confirmationLink: string;
};

export type GetWeatherUpdateTemplateOptions = {
  city: string;
  unsubscribeLink: string;
  temperature: number;
  humidity: number;
  description: string;
};

export class TemplateService {
  public getSubscribeTemplate(props: GetSubscribeTemplateOptions): Template {
    const template = <SubscribeTemplate {...props} />;

    return {
      title: `Confirm your weather subscription for ${props.city}`,
      html: template.toString(),
      text: SubscribeTemplateText(props),
    };
  }

  public getWeatherUpdateTemplate(props: GetWeatherUpdateTemplateOptions): Template {
    const template = <WeatherUpdateTemplate {...props} />;

    return {
      title: `Weather update for ${props.city}`,
      html: template.toString(),
      text: WeatherUpdateTemplateText(props),
    };
  }
}
