vitest.mock('src/services/email.service.js', async (importOriginal) => {
  const { ResendEmailService } = await importOriginal<typeof import('src/services/email.service.js')>();

  class MockResendEmailService extends ResendEmailService {
    public override sendEmail = vitest.fn();
  }

  return { ResendEmailService: MockResendEmailService };
});
