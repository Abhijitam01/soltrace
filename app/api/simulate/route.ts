import { NextRequest, NextResponse } from 'next/server';
import { simulateConstantProduct } from '@/lib/simulator';
import { SimulateError } from '@/lib/errors';
import type { AccountDiff, AmmType } from '@/lib/types';

interface SimulateBody {
  diffs: AccountDiff[];
  multiplier: number;
  ammType: AmmType;
}

export async function POST(request: NextRequest) {
  let body: SimulateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  const { diffs, multiplier, ammType } = body;

  if (!Array.isArray(diffs)) {
    return NextResponse.json(
      { error: 'diffs must be an array', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  if (typeof multiplier !== 'number' || multiplier < 0.1 || multiplier > 3.0) {
    return NextResponse.json(
      { error: 'multiplier must be between 0.1 and 3.0', code: 'INVALID_MULTIPLIER' },
      { status: 400 }
    );
  }

  if (ammType === 'clmm') {
    return NextResponse.json({ clmmUnavailable: true });
  }

  if (ammType === 'aggregator') {
    return NextResponse.json({ aggregatorUnavailable: true });
  }

  try {
    const result = simulateConstantProduct(diffs, multiplier);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SimulateError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Simulation failed', code: 'UNKNOWN' },
      { status: 500 }
    );
  }
}
