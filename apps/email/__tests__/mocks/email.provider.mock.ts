import { vitest } from 'vitest';

vitest.mock('src/services/email.service.js', async (importOriginal) => {
  const { EmailService } = await importOriginal<typeof import('src/services/email.service.js')>();

  class MockEmailService extends EmailService {
    public override sendEmail = vitest.fn();
  }

  return { EmailService: MockEmailService };
});
