const axios = require("axios");
const pdf = require('pdf-parse');
const textract = require('textract');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const chatWithAI = async (req, res) => {
  const { message, chatId } = req.body;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-4-maverick:free",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",  
          "Content-Type": "application/json",
        },
      }
    );

    const aiMessage = response.data.choices[0].message.content;
    
    res.status(200).json({ 
      success: true, 
      message: aiMessage,
      chatId // Include chatId in response if needed
    });
  } catch (error) {
    console.error("OpenRouter Error:", error?.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get AI response",
      error: error.message,
    });
  }
};

const extractTextFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    let extractedText = '';

    if (fileType.startsWith('image/')) {
      // For images (using Tesseract.js OCR)
      const result = await Tesseract.recognize(
        filePath,
        'eng',
        { logger: m => console.log(m) }
      );
      extractedText = result.data.text;
    } else if (fileType === 'application/pdf') {
      // For PDFs
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      extractedText = data.text;
    } else if (
      fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // For Word documents
      extractedText = await new Promise((resolve, reject) => {
        textract.fromFileWithPath(filePath, (error, text) => {
          if (error) reject(error);
          else resolve(text);
        });
      });
    } else if (fileType === 'text/plain') {
      // For plain text files
      extractedText = fs.readFileSync(filePath, 'utf8');
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file type' });
    }

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.status(200).json({ 
      success: true, 
      text: extractedText,
      fileName: req.file.originalname
    });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to extract text',
      error: error.message
    });
  }
};

module.exports = {
  chatWithAI,
  extractTextFromFile
};//chatbot.controller.js....//tesseract-old