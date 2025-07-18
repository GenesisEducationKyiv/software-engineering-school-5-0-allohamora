export type BuildUrlOptions = {
  url: string;
  params?: Record<string, string>;
};

export type GetOptions = BuildUrlOptions & {
  handleIsOk?: boolean;
};

export interface HttpProvider {
  get: (options: GetOptions) => Promise<Response>;
}
