"use server";

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function uploadProfilePicture(file: File) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;
  if (!file) return { error: 'No file received' } as const;

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) return { error: 'File must be JPG, PNG, or SVG' } as const;
  if (file.size > 1 * 1024 * 1024) return { error: 'File size must be less than 1MB' } as const;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const filename = `${session.user.id}_${timestamp}_${safeName}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles');

  try { await mkdir(uploadDir, { recursive: true }); } catch {}

  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);

  const url = `/uploads/profiles/${filename}`;
  return { success: true, url } as const;
}
