import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Average followers per user
    const usersWithFollowers = await prisma.user.findMany({
      include: { followers: true },
    });

    const avgFollowers =
      usersWithFollowers.reduce((sum, u) => sum + u.followers.length, 0) /
      (usersWithFollowers.length || 1);

    // 2. Average posts per user
    const usersWithPosts = await prisma.user.findMany({
      include: { posts: true },
    });

    const avgPosts =
      usersWithPosts.reduce((sum, u) => sum + u.posts.length, 0) /
      (usersWithPosts.length || 1);

    // 3. Most active user (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const mostActive = await prisma.post.groupBy({
      by: ["authorId"],
      _count: { authorId: true },
      where: {
        createdAt: { gte: threeMonthsAgo },
      },
      orderBy: {
        _count: { authorId: "desc" },
      },
      take: 1,
    });

    let mostActiveUser = null;

    if (mostActive.length > 0) {
      mostActiveUser = await prisma.user.findUnique({
        where: { id: mostActive[0].authorId },
      });
    }

    // 4. Most liked post
    const mostLikedPost = await prisma.post.findMany({
      include: {
        _count: { select: { likes: true } },
        author: true,
      },
      orderBy: {
        likes: { _count: "desc" },
      },
      take: 1,
    });

    // 5. Most commented post
    const mostCommentedPost = await prisma.post.findMany({
      include: {
        _count: { select: { comments: true } },
        author: true,
      },
      orderBy: {
        comments: { _count: "desc" },
      },
      take: 1,
    });

    // 6. Engagement per user (likes + comments)
    const usersWithEngagement = await prisma.user.findMany({
      include: {
        posts: {
          include: {
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
      },
    });

    const engagement = usersWithEngagement.map(user => {
      let total = 0;

      user.posts.forEach(post => {
        total += post._count.likes + post._count.comments;
      });

      return {
        username: user.username,
        engagement: total,
      };
    });

    //added later by Student 4
    const allPosts = await prisma.post.findMany();
    const words = {};

allPosts.forEach(p => {
  p.content.split(/\s+/).forEach(w => {
    const word = w.toLowerCase();
    words[word] = (words[word] || 0) + 1;
  });
});
const engagementScore = await prisma.post.aggregate({
  _count: {
    id: true,
  },
});

const mostUsedWord = Object.entries(words)
  .sort((a, b) => b[1] - a[1])[0];

    // Sort top users by engagement
    const topEngagement = engagement.sort((a, b) => b.engagement - a.engagement).slice(0, 5);

    // RESPONSE
    return Response.json({
      avgFollowers: avgFollowers.toFixed(2),
      avgPosts: avgPosts.toFixed(2),

      mostActiveUser: mostActiveUser
        ? {
            username: mostActiveUser.username,
            posts: mostActive[0]._count.authorId,
          }
        : null,

      mostLikedPost: mostLikedPost[0]
        ? {
            content: mostLikedPost[0].content,
            likes: mostLikedPost[0]._count.likes,
            author: mostLikedPost[0].author.username,
          }
        : null,

      mostCommentedPost: mostCommentedPost[0]
        ? {
            content: mostCommentedPost[0].content,
            comments: mostCommentedPost[0]._count.comments,
            author: mostCommentedPost[0].author.username,
          }
        : null,

      topEngagement,
    });

  } catch (error) {
    console.error("Stats error:", error);
    return Response.json({ error: "Failed to load stats" }, { status: 500 });
  }
}