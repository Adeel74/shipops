// ShipOps — Email notification infrastructure
// In production, integrate with a real email provider (Resend, SendGrid, Postmark).
// For dev/demo, emails are logged to the console and stored as audit logs.

export interface EmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email. In production, this calls the email provider API.
 * In dev, it logs to console and returns success.
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // In production:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // const result = await resend.emails.send({
    //   from: 'ShipOps <noreply@shipops.pk>',
    //   to: params.to,
    //   subject: params.subject,
    //   html: params.html,
    // })
    // return { success: true, messageId: result.id }

    // Dev: log to console
    console.log(`[EMAIL] To: ${params.to} | Subject: ${params.subject}`)
    console.log(`[EMAIL] Body: ${params.text || params.html.slice(0, 200)}...`)

    return { success: true, messageId: `dev_${Date.now()}` }
  } catch (e) {
    console.error('[EMAIL] Failed:', e)
    return { success: false, error: (e as Error).message }
  }
}

/**
 * Send a team invitation email.
 */
export async function sendInvitationEmail(params: {
  to: string
  orgName: string
  inviterName: string
  role: string
  inviteUrl: string
}): Promise<{ success: boolean }> {
  const { to, orgName, inviterName, role, inviteUrl } = params

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0f766e, #059669); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">ShipOps</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">COD Operations Cloud</p>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="margin: 0 0 15px; color: #18181b;">You're invited to join ${orgName}</h2>
        <p style="color: #52525b; line-height: 1.6;">
          <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on ShipOps as a <strong>${role}</strong>.
        </p>
        <p style="color: #52525b; line-height: 1.6;">
          ShipOps helps manage COD orders, courier dispatch, WhatsApp confirmations, and RTO recovery for Shopify stores.
        </p>
        <a href="${inviteUrl}" style="display: inline-block; background: #0f766e; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Accept Invitation
        </a>
        <p style="color: #a1a1aa; font-size: 12px; margin-top: 20px;">
          This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    </div>
  `

  const result = await sendEmail({
    to,
    subject: `You're invited to join ${orgName} on ShipOps`,
    html,
    text: `${inviterName} has invited you to join ${orgName} on ShipOps as a ${role}. Accept here: ${inviteUrl}`,
  })

  return { success: result.success }
}

/**
 * Send a daily operations summary email.
 */
export async function sendDailySummaryEmail(params: {
  to: string
  orgName: string
  stats: {
    totalOrders: number
    confirmed: number
    pending: number
    delivered: number
    rto: number
    revenue: number
  }
}): Promise<{ success: boolean }> {
  const { to, orgName, stats } = params

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0f766e, #059669); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Daily Summary — ${orgName}</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="margin: 0 0 20px; color: #18181b;">Today's Operations</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #52525b;">Total Orders</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${stats.totalOrders}</td></tr>
          <tr><td style="padding: 8px 0; color: #52525b;">Confirmed</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #059669;">${stats.confirmed}</td></tr>
          <tr><td style="padding: 8px 0; color: #52525b;">Pending Confirmation</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #d97706;">${stats.pending}</td></tr>
          <tr><td style="padding: 8px 0; color: #52525b;">Delivered</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #059669;">${stats.delivered}</td></tr>
          <tr><td style="padding: 8px 0; color: #52525b;">RTO</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #dc2626;">${stats.rto}</td></tr>
          <tr style="border-top: 2px solid #e5e7eb;"><td style="padding: 12px 0; color: #18181b; font-weight: 600;">Revenue</td><td style="padding: 12px 0; text-align: right; font-weight: 700; color: #059669;">Rs ${stats.revenue.toLocaleString()}</td></tr>
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background: #0f766e; color: white; padding: 10px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;">
          View Dashboard
        </a>
      </div>
    </div>
  `

  const result = await sendEmail({
    to,
    subject: `Daily Summary — ${orgName} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
    html,
  })

  return { success: result.success }
}
