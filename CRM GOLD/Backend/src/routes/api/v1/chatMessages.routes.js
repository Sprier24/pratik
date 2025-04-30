const express = require('express');
const chatMessagesController = require('../../../controller/chatMessages.controller');
const router = express.Router();

// Save a new chat message
router.post('/messages', chatMessagesController.saveMessage);

// Get all chat messages
router.get('/getmessages', chatMessagesController.getMessages);

// Update a chat message
router.put('/editmessages/:id', chatMessagesController.updateMessage);

// Delete a chat message
router.delete('/:chatId', chatMessagesController.deleteChat);

// Rename a chat
router.patch('/:chatId', chatMessagesController.renameChat);

module.exports = router;
