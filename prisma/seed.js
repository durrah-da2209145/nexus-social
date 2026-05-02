import "dotenv/config";
import { PrismaClient } from "../prisma/client/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url: process.env.DATABASE_URL ?? "",
  }),
});

const USERS = [
  { username: "alice_wonder", email: "alice@nexus.com", password: "password123", bio: "Curious developer and tech enthusiast" },
  { username: "bob_builds",   email: "bob@nexus.com",   password: "password123", bio: "Full-stack engineer. Coffee lover" },
  { username: "carol_codes",  email: "carol@nexus.com", password: "password123", bio: "Frontend developer. CSS is art" },
  { username: "dave_designs", email: "dave@nexus.com",  password: "password123", bio: "UI/UX Designer turned developer" },
  { username: "eve_explores", email: "eve@nexus.com",   password: "password123", bio: "Data scientist. Python and SQL" },
  { username: "frank_dev",    email: "frank@nexus.com", password: "password123", bio: "Open source contributor" },
  { username: "grace_geek",   email: "grace@nexus.com", password: "password123", bio: "Security researcher" },
  { username: "henry_hack",   email: "henry@nexus.com", password: "password123", bio: "Hackathon winner. Startup founder" },
  { username: "iris_insight", email: "iris@nexus.com",  password: "password123", bio: "Product manager by day, coder by night" },
  { username: "jack_js",      email: "jack@nexus.com",  password: "password123", bio: "JavaScript is my love language" },
];

const POST_CONTENTS = [
  "Just pushed a huge refactor to production. Nothing exploded, calling that a win!",
  "Hot take: dark mode actually helps me focus. Change my mind.",
  "Spent 2 hours debugging only to find a missing semicolon. Classic.",
  "Working on a social media platform for class. Appreciating Twitter complexity now.",
  "Coffee count today: 4. Bug count fixed: 2. Not my best ratio.",
  "Just discovered Tailwind CSS and never going back to raw CSS.",
  "The best documentation is clear variable names. Write code for humans.",
  "Reminder: version control is not a backup system. But also kind of is.",
  "Pair programming with a rubber duck is underrated.",
  "My pull request finally got merged after 3 weeks. Best day ever.",
  "Trying to explain recursion to someone. This is harder than I thought.",
  "Deployed to production on a Friday. Pray for me.",
  "Finally understood closures in JavaScript. My brain leveled up.",
  "NextJS App Router makes so much sense now.",
  "APIs should be designed for the consumer, not the developer.",
  "Just learned about database indexing. Where has this been my whole life?",
  "Writing tests before code actually saves time. I am a convert.",
  "Does anyone else name variables temp and then forget what it was?",
  "SQL is 50 years old and still the most powerful tool for data.",
  "Just built my first REST API. Feeling unstoppable.",
];

const COMMENT_CONTENTS = [
  "This is so relatable.",
  "Could not agree more!",
  "This happened to me last week too.",
  "Great point, thanks for sharing.",
  "Same. Every. Single. Time.",
  "Wait, this is actually really helpful.",
  "I feel seen.",
  "The struggle is real.",
  "Bookmarking this forever.",
  "Rookie mistake. We have all been there.",
  "Needed this today, thank you!",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const seed = async () => {
  console.log("Starting seed...");

  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  console.log("Cleared existing data");

  const createdUsers = [];
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.create({
      data: {
        username: u.username,
        email: u.email,
        password: hashed,
        bio: u.bio,
      },
    });
    createdUsers.push(user);
  }
  console.log(`Created ${createdUsers.length} users`);

  const createdPosts = [];
  let postIndex = 0;

  for (const user of createdUsers) {
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const post = await prisma.post.create({
        data: {
          content: POST_CONTENTS[postIndex % POST_CONTENTS.length],
          authorId: user.id,

          createdAt: new Date(
            Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000
          ),
        },
      });
      createdPosts.push(post);
      postIndex++;
    }
  }
  console.log(`Created ${createdPosts.length} posts`);

  let commentCount = 0;

  for (const post of createdPosts) {
    const commenters = shuffle(
      createdUsers.filter(u => u.id !== post.authorId)
    ).slice(0, 4);

    for (const commenter of commenters) {
      await prisma.comment.create({
        data: {
          content: pick(COMMENT_CONTENTS),
          authorId: commenter.id,
          postId: post.id,
          
          createdAt: new Date(
            Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000
          ),
        },
      });
      commentCount++;
    }
  }
  console.log(`Created ${commentCount} comments`);

  let likeCount = 0;
  for (const post of createdPosts) {
    const voters = shuffle(
      createdUsers.filter(u => u.id !== post.authorId)
    ).slice(0, 6);

    for (const voter of voters) {
      await prisma.like.create({
        data: {
          userId: voter.id,
          postId: post.id,
        },
      });
      likeCount++;
    }
  }
  console.log(`Created ${likeCount} likes`);

  let followCount = 0;

  for (const user of createdUsers) {
    const targets = shuffle(
      createdUsers.filter(u => u.id !== user.id)
    ).slice(0, 5); // 🔥 MORE FOLLOW RELATIONS

    for (const target of targets) {
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId: target.id,
        },
      });
      followCount++;
    }
  }
  console.log(`Created ${followCount} follow relationships`);

  console.log("");
  console.log("Seed complete!");
  console.log("Test accounts (all passwords: password123)");
  console.log("------------------------------------------");
  USERS.forEach(u => console.log(`  ${u.email}`));
};

try {
  await seed();
  await prisma.$disconnect();
} catch (e) {
  console.error("Seed failed:", e);
  await prisma.$disconnect();
  process.exit(1);
}