import { renderTemplate } from '@/lib/mailer/utils';

describe('renderTemplate', () => {
  it('renders verify-email template with provided link', async () => {
    const link = 'https://example.test/verify?token=abc123';
    const html = await renderTemplate('verify-email', { link });
    expect(html).toContain('Welcome to Matcha');
    expect(html).toContain(link);
  });

  it('renders reset-password template with provided link', async () => {
    const link = 'https://example.test/reset?token=zzz';
    const html = await renderTemplate('reset-password', { link });
    expect(html).toContain('Reset your password');
    expect(html).toContain(link);
  });

  it('throws when template does not exist', async () => {
    await expect(renderTemplate('no-such-template', {})).rejects.toThrow();
  });
});
