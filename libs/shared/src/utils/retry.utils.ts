type Executor<T, A extends unknown[]> = (...args: A) => Promise<T>;

export const retry = <T, A extends unknown[]>(executor: Executor<T, A>, times = 2) => {
  return (...args: A) => {
    return Array.from({ length: times }).reduce(
      (state: Promise<T>) => state.catch(() => executor(...args)),
      executor(...args),
    );
  };
};
