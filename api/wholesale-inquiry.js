import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    contactName, businessName, businessType, email, phone, altPhone,
    city, state, country, gst, volume, message
  } = req.body || {};

  if (!contactName || !businessName || !businessType || !email || !phone || !city || !state || !country || !volume) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Save the inquiry to Supabase
    const { data, error: dbError } = await supabase
      .from('wholesale_inquiries')
      .insert([{
        contact_name: contactName,
        business_name: businessName,
        business_type: businessType,
        email,
        phone,
        alt_phone: altPhone || null,
        city,
        state,
        country,
        gst: gst || null,
        volume,
        message: message || null
      }])
      .select()
      .single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // 2. Confirmation email to the requester
    await sendEmail({
      to: email,
      subject: "We've received your LIJO Papad wholesale inquiry",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <h2 style="letter-spacing: 1px; margin-bottom: 4px;">LIJO PAPAD</h2>
          <p>Hi ${escapeHtml(contactName)},</p>
          <p>Thank you for your interest in stocking LIJO Papad. We've received your wholesale inquiry and our team will review it and reach out within 1&ndash;2 business days.</p>
          <h3 style="margin-top: 24px;">Your submission</h3>
          <ul style="line-height: 1.7;">
            <li><strong>Business:</strong> ${escapeHtml(businessName)} (${escapeHtml(businessType)})</li>
            <li><strong>Location:</strong> ${escapeHtml(city)}, ${escapeHtml(state)}, ${escapeHtml(country)}</li>
            <li><strong>Expected volume:</strong> ${escapeHtml(volume)} lbs/month</li>
            <li><strong>Contact number:</strong> ${escapeHtml(phone)}</li>
          </ul>
          <p style="margin-top: 24px;">If anything above needs correcting, just reply to this email.</p>
          <p>&mdash; The LIJO Papad Team</p>
        </div>
      `
    });

    // 3. Detailed notification email to the manufacturer/admin
    await sendEmail({
      to: process.env.MANUFACTURER_EMAIL,
      subject: `New wholesale inquiry: ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <h2 style="margin-bottom: 4px;">New Wholesale Inquiry</h2>
          <p style="color: #666; font-size: 13px;">Submitted ${new Date().toLocaleString()}</p>

          <h3 style="margin-top: 24px;">Contact Details</h3>
          <ul style="line-height: 1.7;">
            <li><strong>Name:</strong> ${escapeHtml(contactName)}</li>
            <li><strong>Phone:</strong> ${escapeHtml(phone)}</li>
            <li><strong>Alt / WhatsApp:</strong> ${altPhone ? escapeHtml(altPhone) : '&mdash;'}</li>
            <li><strong>Email:</strong> ${escapeHtml(email)}</li>
          </ul>

          <h3 style="margin-top: 24px;">Business Details</h3>
          <ul style="line-height: 1.7;">
            <li><strong>Business Name:</strong> ${escapeHtml(businessName)}</li>
            <li><strong>Type:</strong> ${escapeHtml(businessType)}</li>
            <li><strong>GST / Tax ID:</strong> ${gst ? escapeHtml(gst) : '&mdash;'}</li>
            <li><strong>Location:</strong> ${escapeHtml(city)}, ${escapeHtml(state)}, ${escapeHtml(country)}</li>
          </ul>

          <h3 style="margin-top: 24px;">Order Requirements</h3>
          <ul style="line-height: 1.7;">
            <li><strong>Expected Monthly Volume:</strong> ${escapeHtml(volume)} lbs</li>
            <li><strong>Additional Requirements:</strong> ${message ? escapeHtml(message) : '&mdash;'}</li>
          </ul>

          <p style="margin-top: 24px; color: #666; font-size: 13px;">Reply directly to ${escapeHtml(email)} or call ${escapeHtml(phone)} to follow up.</p>
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