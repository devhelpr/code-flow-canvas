import { ocif } from './ocif';

describe('ocif', () => {
  it('should create an ocif', () => {
    const ocifInstance = ocif();
    expect(ocifInstance).toBeDefined();
  });
});
