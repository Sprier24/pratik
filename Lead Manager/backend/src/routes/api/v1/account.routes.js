const express = require("express");
const accountController = require("../../../controller/account.controller");

const router = express.Router();

router.post("/accountAdd", accountController.accountAdd);

router.put("/updateAccount/:id", accountController.updateAccount);
router.delete("/deleteAccount/:id", accountController.deleteAccount);
router.get("/getAllAccounts", accountController.getAllAccounts); 
router.get("/getAccount/:id", accountController.getAccountById); 
router.get("/getUnpaidAccounts", accountController.getUnpaidAccounts);
router.get("/getPaidAccounts", accountController.getPaidAccounts);
router.post("/sendEmailReminder/:id", accountController.sendEmailReminder); 
router.put("/updateCustomMessage/:id",accountController.updateCustomMessage)
module.exports = router;
