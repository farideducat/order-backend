const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Root route (for testing)
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// Send email route
app.post("/send-email", async (req, res) => {
  const { name, email, phone, address, orderItems, subtotal, shipping, total } = req.body;

  // ✅ Admin email
  const adminHtml = `
    <h2>📦 New Order Received</h2>
    <p><b>Name:</b> ${name}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Phone:</b> ${phone || "N/A"}</p>
    <p><b>Address:</b> ${address}</p>
    <h3>Order Summary</h3>
    <ul>
      ${orderItems.map((item) => `<li>${item.name} x${item.quantity} - OMR ${item.price.toFixed(2)}</li>`).join("")}
    </ul>
    <p><b>Subtotal:</b> OMR ${subtotal.toFixed(2)}</p>
    <p><b>Shipping:</b> OMR ${shipping.toFixed(2)}</p>
    <p><b>Total:</b> OMR ${total.toFixed(2)}</p>
  `;

  // ✅ Customer email
  const customerHtml = `
    <h2>✅ Order Confirmation</h2>
    <p>Dear ${name},</p>
    <p>Thank you for your order with <b>Farid Express</b>! 🎉</p>
    <p><b>Order Details:</b></p>
    <ul>
      ${orderItems.map((item) => `<li>${item.name} x${item.quantity} - OMR ${item.price.toFixed(2)}</li>`).join("")}
    </ul>
    <p><b>Total:</b> OMR ${total.toFixed(2)}</p>
    <p>📍 Shipping Address: ${address}</p>
    <p>We’ll contact you soon regarding delivery 🚚</p>
    <p>— Farid Express</p>
  `;

  try {
    // Send to Admin
    await transporter.sendMail({
      from: `"Farid Express Orders" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "📦 New Order Received",
      html: adminHtml,
    });

    // Send to Customer
    await transporter.sendMail({
      from: `"Farid Express" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Your Order Confirmation - Farid Express",
      html: customerHtml,
    });

    res.json({ success: true, message: "Order emails sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
