export interface MediaFileData {
  fileName: string;
  data: string;
}

export function createMediaLibrary() {
  const mediaLibrary: Record<string, MediaFileData> = {};
  return {
    storeFile: (codeFileName: string, file: MediaFileData) => {
      mediaLibrary[codeFileName] = file;
    },
    getFile: (codeFileName: string) => {
      const file = mediaLibrary[codeFileName];
      if (file) {
        return file;
      }
      return false;
    },
    deleteFile: (codeFileName: string) => {
      if (mediaLibrary[codeFileName]) {
        delete mediaLibrary[codeFileName];
        return true;
      }
      return false;
    },
  };
}

export type MediaLibrary = ReturnType<typeof createMediaLibrary>;
