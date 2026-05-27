import { prisma } from '../src/index.js';
import { validateTitle } from '../utils/validation.js';
import { sendError, logError } from '../utils/errorHandler.js';

export async function getConversations(req, res) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.user.userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        prompts: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          include: { generations: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
      },
    });
    const result = conversations.map((c) => ({
      ...c,
      lastPrompt: c.prompts[0] || null,
      prompts: undefined,
    }));
    res.json(result);
  } catch (error) {
    sendError(res, 500, 'Failed to fetch conversations', 'getConversations', error);
  }
}

export async function getConversation(req, res) {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: {
        prompts: {
          orderBy: { createdAt: 'asc' },
          include: { generations: { orderBy: { createdAt: 'asc' } } },
        },
      },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    const title = conversation.title !== 'New Conversation' ? conversation.title
      : conversation.prompts[0]?.content.slice(0, 80) || 'New Conversation';
    res.json({ ...conversation, title });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch conversation', 'getConversation', error);
  }
}

export async function createConversation(req, res) {
  try {
    const { title } = req.body;
    
    // Validate title if provided
    if (title) {
      const validation = validateTitle(title);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }
    
    const conversation = await prisma.conversation.create({
      data: { title: title || 'New Conversation', userId: req.user.userId },
    });
    res.status(201).json(conversation);
  } catch (error) {
    sendError(res, 500, 'Failed to create conversation', 'createConversation', error);
  }
}

export async function deleteConversation(req, res) {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    await prisma.conversation.delete({ where: { id: conversation.id } });
    res.json({ success: true });
  } catch (error) {
    sendError(res, 500, 'Failed to delete conversation', 'deleteConversation', error);
  }
}

export async function updateConversation(req, res) {
  try {
    const { title } = req.body;
    
    // Validate title
    const validation = validateTitle(title);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    
    const updated = await prisma.conversation.update({
      where: { id: req.params.id },
      data: { title: validation.title },
    });
    res.json(updated);
  } catch (error) {
    sendError(res, 500, 'Failed to update conversation', 'updateConversation', error);
  }
}
