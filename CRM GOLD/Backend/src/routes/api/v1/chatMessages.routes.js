const express = require('express');
const chatMessagesController = require('../../../controller/chatMessages.controller');
const router = express.Router();

// Save a new chat message
router.post('/messages', chatMessagesController.saveMessage);

// Get all chat messages
router.get('/getmessages', chatMessagesController.getMessages);

// Update a chat message
router.put('/editmessages/:id', chatMessagesController.updateMessage);

module.exports = router;
