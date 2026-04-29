const { Resend } = require('resend');

// Vercel Serverless Function Implementation
module.exports = async (req, res) => {
  // 1. Full CORS Support
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // 2. Preflight Handing (Magic Fix for Mobile)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requesterEmail, amount, status, requesterName, message, reason } = req.body;

  // 3. Payload Validation
  if (!requesterEmail || !amount || !status) {
    return res.status(400).json({ 
      error: 'Missing required fields: requesterEmail, amount, and status are mandatory for automation.' 
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // 4. Onboarding Logic for Free/Dev Tiers
    const fromEmail = "NGO Mission Control <onboarding@resend.dev>";

    // 5. Professional HTML Payload
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
        <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #1e40af; margin-top: 0;">Mission Authorization Update</h2>
          <p>Your request for <strong>₹${amount}</strong> has been updated to <strong>${status.toUpperCase()}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0;">
            <p style="margin: 0;"><strong>Requester:</strong> ${requesterName || requesterEmail}</p>
            ${message ? `<p style="margin: 8px 0 0 0;"><strong>Original Message:</strong> ${message}</p>` : ''}
            ${reason ? `<p style="margin: 16px 0 0 0; color: #b91c1c;"><strong>Finance Note:</strong> ${reason}</p>` : ''}
          </div>
          
          <p style="font-size: 12px; color: #94a3b8;">Sent via NGO Hub Automation Core.</p>
        </div>
      </div>
    `;

    const data = await resend.emails.send({
      from: fromEmail,
      to: requesterEmail,
      subject: `[MISSION HUB] Request Updated: ${status}`,
      html: htmlContent,
    });

    res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error('SERVERLESS_API_ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};
