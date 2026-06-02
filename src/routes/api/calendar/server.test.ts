import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDb = vi.fn();
vi.mock('$lib/server/db/index.js', () => ({ getDb: mockGetDb }));
vi.mock('$lib/server/db/schema.js', () => {
  const table = (name: string) => new Proxy({}, {
    get(_, prop) {
      if (typeof prop === 'string') return { _: { name, field: prop } };
      return undefined;
    }
  });
  return {
    episodeSchedules: table('episodeSchedules'),
    episodes: table('episodes'),
    series: table('series'),
    platforms: table('platforms')
  };
});
vi.mock('$lib/server/cache.js', () => ({
  getCached: vi.fn(() => undefined),
  setCached: vi.fn()
}));

async function jsonBody(response: Response) {
  return await response.json() as Record<string, unknown>;
}

function makeMockDb(schedules: unknown[] = []) {
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                orderBy: vi.fn(() => Promise.resolve(schedules))
              }))
            }))
          }))
        }))
      }))
    }))
  };
}

describe('GET /api/calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with correct shape for valid month query', async () => {
    mockGetDb.mockResolvedValue(makeMockDb([]));
    const { GET } = await import('./+server.js');
    const response = await GET({
      url: new URL('http://localhost/api/calendar?year=2026&month=6')
    } as never) as Response;

    expect(response.status).toBe(200);
    const body = await jsonBody(response);
    expect(body).toHaveProperty('events');
    expect(body).toHaveProperty('allSeries');
    expect(body).toHaveProperty('platforms');
    expect(body).toHaveProperty('scheduleByDay');
  });

  it('returns 200 with correct shape for valid week query', async () => {
    mockGetDb.mockResolvedValue(makeMockDb([]));
    const { GET } = await import('./+server.js');
    const response = await GET({
      url: new URL('http://localhost/api/calendar?startDate=2026-06-01&endDate=2026-06-08')
    } as never) as Response;

    expect(response.status).toBe(200);
    const body = await jsonBody(response);
    expect(body).toHaveProperty('events');
    expect(body).toHaveProperty('allSeries');
    expect(body).toHaveProperty('platforms');
    expect(body).toHaveProperty('scheduleByDay');
  });

  it('returns 400 when year is provided without month', async () => {
    const { GET } = await import('./+server.js');
    const response = await GET({
      url: new URL('http://localhost/api/calendar?year=2026')
    } as never) as Response;

    expect(response.status).toBe(400);
    expect(await jsonBody(response)).toEqual({ error: 'กรุณาระบุเดือน' });
  });

  it('returns 400 when month is provided without year', async () => {
    const { GET } = await import('./+server.js');
    const response = await GET({
      url: new URL('http://localhost/api/calendar?month=6')
    } as never) as Response;

    expect(response.status).toBe(400);
    expect(await jsonBody(response)).toEqual({ error: 'กรุณาระบุปี' });
  });

  it('returns 400 when startDate is provided without endDate', async () => {
    const { GET } = await import('./+server.js');
    const response = await GET({
      url: new URL('http://localhost/api/calendar?startDate=2026-06-01')
    } as never) as Response;

    expect(response.status).toBe(400);
    expect(await jsonBody(response)).toEqual({ error: 'กรุณาระบุวันสิ้นสุด' });
  });

  it('returns 400 when endDate is provided without startDate', async () => {
    const { GET } = await import('./+server.js');
    const response = await GET({
      url: new URL('http://localhost/api/calendar?endDate=2026-06-08')
    } as never) as Response;

    expect(response.status).toBe(400);
    expect(await jsonBody(response)).toEqual({ error: 'กรุณาระบุวันเริ่มต้น' });
  });

  it('returns 400 when month and week params are both provided', async () => {
    const { GET } = await import('./+server.js');
    const response = await GET({
      url: new URL('http://localhost/api/calendar?year=2026&month=6&startDate=2026-06-01')
    } as never) as Response;

    expect(response.status).toBe(400);
    expect(await jsonBody(response)).toEqual({ error: 'ไม่สามารถระบุทั้งเดือนและช่วงวันได้พร้อมกัน' });
  });

  it('returns 400 for invalid month format', async () => {
    const { GET } = await import('./+server.js');
    const response = await GET({
      url: new URL('http://localhost/api/calendar?year=2026&month=abc')
    } as never) as Response;

    expect(response.status).toBe(400);
    expect(await jsonBody(response)).toEqual({ error: 'พารามิเตอร์เดือนไม่ถูกต้อง' });
  });

  it('returns 400 for month out of range', async () => {
    const { GET } = await import('./+server.js');
    const response = await GET({
      url: new URL('http://localhost/api/calendar?year=2026&month=13')
    } as never) as Response;

    expect(response.status).toBe(400);
    expect(await jsonBody(response)).toEqual({ error: 'พารามิเตอร์เดือนไม่ถูกต้อง' });
  });

  it('returns 400 for malformed date format in week query', async () => {
    const { GET } = await import('./+server.js');
    const response = await GET({
      url: new URL('http://localhost/api/calendar?startDate=06-01-2026&endDate=06-08-2026')
    } as never) as Response;

    expect(response.status).toBe(400);
    expect(await jsonBody(response)).toEqual({ error: 'รูปแบบวันที่ไม่ถูกต้อง' });
  });

  it('returns 500 with generic error on unexpected DB failure', async () => {
    mockGetDb.mockRejectedValue(new Error('DB connection failed'));
    const { GET } = await import('./+server.js');
    const response = await GET({
      url: new URL('http://localhost/api/calendar?year=2026&month=6')
    } as never) as Response;

    expect(response.status).toBe(500);
    expect(await jsonBody(response)).toEqual({ error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' });
  });
});
