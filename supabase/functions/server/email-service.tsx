/**
 * Email Service for EventCoverageJamaica.com
 * Handles all email notifications for clients, admins, managers, and talents
 * Uses Resend API for email delivery
 */

// Email sending function using Resend API
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  
  if (!RESEND_API_KEY) {
    console.error('[EMAIL] RESEND_API_KEY not configured - skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EventCoverageJamaica <notifications@eventcoveragejamaica.com>',
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EMAIL] Failed to send email:', error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log(`[EMAIL] Successfully sent email to ${params.to}: ${params.subject}`);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Base HTML template with ECJ branding
function getEmailTemplate(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>EventCoverageJamaica Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #755f52 0%, #8b7263 100%); padding: 32px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                    EventCoverageJamaica
                  </h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                    Professional Event Coverage Services
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 32px;">
                  ${content}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                  <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; line-height: 1.5;">
                    <strong style="color: #755f52;">EventCoverageJamaica</strong><br>
                    Managed Event Coverage Services Across All 14 Parishes
                  </p>
                  <p style="margin: 8px 0 0 0; color: #999; font-size: 12px;">
                    Questions? Contact us through the platform or reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Button component for emails
function getButton(text: string, url: string) {
  return `
    <table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background: linear-gradient(135deg, #B0DD16 0%, #9ac514 100%); border-radius: 8px; padding: 14px 28px;">
          <a href="${url}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// Status badge for emails
function getStatusBadge(status: string) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FEF3C7', text: '#92400E' },
    reviewing: { bg: '#DBEAFE', text: '#1E40AF' },
    assigned: { bg: '#E0E7FF', text: '#3730A3' },
    in_progress: { bg: '#DBEAFE', text: '#1E40AF' },
    completed: { bg: '#D1FAE5', text: '#065F46' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  };
  
  const colors = statusColors[status] || { bg: '#F3F4F6', text: '#374151' };
  
  return `
    <span style="display: inline-block; padding: 4px 12px; background-color: ${colors.bg}; color: ${colors.text}; border-radius: 6px; font-size: 13px; font-weight: 600; text-transform: capitalize;">
      ${status.replace('_', ' ')}
    </span>
  `;
}

// ============ CLIENT NOTIFICATIONS ============

export async function sendRequestCreatedEmail(params: {
  clientEmail: string;
  clientName: string;
  requestId: string;
  eventName: string;
  eventDate: string;
  platformUrl: string;
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #755f52; font-size: 24px;">
      Request Received!
    </h2>
    <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.6;">
      Hi ${params.clientName},
    </p>
    <p style="margin: 0 0 24px 0; color: #333; font-size: 16px; line-height: 1.6;">
      Thank you for choosing EventCoverageJamaica! We've received your request for coverage of <strong style="color: #755f52;">${params.eventName}</strong> on <strong>${params.eventDate}</strong>.
    </p>
    
    <div style="background-color: #f8f8f8; border-left: 4px solid #B0DD16; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; color: #755f52; font-weight: 600; font-size: 14px;">
        What happens next?
      </p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
        <li>Our team is reviewing your requirements</li>
        <li>We'll match you with the best available talent</li>
        <li>You'll receive a detailed quote within 24-48 hours</li>
        <li>Track your request status anytime on our platform</li>
      </ul>
    </div>

    ${getButton('View Request Details', `${params.platformUrl}?requestId=${params.requestId}`)}
    
    <p style="margin: 24px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
      Need to make changes? You can update your request details anytime through your dashboard.
    </p>
  `;

  return sendEmail({
    to: params.clientEmail,
    subject: `Request Received: ${params.eventName}`,
    html: getEmailTemplate(content),
  });
}

export async function sendStatusUpdateEmail(params: {
  clientEmail: string;
  clientName: string;
  requestId: string;
  eventName: string;
  oldStatus: string;
  newStatus: string;
  note?: string;
  platformUrl: string;
}) {
  const statusMessages: Record<string, string> = {
    reviewing: "Our team is now reviewing your request and selecting the best talent for your event.",
    assigned: "Great news! We've assigned professional talent to cover your event. Check your dashboard for details.",
    in_progress: "Your event coverage is now in progress. Our team is capturing every important moment.",
    completed: "Success! Your event coverage has been completed. Your final deliverables are ready for review.",
    cancelled: "Your request has been cancelled. If you have any questions, please contact our support team.",
  };

  const content = `
    <h2 style="margin: 0 0 16px 0; color: #755f52; font-size: 24px;">
      Request Status Update
    </h2>
    <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.6;">
      Hi ${params.clientName},
    </p>
    <p style="margin: 0 0 24px 0; color: #333; font-size: 16px; line-height: 1.6;">
      Your request for <strong style="color: #755f52;">${params.eventName}</strong> has been updated.
    </p>
    
    <div style="background-color: #f8f8f8; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">
        <strong>Status Change:</strong>
      </p>
      <p style="margin: 0; font-size: 16px;">
        ${getStatusBadge(params.oldStatus)} → ${getStatusBadge(params.newStatus)}
      </p>
    </div>

    <p style="margin: 0 0 24px 0; color: #555; font-size: 15px; line-height: 1.6;">
      ${statusMessages[params.newStatus] || "Your request status has been updated."}
    </p>

    ${params.note ? `
      <div style="background-color: #fffbeb; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; color: #92400E; font-weight: 600; font-size: 14px;">
          Note from ECJ Team:
        </p>
        <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.6;">
          ${params.note}
        </p>
      </div>
    ` : ''}

    ${getButton('View Request Details', `${params.platformUrl}?requestId=${params.requestId}`)}
  `;

  return sendEmail({
    to: params.clientEmail,
    subject: `${params.eventName} - Status: ${params.newStatus.replace('_', ' ')}`,
    html: getEmailTemplate(content),
  });
}

export async function sendQuoteSentEmail(params: {
  clientEmail: string;
  clientName: string;
  requestId: string;
  eventName: string;
  quoteAmount: number;
  platformUrl: string;
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #755f52; font-size: 24px;">
      Your Quote is Ready!
    </h2>
    <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.6;">
      Hi ${params.clientName},
    </p>
    <p style="margin: 0 0 24px 0; color: #333; font-size: 16px; line-height: 1.6;">
      We've prepared a detailed quote for <strong style="color: #755f52;">${params.eventName}</strong>.
    </p>
    
    <div style="background-color: #f8f8f8; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #755f52; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        Quote Amount
      </p>
      <p style="margin: 0; color: #755f52; font-size: 36px; font-weight: bold;">
        $${quoteAmount.toLocaleString()}
      </p>
    </div>

    <div style="background-color: #E8F5E9; border-left: 4px solid #B0DD16; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; color: #2E7D32; font-weight: 600; font-size: 14px;">
        ✓ ECJ Quality Guarantee
      </p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #1B5E20; font-size: 14px; line-height: 1.8;">
        <li>Vetted professional talent</li>
        <li>On-time delivery commitment</li>
        <li>24/7 platform support</li>
        <li>Satisfaction guarantee</li>
      </ul>
    </div>

    ${getButton('View Full Quote', `${params.platformUrl}?requestId=${params.requestId}`)}
    
    <p style="margin: 24px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
      Have questions about the quote? Our team is here to help! Reply to this email or contact us through the platform.
    </p>
  `;

  return sendEmail({
    to: params.clientEmail,
    subject: `Quote Ready: ${params.eventName} - $${params.quoteAmount.toLocaleString()}`,
    html: getEmailTemplate(content),
  });
}

export async function sendRequestCompletedEmail(params: {
  clientEmail: string;
  clientName: string;
  requestId: string;
  eventName: string;
  platformUrl: string;
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #755f52; font-size: 24px;">
      🎉 Coverage Completed!
    </h2>
    <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.6;">
      Hi ${params.clientName},
    </p>
    <p style="margin: 0 0 24px 0; color: #333; font-size: 16px; line-height: 1.6;">
      Great news! The coverage for <strong style="color: #755f52;">${params.eventName}</strong> has been completed and your deliverables are ready.
    </p>
    
    <div style="background-color: #E8F5E9; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center;">
      <p style="margin: 0 0 16px 0; font-size: 48px;">
        ✓
      </p>
      <p style="margin: 0 0 8px 0; color: #2E7D32; font-weight: 600; font-size: 18px;">
        Your content is ready to view!
      </p>
      <p style="margin: 0; color: #555; font-size: 14px;">
        All deliverables have been uploaded to your dashboard
      </p>
    </div>

    ${getButton('View Your Deliverables', `${params.platformUrl}?requestId=${params.requestId}`)}
    
    <div style="background-color: #f8f8f8; padding: 20px; margin: 32px 0; border-radius: 8px;">
      <p style="margin: 0 0 12px 0; color: #755f52; font-weight: 600; font-size: 15px;">
        We'd love your feedback!
      </p>
      <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">
        Your experience matters to us. Please take a moment to rate the service and share any comments through your dashboard.
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
      Thank you for choosing EventCoverageJamaica. We look forward to covering your next event!
    </p>
  `;

  return sendEmail({
    to: params.clientEmail,
    subject: `✅ Deliverables Ready: ${params.eventName}`,
    html: getEmailTemplate(content),
  });
}

// ============ ADMIN NOTIFICATIONS ============

export async function sendNewRequestNotificationToAdmins(params: {
  adminEmails: string[];
  requestId: string;
  clientName: string;
  eventName: string;
  eventDate: string;
  parish: string;
  platformUrl: string;
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #755f52; font-size: 24px;">
      🆕 New Request Submitted
    </h2>
    <p style="margin: 0 0 24px 0; color: #333; font-size: 16px; line-height: 1.6;">
      A new event coverage request has been submitted and requires review.
    </p>
    
    <div style="background-color: #f8f8f8; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <table width="100%" cellpadding="8" cellspacing="0">
        <tr>
          <td style="color: #666; font-size: 14px; width: 140px;"><strong>Client:</strong></td>
          <td style="color: #333; font-size: 14px;">${params.clientName}</td>
        </tr>
        <tr>
          <td style="color: #666; font-size: 14px;"><strong>Event:</strong></td>
          <td style="color: #333; font-size: 14px;">${params.eventName}</td>
        </tr>
        <tr>
          <td style="color: #666; font-size: 14px;"><strong>Date:</strong></td>
          <td style="color: #333; font-size: 14px;">${params.eventDate}</td>
        </tr>
        <tr>
          <td style="color: #666; font-size: 14px;"><strong>Parish:</strong></td>
          <td style="color: #333; font-size: 14px;">${params.parish}</td>
        </tr>
        <tr>
          <td style="color: #666; font-size: 14px;"><strong>Status:</strong></td>
          <td style="color: #333; font-size: 14px;">${getStatusBadge('pending')}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
        <strong>Action Required:</strong> Please review this request and assign talent as soon as possible.
      </p>
    </div>

    ${getButton('Review Request', `${params.platformUrl}/admin?requestId=${params.requestId}`)}
  `;

  // Send to all admin emails
  const promises = params.adminEmails.map(email =>
    sendEmail({
      to: email,
      subject: `New Request: ${params.eventName} - ${params.parish}`,
      html: getEmailTemplate(content),
    })
  );

  return Promise.all(promises);
}

export async function sendNewTalentApplicationNotification(params: {
  adminEmails: string[];
  talentId: string;
  talentName: string;
  email: string;
  specialties: string[];
  parishes: string[];
  platformUrl: string;
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #755f52; font-size: 24px;">
      👤 New Talent Application
    </h2>
    <p style="margin: 0 0 24px 0; color: #333; font-size: 16px; line-height: 1.6;">
      A new talent has applied to join the EventCoverageJamaica network.
    </p>
    
    <div style="background-color: #f8f8f8; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <table width="100%" cellpadding="8" cellspacing="0">
        <tr>
          <td style="color: #666; font-size: 14px; width: 140px;"><strong>Name:</strong></td>
          <td style="color: #333; font-size: 14px;">${params.talentName}</td>
        </tr>
        <tr>
          <td style="color: #666; font-size: 14px;"><strong>Email:</strong></td>
          <td style="color: #333; font-size: 14px;">${params.email}</td>
        </tr>
        <tr>
          <td style="color: #666; font-size: 14px;"><strong>Specialties:</strong></td>
          <td style="color: #333; font-size: 14px;">${params.specialties.join(', ')}</td>
        </tr>
        <tr>
          <td style="color: #666; font-size: 14px;"><strong>Parishes:</strong></td>
          <td style="color: #333; font-size: 14px;">${params.parishes.join(', ')}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #DBEAFE; border-left: 4px solid #2563EB; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0; color: #1E40AF; font-size: 14px; line-height: 1.6;">
        <strong>Action Required:</strong> Please review the talent's portfolio, references, and qualifications before approval.
      </p>
    </div>

    ${getButton('Review Application', `${params.platformUrl}/admin/talents?talentId=${params.talentId}`)}
  `;

  const promises = params.adminEmails.map(email =>
    sendEmail({
      to: email,
      subject: `New Talent Application: ${params.talentName}`,
      html: getEmailTemplate(content),
    })
  );

  return Promise.all(promises);
}

export async function sendNewServiceSubmissionNotification(params: {
  managerEmails: string[];
  serviceId: string;
  serviceName: string;
  category: string;
  createdBy: string;
  platformUrl: string;
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #755f52; font-size: 24px;">
      📦 New Service Submission
    </h2>
    <p style="margin: 0 0 24px 0; color: #333; font-size: 16px; line-height: 1.6;">
      A new service has been created and is awaiting approval.
    </p>
    
    <div style="background-color: #f8f8f8; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <table width="100%" cellpadding="8" cellspacing="0">
        <tr>
          <td style="color: #666; font-size: 14px; width: 140px;"><strong>Service:</strong></td>
          <td style="color: #333; font-size: 14px;">${params.serviceName}</td>
        </tr>
        <tr>
          <td style="color: #666; font-size: 14px;"><strong>Category:</strong></td>
          <td style="color: #333; font-size: 14px;">${params.category}</td>
        </tr>
        <tr>
          <td style="color: #666; font-size: 14px;"><strong>Created By:</strong></td>
          <td style="color: #333; font-size: 14px;">${params.createdBy}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
        <strong>Action Required:</strong> Please review and approve this service before it can be published.
      </p>
    </div>

    ${getButton('Review Service', `${params.platformUrl}/admin/services?serviceId=${params.serviceId}`)}
  `;

  const promises = params.managerEmails.map(email =>
    sendEmail({
      to: email,
      subject: `New Service for Approval: ${params.serviceName}`,
      html: getEmailTemplate(content),
    })
  );

  return Promise.all(promises);
}

// ============ TALENT NOTIFICATIONS ============

export async function sendTalentAssignmentEmail(params: {
  talentEmail: string;
  talentName: string;
  requestId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  role: string;
  platformUrl: string;
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #755f52; font-size: 24px;">
      🎯 New Assignment
    </h2>
    <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.6;">
      Hi ${params.talentName},
    </p>
    <p style="margin: 0 0 24px 0; color: #333; font-size: 16px; line-height: 1.6;">
      You've been assigned to cover an upcoming event. Please review the details below.
    </p>
    
    <div style="background-color: #E8F5E9; padding: 24px; margin: 24px 0; border-radius: 12px; border-left: 4px solid #B0DD16;">
      <p style="margin: 0 0 16px 0; color: #2E7D32; font-weight: 600; font-size: 18px;">
        Assignment Details
      </p>
      <table width="100%" cellpadding="8" cellspacing="0">
        <tr>
          <td style="color: #2E7D32; font-size: 14px; width: 140px;"><strong>Event:</strong></td>
          <td style="color: #1B5E20; font-size: 14px;">${params.eventName}</td>
        </tr>
        <tr>
          <td style="color: #2E7D32; font-size: 14px;"><strong>Date:</strong></td>
          <td style="color: #1B5E20; font-size: 14px;">${params.eventDate}</td>
        </tr>
        <tr>
          <td style="color: #2E7D32; font-size: 14px;"><strong>Location:</strong></td>
          <td style="color: #1B5E20; font-size: 14px;">${params.eventLocation}</td>
        </tr>
        <tr>
          <td style="color: #2E7D32; font-size: 14px;"><strong>Your Role:</strong></td>
          <td style="color: #1B5E20; font-size: 14px;">${params.role}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
        <strong>Important:</strong> Please confirm your availability and review all event requirements in the platform.
      </p>
    </div>

    ${getButton('View Assignment Details', `${params.platformUrl}/talent/assignments?requestId=${params.requestId}`)}
    
    <p style="margin: 24px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
      If you have any questions or concerns about this assignment, please contact the admin team immediately.
    </p>
  `;

  return sendEmail({
    to: params.talentEmail,
    subject: `New Assignment: ${params.eventName} - ${params.eventDate}`,
    html: getEmailTemplate(content),
  });
}

export async function sendTalentApprovalEmail(params: {
  talentEmail: string;
  talentName: string;
  tier: string;
  platformUrl: string;
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #755f52; font-size: 24px;">
      🎉 Welcome to EventCoverageJamaica!
    </h2>
    <p style="margin: 0 0 16px 0; color: #333; font-size: 16px; line-height: 1.6;">
      Hi ${params.talentName},
    </p>
    <p style="margin: 0 0 24px 0; color: #333; font-size: 16px; line-height: 1.6;">
      Congratulations! Your application has been approved, and you're now part of the EventCoverageJamaica talent network.
    </p>
    
    <div style="background-color: #E8F5E9; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center;">
      <p style="margin: 0 0 12px 0; font-size: 48px;">
        ✓
      </p>
      <p style="margin: 0 0 8px 0; color: #2E7D32; font-weight: 600; font-size: 18px;">
        Your Tier: ${params.tier.toUpperCase()}
      </p>
      <p style="margin: 0; color: #555; font-size: 14px;">
        You can now receive assignments
      </p>
    </div>

    <div style="background-color: #f8f8f8; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 12px 0; color: #755f52; font-weight: 600; font-size: 15px;">
        What's Next?
      </p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
        <li>Complete your profile with portfolio samples</li>
        <li>Set your availability calendar</li>
        <li>Review platform guidelines and standards</li>
        <li>You'll be notified when assignments match your profile</li>
      </ul>
    </div>

    ${getButton('Access Your Dashboard', `${params.platformUrl}/talent`)}
    
    <p style="margin: 24px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
      We're excited to have you on board! Our team is here to support you every step of the way.
    </p>
  `;

  return sendEmail({
    to: params.talentEmail,
    subject: '🎉 Welcome to EventCoverageJamaica - Application Approved!',
    html: getEmailTemplate(content),
  });
}

// Export all functions
export default {
  sendRequestCreatedEmail,
  sendStatusUpdateEmail,
  sendQuoteSentEmail,
  sendRequestCompletedEmail,
  sendNewRequestNotificationToAdmins,
  sendNewTalentApplicationNotification,
  sendNewServiceSubmissionNotification,
  sendTalentAssignmentEmail,
  sendTalentApprovalEmail,
};
