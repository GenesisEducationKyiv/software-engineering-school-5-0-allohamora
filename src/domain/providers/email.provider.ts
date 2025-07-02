import { JSX } from 'hono/jsx/jsx-runtime';

export type SendEmailOptions = {
  to: string[];
  title: string;
  html?: string;
  text?: string;
  react?: JSX.Element;
};

export interface EmailProvider {
  sendEmail(options: SendEmailOptions): Promise<void>;
}
