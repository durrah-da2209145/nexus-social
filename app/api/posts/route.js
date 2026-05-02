import { NextResponse } from 'next/server';
import { SocialRepository } from '@/lib/SocialRepository';

// Get all posts for the feed
export async function GET() {
  try {
    const posts = await SocialRepository.getAllPosts();
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
//create a new post
export async function POST(request) {
  try {
    const { authorId, content } = await request.json();
    
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const newPost = await SocialRepository.createPost(authorId, content);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}