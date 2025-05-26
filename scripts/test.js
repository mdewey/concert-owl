
console.log('lets go', new Date()); // eslint-disable-line no-console

// change this to a require
import { GoogleGenAI } from '@google/genai';

import { ConcertOwl } from '../src/concert-owl.js';
const { GEMINI_API_KEY } = process.env;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Calls the  AI works and logs the response.
 */
async function main() {
  // const response = await ai.models.generateContent({
  //   model: 'gemini-2.0-flash',
  //   contents: 'In three words, what genre are the Bands Vulfpeck, arc de soliel',
  // });
  // console.log(response.text);
  const results = await ConcertOwl.pushWeeklySummaryV2()
}
main();
