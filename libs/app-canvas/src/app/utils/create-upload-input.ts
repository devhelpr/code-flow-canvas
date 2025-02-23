export const createUploadJSONFileInput = (): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    const input = document.createElement('input') as HTMLInputElement & {
      files: FileList;
    };

    input.oncancel = () => {
      reject('File dialog cancelled');
    };
    input.type = 'file';
    input.setAttribute('accept', 'application/JSON');
    input.onchange = () => {
      const files = Array.from(input.files);
      if (files && files.length > 0) {
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          if (event && event.target && event.target.result) {
            const data = JSON.parse(event.target.result.toString());
            console.log('IMPORT DATA', data);
            resolve(data);
          } else [reject('No file data found')];
        });
        reader.addEventListener('error', (event) => {
          console.error('Error reading file', event);
          reject(event);
        });
        reader.readAsText(files[0]);
      }
    };
    input.click();
  });
};
