import { beforeEach, describe, expect, it } from 'vitest';
import { JwtService } from 'src/services/jwt.service.js';

describe('JwtService (unit)', () => {
  const JWT_SECRET = 'test-secret';
  const JWT_EXPIRES_IN = 3600;

  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({ config: { JWT_SECRET, JWT_EXPIRES_IN } });
  });

  describe('sign', () => {
    it('signs a payload and returns a JWT token', async () => {
      const payload = { userId: '123', email: 'test@example.com' };

      const token = await jwtService.sign(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('includes the payload data in the token', async () => {
      const payload = { userId: '123', email: 'test@example.com' };

      const token = await jwtService.sign(payload);
      const decodedPayload = await jwtService.verify(token);

      expect(decodedPayload).toMatchObject(payload);
    });
  });

  describe('verify', () => {
    it('verifies a valid token and returns the payload', async () => {
      const payload = { userId: '123', role: 'user' };
      const token = await jwtService.sign(payload);

      const decodedPayload = await jwtService.verify(token);

      expect(decodedPayload).toMatchObject(payload);
      expect(decodedPayload.iat).toBeDefined();
      expect(decodedPayload.exp).toBeDefined();
    });

    it('throws an error when verifying an invalid token', async () => {
      const invalidToken = 'invalid.token.format';

      await expect(jwtService.verify(invalidToken)).rejects.toThrow();
    });

    it('throws an error when verifying a token with wrong secret', async () => {
      const wrongSecretService = new JwtService({ config: { JWT_SECRET: 'wrong-secret', JWT_EXPIRES_IN } });
      const payload = { userId: '123', email: 'test@example.com' };
      const token = await jwtService.sign(payload);

      await expect(wrongSecretService.verify(token)).rejects.toThrow();
    });

    it('throws an error when verifying an expired token', async () => {
      const shortExpiryService = new JwtService({ config: { JWT_SECRET, JWT_EXPIRES_IN: 1 } });
      const payload = { userId: '123', email: 'test@example.com' };
      const token = await shortExpiryService.sign(payload);

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      await expect(shortExpiryService.verify(token)).rejects.toThrow();
    });
  });

  describe('token expiration', () => {
    it('includes correct expiration time in the token', async () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const signTime = Math.floor(Date.now() / 1000);

      const token = await jwtService.sign(payload);
      const decodedPayload = await jwtService.verify(token);

      expect(decodedPayload.exp).toBeGreaterThan(signTime);
      expect(decodedPayload.exp).toBeLessThanOrEqual(signTime + JWT_EXPIRES_IN + 1);
    });
  });
});
