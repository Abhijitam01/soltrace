export const runtime = 'edge';

import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import type { DecodedTransaction } from '@/lib/types';

const SYSTEM_PROMPT = `You are a Solana transaction analyzer. Given decoded transaction data, return ONLY valid JSON.
Format: { "riskScore": <integer 0-100>, "summary": "<2-3 sentences, plain English, no markdown>" }
IMPORTANT: Always output riskScore before summary in the JSON object.
Risk scoring: 0-25=routine swap, 26-50=unusual, 51-75=large approval/unknown program, 76-100=drainer/infinite approval.
Never output anything outside the JSON object.`;

interface ExplainBody {
  decodedTx: DecodedTransaction;
}

export async function POST(request: Request) {
  let body: ExplainBody;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { decodedTx } = body;
  if (!decodedTx) {
    return new Response(
      JSON.stringify({ error: 'decodedTx is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

  const userMessage = JSON.stringify({
    signature: decodedTx.signature,
    summary: decodedTx.summary,
    ammType: decodedTx.ammType,
    programIds: decodedTx.programIds,
    accountDiffs: decodedTx.diffs.slice(0, 20),
  });

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    abortSignal: AbortSignal.timeout(30000),
  });

  return result.toDataStreamResponse();
}
