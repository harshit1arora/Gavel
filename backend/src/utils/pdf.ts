export async function pdfParse(buffer: Buffer) {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    return await parser.getText();
  } finally {
    await parser.destroy();
  }
}
