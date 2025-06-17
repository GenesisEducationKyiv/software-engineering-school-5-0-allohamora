vitest.mock('src/services/send-email.service.js', async (importOriginal) => {
  const { ResendSendEmailService } = await importOriginal<typeof import('src/services/send-email.service.js')>();

  class MockResendSendEmailService extends ResendSendEmailService {
    public override sendEmail = vitest.fn();
  }

  return { ResendSendEmailService: MockResendSendEmailService };
});
