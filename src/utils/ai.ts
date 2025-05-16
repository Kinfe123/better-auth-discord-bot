import OpenAI from 'openai';
import { ApiResponse } from './api';
import { chatHistory } from './chatHistory';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProcessedDoc {
  title: string;
  description: string;
  code: string;
  source: string;
  language: string;
}

function processMarkdownContent(docs: ApiResponse[]): ProcessedDoc[] {
  if (!Array.isArray(docs) || docs.length === 0) {
    return [];
  }

  return docs.map(doc => {
    // Clean up markdown content
    const cleanDescription = doc.description
      .replace(/\[!code highlight\]/g, '') // Remove code highlight markers
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks from description
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .trim();

    // Clean up code
    const cleanCode = doc.code
      .replace(/\[!code highlight\]/g, '') // Remove code highlight markers
      .trim();

    return {
      title: doc.title,
      description: cleanDescription,
      code: cleanCode,
      source: doc.source,
      language: doc.language || 'typescript'
    };
  });
}

function generateFallbackResponse(docs: ProcessedDoc[]): string {
  if (docs.length === 0) {
    return 'I couldn\'t find any relevant information in the documentation for your question. Please try rephrasing your question or check the official Better Auth documentation.';
  }

  // Find the most relevant doc based on title and description
  const mostRelevantDoc = docs[0];
  
  let response = `**${mostRelevantDoc.title}**\n\n`;
  response += `${mostRelevantDoc.description}\n\n`;
  
  if (mostRelevantDoc.code) {
    response += `Here's a code example:\n\`\`\`${mostRelevantDoc.language}\n${mostRelevantDoc.code}\n\`\`\`\n\n`;
  }
  
  response += `Source: ${mostRelevantDoc.source}\n\n`;
  response += `*Note: This is a simplified response. For more detailed information, please check the official Better Auth documentation.*`;
  
  return response;
}

export async function generateAIResponse(
  query: string, 
  docs: ApiResponse[], 
  userId: string, 
  channelId: string
): Promise<string> {
  try {
    // Process the documentation to clean up markdown and extract code
    const processedDocs = processMarkdownContent(docs);

    if (processedDocs.length === 0) {
      return 'I couldn\'t find any relevant information in the documentation for your question. Please try rephrasing your question or check the official Better Auth documentation.';
    }

    try {
      // Get chat history context
      const chatContext = chatHistory.getContext(userId, channelId);
      
      // Prepare the context from documentation
      const context = processedDocs.map(doc => `
Title: ${doc.title}
Description: ${doc.description}
${doc.code ? `Code Example (${doc.language}):
\`\`\`${doc.language}
${doc.code}
\`\`\`` : ''}
Source: ${doc.source}
`).join('\n---\n');

      const systemPrompt = `You are a specialized Better Auth documentation - better-auth.com or github.com/better-auth/better-auth assistant. Your role is to:
1. Provide accurate, documentation-based answers
2. Include relevant code examples when available
3. Format responses in clear, readable markdown
4. Reference the source documentation
5. Be concise but complete
6. Only use information from the provided documentation context
7. If the documentation doesn't contain the answer, say so clearly
8. Focus on practical implementation details and code examples
9. Consider the conversation history when providing context`;

      // Prepare messages array with chat history
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: systemPrompt
        }
      ];

      // Add chat history context
      chatContext.forEach(msg => {
        messages.push({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content
        });
      });

      // Add current query with documentation context
      messages.push({
        role: "user",
        content: `Given the following Better Auth documentation context and user query, provide a helpful response.

Documentation Context:
${context}

User Query: ${query}

Please structure your response as follows:
1. A direct answer to the question
2. Relevant code examples (if available)
3. Source references
4. Additional context or related information (if helpful)

Response:`
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.3,
        max_tokens: 1500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      const response = completion.choices[0].message.content;
      
      if (!response) {
        return generateFallbackResponse(processedDocs);
      }

      // Add the response to chat history
      chatHistory.addMessage(userId, channelId, 'assistant', response);
      
      return response;

    } catch (apiError: any) {
      console.error('OpenAI API Error:', apiError);
      
      // Check if it's a quota/rate limit error
      if (apiError.status === 429 || apiError.code === 'insufficient_quota') {
        console.log('Using fallback response due to API quota/rate limit');
        const fallbackResponse = generateFallbackResponse(processedDocs);
        chatHistory.addMessage(userId, channelId, 'assistant', fallbackResponse);
        return fallbackResponse;
      }
      
      throw apiError; // Re-throw other types of errors
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again later.';
  }
} 