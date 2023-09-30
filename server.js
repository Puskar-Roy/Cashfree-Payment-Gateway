const express = require("express");
const dotenv = require("dotenv");
const cors = require('cors')
const {
  CFConfig,
  CFPaymentGateway,
  CFEnvironment,
  CFCustomerDetails,
  CFOrderRequest,
  CFUPIPayment,
  CFUPI,
  CFOrderPayRequest,
} = require("cashfree-pg-sdk-nodejs");


const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
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
  const { name, phone, email, amount } = req.body;
  console.log(req.body);
  try {
    // Create a CFCustomerDetails object with customer details
    const customerDetails = new CFCustomerDetails();
    customerDetails.customerId = name;
    customerDetails.customerPhone = phone;
    customerDetails.customerEmail = email;

    const cFOrderRequest = new CFOrderRequest();
    cFOrderRequest.orderAmount = amount;
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

app.post("/initiate-payment-upi", async (req, res) => {
  try {
    const { paymentSessionId, paymentMethod } = req.body;

    // Payment method for UPI
    const cFUpiPayment = {
      upi: {
        channel: "collect", // Use "collect" for UPI collect payments
        upiId: "testsuccess@gocash", // Replace with your UPI ID
      },
    };

    // Create a CFOrderPayRequest object with payment session ID and payment method
    const cFOrderPayRequest = {
      paymentSessionId,
      paymentMethod: cFUpiPayment, // Use UPI payment method
    };

    // Initiate the payment
    const cfPayResponse = await paymentGateway.orderSessionsPay(
      cfConfig,
      cFOrderPayRequest
    );

    if (cfPayResponse && cfPayResponse.cfOrderPayResponse) {
      // In a real application, you may want to redirect the user to the UPI payment app
      // Here, we'll simply return the payment URL for demonstration purposes
      const paymentUrl = cfPayResponse.cfOrderPayResponse;
      console.log(paymentUrl);
      res.json({ paymentUrl });
    } else {
      res.status(500).json({ error: "Payment initiation failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// app.post("/initiate-payment-upi", async (req, res) => {
//   try {
//     const { paymentSessionId } = req.body;

//     // Create a CFUPI object for UPI payment
//     var cfUpi = new CFUPI();
//     cfUpi.channel = CFUPI.ChannelEnum.Collect;
//     cfUpi.upiId = "testsuccess@gocash"; // Replace with the actual UPI ID

//     // Create a CFUPIPayment object with UPI payment details
//     var cFUPIPayment = new CFUPIPayment();
//     cFUPIPayment.upi = cfUpi;

//     // Create a CFOrderPayRequest object with payment session ID and payment method
//     var cFOrderPayRequest = new CFOrderPayRequest();
//     cFOrderPayRequest.paymentSessionId = paymentSessionId;
//     cFOrderPayRequest.paymentMethod = cFUPIPayment;

//     // Initiate the UPI payment
//     var apiInstance = new CFPaymentGateway();
//     var cfPayResponse = await apiInstance.orderSessionsPay(
//       cfConfig,
//       cFOrderPayRequest
//     );

//     if (cfPayResponse && cfPayResponse.cfOrderPayResponse) {
//       // Extract the payment URL and handle it as needed
//       const paymentUrl = cfPayResponse.cfOrderPayResponse.data;
//       console.log("Payment URL:", paymentUrl);
//       res.json({ paymentUrl });
//     } else {
//       res.status(500).json({ error: "Payment initiation failed" });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
