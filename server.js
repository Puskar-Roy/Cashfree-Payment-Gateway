const express = require("express");
const dotenv = require("dotenv");
const {
  CFConfig,
  CFPaymentGateway,
  CFEnvironment,
  CFCustomerDetails,
  CFOrderRequest,
} = require("cashfree-pg-sdk-nodejs");

// Create an Express app
const app = express();
dotenv.config();
app.use(express.json());

// Configure your Cashfree environment and credentials
const cfConfig = new CFConfig(
  CFEnvironment.SANDBOX,
  "2023-08-01",
  process.env.API_ID,
  process.env.API_SEC
);

console.log(process.env.API_SEC);
// Create a Cashfree Payment Gateway instance
const paymentGateway = new CFPaymentGateway();

// Route for generating a payment session ID
app.post("/generate-session-id", async (req, res) => {
  try {
    // Create a CFCustomerDetails object with customer details
    const customerDetails = new CFCustomerDetails();
    customerDetails.customerId = "puskarroy";
    customerDetails.customerPhone = "9999999999";
    customerDetails.customerEmail = "Puskarroy@gmail.com";

    const cFOrderRequest = new CFOrderRequest();
    cFOrderRequest.orderAmount = 100;
    cFOrderRequest.orderCurrency = "INR";
    cFOrderRequest.customerDetails = customerDetails;

    // Generate the payment session ID
    const paymentSessionResponse = await paymentGateway.orderCreate(
      cfConfig,
      cFOrderRequest
    );

    if (paymentSessionResponse && paymentSessionResponse.cfOrder) {
      const paymentSessionId = paymentSessionResponse.cfOrder.paymentSessionId;
      res.json({ paymentSessionId });
    } else {
      res.status(500).json({ error: "Failed to generate payment session ID" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route for initiating a payment with the payment session ID
app.post("/initiate-payment", async (req, res) => {
  try {
    const { paymentSessionId } = req.body;

    // Create a CFCardPayment object with payment details (adjust as needed)
    const cFCardPayment = {
      card: {
        channel: "link",
        cardBankName: "Test",
        cardNumber: "4111111111111111",
        cardCvv: "123",
        cardExpiryMm: "12",
        cardExpiryYy: "25",
      },
    };

    // Create a CFOrderPayRequest object with payment session ID and payment method
    const cFOrderPayRequest = {
      paymentSessionId,
      paymentMethod: cFCardPayment,
    };

    // Initiate the payment
    const cfPayResponse = await paymentGateway.orderSessionsPay(
      cfConfig,
      cFOrderPayRequest
    );

    if (cfPayResponse && cfPayResponse.cfOrderPayResponse) {
      res.json({ orderId: cfPayResponse.cfOrderPayResponse.orderId });
    } else {
      res.status(500).json({ error: "Payment initiation failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
