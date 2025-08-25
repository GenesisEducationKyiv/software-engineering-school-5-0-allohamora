import { describe, it, expect } from 'vitest';
import { filesOfProject } from 'tsarch';
import 'tsarch/dist/jest';

describe('Notification Architecture', () => {
  it('services are cycle free', () => {
    const rule = filesOfProject().inFolder('src/services').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });
});
