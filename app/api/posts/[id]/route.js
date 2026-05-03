import { prisma } from "@/lib/prisma";

// GET single post
export async function GET(req, { params }) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: true,
        comments: {
          include: { author: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    return Response.json(post);
  } catch (err) {
    return Response.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

// DELETE post
export async function DELETE(req, { params }) {
  try {
    await prisma.post.delete({
      where: { id: params.id },
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: "Failed to delete post" }, { status: 500 });
  }
}