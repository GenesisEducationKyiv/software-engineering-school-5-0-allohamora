import { ConfigService } from 'src/services/config.service.js';
import { LoggerService } from '@weather-subscription/shared';
import { TemplateService } from './services/template.service.js';
import { EmailService } from './services/email.service.js';
import { Server } from './server.js';
import { App } from './app.js';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public loggerService = new LoggerService(this);

  public templateService = new TemplateService();
  public emailService = new EmailService(this);

  public server = new Server(this);

  public app = new App(this);
}
