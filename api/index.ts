import nodemailer from 'nodemailer';

export const config = {
  runtime: 'nodejs',
};

// GET handler for testing connectivity
export async function GET(req: Request) {
  return Response.json({ 
    status: 'ok', 
    message: 'API is reachable!',
    system: 'v2.1 (Web API Mode)'
  });
}

// POST handler for Booking and Email Testing
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json();
    
    console.log("Incoming request to:", url.pathname);
    console.log("Data:", body);

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const receiverEmail = process.env.RECEIVER_EMAIL || emailUser;

    // 1. Check Configuration
    if (!emailUser || !emailPass) {
      return Response.json({ 
        error: 'Configuration Missing',
        details: 'EMAIL_USER or EMAIL_PASS environment variables are not set in Vercel.',
        help: 'Please go to Vercel Project Settings > Environment Variables and add EMAIL_USER and EMAIL_PASS.'
      }, { status: 500 });
    }

    // 2. Setup Transporter
    const finalPass = emailPass.replace(/\s/g, '');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: finalPass,
      },
    });

    // 3. Handle "/api/test-email"
    if (url.pathname.includes('/test-email')) {
      await transporter.verify();
      return Response.json({ success: true, message: 'Email connection verified!' });
    }

    // 4. Handle "/api/book"
    if (url.pathname.includes('/book')) {
      const { name, date, pickup, destination } = body;

      if (!name || !date || !pickup || !destination) {
        return Response.json({ error: 'All fields are required' }, { status: 400 });
      }

      const mailOptions = {
        from: emailUser,
        to: receiverEmail,
        subject: `New Booking Request: ${name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #064e3b; border-radius: 10px;">
            <h2 style="color: #064e3b;">New Booking Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Travel Date:</strong> ${date}</p>
            <p><strong>Pickup Location:</strong> ${pickup}</p>
            <p><strong>Destination:</strong> ${destination}</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">Sent from Green Kerala Website (Web API Mode).</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      return Response.json({ success: true, message: 'Booking request sent successfully' });
    }

    return Response.json({ error: 'Endpoint not found' }, { status: 404 });

  } catch (error: any) {
    console.error("API ERROR:", error);
    return Response.json(
      { 
        error: 'Server Error', 
        details: error.message,
        help: error.message.includes('535') ? 'Check your Gmail App Password.' : 'Check Vercel logs.'
      },
      { status: 500 }
    );
  }
}
