export interface CapturedImage {
  base64: string;
  width: number;
  height: number;
}

export async function captureElementAsPng(element: HTMLElement): Promise<CapturedImage | null> {
  const { default: html2canvas } = await import('html2canvas');
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    ignoreElements: (el) => el.classList.contains('sr-only'),
  });
  return {
    base64: canvas.toDataURL('image/png').split(',')[1],
    width: rect.width,
    height: rect.height,
  };
}
