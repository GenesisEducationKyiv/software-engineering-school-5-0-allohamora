// https://github.com/microsoft/TypeScript/issues/471
type Interface<T> = {
  [P in keyof T]: T[P];
};

export const createMock = <T>(value: Interface<T>) => {
  return value as T;
};
