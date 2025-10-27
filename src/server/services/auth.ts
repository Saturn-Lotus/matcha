import { IMailer } from '@/lib/mailer/Mailer';
import { UserRepository, UserTokensRepository } from '@/server/repositories';
import { randomBytes } from 'crypto';
import { encrypt } from '@/lib/auth/session';
import { HTTPError } from '@/lib/exception-http-mapper';
import bcrypt from 'bcrypt';

@HTTPError(400)
export class InvalidVerificationTokenError extends Error {
  constructor(message = 'Invalid verification token') {
    super(message);
  }
}

@HTTPError(410)
export class VerificationTokenExpiredError extends Error {
  constructor(message = 'Verification token already used or expired') {
    super(message);
  }
}

@HTTPError(400)
export class SimilarPasswordError extends Error {
  constructor(
    message = 'New password must be different from the old password',
  ) {
    super(message);
  }
}
@HTTPError(401)
export class InvalidCredentialsError extends Error {
  constructor(message = 'Invalid username or password') {
    super(message);
  }
}

@HTTPError(409)
export class EmailInUseError extends Error {
  constructor(message = 'Email is already in use by another account') {
    super(message);
  }
}

const TOKEN_EXPIRY_HOURS = parseInt(process.env.TOKEN_EXPIRY_HOURS || '24', 10);
const JWT_SESSION_EXPIRY_DAYS = parseInt(
  process.env.JWT_SESSION_EXPIRY_DAYS || '7',
  10,
);

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly userTokensRepo: UserTokensRepository,
    private readonly mailer: IMailer,
  ) {}

  private generate32ByteToken(): string {
    return randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(receiverEmail: string, userId: string) {
    const token = this.generate32ByteToken();
    const expiryDate = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 3600 * 1000);
    await this.userTokensRepo.create({
      userId,
      tokenHash: bcrypt.hashSync(token, 10),
      tokenType: 'emailVerification',
      tokenExpiry: expiryDate,
    });

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

  async requestPasswordReset(receiverEmail: string) {
    const token = this.generate32ByteToken();
    const user = await this.userRepo.findByEmail(receiverEmail);
    if (user) {
      const tokenHash = await bcrypt.hash(token, 10);
      await this.userTokensRepo.create({
        userId: user.id,
        tokenHash,
        tokenType: 'passwordReset',
        tokenExpiry: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 3600 * 1000),
      });

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
  }

  async verifyUser(token: string) {
    if (!token.trim()) {
      throw new InvalidVerificationTokenError('No token provided');
    }
    const tokenHash = await bcrypt.hash(token, 10);
    const results = await this.userTokensRepo.query(
      '"tokenHash" = $1 AND "tokenType" = $2',
      [tokenHash, 'emailVerification'],
    );

    const userToken = results.length === 1 ? results[0] : null;

    if (!userToken) {
      throw new InvalidVerificationTokenError('Token is invalid');
    }

    if (userToken.tokenExpiry < new Date()) {
      throw new VerificationTokenExpiredError('Token has expired');
    }

    await this.userRepo.update(userToken.userId, {
      isVerified: true,
    });
    await this.userTokensRepo.delete(userToken.tokenHash);
  }

  async verifyUserEmailChange(token: string) {
    if (!token.trim()) {
      throw new InvalidVerificationTokenError('No token provided');
    }
    const tokenHash = await bcrypt.hash(token, 10);
    const results = await this.userTokensRepo.query(
      '"tokenHash" = $1 AND "tokenType" = $2',
      [tokenHash, 'emailVerification'],
    );
    const userToken = results.length === 1 ? results[0] : null;
    const user = await this.userRepo.findById(userToken?.userId || '');

    if (!userToken || !user) {
      throw new InvalidVerificationTokenError('Token is invalid');
    }
    if (userToken.tokenExpiry < new Date()) {
      throw new VerificationTokenExpiredError('Token has expired');
    }
    if (!user.pendingEmail) {
      throw new Error('No pending email to verify');
    }
    const emailInUse = await this.userRepo.findByEmail(user.pendingEmail);
    if (emailInUse && emailInUse.id !== user.id) {
      throw new EmailInUseError();
    }
    this.userRepo.update(user.id, {
      email: user.pendingEmail,
      pendingEmail: null,
    });
    await this.userTokensRepo.delete(userToken.tokenHash);
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token.trim()) {
      throw new InvalidVerificationTokenError('No token provided');
    }
    const tokenHash = await bcrypt.hash(token, 10);

    const results = await this.userTokensRepo.query(
      '"tokenHash" = $1 AND "tokenType" = $2',
      [tokenHash, 'passwordReset'],
    );
    const userToken = results.length === 1 ? results[0] : null;

    if (!userToken) {
      throw new InvalidVerificationTokenError('Token is invalid');
    }
    if (userToken.tokenExpiry < new Date()) {
      throw new VerificationTokenExpiredError('Token has expired');
    }
    const user = await this.userRepo.findById(userToken.userId);
    if (!user) {
      throw new Error('User not found');
    }
    const isPasswordMatched = await bcrypt.compare(
      newPassword,
      user.passwordHash,
    );

    if (isPasswordMatched) {
      throw new SimilarPasswordError();
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userRepo.update(user.id, {
      passwordHash: hashedPassword,
    });
    await this.userTokensRepo.delete(userToken.tokenHash);
  }

  async authenticate(username: string, password: string) {
    const user = await this.userRepo.findByUsername(username);

    if (!user) {
      throw new InvalidCredentialsError('Invalid username');
    }

    const isPasswordMatched = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordMatched) {
      throw new InvalidCredentialsError('Invalid password');
    }

    return user;
  }

  async createSession(userId: string, email: string) {
    const expiresAt = new Date(
      Date.now() + JWT_SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );
    const session = await encrypt({ userId, email, expiresAt });
    return session;
  }
}
