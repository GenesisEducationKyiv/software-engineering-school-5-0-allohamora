import './mocks/index.js';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { Container } from 'src/container.js';
import { createMockServer } from '__tests__/utils/mock-server.utils.js';

export const ctx = new Container();

const mockServer = createMockServer();

beforeAll(() => {
  mockServer.start();
});

afterEach(() => {
  mockServer.onUnhandledRequest.mockClear();
  mockServer.clearHandlers();
});

afterAll(() => mockServer.stop());

export { mockServer };
