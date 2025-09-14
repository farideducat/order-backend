// ===============================
// Imports & Config
// ===============================
const express = require("express");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

//import product model
const Product = require("./models/Product");

const { default: mongoose } = require("mongoose");

// Middleware

app.use(express.json());

// Allow only your GitHub Pages frontend
const allowedOrigins = [
  "https://farideducat.github.io",
  "https://farideducat.github.io/partsStore",
     "http://127.0.0.1:5500", 
    "http://localhost:5500",
     "https://order-backend-o09t.onrender.com" 
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
};

app.use(cors(corsOptions));


// mongoDB connection 

mongoose.connect(process.env.MONGO_URL,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.log("❌ MongoDB connection error:", err));

// ===============================
// Nodemailer Setup for order
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
  res.send("✅ Backend is running!");
});


  // product routs admin panel API

  // add product

  app.post("/api/product", async (req, res) => {
    try{
      const newProduct = new Product(req.body);
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
    }  catch (err) {
      res.status(500).json({error: "Failed to add product", details: err.message });
    }
  })


  //get all products

  app.get("/api/product", async (req, res ) => {
    try{ 
    const products =  await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
  });


  //update product 
  app.put("/api/product/:id", async (req, res) => {
    try{
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new: true}
      );
      res.json(updatedProduct);
    } catch(err) {
      res.status(500).json({error: "Failed to update product"});
    }
  });



  //deleted product

  app.delete("/api/product/:id", async (req, res) => {
    try{
      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: "product deleted successfully"});
    } catch (err) {
      res.status(500).json({error: "failed to delete product"});
    }
  });

   
// Send email route
app.post("/send-email", async (req, res) => {
  const { name, email, phone, address, orderItems, subtotal, shipping, total } = req.body;

  // ✅ Email for Admin (store owner)
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
        ${orderItems
          .map(
            (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toFixed(2)}</td>
          </tr>`
          )
          .join("")}
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
        ${orderItems
          .map(
            (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toFixed(2)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
    <p><b>Subtotal:</b> OMR ${subtotal.toFixed(2)}</p>
    <p><b>Shipping:</b> OMR ${shipping.toFixed(2)}</p>
    <p><b>Total:</b> OMR ${total.toFixed(2)}</p>
    <p>📦 Your order is being processed. We’ll notify you once it’s shipped!</p>
  `;

  try {
    // Send email to Admin (you)
    await transporter.sendMail({
      from: `"Farid Express Orders" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "📦 New Order Received",
      html: adminHtml,
    });

    // Send confirmation to Customer
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

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
