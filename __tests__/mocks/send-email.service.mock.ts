vitest.mock('src/services/send-email.service.js', async (importOriginal) => {
  const { SendEmailService } = await importOriginal<typeof import('src/services/send-email.service.js')>();

  class MockSendEmailService extends SendEmailService {
    public override sendEmail = vitest.fn();
  }

  return { SendEmailService: MockSendEmailService };
});
