import { prisma } from '../src/index.js';
import { sendError } from '../utils/errorHandler.js';

export async function getFavorites(req, res) {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.userId },
      include: { prompt: true },
      orderBy: { id: 'desc' },
    });
    res.json(favorites.map(f => f.prompt));
  } catch (error) {
    sendError(res, 500, 'Failed to fetch favorites', 'getFavorites', error);
  }
}

export async function addFavorite(req, res) {
  try {
    const { promptId } = req.params;
    const userId = req.user.userId;
    
    // Validate promptId
    if (!promptId || typeof promptId !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt ID' });
    }
    
    // Verify prompt exists and user has access to it
    const prompt = await prisma.prompt.findFirst({
      where: { 
        id: promptId,
        userId // Only allow favoriting own prompts
      },
    });
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found or access denied' });
    }
    
    const fav = await prisma.favorite.upsert({
      where: { userId_promptId: { userId, promptId } },
      update: {},
      create: { userId, promptId },
    });
    res.status(201).json(fav);
  } catch (error) {
    sendError(res, 500, 'Failed to add favorite', 'addFavorite', error);
  }
}

export async function removeFavorite(req, res) {
  try {
    const { promptId } = req.params;
    
    // Validate promptId
    if (!promptId || typeof promptId !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt ID' });
    }
    
    const fav = await prisma.favorite.findFirst({ 
      where: { userId: req.user.userId, promptId } 
    });
    
    if (!fav) return res.status(404).json({ error: 'Favorite not found' });
    
    await prisma.favorite.delete({ where: { id: fav.id } });
    res.json({ success: true });
  } catch (error) {
    sendError(res, 500, 'Failed to remove favorite', 'removeFavorite', error);
  }
}
