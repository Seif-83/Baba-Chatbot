declare module 'pdf-parse' {
  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: any
  ): Promise<{ text: string; numpages: number; info: any }>;
  export = pdfParse;
}

declare module 'mammoth' {
  export function extractRawText(input: {
    buffer?: Buffer;
    arrayBuffer?: ArrayBuffer;
  }): Promise<{ value: string; messages: any[] }>;
}
