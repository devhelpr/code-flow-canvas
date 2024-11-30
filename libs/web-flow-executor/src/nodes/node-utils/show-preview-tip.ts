import { IDOMElement } from '@devhelpr/visual-programming-system';

export const showPreviewTip = (value: any, previewNode?: IDOMElement) => {
  if (previewNode) {
    const displayValue: string = isFinite(value)
      ? value.toFixed(2)
      : isNaN(value) || value === null || value == undefined
      ? '-'
      : value.toString();
    previewNode.domElement.textContent = displayValue;
    (previewNode.domElement as HTMLElement).classList.remove('hidden');
  }
};
