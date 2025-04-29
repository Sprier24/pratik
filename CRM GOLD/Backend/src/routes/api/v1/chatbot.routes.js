const express = require("express");
const router = express.Router();
const chatbotController = require("../../../controller/chatbot.controller");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post("/chat", chatbotController.chatWithAI);
router.post("/extract-text", upload.single('file'), chatbotController.extractTextFromFile);

module.exports = router;//chatbot.routes.js.....//tessreact-old