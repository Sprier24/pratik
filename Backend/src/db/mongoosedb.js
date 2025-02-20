const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://JARVIS:abcd1234@crm.eylks.mongodb.net/newcrm");
        console.log("Connected to DB");
    } catch (error) {
        console.log("Not connected to DB", error);
    }
}

module.exports = connectDB;
