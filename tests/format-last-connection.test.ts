import { formatLastConnection, relativeTime } from '@/lib/utils';

describe('formatLastConnection', () => {
  const iso = '2024-03-15T14:30:00.000Z';

  it('formats the instant with both date and time', () => {
    expect(formatLastConnection(iso)).toBe('Mar 15, 2024, 14:30 UTC');
  });

  it('includes the year and a clock time', () => {
    const formatted = formatLastConnection(iso);

    expect(formatted).toContain('2024');
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });

  it('differs from the relative form for an old timestamp', () => {
    expect(formatLastConnection(iso)).not.toBe(relativeTime(iso));
  });
});
