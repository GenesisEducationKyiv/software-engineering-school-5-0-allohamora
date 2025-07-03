export type Logger = {
  info: (data: { msg: string } & Record<string, unknown>) => void;
  error: (data: { err: Error | unknown } & Record<string, unknown>) => void;
};

export interface LoggerProvider {
  createLogger(name: string): Logger;
}
