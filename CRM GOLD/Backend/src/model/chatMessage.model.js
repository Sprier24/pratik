const mongoose = require('mongoose');

// chatMessage.model.js
const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  edited: {
    type: Boolean,
    default: false,
  },
  chatId: {
    type: String,
    required: true,
    index: true,
  },
  chatTitle: {
    type: String,
  },
}, { timestamps: true });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
