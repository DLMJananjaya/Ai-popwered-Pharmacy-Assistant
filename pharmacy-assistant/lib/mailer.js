import nodemailer from 'nodemailer';

export const sendOTP = async (email, otp) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn(`[Mock Email] OTP for ${email} is: ${otp}`);
    console.warn('Set EMAIL_USER and EMAIL_PASS in .env.local to send real emails.');
    return true;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your email provider
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from: `"AI Pharmacy Assistant" <${user}>`,
    to: email,
    subject: 'Your One-Time Password (OTP)',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Verify Your Login</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="color: #00A99D; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// --- NEW: send prescription + side effects to patient ---

/**
 * Builds one medicine's HTML block: name, dosage info, side effects, warnings.
 * Kept separate so the main function stays readable.
 */
function renderMedicineBlock(med) {
  const sideEffectsHtml = med.sideEffects && med.sideEffects.found
    ? `
        <p style="margin: 8px 0 4px 0;"><strong>Common side effects:</strong> ${med.sideEffects.common}</p>
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:8px 12px; margin:6px 0;">
          <strong style="color:#b91c1c;">⚠ Warning:</strong>
          <span style="color:#b91c1c;">${med.sideEffects.warnings}</span>
        </div>
        <p style="font-size:11px; color:#888; margin:4px 0 0 0;">Source: ${med.sideEffects.source}</p>
      `
    : `<p style="font-size:12px; color:#888; font-style:italic;">Side effect information not available — please ask your pharmacist.</p>`;

  return `
    <div style="border:1px solid #e5e7eb; border-radius:10px; padding:14px 16px; margin-bottom:14px;">
      <h3 style="margin:0 0 6px 0; color:#00A99D;">${med.canonical || med.input}</h3>
      ${sideEffectsHtml}
    </div>
  `;
}

/**
 * Sends the patient a readable summary of their prescription's medicines
 * and side effects. `medicines` should be the array of identified medicines
 * (same shape as `manualMeds` in the frontend) that were found (med.found === true).
 */
export const sendPrescriptionEmail = async (email, patientName, medicines) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn(`[Mock Email] Prescription info for ${email}:`, medicines);
    console.warn('Set EMAIL_USER and EMAIL_PASS in .env.local to send real emails.');
    return true;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const foundMedicines = medicines.filter((m) => m.found);
  const medicineBlocksHtml = foundMedicines.map(renderMedicineBlock).join('');

  const mailOptions = {
    from: `"VAIDIA Pharmacy Assistant" <${user}>`,
    to: email,
    subject: 'Your Prescription - Medicine Information & Side Effects',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#00A99D;">Your Prescription Information</h2>
        ${patientName ? `<p>Dear ${patientName},</p>` : '<p>Dear Patient,</p>'}
        <p>Here is the information about your prescribed medicines, including possible side effects to be aware of.</p>
        ${medicineBlocksHtml}
        <p style="font-size:12px; color:#888; margin-top:20px;">
          This information is provided for your awareness and is not a substitute for advice from your doctor or pharmacist.
          If you experience any severe or unexpected symptoms, contact your healthcare provider immediately.
        </p>
        <p style="font-size:12px; color:#888;">— VAIDIA Pharmacy Assistant</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Prescription email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending prescription email:', error);
    return false;
  }
};
