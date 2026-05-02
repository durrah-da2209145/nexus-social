import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SocialRepository {
  // --- USER OPERATIONS ---
  static async createUser(data) {
    return await prisma.user.create({ data });
  }

  static async getUserByEmail(email) {
    return await prisma.user.findUnique({ where: { email } });
  }

  static async getUserProfile(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { followedBy: true, following: true, posts: true } }
      }
    });
  }

  //  POST OPERATIONS 
  static async getAllPosts() {
    return await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, profilePic: true } },
        _count: { select: { likedBy: true, comments: true } }
      }
    });
  }

  static async createPost(authorId, content) {
    return await prisma.post.create({
      data: { content, authorId }
    });
  }

  //INTERACTION OPERATIONS 
  static async toggleLike(postId, userId) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { likedBy: { where: { id: userId } } }
    });

    const isLiked = post.likedBy.length > 0;

    return await prisma.post.update({
      where: { id: postId },
      data: {
        likedBy: isLiked 
          ? { disconnect: { id: userId } } 
          : { connect: { id: userId } }
      }
    });
  }

  static async addComment(postId, authorId, text) {
    return await prisma.comment.create({
      data: { text, postId, authorId }
    });
  }

  //  STATISTICS 
  static async getGlobalStats() {
    const totalPosts = await prisma.post.count();
    const totalUsers = await prisma.user.count();
    
    // Server-side hashtag logic
    const posts = await prisma.post.findMany({ select: { content: true } });
    const hashtagMap = {};
    posts.forEach(p => {
      const tags = p.content.match(/#[a-z0-9_]+/gi) || [];
      tags.forEach(tag => {
        hashtagMap[tag] = (hashtagMap[tag] || 0) + 1;
      });
    });

    const trendingTags = Object.entries(hashtagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { totalPosts, totalUsers, trendingTags };
  }
}