import { describe, it, expect } from 'vitest';
import { filesOfProject } from 'tsarch';
import 'tsarch/dist/jest';

describe('Subscription Service Architecture', () => {
  it('services do not depend on controllers', () => {
    const rule = filesOfProject().inFolder('src/services').shouldNot().dependOnFiles().inFolder('src/controllers');

    expect(rule).toPassAsync();
  });

  it('services are cycle free', () => {
    const rule = filesOfProject().inFolder('src/services').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });

  it('repositories are cycle free', () => {
    const rule = filesOfProject().inFolder('src/repositories').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });

  it('controllers are cycle free', () => {
    const rule = filesOfProject().inFolder('src/controllers').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });
});
