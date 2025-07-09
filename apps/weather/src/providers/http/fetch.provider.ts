import { Exception } from 'src/exception.js';
import { HttpProvider, BuildUrlOptions, GetOptions } from './http.provider.js';

export class FetchHttpProvider implements HttpProvider {
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
      throw Exception.InternalServerError('Something went wrong');
    }

    return res;
  }
}
