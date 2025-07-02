vitest.mock('src/infrastructure/providers/email.provider.js', async (importOriginal) => {
  const { ResendEmailProvider } =
    await importOriginal<typeof import('src/infrastructure/adapters/email.provider.js')>();

  class MockResendEmailProvider extends ResendEmailProvider {
    public override sendEmail = vitest.fn();
  }

  return { ResendEmailProvider: MockResendEmailProvider };
});
