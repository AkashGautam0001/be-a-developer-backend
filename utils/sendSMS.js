const axios = require("axios");

const sendOTP = async (phone, otp) => {
  try {
    // You can integrate with services like Twilio, MSG91, or Fast2SMS
    // This is a placeholder implementation
    console.log(`Sending OTP ${otp} to ${phone}`);

    // Example with Fast2SMS (replace with your actual service)
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        // route: "otp",
        route: "q",
        variables_values: otp,
        flash: 0,
        numbers: phone,
        message: `Your OTP is: ${otp}`,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error("SMS sending error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = sendOTP;
