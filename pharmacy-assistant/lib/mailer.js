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
