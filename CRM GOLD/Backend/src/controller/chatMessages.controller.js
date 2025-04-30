const ChatMessage = require('../model/chatMessage.model');

// Save a new chat message
const saveMessage = async (req, res) => {
  try {
    const { sender, content, chatId } = req.body;

    let chatTitle = null;
    if (sender === 'user') {
      const chatMessageCount = await ChatMessage.countDocuments({ chatId });
      if (chatMessageCount === 0) {
        chatTitle = content.substring(0, 50);
      }
    }

    const newMessage = new ChatMessage({
      sender,
      content,
      chatId,
      chatTitle,
      // Explicitly set createdAt if needed
      createdAt: new Date().toISOString(),
    });

    await newMessage.save();
    res.status(200).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error saving message', error });
  }
};

// Get all chat messages
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.query;
    const query = chatId ? { chatId } : {};
    
    const messages = await ChatMessage.find(query).sort({ createdAt: 1 });

    // Ensure createdAt exists for every message (fallback to current time if missing)
    const sanitizedMessages = messages.map(msg => ({
      ...msg._doc,
      createdAt: msg.createdAt || new Date().toISOString(),
    }));

    res.status(200).json(sanitizedMessages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
};

const updateMessage = async (req, res) => {
    try {
      const { messageId, newContent } = req.body;
  
      const updatedMessage = await ChatMessage.findByIdAndUpdate(
        messageId,
        { content: newContent, edited: true },
        { new: true }
      );
  
      res.status(200).json(updatedMessage);
    } catch (error) {
      res.status(500).json({ message: 'Error updating message', error });
    }
  };

const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Delete all messages with this chatId
    const result = await ChatMessage.deleteMany({ chatId });
    
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} messages`,
      chatId
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error deleting chat', 
      error: error.message 
    });
  }
};

const renameChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { chatTitle } = req.body;
    
    await ChatMessage.updateMany(
      { chatId },
      { $set: { chatTitle } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Chat renamed successfully',
      chatId,
      chatTitle
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error renaming chat', 
      error: error.message 
    });
  }
};
  
module.exports = { 
    saveMessage, 
    getMessages,
    updateMessage,
    deleteChat,
    renameChat
};
