import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const apiKey = this.configService.get('RESEND_API_KEY');
    if (!apiKey) {
      console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.configService.get('EMAIL_FROM', 'noreply@localvendor.in'),
          to,
          subject,
          html,
        }),
      });
      if (!response.ok) {
        console.error('Email send failed:', await response.text());
      }
    } catch (error) {
      console.error('Email service error:', error);
    }
  }

  async sendBookingConfirmation(email: string, bookingDetails: { service: string; date: string; vendor: string }) {
    await this.sendEmail(
      email,
      'Booking Request Submitted - Diggu',
      `<h2>Booking Request Submitted</h2>
       <p>Your booking for <strong>${bookingDetails.service}</strong> with ${bookingDetails.vendor} on ${bookingDetails.date} has been submitted.</p>
       <p>You'll receive a notification once the vendor responds.</p>`,
    );
  }

  async sendBookingAccepted(email: string, bookingDetails: { service: string; date: string }) {
    await this.sendEmail(
      email,
      'Booking Accepted - Diggu',
      `<h2>Great news!</h2>
       <p>Your booking for <strong>${bookingDetails.service}</strong> on ${bookingDetails.date} has been accepted.</p>`,
    );
  }

  async sendPasswordReset(email: string, resetToken: string) {
    const frontendUrl = this.configService.get('CORS_ORIGIN', 'http://localhost:3000');
    await this.sendEmail(
      email,
      'Password Reset - Diggu',
      `<h2>Password Reset</h2>
       <p>Click the link below to reset your password:</p>
       <a href="${frontendUrl}/forgot-password?token=${resetToken}">Reset Password</a>
       <p>This link expires in 1 hour.</p>`,
    );
  }

  async sendBookingRejected(email: string, bookingDetails: { service: string; date: string; vendor: string }) {
    await this.sendEmail(
      email,
      'Booking Request Rejected - Diggu',
      `<h2>Booking Request Not Accepted</h2>
       <p>Unfortunately, your booking for <strong>${bookingDetails.service}</strong> with ${bookingDetails.vendor} on ${bookingDetails.date} was not accepted.</p>
       <p>Try searching for other vendors offering the same service.</p>`,
    );
  }

  async sendDocumentApprovalNotification(email: string, documentDetails: { type: string; vendorName: string }) {
    await this.sendEmail(
      email,
      'Document Approved - Diggu',
      `<h2>Your document has been approved!</h2>
       <p><strong>${documentDetails.type}</strong> for ${documentDetails.vendorName} has been verified and approved.</p>
       <p>Your profile verification status has been updated.</p>`,
    );
  }

  async sendDocumentRejectionNotification(email: string, documentDetails: { type: string; vendorName: string; reason?: string }) {
    await this.sendEmail(
      email,
      'Document Rejected - Diggu',
      `<h2>Document Requires Resubmission</h2>
       <p>Your <strong>${documentDetails.type}</strong> submission was not approved.</p>
       ${documentDetails.reason ? `<p><strong>Reason:</strong> ${documentDetails.reason}</p>` : ''}
       <p>Please review and resubmit a clear, valid document.</p>`,
    );
  }
}
