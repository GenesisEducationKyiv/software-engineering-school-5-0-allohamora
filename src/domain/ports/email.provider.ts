import { Template } from './templates.provider.js';

export type SendEmailOptions = {
  to: string[];
  template: Template;
};

export interface EmailProvider {
  sendEmail(options: SendEmailOptions): Promise<void>;
}
