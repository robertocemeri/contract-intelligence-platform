const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Email Service - Contract deadline alerts
 * Gracefully handles missing email configuration
 */

class EmailService {
  constructor() {
    this.enabled = config.email.enabled;
    
    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: false,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });
    } else {
      console.log('Email service disabled - no credentials provided');
    }
  }

  /**
   * Send deadline alert email
   */
  async sendDeadlineAlert(contract, deadlines) {
    if (!this.enabled) {
      console.log('Email not sent (service disabled):', contract.title);
      return {
        ok: true,
        data: { skipped: true, reason: 'Email service not configured' },
      };
    }

    try {
      const deadlineList = deadlines
        .map(d => `- ${d.dateType}: ${d.date.toLocaleDateString()} - ${d.description || 'N/A'}`)
        .join('\n');

      const mailOptions = {
        from: config.email.from,
        to: config.email.user, // In production, would be contract owner's email
        subject: `⚠️ Upcoming Contract Deadlines - ${contract.title}`,
        text: `
Contract: ${contract.title}
Status: ${contract.status}
Risk Level: ${contract.riskLevel || 'N/A'}

Upcoming Deadlines (next 30 days):
${deadlineList}

Please review and take appropriate action.

Contract ID: ${contract._id}
Analyzed: ${contract.aiAnalysisDate?.toLocaleDateString() || 'N/A'}
        `,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #d97706;">⚠️ Upcoming Contract Deadlines</h2>
  
  <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0;">${contract.title}</h3>
    <p><strong>Status:</strong> ${contract.status}</p>
    <p><strong>Risk Level:</strong> <span style="color: ${this._getRiskColor(contract.riskLevel)}">${contract.riskLevel || 'N/A'}</span></p>
  </div>

  <h3>Upcoming Deadlines (next 30 days):</h3>
  <ul>
    ${deadlines.map(d => `
      <li>
        <strong>${d.dateType}:</strong> ${d.date.toLocaleDateString()}<br>
        <em>${d.description || 'N/A'}</em>
      </li>
    `).join('')}
  </ul>

  <p style="color: #6b7280; font-size: 12px;">
    Contract ID: ${contract._id}<br>
    Analyzed: ${contract.aiAnalysisDate?.toLocaleDateString() || 'N/A'}
  </p>
</div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        ok: true,
        data: { messageId: info.messageId },
      };
      
    } catch (error) {
      console.error('Email sending error:', error.message);
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  _getRiskColor(riskLevel) {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#7f1d1d',
    };
    return colors[riskLevel] || '#6b7280';
  }
}

module.exports = new EmailService();