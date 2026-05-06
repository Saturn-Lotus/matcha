import { IMailer } from '@/lib/mailer/Mailer';
import { UserRepository, UserTokensRepository } from '@/server/repositories';
import { randomBytes } from 'crypto';
import { encrypt, decrypt } from '@/lib/auth/session';
import { HTTPError, NotFoundException } from '@/lib/exception-http-mapper';
import bcrypt from 'bcrypt';
import { renderTemplate } from '@/lib/mailer/utils';

@HTTPError(400)
export class InvalidVerificationTokenError extends Error {
  constructor(message = 'Invalid verification token') {
    super(message);
    this.name = 'InvalidVerificationTokenError';
  }
}

@HTTPError(410)
export class VerificationTokenExpiredError extends Error {
  constructor(message = 'Verification token already used or expired') {
    super(message);
    this.name = 'VerificationTokenExpiredError';
  }
}

@HTTPError(400)
export class SimilarPasswordError extends Error {
  constructor(
    message = 'New password must be different from the old password',
  ) {
    super(message);
    this.name = 'SimilarPasswordError';
  }
}
@HTTPError(401)
export class InvalidCredentialsError extends Error {
  constructor(message = 'Invalid username or password') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

@HTTPError(409)
export class EmailInUseError extends Error {
  constructor(message = 'Email is already in use by another account') {
    super(message);
  }
}

@HTTPError(500)
export class InvalidSessionError extends Error {
  constructor(message = 'Session is invalid or has expired') {
    super(message);
    this.name = 'InvalidSessionError';
  }
}

const DEFAULT_TOKEN_EXPIRY_HOURS = '24';
const DEFAULT_JWT_SESSION_EXPIRY_DAYS = '7';
const TOKEN_EXPIRY_HOURS = parseInt(
  process.env.TOKEN_EXPIRY_HOURS || DEFAULT_TOKEN_EXPIRY_HOURS,
  10,
);
const JWT_SESSION_EXPIRY_DAYS = parseInt(
  process.env.JWT_SESSION_EXPIRY_DAYS || DEFAULT_JWT_SESSION_EXPIRY_DAYS,
  10,
);

const JWT_SESSION_EXPIRY_MS = JWT_SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly userTokensRepo: UserTokensRepository,
    private readonly mailer: IMailer,
  ) {}

  private generate32ByteToken(): string {
    return randomBytes(32).toString('hex');
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.userTokensRepo.deleteByUserId(userId, 'emailVerification');
    const destination = user.pendingEmail ?? user.email;
    await this.sendVerificationEmail(destination, userId);
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
    const link = `${process.env.NEXT_PUBLIC_CLIENT_URL}/api/auth/verify?token=${token}&id=${userId}`;
    const html = await renderTemplate('verify-email', { link });
    this.mailer.sendEmail(receiverEmail, 'Verify your email address', html);
  }

  async requestPasswordReset(receiverEmail: string) {
    const token = this.generate32ByteToken();
    const user = await this.userRepo.findByEmail(receiverEmail);
    if (user) {
      const tokenHash = await bcrypt.hash(token, 10);
      await this.userTokensRepo.deleteByUserId(user.id, 'passwordReset');
      await this.userTokensRepo.create({
        userId: user.id,
        tokenHash,
        tokenType: 'passwordReset',
        tokenExpiry: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 3600 * 1000),
      });

      if (process.env.NEXT_PUBLIC_CLIENT_URL === undefined) {
        throw new Error('NEXT_PUBLIC_CLIENT_URL is not defined');
      }
      const link = `${process.env.NEXT_PUBLIC_CLIENT_URL}/reset-password?token=${token}&id=${user.id}`;
      const html = await renderTemplate('reset-password', { link });
      this.mailer.sendEmail(receiverEmail, 'Reset your password', html);
    }
  }

  async verifyUser(token: string, userId: string) {
    if (!token.trim()) {
      throw new InvalidVerificationTokenError('No token provided');
    }

    const results = await this.userTokensRepo.query(
      '"userId" = $1 AND "tokenType" = $2',
      [userId, 'emailVerification'],
    );
    const userToken = results.length === 1 ? results[0] : null;

    if (!userToken) {
      throw new InvalidVerificationTokenError('Token is invalid');
    }

    const isTokenValid = await bcrypt.compare(token, userToken.tokenHash);
    if (!isTokenValid) {
      throw new InvalidVerificationTokenError('Token is invalid');
    }

    if (userToken.tokenExpiry < new Date()) {
      throw new VerificationTokenExpiredError('Token has expired');
    }

    await this.userRepo.update(userToken.userId, {
      isVerified: true,
      pendingEmail: null,
    });
    await this.userTokensRepo.delete(userToken.tokenHash);
  }

  async verifyUserEmailChange(token: string, userId: string) {
    if (!token.trim()) {
      throw new InvalidVerificationTokenError('No token provided');
    }

    const results = await this.userTokensRepo.query(
      '"userId" = $1 AND "tokenType" = $2',
      [userId, 'emailVerification'],
    );
    const userToken = results.length === 1 ? results[0] : null;
    const user = await this.userRepo.findById(userId);

    if (!userToken || !user) {
      throw new InvalidVerificationTokenError('Token is invalid');
    }

    const isTokenValid = await bcrypt.compare(token, userToken.tokenHash);
    if (!isTokenValid) {
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
    await this.userRepo.update(user.id, {
      email: user.pendingEmail,
      pendingEmail: null,
      isVerified: true,
    });
    await this.userTokensRepo.delete(userToken.tokenHash);
  }

  async resetPassword(token: string, id: string, newPassword: string) {
    if (!token.trim()) {
      throw new InvalidVerificationTokenError('No token provided');
    }

    const results = await this.userTokensRepo.query(
      '"tokenType" = $1 AND "userId" = $2',
      ['passwordReset', id],
    );
    const userToken = results.length === 1 ? results[0] : null;

    if (!userToken) {
      throw new InvalidVerificationTokenError('Token is invalid');
    }
    if (userToken.tokenExpiry < new Date()) {
      throw new VerificationTokenExpiredError('Token has expired');
    }

    const isTokenMatched = await bcrypt.compare(token, userToken.tokenHash);
    if (!isTokenMatched) {
      throw new InvalidVerificationTokenError('Token is invalid');
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

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    return user;
  }

  async createSession(
    userId: string,
    email: string,
    options: {
      isVerified: boolean;
      isProfileComplete: boolean;
      avatarUrl?: string | null;
    },
  ) {
    const expiresAt = new Date(Date.now() + JWT_SESSION_EXPIRY_MS);
    return encrypt({
      userId,
      email,
      isVerified: options.isVerified,
      isProfileComplete: options.isProfileComplete,
      avatarUrl: options.avatarUrl ?? null,
      expiresAt,
    });
  }

  async refreshSession(
    currentToken: string,
    updates: {
      isVerified?: boolean;
      isProfileComplete?: boolean;
      avatarUrl?: string | null;
    },
  ) {
    const payload = await decrypt(currentToken);
    if (!payload?.userId) {
      throw new InvalidSessionError('Cannot refresh an invalid session');
    }
    const expiresAt = new Date(Date.now() + JWT_SESSION_EXPIRY_MS);
    const avatarUrl =
      updates.avatarUrl === undefined
        ? (payload.avatarUrl as string | null)
        : updates.avatarUrl;
    return encrypt({
      userId: payload.userId as string,
      email: payload.email as string,
      isVerified: updates.isVerified ?? Boolean(payload.isVerified),
      isProfileComplete:
        updates.isProfileComplete ?? Boolean(payload.isProfileComplete),
      avatarUrl: avatarUrl,
      expiresAt,
    });
  }
}
