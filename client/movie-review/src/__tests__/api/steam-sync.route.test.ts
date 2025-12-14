import { POST } from '@/app/api/steam/sync/route';

const mockGetServerSession = jest.fn();

jest.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    platform_connections: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

describe('POST /api/steam/sync', () => {
  beforeEach(() => {
    mockGetServerSession.mockReset();
    mockFindFirst.mockReset();
    mockUpdate.mockReset();
    (global.fetch as any).mockClear?.();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST({} as any);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('returns 400 when no steam connection exists', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1' } });
    mockFindFirst.mockResolvedValue(null);

    const res = await POST({} as any);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toMatch(/not connected/i);
  });

  it('returns 500 when STEAM_API_KEY is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1' } });
    mockFindFirst.mockResolvedValue({ id: 'c1', platformUserId: '76561198000000000' });

    const oldKey = process.env.STEAM_API_KEY;
    delete process.env.STEAM_API_KEY;

    const res = await POST({} as any);

    process.env.STEAM_API_KEY = oldKey;

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/STEAM_API_KEY/i);
  });

  it('updates gamesData from Steam API', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1' } });
    mockFindFirst.mockResolvedValue({ id: 'c1', platformUserId: '76561198000000000' });
    process.env.STEAM_API_KEY = process.env.STEAM_API_KEY || 'test_key';

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        response: {
          games: [
            {
              appid: 570,
              name: 'Dota 2',
              playtime_forever: 120,
              img_icon_url: 'abc',
              img_logo_url: 'def',
              rtime_last_played: 123,
            },
          ],
        },
      }),
    });

    mockUpdate.mockResolvedValue({});

    const res = await POST({} as any);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.gamesCount).toBe(1);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.where.id).toBe('c1');
    expect(Array.isArray(updateArg.data.gamesData)).toBe(true);
    expect(updateArg.data.gamesData[0].name).toBe('Dota 2');
  });
});
