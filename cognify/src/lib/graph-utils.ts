import crypto from "crypto";

/**
 * Generate a deterministic node ID from an entity label.
 * Uses SHA256 hash of normalized label, truncated to 16 characters.
 */
export function generateNodeId(label: string): string {
  const normalized = label.toLowerCase().trim();
  return crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Chunk text into word-based segments with overlap.
 * @param text - The input text to chunk
 * @param chunkSize - Number of words per chunk
 * @param overlap - Number of overlapping words between chunks
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  chunkSize: number,
  overlap: number,
): string[] {
  // Split text into words, preserving whitespace patterns
  const words = text.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) return [];
  if (words.length <= chunkSize) return [text];

  const chunks: string[] = [];
  let startIdx = 0;

  while (startIdx < words.length) {
    const endIdx = Math.min(startIdx + chunkSize, words.length);
    const chunk = words.slice(startIdx, endIdx).join(" ");
    chunks.push(chunk);

    // Move start index forward by (chunkSize - overlap)
    // If we're at the end, break to avoid infinite loop
    if (endIdx === words.length) break;
    startIdx += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Normalize an entity string for consistency.
 * - Lowercase
 * - Trim whitespace
 * - Remove common stopwords
 */
export function normalizeEntity(entity: string): string {
  const stopwords = new Set([
    "the",
    "a",
    "an",
    "of",
    "and",
    "or",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "as",
    "is",
    "was",
    "are",
    "were",
  ]);

  const words = entity
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !stopwords.has(word));

  return words.join(" ");
}

/**
 * Enforce maximum word count for predicates (3 words max).
 * Removes trailing stopwords if needed.
 */
export function limitPredicateLength(predicate: string, maxWords = 3): string {
  const words = predicate.trim().split(/\s+/);

  if (words.length <= maxWords) {
    return predicate.trim();
  }

  // Take first maxWords
  let shortened = words.slice(0, maxWords);

  // Remove trailing stopwords
  const trailingStopwords = new Set([
    "a",
    "an",
    "the",
    "of",
    "with",
    "by",
    "to",
    "from",
    "in",
    "on",
    "for",
  ]);

  while (
    shortened.length > 1 &&
    trailingStopwords.has(shortened[shortened.length - 1]!.toLowerCase())
  ) {
    shortened = shortened.slice(0, -1);
  }

  return shortened.join(" ");
}

/**
 * Extract JSON from LLM response text.
 * Handles code blocks, partial responses, and malformed JSON.
 */
export function extractJsonFromText(text: string): unknown {
  if (!text || text.trim().length === 0) {
    return null;
  }

  let jsonText = text.trim();

  // Step 1: Check for code blocks with triple backticks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const codeBlockMatch = codeBlockRegex.exec(jsonText);

  if (codeBlockMatch?.[1]) {
    jsonText = codeBlockMatch[1].trim();
  }

  // Step 2: Try direct JSON parse
  try {
    return JSON.parse(jsonText) as unknown;
  } catch {
    // Continue to more robust extraction
  }

  // Step 3: Find JSON array boundaries
  const startIdx = jsonText.indexOf("[");
  if (startIdx === -1) {
    // Try to find object boundaries
    const objStartIdx = jsonText.indexOf("{");
    if (objStartIdx === -1) {
      return null;
    }

    // Find matching closing brace
    let braceCount = 0;
    for (let i = objStartIdx; i < jsonText.length; i++) {
      if (jsonText[i] === "{") braceCount++;
      if (jsonText[i] === "}") braceCount--;
      if (braceCount === 0) {
        const objStr = jsonText.slice(objStartIdx, i + 1);
        try {
          return JSON.parse(objStr) as unknown;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  // Step 4: Count brackets to find matching ']'
  let bracketCount = 0;
  for (let i = startIdx; i < jsonText.length; i++) {
    if (jsonText[i] === "[") bracketCount++;
    if (jsonText[i] === "]") bracketCount--;
    if (bracketCount === 0) {
      const jsonStr = jsonText.slice(startIdx, i + 1);
      try {
        return JSON.parse(jsonStr) as unknown;
      } catch {
        // Step 5: Try to fix common issues
        let fixed = jsonStr;

        // Remove trailing commas before closing brackets/braces
        fixed = fixed.replace(/,(\s*[}\]])/g, "$1");

        try {
          return JSON.parse(fixed) as unknown;
        } catch {
          // Last resort: try to extract complete objects
          return extractCompleteObjects(jsonStr);
        }
      }
    }
  }

  // Step 6: If incomplete, extract complete objects
  return extractCompleteObjects(jsonText.slice(startIdx));
}

/**
 * Extract complete JSON objects from potentially incomplete text.
 * Used as a fallback when the JSON array is incomplete.
 */
function extractCompleteObjects(text: string): unknown {
  const objects: unknown[] = [];
  let braceCount = 0;
  let objStart = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      if (braceCount === 0) objStart = i;
      braceCount++;
    }
    if (text[i] === "}") {
      braceCount--;
      if (braceCount === 0 && objStart !== -1) {
        const objStr = text.slice(objStart, i + 1);
        try {
          const obj = JSON.parse(objStr) as unknown;
          objects.push(obj);
        } catch {
          // Skip invalid objects
        }
        objStart = -1;
      }
    }
  }

  return objects.length > 0 ? objects : null;
}
