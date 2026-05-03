import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.password !== password) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return Response.json({
    id: user.id,
    username: user.username,
    email: user.email,
  });
}