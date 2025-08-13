import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly emailUser: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.emailUser = this.getConfigValue('EMAIL_USER');
    this.frontendUrl = this.getConfigValue('FRONTEND_URL');

    this.transporter = nodemailer.createTransport({
      service: this.getConfigValue('EMAIL_SERVICE'),
      host: this.getConfigValue('NODEMAILER_HOST'),
      port: this.getConfigValue<number>('NODEMAILER_PORT'),
      secure: this.getConfigValue<boolean>('NODEMAILER_SECURE'),
      auth: {
        user: this.emailUser,
        pass: this.getConfigValue('EMAIL_PASS'),
      },
    });

    this.verifyTransporter();
  }

  private async verifyTransporter() {
    try {
      await this.transporter.verify();

      const mailSuccess = `<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#0b1020;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica Neue,Arial;color:#e2e8f0;flex-direction:column;gap:16px;text-align:center;">
  
  <!-- Animated Success Icon -->
  <svg style="width:96px;height:96px;" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="26" stroke="#22c55e" stroke-width="6" fill="none" opacity="0.35"/>
    <path d="M18 34 L28 44 L46 24" stroke="#22c55e" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <animate attributeName="stroke-dasharray" from="0,100" to="100,0" dur="0.6s" fill="freeze"/>
    </path>
  </svg>

  <!-- Success Message -->
  <h1 style="margin:0;font-size:1.8rem;">Payment Successful</h1>
  <p style="margin:0;color:#94a3b8;font-size:1rem;">Your payment has been processed successfully.</p>
</div>
`
      this.logger.log(mailSuccess);
    } catch (error) {
      this.logger.error('Failed to verify email ', error);
      throw error;
    }
  }

  private getConfigValue<T = string>(key: string, defaultValue?: T): T {
    const value = this.configService.get<T>(key) ?? defaultValue;
    if (value === undefined) {
      throw new Error(`Missing required config value for ${key}`);
    }
    return value;
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<{ success: boolean; messageId: string }> {
    if (!to || !subject || !text) {
      throw new Error('Missing required email parameters');
    }
    const mailOptions = {
      from: this.emailUser,
      to,
      subject,
      text,
      html: html || text,
    };

    try {
      const info: nodemailer.SentMessageInfo =
        await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      this.logger.error('Failed to send email', err);
      return { success: false, messageId: '' };
    }
  }

  async sendVerificationEmail(
    to: string,
    token: string,
  ): Promise<{ success: boolean; messageId: string }> {
    if (!to || !token) {
      throw new Error('Missing required parameters for verification email');
    }

    const verificationLink = `${this.frontendUrl}/auth/verify-email/${encodeURIComponent(token)}`;
    const subject = `Verify Your Email`;
    const text = `Please verify your email by clicking the following link: ${verificationLink}`;
    const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <h1 style="color: #2d3748; font-size: 24px; margin-bottom: 20px; text-align: center;">Verify Your Email Address</h1>
    
    <p style="font-size: 16px; color: #4a5568; line-height: 1.5; margin-bottom: 24px;">
        Thank you for signing up! Please confirm your email address by clicking the button below:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; 
                  color: white; text-decoration: none; border-radius: 6px; font-weight: 500;
                  font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background-color 0.2s;">
            Verify Email Address
        </a>
    </div>
    
    <p style="font-size: 14px; color: #718096; line-height: 1.5; margin-bottom: 16px;">
        If you didn't create an account, you can safely ignore this email.
    </p>
    
    <p style="font-size: 14px; color: #a0aec0; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
        This verification link will expire in 24 hours.<br>
        Having trouble? Contact our <a href="mailto:support@yourdomain.com" style="color: #4299e1;">support team</a>.
    </p>
</div>`;
    return this.sendEmail(to, subject, text, html);
  }
}
