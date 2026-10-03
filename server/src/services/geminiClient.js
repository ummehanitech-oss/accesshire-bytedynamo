import { GoogleGenAI } from '@google/genai';

/**
 * Safely parse JSON from model output, stripping codeblock backticks if present
 */
export function parseJsonSafely(text) {
  let cleaned = (text || '').trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  return JSON.parse(cleaned);
}

/**
 * Reusable helper to call Gemini and parse JSON response with 1 retry and friendly error messages.
 *
 * @param {object} options
 * @param {string} options.systemInstruction - Instructions for the model
 * @param {string} options.prompt - Prompt content
 * @param {number} [options.temperature] - Model temperature (default: 0.2)
 * @returns {Promise<object>} The parsed JSON object
 */
export async function generateJson({ systemInstruction, prompt, temperature = 0.2 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const error = new Error('GEMINI_API_KEY is not configured on the server. Please add your key to server/.env.');
    error.status = 500;
    error.statusCode = 500;
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const ai = new GoogleGenAI({ apiKey });

  const executeCall = async () => {
    return await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature
      }
    });
  };

  try {
    const response = await executeCall();
    const text = response.text || '';
    return parseJsonSafely(text);
  } catch (err1) {
    if (err1.status === 429 || (err1.message && err1.message.includes('429'))) {
      const err = new Error('Google AI rate limit reached. Please wait a moment and try again.');
      err.status = 429;
      err.statusCode = 429;
      throw err;
    }

    console.warn('First Gemini attempt failed, retrying once...', err1.message);
    try {
      const retryResponse = await executeCall();
      const text = retryResponse.text || '';
      return parseJsonSafely(text);
    } catch (err2) {
      if (err2.status === 429 || (err2.message && err2.message.includes('429'))) {
        const err = new Error('Google AI rate limit reached. Please wait a moment and try again.');
        err.status = 429;
        err.statusCode = 429;
        throw err;
      }
      const err = new Error('We could not read the AI response. Please try again.');
      err.status = 502;
      err.statusCode = 502;
      throw err;
    }
  }
}
