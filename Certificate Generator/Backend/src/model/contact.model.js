const mongoose = require("mongoose");

const contactPersonSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    contactNo: { type: String, required: true },
    email: { type: String, required: true },
    designation: { type: String, required: true },
    company: { type: String, required: true }
}, {
    timestamps: true
});

const ContactPerson = mongoose.model("ContactPerson", contactPersonSchema)

module.exports = ContactPerson