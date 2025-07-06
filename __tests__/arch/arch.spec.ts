import { filesOfProject } from 'tsarch';
import 'tsarch/dist/jest';

describe('Project Architecture', () => {
  it('domain does not depend on secondary adapters', () => {
    const rule = filesOfProject().inFolder('src/domain').shouldNot().dependOnFiles().inFolder('src/secondary');

    expect(rule).toPassAsync();
  });

  it('domain does not depend on primary adapters', () => {
    const rule = filesOfProject().inFolder('src/domain').shouldNot().dependOnFiles().inFolder('src/primary');

    expect(rule).toPassAsync();
  });

  it('domain is cycle free', () => {
    const rule = filesOfProject().inFolder('src/domain').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });

  it('primary is cycle free', () => {
    const rule = filesOfProject().inFolder('src/primary').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });

  it('secondary is cycle free', () => {
    const rule = filesOfProject().inFolder('src/secondary').should().beFreeOfCycles();

    expect(rule).toPassAsync();
  });

  it('primary does not depend on services directly', () => {
    const rule = filesOfProject()
      .matchingPattern('src/primary')
      .shouldNot()
      .dependOnFiles()
      .matchingPattern('src/domain/services');

    expect(rule).toPassAsync();
  });

  it('secondary does not depend on services directly', () => {
    const rule = filesOfProject()
      .matchingPattern('src/primary')
      .shouldNot()
      .dependOnFiles()
      .matchingPattern('src/domain/services');

    expect(rule).toPassAsync();
  });
});
