import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for booking
  app.post('/api/book', async (req, res) => {
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
      console.log('- EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail (default)');

      if (!emailUser || !emailPass) {
        console.error('Email credentials missing in environment variables');
        return res.status(500).json({ 
          error: 'Email service is not configured.',
          details: 'The site owner needs to set EMAIL_USER and EMAIL_PASS in the Secrets panel.'
        });
      }

      // Basic validation for Gmail App Password (should be 16 chars)
      if (process.env.EMAIL_SERVICE === 'gmail' || !process.env.EMAIL_SERVICE) {
        const cleanPass = emailPass.replace(/\s/g, '');
        if (cleanPass.length !== 16) {
          console.warn('Warning: EMAIL_PASS does not appear to be a valid 16-character Gmail App Password.');
        }
      }

      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      // Verify connection configuration
      try {
        await transporter.verify();
        console.log('Nodemailer transporter verified successfully');
      } catch (verifyError) {
        console.error('Nodemailer verification failed:', verifyError);
        return res.status(500).json({ 
          error: 'Email service configuration error. Please check your EMAIL_PASS in the Secrets panel.',
          details: verifyError instanceof Error ? verifyError.message : String(verifyError)
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
