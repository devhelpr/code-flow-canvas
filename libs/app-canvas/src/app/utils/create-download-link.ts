export const downloadJSON = (data: any, name: string) => {
  downloadFile(data, name, 'application/json');
};

export const downloadFile = (data: any, name: string, dataType: string) => {
  const blob = new Blob([data], { type: dataType });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = name;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export async function saveFile(
  data: any,
  name: string,
  dataType: string,
  extension: string,
  id: string
) {
  if ((window as any).showSaveFilePicker) {
    const handle = await (window as any).showSaveFilePicker({
      excludeAcceptAllOption: true,
      suggestedName: name,
      id: id,
      types: [
        {
          description: 'File',
          accept: {
            [dataType]: [extension],
          },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(data);
    writable.close();
    return Promise.resolve();
  } else {
    downloadFile(data, name + extension, dataType);
    return Promise.resolve();
  }
}
