import { Exception, ExceptionCode } from 'src/exception.js';

type BuildUrlOptions = {
  url: string;
  params?: Record<string, string>;
};

export type GetOptions = BuildUrlOptions & {
  handleIsOk?: boolean;
};

export interface HttpService {
  get: (options: GetOptions) => Promise<Response>;
}

export class FetchHttpService implements HttpService {
  private buildUrl({ url, params }: BuildUrlOptions) {
    const parts = [url];

    if (params) {
      parts.push(`?${new URLSearchParams(params).toString()}`);
    }

    return parts.join('');
  }

  public async get({ handleIsOk = true, ...rest }: GetOptions) {
    const res = await fetch(this.buildUrl(rest));

    if (handleIsOk && !res.ok) {
      throw new Exception(ExceptionCode.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }

    return res;
  }
}
