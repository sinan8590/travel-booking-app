import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Simple GET route for testing API connectivity
app.get(['/api', '/api/ping'], (req, res) => {
  res.json({ status: 'ok', message: 'API is reachable!' });
});

// API Route for testing email connection
app.post(['/api/test-email', '/test-email'], async (req, res) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return res.status(400).json({ error: 'Email credentials missing in Secrets panel.' });
    }

    if (emailUser.toLowerCase() === 'gmail') {
      return res.status(400).json({
        error: 'Invalid Email Configuration.',
        details: 'EMAIL_USER is set to "gmail". It should be your full email address (e.g., muhammedsinanu8590@gmail.com).'
      });
    }

    let finalPass = emailPass.replace(/\s/g, '');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: finalPass,
      },
    });

    await transporter.verify();
    res.json({ status: 'ok', message: 'Email connection verified successfully!' });
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({ 
      error: 'Email test failed.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// API Route for booking
app.post(['/api/book', '/book'], async (req, res) => {
  const { name, date, pickup, destination } = req.body;

  if (!name || !date || !pickup || !destination) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const receiverEmail = process.env.RECEIVER_EMAIL || emailUser;

    if (!emailUser || !emailPass) {
      return res.status(500).json({ 
        error: 'Configuration Missing',
        details: 'EMAIL_USER or EMAIL_PASS environment variables are not set in Vercel.',
        help: 'Please go to Vercel Project Settings > Environment Variables and add EMAIL_USER and EMAIL_PASS.'
      });
    }

    if (emailUser.toLowerCase() === 'gmail') {
      return res.status(500).json({
        error: 'Invalid Email Configuration.',
        details: 'EMAIL_USER is set to "gmail". It should be your full email address (e.g., muhammedsinanu8590@gmail.com).',
        help: 'Please update the EMAIL_USER secret in the Secrets panel to your actual Gmail address.'
      });
    }

    let finalPass = emailPass.replace(/\s/g, '');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: finalPass,
      },
    });

    const mailOptions = {
      from: emailUser,
      to: receiverEmail,
      subject: `New Booking Request: ${name}`,
      text: `
        New Booking Request from Green Kerala Website:
        
        Name: ${name}
        Travel Date: ${date}
        Pickup Location: ${pickup}
        Destination: ${destination}
        
        Please contact the customer to confirm.
      `,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #064e3b; border-radius: 10px;">
          <h2 style="color: #064e3b;">New Booking Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Travel Date:</strong> ${date}</p>
          <p><strong>Pickup Location:</strong> ${pickup}</p>
          <p><strong>Destination:</strong> ${destination}</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">This request was sent automatically from the Green Kerala website.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Booking request sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send booking request. Please try again later.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default app;
