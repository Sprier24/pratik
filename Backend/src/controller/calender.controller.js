const Event = require('../models/Event');

// Get all events
const getEvent = async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new event
const createEvent = async (req, res) => {
    const { title, date, calendarId } = req.body;
    try {
        const newEvent = new Event({ title, date, calendarId });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update an event
const updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, date, calendarId } = req.body;
    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            { title, date, calendarId },
            { new: true }
        );
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete an event
const deleteEvent = async (req, res) => {
    const { id } = req.params;
    try {
        await Event.findByIdAndDelete(id);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
};