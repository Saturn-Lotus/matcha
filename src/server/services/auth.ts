import { IMailer } from '@/lib/mailer/Mailer';
import { UserRepository, UserTokensRepository } from '@/server/repositories';
import { randomBytes } from 'crypto';
import { encrypt } from '@/lib/auth/session';
import { HTTPError } from '@/lib/exception-http-mapper';
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
