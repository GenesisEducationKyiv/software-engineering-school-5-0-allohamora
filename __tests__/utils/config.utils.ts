import { ConfigService, Config } from 'src/services/config.service.js';

export const createConfigMock = (values: Partial<Config>) => {
  return {
    get: (key: keyof Config) => {
      const value = values[key];

      if (!(key in values)) {
        console.warn(`Config key "${key}" is not set in the mock.`);
      }

      return value;
    },
  } as ConfigService;
};
