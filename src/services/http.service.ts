import { Exception, ExceptionCode } from 'src/exception.js';

type BuildUrlOptions = {
  url: string;
  params?: Record<string, string>;
};

export type GetOptions = BuildUrlOptions & {
  handleIsOk?: boolean;
};

// typescript forces you to implement all private methods if you will use class as interface
// and this will affect proxies, to prevent this we create this private method here
// https://github.com/microsoft/TypeScript/issues/2672
const buildUrl = ({ url, params }: BuildUrlOptions) => {
  const parts = [url];

  if (params) {
    parts.push(`?${new URLSearchParams(params).toString()}`);
  }

  return parts.join('');
};

export class HttpService {
  public async get({ handleIsOk = true, ...rest }: GetOptions) {
    const res = await fetch(buildUrl(rest));

    if (handleIsOk && !res.ok) {
      throw new Exception(ExceptionCode.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }

    return res;
  }
}
