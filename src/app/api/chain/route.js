import { readEvents, readState } from '../../../lib/chain/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [state, events] = await Promise.all([readState(), readEvents()]);
    return Response.json({ ok: true, data: { state, events }, error: null });
  } catch (e) {
    console.error('chain read failed', e);
    return Response.json({ ok: false, data: null, error: 'Could not read the Fuji contract right now.' }, { status: 502 });
  }
}
