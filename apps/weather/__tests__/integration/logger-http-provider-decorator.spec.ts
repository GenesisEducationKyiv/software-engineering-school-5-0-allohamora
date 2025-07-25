import * as fsp from 'node:fs/promises';
import { http, HttpResponse } from 'msw';
import { createMockServer } from '__tests__/utils/mock-server.utils.js';
import { scheduler } from 'node:timers/promises';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, MockInstance, vitest } from 'vitest';
import { LoggerHttpProviderDecorator } from 'src/providers/http/logger.provider.js';
import { FetchHttpProvider } from 'src/providers/http/fetch.provider.js';

vitest.mock('node:fs/promises', () => ({
  appendFile: vitest.fn(),
}));

describe('LoggerHttpProviderDecorator (integration)', () => {
  let appendFileMock: MockInstance;

  const mockServer = createMockServer();

  beforeAll(() => {
    mockServer.start();
  });

  beforeEach(() => {
    appendFileMock = vitest.spyOn(fsp, 'appendFile').mockImplementation(vitest.fn());
  });

  afterEach(() => {
    // here is the solution used https://github.com/mswjs/msw/issues/946#issuecomment-1572768939
    expect(mockServer.onUnhandledRequest).not.toHaveBeenCalled();
    mockServer.onUnhandledRequest.mockClear();

    mockServer.clearHandlers();

    appendFileMock.mockRestore();
  });

  afterAll(() => {
    mockServer.stop();
  });

  const writeLogDelay = async () => {
    await scheduler.wait(0);
  };

  describe('when logging is enabled', () => {
    let loggerHttpProvider: LoggerHttpProviderDecorator;

    beforeEach(() => {
      loggerHttpProvider = new LoggerHttpProviderDecorator(new FetchHttpProvider(), {
        config: { WRITE_LOGS_TO_FILES: true },
      });
    });

    it('calls the underlying HTTP provider', async () => {
      const mockResponseData = { data: 'test' };

      mockServer.addHandlers(
        http.get('https://api.example.com', () => {
          return HttpResponse.json(mockResponseData);
        }),
      );

      const response = await loggerHttpProvider.get({
        url: 'https://api.example.com',
        params: { q: 'test' },
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData).toEqual(mockResponseData);
    });

    it('logs the response when logging is enabled', async () => {
      const mockResponseData = { weather: 'sunny', temperature: 25 };

      mockServer.addHandlers(
        http.get('https://api.example.com/weather', () => {
          return HttpResponse.json(mockResponseData);
        }),
      );

      const response = await loggerHttpProvider.get({
        url: 'https://api.example.com/weather',
        params: { city: 'London' },
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData).toEqual(mockResponseData);

      await writeLogDelay();

      expect(appendFileMock).toHaveBeenCalledWith(
        expect.stringMatching(/\.temp\/\d+\.txt$/),
        `"https://api.example.com/weather?city=London - Response: ${JSON.stringify(mockResponseData)}"`,
      );
    });

    it('handles responses with different content types', async () => {
      const xmlResponse = '<weather><temperature>25</temperature><condition>sunny</condition></weather>';

      mockServer.addHandlers(
        http.get('https://api.example.com/weather.xml', () => {
          return new HttpResponse(xmlResponse, {
            headers: { 'Content-Type': 'application/xml' },
          });
        }),
      );

      const response = await loggerHttpProvider.get({
        url: 'https://api.example.com/weather.xml',
      });

      expect(response.ok).toBe(true);
      expect(await response.text()).toBe(xmlResponse);

      await writeLogDelay();

      expect(appendFileMock).toHaveBeenCalledWith(
        expect.stringMatching(/\.temp\/\d+\.txt$/),
        `"https://api.example.com/weather.xml - Response: ${xmlResponse}"`,
      );
    });

    it('handles empty responses', async () => {
      mockServer.addHandlers(
        http.get('https://api.example.com/resource', () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const response = await loggerHttpProvider.get({
        url: 'https://api.example.com/resource',
      });

      expect(response.status).toBe(204);

      await writeLogDelay();

      expect(appendFileMock).toHaveBeenCalledWith(
        expect.stringMatching(/\.temp\/\d+\.txt$/),
        '"https://api.example.com/resource - Response: "',
      );
    });

    it('clones the response to avoid consuming the original stream', async () => {
      const mockResponseData = { data: 'test' };

      mockServer.addHandlers(
        http.get('https://api.example.com', () => {
          return HttpResponse.json(mockResponseData);
        }),
      );

      const response = await loggerHttpProvider.get({
        url: 'https://api.example.com',
      });

      const firstRead = await response.clone().json();
      const secondRead = await response.json();

      expect(firstRead).toEqual(mockResponseData);
      expect(secondRead).toEqual(mockResponseData);

      await writeLogDelay();

      expect(appendFileMock).toHaveBeenCalledWith(
        expect.stringMatching(/\.temp\/\d+\.txt$/),
        `"https://api.example.com/ - Response: ${JSON.stringify(mockResponseData)}"`,
      );
    });
  });

  describe('when logging is disabled', () => {
    let loggerHttpProvider: LoggerHttpProviderDecorator;

    beforeEach(() => {
      loggerHttpProvider = new LoggerHttpProviderDecorator(new FetchHttpProvider(), {
        config: { WRITE_LOGS_TO_FILES: false },
      });
    });

    it('calls the underlying HTTP provider without logging', async () => {
      const mockResponseData = { weather: 'cloudy' };

      mockServer.addHandlers(
        http.get('https://api.example.com/weather', () => {
          return HttpResponse.json(mockResponseData);
        }),
      );

      const response = await loggerHttpProvider.get({
        url: 'https://api.example.com/weather',
      });

      expect(response.ok).toBe(true);
      const responseData = await response.json();
      expect(responseData).toEqual(mockResponseData);

      await writeLogDelay();

      expect(appendFileMock).not.toHaveBeenCalled();
    });

    it('does not clone the response when logging is disabled', async () => {
      const mockResponseData = { data: 'test' };

      mockServer.addHandlers(
        http.get('https://api.example.com', () => {
          return HttpResponse.json(mockResponseData);
        }),
      );

      const response = await loggerHttpProvider.get({
        url: 'https://api.example.com',
      });

      expect(response.ok).toBe(true);
      const responseData = await response.json();
      expect(responseData).toEqual(mockResponseData);

      expect(appendFileMock).not.toHaveBeenCalled();
    });
  });
});
