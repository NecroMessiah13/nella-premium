import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const safe = path.basename(name);
    const file = path.join(process.cwd(), 'data', 'uploads', safe);
    const buf = await readFile(file);
    const ext = (safe.match(/\.([a-zA-Z0-9]+)$/) || [])[1]?.toLowerCase() || '';
    const types: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      avif: 'image/avif',
    };
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': types[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }
}