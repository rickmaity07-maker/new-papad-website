import crypto from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin lets this server-side function write to Firestore
// regardless of client security rules (which correctly restrict writes
// to a user's own documents from the browser).
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    uid, email, items, total, shippingAddress
  } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !uid || !items || !total) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Verify the payment signature actually came from Razorpay
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed — signature mismatch' });
    }

    // 2. Save the order to Firestore
    const orderRef = await db.collection('users').doc(uid).collection('orders').add({
      email,
      items,
      total,
      shippingAddress,
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      status: 'paid',
      createdAt: new Date()
    });

    // 3. Confirmation email to the customer
    await sendEmail({
      to: email,
      subject: 'Your LIJO Papad order is confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <h2 style="letter-spacing: 1px;">LIJO PAPAD</h2>
          <p>Thank you for your order! We've received your payment and your papads are being prepared.</p>
          <h3 style="margin-top: 24px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${items.map(item => `
              <tr>
                <td style="padding: 6px 0;">${escapeHtml(item.name)} &times; ${item.qty}</td>
                <td style="padding: 6px 0; text-align: right;">$${(item.price * item.qty).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr>
              <td style="padding: 10px 0; font-weight: bold; border-top: 1px solid #eee;">Total</td>
              <td style="padding: 10px 0; font-weight: bold; text-align: right; border-top: 1px solid #eee;">$${total.toFixed(2)}</td>
            </tr>
          </table>
          <h3 style="margin-top: 24px;">Shipping To</h3>
          <p>${escapeHtml(shippingAddress.street)}<br/>${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.state)} ${escapeHtml(shippingAddress.postalCode)}<br/>${escapeHtml(shippingAddress.country)}</p>
          <p style="margin-top: 24px; color: #666; font-size: 13px;">Order ID: ${orderRef.id}</p>
          <p>&mdash; The LIJO Papad Team</p>
        </div>
      `
    });

    // 4. Notification email to the manufacturer/admin
    await sendEmail({
      to: process.env.MANUFACTURER_EMAIL,
      subject: `New order received — $${total.toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <h2 style="margin-bottom: 4px;">New Order</h2>
          <p style="color: #666; font-size: 13px;">Order ID: ${orderRef.id} &middot; Placed ${new Date().toLocaleString()}</p>

          <h3 style="margin-top: 24px;">Customer</h3>
          <p>${escapeHtml(email)}</p>

          <h3 style="margin-top: 24px;">Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${items.map(item => `
              <tr>
                <td style="padding: 6px 0;">${escapeHtml(item.name)} &times; ${item.qty}</td>
                <td style="padding: 6px 0; text-align: right;">$${(item.price * item.qty).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr>
              <td style="padding: 10px 0; font-weight: bold; border-top: 1px solid #eee;">Total</td>
              <td style="padding: 10px 0; font-weight: bold; text-align: right; border-top: 1px solid #eee;">$${total.toFixed(2)}</td>
            </tr>
          </table>

          <h3 style="margin-top: 24px;">Ship To</h3>
          <p>${escapeHtml(shippingAddress.street)}<br/>${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.state)} ${escapeHtml(shippingAddress.postalCode)}<br/>${escapeHtml(shippingAddress.country)}</p>

          <p style="margin-top: 24px; color: #666; font-size: 13px;">Payment ID: ${razorpay_payment_id}</p>
        </div>
      `
    });

    return res.status(200).json({ success: true, orderId: orderRef.id });
  } catch (err) {
    console.error('Payment verification/order error:', err);
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