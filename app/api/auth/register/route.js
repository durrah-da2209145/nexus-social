import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const { username, email, password } = await req.json();

  const user = await prisma.user.create({
    data: { username, email, password },
  });

  return Response.json(user);
}