import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { adminLog } from '@/lib/adminLog';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Нет файлов' },
        { status: 400 }
      );
    }

    const urls: string[] = [];
    const dir = path.join(process.cwd(), 'data', 'uploads');
    await mkdir(dir, { recursive: true });

    for (const file of files) {
      const ext = (file.name.match(/\.([a-zA-Z0-9]+)$/) || [])[1] || 'jpg';
      const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, fileName), buffer);
      urls.push(`/api/files/${fileName}`);
    }

    await adminLog(admin, "UPLOAD", "file", null, { files: urls });

    return NextResponse.json({ urls });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { error: 'Ошибка загрузки' },
      { status: 500 }
    );
  }
}