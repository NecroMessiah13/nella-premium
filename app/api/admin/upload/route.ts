import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

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

    for (const file of files) {
      // Преобразуем в base64
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      urls.push(dataUrl);
    }

    return NextResponse.json({ urls });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { error: 'Ошибка загрузки' },
      { status: 500 }
    );
  }
}
