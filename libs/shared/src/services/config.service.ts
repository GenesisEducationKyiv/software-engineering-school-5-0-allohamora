import 'dotenv/config';

export abstract class BaseConfigService<Config extends Record<string, unknown>> {
  protected config: Config;

  constructor() {
    this.setConfig();
  }

  protected abstract setConfig(): void;

  public get<T extends keyof Config>(key: T): Config[T] {
    return this.config[key];
  }

  public getConfig(): Config {
    return this.config;
  }
}
