const Account = require("../model/accountSchema.model");
const nodemailer = require("nodemailer");

const accountAdd = async (req, res) => {
    try {
        const { accountHolderName, accountNumber, bankName, accountType, IFSCCode, UpiId } = req.body;

        const newAccount = new Account({
            accountHolderName,
            accountNumber,
            bankName,
            accountType,
            IFSCCode,
            UpiId
        });

        const savedAccount = await newAccount.save();
        res.status(201).json({ message: "Account added successfully", data: savedAccount });

    } catch (error) {
        console.error("Error adding account:", error);
        res.status(500).json({ message: "Failed to add account", error: error.message });
    }
};

const updateAccount = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        console.log("Updating account with ID:", id, "and data:", updates);

        const updatedAccount = await Account.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!updatedAccount) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Account updated successfully",
            data: updatedAccount
        });
    } catch (error) {
        console.error("Error updating account:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const deleteAccount = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedAccount = await Account.findByIdAndDelete(id);

        if (!deletedAccount) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Account deleted successfully",
            data: deletedAccount
        });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getAllAccounts = async (req, res) => {
    try {
        const accounts = await Account.find({});
        res.status(200).json({
            success: true,
            data: accounts
        });
    } catch (error) {
        console.error("Error fetching accounts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getAccountById = async (req, res) => {
    const { id } = req.params;

    try {
        const account = await Account.findById(id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        res.status(200).json({
            success: true,
            data: account
        });
    } catch (error) {
        console.error("Error fetching account:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getUnpaidAccounts = async (req, res) => {

    try {
        const unpaidAccounts = await Account.find({ status: "Unpaid" });
        res.status(200).json({
            success: true,
            data: unpaidAccounts,
        });
    } catch (error) {
        console.error("Error fetching unpaid accounts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getPaidAccounts = async (req, res) => {

    try {
        const paidAccounts = await Account.find({ status: 'Paid' });

        // Map to extract only the desired fields
        // const response = unpaidAccounts.map(account => ({
        //     companyName: account.companyName,
        //     withGstAmount:account.withGstAmount,
        //     mobile:account.mobile,
        //     productName: account.productName,
        //     endDate: account.date // Assuming 'date' is your end date
        // }));

        // res.status(200).json({
        //     success: true,
        //     data: response
        // });
        res.status(200).json({
            success: true,
            data: paidAccounts
        });
    } catch (error) {
        console.error("Error fetching unpaid accounts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const transporter = nodemailer.createTransport({
    service: "gmail",  // Or another service like SendGrid
    auth: {
        user: process.env.EMAIL_USER,  // Get email from .env
        pass: process.env.EMAIL_PASS,  // Get password from .env
    },
});

const sendEmailReminder = async (req, res) => {
    const { id } = req.params; // Extract the contact ID from the request parameters
    const { message } = req.body; // Extract the message from the request body

    // Validate the message field
    if (!message) {
        return res.status(400).json({
            success: false,
            message: "Message content is required",
        });
    }

    try {
        // Find the account by ID
        const account = await Account.findById(id);

        if (!account) {
            return res.status(404).json({ success: false, message: "Account not found" });
        }

        // Validate the email address
        if (!account.emailAddress) {
            return res.status(400).json({
                success: false,
                message: "Email address not available for this account",
            });
        }

        // Define the email options
        const mailOptions = {
            from: "your-email@gmail.com", // Your email address
            to: account.emailAddress, // Recipient's email address from the database
            subject: `Payment Reminder for Account #${account.id}`, // Subject of the email
            text: message, // The message the user wrote
        };

        // Send the email using Nodemailer
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error.message);
                return res.status(500).json({
                    success: false,
                    message: "Error sending email: " + error.message,
                });
            }

            console.log("Email sent successfully: " + info.response);
            res.status(200).json({
                success: true,
                message: `Email sent successfully to ${account.emailAddress}`,
                data: info.response, // Return the email info (optional)
            });
        });
    } catch (error) {
        console.error("Error sending email:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};


const sendWhatsAppReminder = async (req, res) => {
    const { id } = req.params;

    try {
        // Find the account by ID
        const account = await Account.findById(id);
        if (!account) {
            return res.status(404).json({ success: false, message: "Account not found" });
        }

        // Construct the recipient's WhatsApp number
        const countryCode = '+91';
        const customerNumber = account.contactNumber;
        if (!customerNumber) {
            return res.status(400).json({ success: false, message: "Customer contact number not found" });
        }
        const formattedNumber = `${countryCode}${customerNumber}`;

        // Construct the reminder message
        const message = `Hello ${account.customerName},\n\nThis is a reminder to pay your outstanding account of ₹${account.remainingAmount}. Please make the payment at your earliest convenience.`;

        // Simulate sending a WhatsApp message
        console.log(`Sending WhatsApp message to: ${formattedNumber}`);
        console.log(`Message: ${message}`);

        // Respond with success
        res.status(200).json({
            success: true,
            message: "WhatsApp reminder sent successfully",
        });
    } catch (error) {
        // Handle errors
        console.error("Error sending WhatsApp reminder:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const updateCustomMessage = async(req,res)=>{
    try {
        const { customMessage } = req.body;
        const accountId = req.params.accountId;
    
        const updatedAccount = await Account.findByIdAndUpdate(accountId, { customMessage }, { new: true });
    
        if (!updatedAccount) {
          return res.status(404).json({ message: 'Account not found' });
        }
    
        return res.json({ data: updatedAccount });
      } catch (error) {
        console.error('Error saving custom message:', error);
        res.status(500).json({ message: 'Failed to save custom message' });
      }
}

module.exports = {
    accountAdd,
    updateAccount,
    deleteAccount,
    getAllAccounts,
    getAccountById,
    getUnpaidAccounts,
    getPaidAccounts,
    sendEmailReminder,
    sendWhatsAppReminder,
    updateCustomMessage,
};