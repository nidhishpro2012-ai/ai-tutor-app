const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');

const router = express.Router();

router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const totalMessages = await ChatMessage.countDocuments({ userId: req.user.id });

    return res.json({
      username: user.username,
      questionsAsked: user.questionCount,
      totalMessages
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load dashboard data.' });
  }
});

module.exports = router;
