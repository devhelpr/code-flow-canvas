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
