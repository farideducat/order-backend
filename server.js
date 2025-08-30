// ===============================
// Imports & Config
// ===============================
const express = require("express");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config();

// ===============================
// Middleware
// ===============================
app.use(express.json());

// Allow only your GitHub Pages frontend
const allowedOrigins = [
  "https://farideducat.github.io",
  "https://farideducat.github.io/partsStore"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
};

app.use(cors(corsOptions));

// ===============================
// MongoDB Connection
// ===============================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ===============================
// Order Schema
// ===============================
const orderSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  orderItems: [
    {
      name: String,
      quantity: Number,
      price: Number,
    },
  ],
  subtotal: Number,
  shipping: Number,
  total: Number,
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

// ===============================
// Nodemailer Setup
// ===============================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ===============================
// Routes
// ===============================

// Test route
app.get("/", (req, res) => {
  res.send("✅ Backend is running with MongoDB!");
});

// Send email + save order
app.post("/send-email", async (req, res) => {
  const { name, email, phone, address, orderItems, subtotal, shipping, total } = req.body;

  // ✅ Email for Admin
  const adminHtml = `
    <h2>📦 New Order Received</h2>
    <p><b>Name:</b> ${name}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Phone:</b> ${phone}</p>
    <p><b>Address:</b> ${address}</p>
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price (OMR)</th>
        </tr>
      </thead>
      <tbody>
        ${orderItems.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toFixed(2)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
    <p><b>Subtotal:</b> OMR ${subtotal.toFixed(2)}</p>
    <p><b>Shipping:</b> OMR ${shipping.toFixed(2)}</p>
    <p><b>Total:</b> OMR ${total.toFixed(2)}</p>
  `;

  // ✅ Email for Customer
  const customerHtml = `
    <h2>✅ Thank you for your order, ${name}!</h2>
    <p>We have received your order. Here are the details:</p>
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price (OMR)</th>
        </tr>
      </thead>
      <tbody>
        ${orderItems.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toFixed(2)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
    <p><b>Subtotal:</b> OMR ${subtotal.toFixed(2)}</p>
    <p><b>Shipping:</b> OMR ${shipping.toFixed(2)}</p>
    <p><b>Total:</b> OMR ${total.toFixed(2)}</p>
    <p>📦 Your order is being processed. We’ll notify you once it’s shipped!</p>
  `;

  try {
    // ✅ Save order to MongoDB
    const newOrder = new Order({
      name,
      email,
      phone,
      address,
      orderItems,
      subtotal,
      shipping,
      total,
    });
    await newOrder.save();

    // ✅ Send email to Admin
    await transporter.sendMail({
      from: `"Farid Express Orders" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "📦 New Order Received",
      html: adminHtml,
    });

    // ✅ Send confirmation to Customer
    await transporter.sendMail({
      from: `"Farid Express" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Your Order Confirmation - Farid Express",
      html: customerHtml,
    });

    res.json({ success: true, message: "Order saved & emails sent!" });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, message: "Failed to process order" });
  }
});

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
