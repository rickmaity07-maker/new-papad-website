import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fields, formData } = req.body || {};

  if (!fields || !formData) {
    return res.status(400).json({ error: 'Missing form data' });
  }

  // Validate required fields
  for (const field of fields) {
    if (field.required && !formData[field.id]) {
      return res.status(400).json({ error: `Missing required field: ${field.label}` });
    }
  }

  // Try to find an email field to send the confirmation to
  const emailField = fields.find(f => f.type === 'email');
  const customerEmail = emailField ? formData[emailField.id] : null;

  try {
    // 1. Save the full submission to Supabase as flexible JSON
    const { data, error: dbError } = await supabase
      .from('wholesale_inquiries')
      .insert([{ form_data: formData }])
      .select()
      .single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    const rowsHtml = fields
      .filter(f => formData[f.id])
      .map(f => `<li><strong>${escapeHtml(f.label)}:</strong> ${escapeHtml(formData[f.id])}</li>`)
      .join('');

    // 2. Confirmation email to the requester, if we have their email
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: "We've received your LIJO Papad wholesale inquiry",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
            <h2 style="letter-spacing: 1px;">LIJO PAPAD</h2>
            <p>Thank you for your interest in stocking LIJO Papad. We've received your wholesale inquiry and our team will review it and reach out within 1&ndash;2 business days.</p>
            <h3 style="margin-top: 24px;">Your submission</h3>
            <ul style="line-height: 1.7;">${rowsHtml}</ul>
            <p style="margin-top: 24px;">If anything above needs correcting, just reply to this email.</p>
            <p>&mdash; The LIJO Papad Team</p>
          </div>
        `
      });
    }

    // 3. Detailed notification email to the manufacturer/admin
    await sendEmail({
      to: process.env.MANUFACTURER_EMAIL,
      subject: `New wholesale inquiry${formData.businessName ? ': ' + formData.businessName : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <h2 style="margin-bottom: 4px;">New Wholesale Inquiry</h2>
          <p style="color: #666; font-size: 13px;">Submitted ${new Date().toLocaleString()}</p>
          <ul style="line-height: 1.7; margin-top: 20px;">${rowsHtml}</ul>
          ${customerEmail ? `<p style="margin-top: 24px; color: #666; font-size: 13px;">Reply directly to ${escapeHtml(customerEmail)} to follow up.</p>` : ''}
        </div>
      `
    });

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Wholesale inquiry error:', err);
    return res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

async function sendEmail({ to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Email send failed (${to}): ${errText}`);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}