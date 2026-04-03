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
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'muhammedsinanu8590@gmail.com',
          pass: process.env.EMAIL_PASS || 'ufqu rqgv byak ydgy',
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER || 'muhammedsinanu8590@gmail.com',
        to: process.env.RECEIVER_EMAIL || 'muhammedsinanu8590@gmail.com',
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
      res.status(500).json({ error: 'Failed to send booking request. Please try again later.' });
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
