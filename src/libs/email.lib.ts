import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM, EMAIL_NAME } from 'src/config.js';
import { createLogger } from './pino.lib.js';
import { Exception, ExceptionCode } from 'src/exception.js';
import { JSX } from 'hono/jsx/jsx-runtime';

const resend = new Resend(RESEND_API_KEY);

const logger = createLogger('email.lib.ts');

type SendEmailOptions = {
  to: string[];
  title: string;
  html?: string;
  text?: string;
  react?: JSX.Element;
};

export const sendEmail = async ({ to, title, html, text, react }: SendEmailOptions) => {
  const { error } = await resend.emails.send({
    from: `${EMAIL_NAME} <${EMAIL_FROM}>`,
    to,
    subject: title,
    html,
    text,
    react,
  });

  if (error) {
    logger.error({ err: error });
    throw new Exception(ExceptionCode.INTERNAL_SERVER_ERROR, error.message);
  }
};
