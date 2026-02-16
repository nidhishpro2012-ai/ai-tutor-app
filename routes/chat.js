const express = require('express');
const OpenAI = require('openai');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const subjectPrompts = {
  math: 'You are a friendly math tutor. Explain problems step-by-step with simple language for ages 13-16.',
  science:
    'You are a friendly science tutor. Explain concepts clearly, using simple examples and step-by-step reasoning for ages 13-16.',
  'creative-writing':
    'You are a creative writing helper. Write engaging short poems and stories with age-appropriate language for ages 13-16.',
  general:
    'You are a helpful study assistant for ages 13-16. Keep answers clear, accurate, and encouraging.'
};

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, subjectMode = 'general' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const mode = subjectPrompts[subjectMode] ? subjectMode : 'general';

    await ChatMessage.create({
      userId: req.user.id,
      role: 'user',
      content: message,
      subjectMode: mode
    });

    const memoryMessages = await ChatMessage.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const formattedMemory = memoryMessages.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content
    }));

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: subjectPrompts[mode] },
        ...formattedMemory,
        { role: 'user', content: message }
      ],
      temperature: mode === 'creative-writing' ? 0.9 : 0.5
    });

    const aiReply = completion.choices?.[0]?.message?.content?.trim() ||
      'I could not generate a response this time. Please try again.';

    await ChatMessage.create({
      userId: req.user.id,
      role: 'assistant',
      content: aiReply,
      subjectMode: mode
    });

    await User.findByIdAndUpdate(req.user.id, { $inc: { questionCount: 1 } });

    return res.json({ reply: aiReply });
  } catch (error) {
    return res.status(500).json({
      error: 'AI service failed. Please try again in a moment.'
    });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await ChatMessage.find({ userId: req.user.id })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return res.json({ history });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch history.' });
  }
});

module.exports = router;
