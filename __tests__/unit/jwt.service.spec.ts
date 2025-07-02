import { JwtProvider } from 'src/domain/ports/jwt.provider.js';
import { FastJwtProvider } from 'src/infrastructure/adapters/jwt.provider.js';

describe('JwtService (unit)', () => {
  const JWT_SECRET = 'test-secret';
  const JWT_EXPIRES_IN = 3600;

  let jwtProvider: JwtProvider;

  beforeEach(() => {
    jwtProvider = new FastJwtProvider({ config: { JWT_SECRET, JWT_EXPIRES_IN } });
  });

  describe('sign', () => {
    it('signs a payload and returns a JWT token', async () => {
      const payload = { userId: '123', email: 'test@example.com' };

      const token = await jwtProvider.sign(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('includes the payload data in the token', async () => {
      const payload = { userId: '123', email: 'test@example.com' };

      const token = await jwtProvider.sign(payload);
      const decodedPayload = await jwtProvider.verify(token);

      expect(decodedPayload).toMatchObject(payload);
    });
  });

  describe('verify', () => {
    it('verifies a valid token and returns the payload', async () => {
      const payload = { userId: '123', role: 'user' };
      const token = await jwtProvider.sign(payload);

      const decodedPayload = await jwtProvider.verify(token);

      expect(decodedPayload).toMatchObject(payload);
      expect(decodedPayload.iat).toBeDefined();
      expect(decodedPayload.exp).toBeDefined();
    });

    it('throws an error when verifying an invalid token', async () => {
      const invalidToken = 'invalid.token.format';

      await expect(jwtProvider.verify(invalidToken)).rejects.toThrow();
    });

    it('throws an error when verifying a token with wrong secret', async () => {
      const payload = { userId: '123' };
      const jwtServiceWithDifferentSecret = new FastJwtProvider({
        config: { JWT_SECRET: 'different-secret', JWT_EXPIRES_IN },
      });
      const token = await jwtProvider.sign(payload);

      await expect(jwtServiceWithDifferentSecret.verify(token)).rejects.toThrow();
    });

    it('throws an error when verifying an expired token', async () => {
      const payload = { userId: '123' };
      const jwtServiceWithShortExpiry = new FastJwtProvider({ config: { JWT_SECRET, JWT_EXPIRES_IN: -1 } });
      const token = await jwtServiceWithShortExpiry.sign(payload);

      await expect(jwtServiceWithShortExpiry.verify(token)).rejects.toThrow();
    });
  });
});
