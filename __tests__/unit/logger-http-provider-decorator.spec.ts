import * as fsp from 'node:fs/promises';
import { LoggerHttpProviderDecorator } from 'src/providers/http/logger.provider.js';
import { HttpProvider, GetOptions } from 'src/providers/http/http.provider.js';
import { createConfigMock } from '__tests__/utils/config.utils.js';
import { MockedFunction, MockInstance } from 'vitest';
import { createMock } from '__tests__/utils/mock.utils.js';
import { scheduler } from 'node:timers/promises';

vitest.mock('node:fs/promises', () => ({
  appendFile: vitest.fn(),
}));

describe('LoggerHttpProviderDecorator (unit)', () => {
  let httpGetMock: MockedFunction<HttpProvider['get']>;
  let appendFileMock: MockInstance;

  beforeEach(() => {
    appendFileMock = vitest.spyOn(fsp, 'appendFile').mockImplementation(vitest.fn());
    httpGetMock = vitest.fn();
  });

  afterEach(() => {
    appendFileMock.mockRestore();
    httpGetMock.mockRestore();
  });

  const createResponse = ({ url, body, init }: { url: string; body?: BodyInit | null; init?: ResponseInit }) => {
    const response = new Response(body, init);

    // we cannot pass url directly to the Response constructor,
    // so we need to set it manually to ensure the URL is correct
    // https://stackoverflow.com/a/57382543
    Object.defineProperty(response, 'url', {
      value: url,
      writable: false,
    });

    // clone method doesn't pass url
    // so we need to pass it manually to avoid url: '' in the cloned response
    // https://stackoverflow.com/a/79478897
    response.clone = () => response;

    return response;
  };

  const writeLogDelay = async () => {
    await scheduler.wait(0);
  };

  describe('when logging is enabled', () => {
    let loggerHttpProvider: LoggerHttpProviderDecorator;

    beforeEach(() => {
      loggerHttpProvider = new LoggerHttpProviderDecorator(
        createMock<HttpProvider>({ get: httpGetMock }),
        createConfigMock({ WRITE_LOGS_TO_FILES: true }),
      );
    });

    it('calls the underlying HTTP provider', async () => {
      const options: GetOptions = { url: 'https://api.example.com', params: { q: 'test' } };
      const mockResponse = createResponse({
        url: 'https://api.example.com?q=test',
        body: '{"data": "test"}',
        init: { status: 200, statusText: 'OK', headers: { 'Content-Type': 'application/json' } },
      });

      httpGetMock.mockResolvedValue(mockResponse);

      const result = await loggerHttpProvider.get(options);

      expect(httpGetMock).toHaveBeenCalledWith(options);
      expect(result).toBe(mockResponse);
    });

    it('logs the response when logging is enabled', async () => {
      const options: GetOptions = { url: 'https://api.example.com' };
      const mockResponse = createResponse({
        url: 'https://api.example.com',
        body: '{"weather": "sunny"}',
        init: { status: 200, statusText: 'OK' },
      });

      httpGetMock.mockResolvedValue(mockResponse);

      await loggerHttpProvider.get(options);

      await writeLogDelay();

      expect(appendFileMock).toHaveBeenCalledWith(
        expect.stringMatching(/\.temp\/\d+\.txt$/),
        `"https://api.example.com - Response: {"weather": "sunny"}"`,
      );
    });

    it('handles responses with different content types', async () => {
      const options: GetOptions = { url: 'https://api.example.com/xml' };
      const mockResponse = createResponse({
        url: 'https://api.example.com/xml',
        body: '<xml><data>test</data></xml>',
        init: { status: 200, statusText: 'OK', headers: { 'Content-Type': 'application/xml' } },
      });

      httpGetMock.mockResolvedValue(mockResponse);

      await loggerHttpProvider.get(options);

      await writeLogDelay();

      expect(appendFileMock).toHaveBeenCalledWith(
        expect.stringMatching(/\.temp\/\d+\.txt$/),
        `"https://api.example.com/xml - Response: <xml><data>test</data></xml>"`,
      );
    });

    it('handles empty responses', async () => {
      const options: GetOptions = { url: 'https://api.example.com/empty' };
      const mockResponse = createResponse({
        url: 'https://api.example.com/empty',
        body: null,
        init: { status: 204, statusText: 'No Content' },
      });

      httpGetMock.mockResolvedValue(mockResponse);

      await loggerHttpProvider.get(options);

      await writeLogDelay();

      expect(appendFileMock).toHaveBeenCalledWith(
        expect.stringMatching(/\.temp\/\d+\.txt$/),
        '"https://api.example.com/empty - Response: "',
      );
    });

    it('clones the response to avoid consuming the original stream', async () => {
      const options: GetOptions = { url: 'https://api.example.com' };
      const mockResponse = createResponse({
        url: 'https://api.example.com',
        body: '{"data": "test"}',
        init: { status: 200, statusText: 'OK' },
      });

      const cloneSpy = vitest.spyOn(mockResponse, 'clone');
      httpGetMock.mockResolvedValue(mockResponse);

      const result = await loggerHttpProvider.get(options);

      await writeLogDelay();

      expect(cloneSpy).toHaveBeenCalled();
      expect(result).toBe(mockResponse);

      cloneSpy.mockRestore();
    });
  });

  describe('when logging is disabled', () => {
    let loggerHttpProvider: LoggerHttpProviderDecorator;

    beforeEach(() => {
      loggerHttpProvider = new LoggerHttpProviderDecorator(
        createMock<HttpProvider>({ get: httpGetMock }),
        createConfigMock({ WRITE_LOGS_TO_FILES: false }),
      );
    });

    it('calls the underlying HTTP provider without logging', async () => {
      const options: GetOptions = { url: 'https://api.example.com' };
      const mockResponse = createResponse({
        url: 'https://api.example.com',
        body: '{"data": "test"}',
        init: { status: 200, statusText: 'OK' },
      });

      httpGetMock.mockResolvedValue(mockResponse);

      const result = await loggerHttpProvider.get(options);

      expect(httpGetMock).toHaveBeenCalledWith(options);
      expect(result).toBe(mockResponse);
      expect(appendFileMock).not.toHaveBeenCalled();
    });

    it('does not clone the response when logging is disabled', async () => {
      const options: GetOptions = { url: 'https://api.example.com' };
      const mockResponse = createResponse({
        url: 'https://api.example.com',
        body: '{"data": "test"}',
        init: { status: 200, statusText: 'OK' },
      });

      const cloneSpy = vitest.spyOn(mockResponse, 'clone');
      httpGetMock.mockResolvedValue(mockResponse);

      await loggerHttpProvider.get(options);

      expect(cloneSpy).not.toHaveBeenCalled();
      expect(appendFileMock).not.toHaveBeenCalled();
    });
  });
});
