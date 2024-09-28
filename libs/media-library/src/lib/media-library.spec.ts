import { createMediaLibrary } from './media-library';

describe('mediaLibrary', () => {
  it('should create a defined instance', () => {
    const mediaLibrary = createMediaLibrary();
    expect(mediaLibrary).toBeDefined();
  });
});
