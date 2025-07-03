import { GetSubscribeTemplateOptions, GetWeatherUpdateTemplateOptions, Template, TemplateProvider } from "src/domain/ports/secondary/templates.provider.js";
import { SubscribeTemplate, SubscribeTemplateText } from "../templates/subscribe.template.js";
import { WeatherUpdateTemplate, WeatherUpdateTemplateText } from "../templates/weather-update.template.js";

export class JsxTemplateProvider implements TemplateProvider {
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
    }
  }
}
