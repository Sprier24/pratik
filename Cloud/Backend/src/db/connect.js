const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb+srv://JARVIS:abcd1234@crm.eylks.mongodb.net/certificate";
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true
        };

        await mongoose.connect(uri, options);
        console.log("Connected to DB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit if database connection fails
    }
}

module.exports = connectDB;