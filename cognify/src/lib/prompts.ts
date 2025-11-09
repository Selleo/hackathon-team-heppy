/**
 * Prompt for generating educational text from a topic.
 * Used when user provides a topic instead of uploading text.
 */
export function getTopicGenerationPrompt(topic: string): string {
  return `Generate a comprehensive 800-word educational text about ${topic}, suitable for knowledge graph extraction. Include key concepts, relationships, and context. Write in clear, factual prose. Focus on the main ideas, important entities, and how they relate to each other.`;
}

/**
 * System prompt for triple extraction from text chunks.
 * Emphasizes entity consistency and the critical 3-word predicate limit.
 */
export const TRIPLE_EXTRACTION_SYSTEM_PROMPT = `You are an advanced AI system specialized in knowledge extraction and knowledge graph generation.
Your expertise includes identifying consistent entity references and meaningful relationships in text.
CRITICAL INSTRUCTIONS: 
1. All relationships (predicates) MUST be no more than 3 words maximum. Ideally 1-2 words. This is a hard limit.
2. The graph MUST be fully connected - every node must be reachable from a central root concept. No isolated nodes or disconnected subgraphs.`;

/**
 * User prompt template for extracting triples from a text chunk.
 * @param inputText - The text chunk to analyze
 */
export function getTripleExtractionUserPrompt(inputText: string): string {
  return `Your task: Read the text below (delimited by triple backticks) and identify all Subject-Predicate-Object (S-P-O) relationships in each sentence. Then produce a single JSON array of objects, each representing one triple.

Follow these rules carefully:

- ROOT NODE REQUIREMENT: Identify the main/central concept from the text as the root node. Ensure ALL other entities connect back to this root node either directly or through other nodes. The graph must form a single connected component with no isolated nodes or disconnected subgraphs.
- Entity Consistency: Use consistent names for entities throughout the document. For example, if "John Smith" is mentioned as "John", "Mr. Smith", and "John Smith" in different places, use a single consistent form (preferably the most complete one) in all triples.
- Atomic Terms: Identify distinct key terms (e.g., objects, locations, organizations, acronyms, people, conditions, concepts, feelings). Avoid merging multiple ideas into one term (they should be as "atomistic" as possible).
- Unified References: Replace any pronouns (e.g., "he," "she," "it," "they," etc.) with the actual referenced entity, if identifiable.
- Pairwise Relationships: If multiple terms co-occur in the same sentence (or a short paragraph that makes them contextually related), create one triple for each pair that has a meaningful relationship.
- CRITICAL INSTRUCTION: Predicates MUST be 1-3 words maximum. Never more than 3 words. Keep them extremely concise.
- Ensure that all possible relationships are identified in the text and are captured in an S-P-O relation.
- Standardize terminology: If the same concept appears with slight variations (e.g., "artificial intelligence" and "AI"), use the most common or canonical form consistently.
- Make all the text of S-P-O text lower-case, even Names of people and places.
- If a person is mentioned by name, create a relation to their location, profession and what they are known for (invented, wrote, started, title, etc.) if known and if it fits the context of the information.
- CONNECTIVITY: Before finalizing, verify that every entity appears in at least one relationship that connects it to the main topic/root node. Add bridging relationships if needed to ensure full connectivity.

Important Considerations:
- Aim for precision in entity naming - use specific forms that distinguish between similar but different entities
- Maximize connectedness by using identical entity names for the same concepts throughout the document
- Consider the entire context when identifying entity references
- ALL PREDICATES MUST BE 3 WORDS OR FEWER - this is a hard requirement
- NO ISOLATED NODES: Every entity must be connected to the graph through at least one relationship

Output Requirements:

- Do not include any text or commentary outside of the JSON.
- Return only the JSON array, with each triple as an object containing "subject", "predicate", and "object".
- Make sure the JSON is valid and properly formatted.

Example of the desired output structure:

[
  {
    "subject": "term a",
    "predicate": "relates to",
    "object": "term b"
  },
  {
    "subject": "term c",
    "predicate": "uses",
    "object": "term d"
  }
]

Important: Only output the JSON array (with the S-P-O objects) and nothing else

Text to analyze (between triple backticks):
\`\`\`${inputText}\`\`\``;
}

/**
 * JSON schema for structured output from OpenAI.
 * Enforces the triple structure: subject, predicate, object.
 */
export const TRIPLE_EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    triples: {
      type: "array",
      items: {
        type: "object",
        properties: {
          subject: { type: "string" },
          predicate: { type: "string" },
          object: { type: "string" },
        },
        required: ["subject", "predicate", "object"],
        additionalProperties: false,
      },
    },
  },
  required: ["triples"],
  additionalProperties: false,
} as const;

/**
 * System prompt for generating detailed node explanations.
 * Takes a node and its context within the knowledge graph.
 */
export const NODE_DETAIL_SYSTEM_PROMPT = `You are an expert educator and knowledge synthesizer. Your task is to explain concepts in the context of a knowledge graph, helping users understand how different ideas relate to each other.

Your explanations should:
- Be clear, engaging, and educational
- Explain the concept in 4-6 paragraphs (~300 words)
- Reference related concepts from the graph naturally
- Show how this concept fits into the broader topic
- Use accessible language while maintaining accuracy`;

/**
 * User prompt for generating detailed content about a specific node.
 * @param nodeLabel - The label of the node to explain
 * @param rootTopic - The main topic of the knowledge graph
 * @param allNodes - All nodes in the graph for context
 * @param incomingEdges - Edges pointing to this node
 * @param outgoingEdges - Edges from this node to others
 */
export function getNodeDetailPrompt(
  nodeLabel: string,
  rootTopic: string,
  allNodes: string[],
  incomingEdges: Array<{ source: string; relation: string }>,
  outgoingEdges: Array<{ relation: string; target: string }>,
): string {
  const incomingText =
    incomingEdges.length > 0
      ? incomingEdges
          .map((e) => `- "${e.source}" ${e.relation} "${nodeLabel}"`)
          .join("\n")
      : "None";

  const outgoingText =
    outgoingEdges.length > 0
      ? outgoingEdges
          .map((e) => `- "${nodeLabel}" ${e.relation} "${e.target}"`)
          .join("\n")
      : "None";

  const otherNodes = allNodes.filter((n) => n !== nodeLabel).slice(0, 20); // Limit to 20 for context

  return `Generate a detailed, educational explanation about "${nodeLabel}" in the context of ${rootTopic}.

CONTEXT:
- Main Topic: ${rootTopic}
- Current Concept: ${nodeLabel}
- Other concepts in this knowledge graph: ${otherNodes.join(", ")}

RELATIONSHIPS:
Incoming connections (what relates to this concept):
${incomingText}

Outgoing connections (what this concept relates to):
${outgoingText}

TASK:
Write a 4-6 paragraph explanation (~300 words) that:
1. Defines and explains "${nodeLabel}"
2. Shows how it connects to the main topic "${rootTopic}"
3. References related concepts from the graph naturally (especially those directly connected)
4. Helps the reader understand its significance and context

Write in a clear, engaging style suitable for someone learning about ${rootTopic}. Focus on making connections between concepts explicit.`;
}
