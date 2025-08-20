const Razorpay = require("razorpay");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const Enrollment = require("../models/enrollment.model");
const Payment = require("../models/payment.model");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
  },
});

// Generate invoice number
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString();
  return `INV-${timestamp}`;
};

// Create Razorpay order for confirmation fee

const createConfirmationOrder = async (req, res) => {
  try {
    const { enrollmentId } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("user")
      .populate("course");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    if (enrollment.confirmationFeePaid) {
      return res.status(400).json({
        success: false,
        message: "Confirmation fee already paid",
      });
    }

    const options = {
      amount: enrollment.confirmationFeeAmount * 100, // Convert to paise
      currency: "INR",
      receipt: `conf_${enrollmentId}`,
      notes: {
        enrollmentId: enrollmentId,
        userId: enrollment.user._id.toString(),
        courseId: enrollment.course._id.toString(),
        paymentType: "CONFIRMATION",
      },
    };

    const order = await razorpay.orders.create(options);

    // Create payment record
    const payment = new Payment({
      user: enrollment.user._id,
      enrollment: enrollmentId,
      razorpayOrderId: order.id,
      amount: enrollment.confirmationFeeAmount,
      paymentType: "CONFIRMATION",
      invoiceNumber: generateInvoiceNumber(),
    });
    await payment.save();

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

// Verify confirmation payment
// router.post("/verify-confirmation-payment",
const verifyConfirmationPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Find payment
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Update payment
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "PAID";
    await payment.save();

    // Update enrollment
    const enrollment = await Enrollment.findById(payment.enrollment)
      .populate("user")
      .populate("course");

    enrollment.confirmationFeePaid = true;
    enrollment.confirmationPaymentId = razorpay_payment_id;
    enrollment.status = "CONFIRMED";
    await enrollment.save();

    // Send invoice email
    // await sendInvoiceEmail(payment, enrollment);

    res.json({
      success: true,
      message: "Payment verified successfully",
      enrollmentId: enrollment._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

// Create order for full/monthly payment
// router.post("/create-course-order", authenticateUser,
const createPaymentOrder = async (req, res) => {
  try {
    const { enrollmentId = "6898581a5cb7409300a71f0f", paymentMethod } =
      req.body;

    const enrollment = await Enrollment.findById(enrollmentId).populate(
      "course"
    );

    // if (!enrollment || enrollment.user.toString() !== req.user._id.toString()) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Enrollment not found",
    //   });
    // }

    if (!enrollment.confirmationFeePaid) {
      return res.status(400).json({
        success: false,
        message: "Confirmation fee not paid",
      });
    }

    let amount;
    let paymentType;

    if (paymentMethod === "full") {
      amount = enrollment.course.price;
      paymentType = "FULL";
    } else if (paymentMethod === "monthly") {
      amount = enrollment.course.monthlyPrice;
      paymentType = "MONTHLY";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `course_${enrollmentId}`,
      notes: {
        enrollmentId: enrollmentId,
        // userId: req.user._id.toString(),
        userId: "6898581a5cb7409300a71f0d",
        courseId: enrollment.course._id.toString(),
        paymentType: paymentType,
      },
    };

    const order = await razorpay.orders.create(options);

    // Create payment record
    const payment = new Payment({
      // user: req.user._id,
      user: "6898581a5cb7409300a71f0d",
      enrollment: enrollmentId,
      razorpayOrderId: order.id,
      amount: amount,
      paymentType: paymentType,
      invoiceNumber: generateInvoiceNumber(),
    });
    await payment.save();

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

// Verify course payment
// router.post("/verify-course-payment", authenticateUser,
const verifyCoursePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Find payment
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Update payment
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "PAID";
    await payment.save();

    // Update enrollment
    const enrollment = await Enrollment.findById(payment.enrollment)
      .populate("user")
      .populate("course");

    enrollment.paymentMethod =
      payment.paymentType === "FULL" ? "FULL" : "MONTHLY";
    enrollment.totalAmountPaid += payment.amount;

    if (payment.paymentType === "FULL") {
      enrollment.fullPaymentCompleted = true;
      enrollment.status = "ACTIVE";
    } else if (payment.paymentType === "MONTHLY") {
      const currentDate = new Date();
      enrollment.monthlyPayments.push({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        amount: payment.amount,
        paymentId: razorpay_payment_id,
        paidAt: new Date(),
        status: "PAID",
      });
      enrollment.status = "ACTIVE";
    }

    await enrollment.save();

    // Send invoice email
    await sendInvoiceEmail(payment, enrollment);

    res.json({
      success: true,
      message: "Payment verified successfully",
      enrollmentId: enrollment._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

// Razorpay webhook
// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),

const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false });
    }

    const event = JSON.parse(req.body);

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;

      // Find and update payment
      const payment = await Payment.findOne({
        razorpayOrderId: paymentEntity.order_id,
      });

      if (payment) {
        payment.status = "PAID";
        payment.razorpayPaymentId = paymentEntity.id;
        await payment.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ success: false });
  }
};

// Send invoice email

async function sendInvoiceEmail(payment, enrollment) {
  try {
    const pdfBuffer = await generateInvoicePDF(payment, enrollment);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      // to: process.env.EMAIL_USER, // or recipient email
      to: "akashfoundation.in@gmail.com",
      subject: `Invoice - ${payment.invoiceNumber}`,
      html: `
        <h2>Payment Invoice</h2>
        <p>Dear ${enrollment.user.name},</p>
        <p>Thank you for your payment. Please find your invoice attached.</p>
        <p><strong>Invoice Number:</strong> ${payment.invoiceNumber}</p>
        <p><strong>Amount:</strong> ₹${payment.amount}</p>
        <p><strong>Course:</strong> ${enrollment.course.title}</p>
        <p><strong>Payment ID:</strong> ${payment.razorpayPaymentId}</p>
        <br>
        <p>Best regards,<br>Course Team</p>
      `,
      attachments: [
        {
          filename: `invoice-${payment.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // Mark invoice as sent
    payment.invoiceSent = true;
    await payment.save();
  } catch (error) {
    console.error("Email sending error:", error);
  }
}
// Generate invoice PDF
async function generateInvoicePDF(payment, enrollment) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // PDF content
    doc.fontSize(20).text("INVOICE", 50, 50);
    doc.fontSize(12);
    doc.text(`Invoice Number: ${payment.invoiceNumber}`, 50, 100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 120);
    doc.text(`Payment ID: ${payment.razorpayPaymentId}`, 50, 140);

    doc.text("Bill To:", 50, 180);
    doc.text(`${enrollment.user.name}`, 50, 200);
    doc.text(`${enrollment.user.email}`, 50, 220);
    doc.text(`${enrollment.user.phone}`, 50, 240);
    doc.text(`${enrollment.user.address}, ${enrollment.user.city}`, 50, 260);
    doc.text(`${enrollment.user.state} - ${enrollment.user.pincode}`, 50, 280);

    doc.text("Course Details:", 50, 320);
    doc.text(`Course: ${enrollment.course.title}`, 50, 340);
    doc.text(`Payment Type: ${payment.paymentType}`, 50, 360);
    doc.text(`Amount: ₹${payment.amount}`, 50, 380);

    doc.text("Thank you for your payment!", 50, 420);

    doc.end();
  });
}

module.exports = {
  createPaymentOrder,
  verifyCoursePayment,
  createConfirmationOrder,
  razorpayWebhook,
  verifyConfirmationPayment,
};
