import { IMailer } from '@/lib/mailer/Mailer';
import { UserRepository } from '../repositories';
import { randomBytes } from 'crypto';

export class InvalidVerificationTokenError extends Error {
  constructor(message = 'Invalid verification token') {
    super(message);
    this.name = 'InvalidVerificationTokenError';
  }
}

export class VerificationTokenExpiredError extends Error {
  constructor(message = 'Verification token already used or expired') {
    super(message);
    this.name = 'VerificationTokenExpiredError';
  }
}

export class SimilarPasswordError extends Error {
  constructor(message = 'New password must be different from the old password') {
    super(message);
    this.name = 'SimilarPasswordError';
  }
}

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly mailer: IMailer,
  ) {}

  private generate32ByteToken(): string {
    return randomBytes(32).toString('hex');
  }

  sendVerificationEmail(receiverEmail: string, userId: string) {
    const token = this.generate32ByteToken();
    this.userRepo.update(userId, { emailVerificationToken: token });

    if (process.env.NEXT_PUBLIC_CLIENT_URL === undefined) {
      throw new Error('NEXT_PUBLIC_CLIENT_URL is not defined');
    }
    const link = `${process.env.NEXT_PUBLIC_CLIENT_URL}/api/auth/verify?token=${token}`;
    this.mailer.sendEmail(
      receiverEmail,
      'Verify your email address',
      `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px; background: #fafbfc;">
        <h2 style="color: #333;">Welcome to Matcha!</h2>
        <p style="font-size: 16px; color: #555;">
        Thank you for signing up. Please verify your email address by clicking the button below:
        </p>
        <a href="${link}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Verify Email
        </a>
        <p style="font-size: 14px; color: #888;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <span style="word-break: break-all;">${link}</span>
        </p>
        <hr style="margin: 24px 0;">
        <p style="font-size: 12px; color: #aaa;">
        If you did not create an account, you can safely ignore this email.
        </p>
      </div>
      `,
    );
  }

  sendResetPasswordEmail(receiverEmail: string, userId: string) {
    const token = this.generate32ByteToken();

    this.userRepo.update(userId, { passwordResetToken: token });

    if (process.env.NEXT_PUBLIC_CLIENT_URL === undefined) {
      throw new Error('NEXT_PUBLIC_CLIENT_URL is not defined');
    }
    const link = `${process.env.NEXT_PUBLIC_CLIENT_URL}/reset-password?token=${token}`;

    this.mailer.sendEmail(
      receiverEmail,
      'Reset your password',
      `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px; background: #fafbfc;">
        <h2 style="color: #333;">Reset your password</h2>
        <p style="font-size: 16px; color: #555;">
        We received a request to reset your password. Click the button below to reset it:
        </p>
        <a href="${link}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Reset Password
        </a>
        <p style="font-size: 14px; color: #888;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <span style="word-break: break-all;">${link}</span>
        </p>
        <hr style="margin: 24px 0;">
        <p style="font-size: 12px; color: #aaa;">
        If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
      `,
    );
  }

  async verifyUser(token: string) {
    if (!token || !token.trim()) {
      throw new InvalidVerificationTokenError('No token provided');
    }

    const results = await this.userRepo.query('"emailVerificationToken" = $1', [
      token,
    ]);

    const user = results.length === 1 ? results[0] : null;

    if (!user) {
      throw new InvalidVerificationTokenError('Token is invalid');
    }

    if (user.isVerified) {
      return;
    }

    try {
      await this.userRepo.update(user.id, {
        isVerified: true,
        emailVerificationToken: null,
      });
    } catch (error: any) {
      console.error('Error updating user verification status:', error);
      throw new Error('Failed to update user verification status');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !token.trim()) {
      throw new InvalidVerificationTokenError('No token provided');
    }

    const results = await this.userRepo.query('"passwordResetToken" = $1', [
      token,
    ]);
    const user = results.length === 1 ? results[0] : null;

    if (!user) {
      throw new InvalidVerificationTokenError('Token is invalid');
    }

    if (user.passwordHash === newPassword) {
      throw new SimilarPasswordError();
    }

    try {
      await this.userRepo.update(user.id, {
        passwordHash: newPassword,
        passwordResetToken: null,
      });
    } catch (error: any) {
      console.error('Error updating user password:', error);
      throw new Error('Failed to update user password');
    }
  }
}
