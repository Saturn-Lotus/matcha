import 'server-only';
import * as nodemailer from 'nodemailer';

export class TransporterError extends Error {
  public details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'TransporterError';
    this.details = details;
  }
}

export interface IMailer {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

export class Mailer implements IMailer {
  private readonly transporter: nodemailer.Transporter;
  private readonly appEmail: string;

  constructor(appEmail?: string, appPassword?: string, appService?: string) {
    const email = appEmail || process.env.APP_EMAIL;
    const password = appPassword || process.env.APP_PASSWORD;
    const service = appService || process.env.APP_SERVICE;

    if (!email || !password || !service) {
      throw new TypeError('Missing email, password or service');
    }

    this.transporter = nodemailer.createTransport({
      service: service,
      auth: {
        user: email,
        pass: password,
      },
    });

    this.appEmail = email;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.appEmail}" <${this.appEmail}>`,
        to,
        subject,
        html: body,
        headers: {
          'X-Mailer': 'NodeMailer',
        },
        envelope: {
          from: this.appEmail,
          to: to,
        },
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new TransporterError('Failed to send email', {
        to,
        subject,
        body,
        error,
      });
    }
  }
}
