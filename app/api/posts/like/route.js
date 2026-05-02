import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req, { params }) {
  try {
    const { userId } = await req.json();

    const existing = await prisma.like.findFirst({
      where: {
        postId: params.id,
        userId,
      },
    });

    if (existing) {
      await prisma.like.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.like.create({
        data: {
          postId: params.id,
          userId,
        },
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: "Like failed" }, { status: 500 });
  }
}