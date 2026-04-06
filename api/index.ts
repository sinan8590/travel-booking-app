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
    console.log('Attempting to send booking email for:', name);
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const receiverEmail = process.env.RECEIVER_EMAIL || emailUser;

    console.log('Email Config Check:');
    console.log('- EMAIL_USER:', emailUser || 'NOT SET');
    console.log('- EMAIL_PASS length:', emailPass ? emailPass.length : 'NOT SET');

    if (!emailUser || !emailPass) {
      console.error('Email credentials missing in environment variables');
      return res.status(500).json({ 
        error: 'Email service is not configured.',
        details: 'The site owner needs to set EMAIL_USER and EMAIL_PASS in the Vercel Environment Variables.',
        help: 'Please go to Vercel Project Settings > Environment Variables and add EMAIL_USER and EMAIL_PASS.'
      });
    }

    if (emailUser.toLowerCase() === 'gmail') {
      return res.status(500).json({
        error: 'Invalid Email Configuration.',
        details: 'EMAIL_USER is set to "gmail". It should be your full email address (e.g., muhammedsinanu8590@gmail.com).',
        help: 'Please update the EMAIL_USER environment variable to your actual Gmail address.'
      });
    }

    // Clean spaces from Gmail App Password
    let finalPass = emailPass.replace(/\s/g, '');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: finalPass,
      },
      debug: true,
      logger: true,
    });

    // Verify connection configuration
    try {
      await transporter.verify();
      console.log('Nodemailer transporter verified successfully');
    } catch (verifyError) {
      console.error('Nodemailer verification failed:', verifyError);
      const errorMsg = verifyError instanceof Error ? verifyError.message : String(verifyError);
      let helpText = 'Please check your EMAIL_PASS in the Vercel Environment Variables.';
      
      if (errorMsg.includes('535-5.7.8')) {
        helpText = 'Google rejected your login. This almost always means you are using your regular password instead of an "App Password". \n\nTo fix this:\n1. Enable 2-Step Verification in your Google Account.\n2. Search for "App Passwords" and generate a new 16-character code.\n3. Use that code in Vercel.\n\nDirect Link: https://myaccount.google.com/apppasswords';
      }

      return res.status(500).json({ 
        error: 'Email service configuration error.',
        details: errorMsg,
        help: helpText
      });
    }

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

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
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
