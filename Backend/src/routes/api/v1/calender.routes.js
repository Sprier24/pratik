const express = require("express");

const { getEvent, updateEvent, createEvent, deleteEvent } = require("../../../controller/calender.controller");

const router = express.Router();

router.post("/createEvent", createEvent);
router.get("/getEvent", getEvent);
router.put("/updateEvent/:id", updateEvent); 
router.delete("/deleteEvent/:id", deleteEvent);

module.exports = router;
