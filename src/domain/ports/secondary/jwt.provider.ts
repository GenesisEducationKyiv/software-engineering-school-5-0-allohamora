export interface JwtProvider {
  verify<T extends Record<string, unknown>>(jwt: string): Promise<T>;
  sign<T extends Record<string, unknown>>(payload: T): Promise<string>;
}
