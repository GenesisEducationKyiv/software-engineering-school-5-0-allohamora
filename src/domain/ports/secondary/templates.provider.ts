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

export interface TemplateProvider {
  getSubscribeTemplate(options: GetSubscribeTemplateOptions): Template;
  getWeatherUpdateTemplate(options: GetWeatherUpdateTemplateOptions): Template;
}
