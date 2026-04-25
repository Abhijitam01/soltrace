import { NextRequest, NextResponse } from 'next/server';
import { decodeTransaction } from '@/lib/decoder';
import { getRecentAnalyses } from '@/lib/turso';
import { DecodeError } from '@/lib/errors';

const SIG_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sig = searchParams.get('sig');

  if (sig === 'recent') {
    const analyses = await getRecentAnalyses(10);
    return NextResponse.json(analyses);
  }

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing sig parameter', code: 'INVALID_SIG' },
      { status: 400 }
    );
  }

  if (!SIG_PATTERN.test(sig)) {
    return NextResponse.json(
      { error: 'Invalid transaction signature format', code: 'INVALID_SIG' },
      { status: 400 }
    );
  }

  try {
    const decoded = await decodeTransaction(sig);
    return NextResponse.json(decoded);
  } catch (err) {
    if (err instanceof DecodeError) {
      const status =
        err.code === 'INVALID_SIG'
          ? 400
          : err.code === 'NOT_FOUND'
          ? 404
          : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json(
      { error: 'Internal server error', code: 'UNKNOWN' },
      { status: 500 }
    );
  }
}
