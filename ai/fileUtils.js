import mammoth from "mammoth";

// Converts a DOCX file (as ArrayBuffer) to plain text.
export async function convertDocxToText(arrayBuffer) {
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });
  return text;
}
