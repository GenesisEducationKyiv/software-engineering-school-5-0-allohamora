export type SendEmailOptions = {
  to: string[];
  title: string;
  html?: string;
  text?: string;
};

export interface EmailProvider {
  sendEmail(options: SendEmailOptions): Promise<void>;
}
