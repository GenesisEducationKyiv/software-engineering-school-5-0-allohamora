import { describe, it, expect } from 'vitest';
import { filesOfProject } from 'tsarch';
import 'tsarch/dist/jest';

describe('Email Service Architecture', () => {
  it('templates do not depend on services', () => {
    const rule = filesOfProject().inFolder('src/templates').shouldNot().dependOnFiles().inFolder('src/services');

    expect(rule).toPassAsync();
  });

  it('templates do not depend on controllers', () => {
    const rule = filesOfProject().inFolder('src/templates').shouldNot().dependOnFiles().inFolder('src/controllers');

    expect(rule).toPassAsync();
  });

  it('services do not depend on controllers', () => {
    const rule = filesOfProject().inFolder('src/services').shouldNot().dependOnFiles().inFolder('src/controllers');

    expect(rule).toPassAsync();
  });

  it('controllers do not depend on templates', () => {
    const rule = filesOfProject().inFolder('src/controllers').shouldNot().dependOnFiles().inFolder('src/templates');

    expect(rule).toPassAsync();
  });

  it('services are cycle free', () => {
    const rule = filesOfProject().inFolder('src/services').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });

  it('controllers are cycle free', () => {
    const rule = filesOfProject().inFolder('src/controllers').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });

  it('templates are cycle free', () => {
    const rule = filesOfProject().inFolder('src/templates').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });
});
