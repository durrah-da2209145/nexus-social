import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req, { params }) {
  try {
    const { authorId, text } = await req.json();

    const comment = await prisma.comment.create({
      data: {
        text,
        postId: params.id,
        authorId,
      },
    });

    return Response.json(comment);
  } catch (err) {
    return Response.json({ error: "Comment failed" }, { status: 500 });
  }
}