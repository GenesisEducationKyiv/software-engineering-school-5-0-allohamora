import { describe, it, expect } from 'vitest';
import { filesOfProject } from 'tsarch';
import 'tsarch/dist/jest';

describe('Subscription Service Architecture', () => {
  it('services is cycle free', () => {
    const rule = filesOfProject().inFolder('src/services').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });

  it('providers is cycle free', () => {
    const rule = filesOfProject().inFolder('src/providers').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });

  it('controllers is cycle free', () => {
    const rule = filesOfProject().inFolder('src/controllers').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });
});
