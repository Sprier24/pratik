const ChatMessage = require('../model/chatMessage.model');

// Save a new chat message
const saveMessage = async (req, res) => {
  try {
    const { sender, content, chatId } = req.body;

    // For the first message in a chat, set the chat title
    let chatTitle = null;
    if (sender === 'user') {
      const chatMessageCount = await ChatMessage.countDocuments({ chatId });
      if (chatMessageCount === 0) {
        chatTitle = content.substring(0, 50); // Use first 50 chars as title
      }
    }

    const newMessage = new ChatMessage({
      sender,
      content,
      chatId,
      chatTitle,
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
    
    const messages = await ChatMessage.find(query).sort({ timestamp: 1 });
    res.status(200).json(messages);
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
  
module.exports = { 
    saveMessage, 
    getMessages,
    updateMessage 
};
