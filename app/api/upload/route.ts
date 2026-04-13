import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function getCloudinaryConfig() {
  const CLOUD_NAME =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_NAME;
  const CLOUD_API_KEY =
    process.env.CLOUDINARY_API_KEY ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
    process.env.CLOUDINARY_KEY ||
    process.env.API_KEY;
  const CLOUD_API_SECRET =
    process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET || process.env.API_SECRET;
  return { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET };
}

async function uploadImgbb(
  buffer: Buffer,
  filename: string,
  apiKey: string,
  uploadUrl: string
): Promise<string | null> {
  if (!apiKey) return null;

  const base64 = buffer.toString('base64');
  const body = new URLSearchParams();
  body.append('key', apiKey);
  body.append('image', base64);
  if (filename) body.append('name', filename.replace(/\.[^.]+$/, '') || 'image');

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const json = (await res.json()) as {
    success?: boolean;
    data?: { url?: string; display_url?: string; image?: { url?: string } };
    error?: { message?: string; code?: string };
  };

  if (!res.ok || json.success === false) {
    const msg = json.error?.message || JSON.stringify(json);
    console.error('ImgBB upload error', res.status, msg);
    return null;
  }

  const url = json.data?.url || json.data?.display_url || json.data?.image?.url;
  return url ?? null;
}

async function uploadCloudinary(
  buffer: Buffer,
  filename: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string
): Promise<string | null> {
  const folder = 'casacheia_uploads/product';
  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = { folder, timestamp };
  const paramsStr = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  const signature = crypto.createHmac('sha1', apiSecret).update(paramsStr).digest('hex');

  const body = new FormData();
  // Node Buffer is backed by ArrayBuffer; narrow for DOM BlobPart typing.
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
  body.append('file', new Blob([arrayBuffer]), filename);
  body.append('api_key', apiKey);
  body.append('timestamp', String(timestamp));
  body.append('signature', signature);
  body.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Cloudinary upload error', res.status, err);
    return null;
  }

  const data = (await res.json()) as { secure_url?: string };
  return data.secure_url ?? null;
}

export async function POST(request: NextRequest) {
  const imgbbKey = process.env.IMGBB_API_KEY?.trim();
  const imgbbUrl = (process.env.URL_IMGBB || 'https://api.imgbb.com/1/upload').replace(/\/$/, '');
  const hasImgbb = Boolean(imgbbKey);

  const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = getCloudinaryConfig();
  const hasCloudinary = Boolean(CLOUD_NAME && CLOUD_API_KEY && CLOUD_API_SECRET);

  if (!hasImgbb && !hasCloudinary) {
    return NextResponse.json(
      {
        error: 'Serviço de upload não configurado',
        message:
          'No projeto admin, crie/edite admin/.env.local com IMGBB_API_KEY=... (e opcionalmente URL_IMGBB). Reinicie o next dev.',
        urls: [],
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const fromFiles = formData.getAll('files').filter((x): x is File => x instanceof File);
    const single = formData.get('file');

    const toUpload: File[] = fromFiles.length
      ? fromFiles
      : single instanceof File
        ? [single]
        : [];

    if (toUpload.length === 0) {
      return NextResponse.json({ error: 'Nenhum ficheiro enviado' }, { status: 400 });
    }

    const urls: string[] = [];

    for (const f of toUpload) {
      const bytes = await f.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const name = f.name || 'image';

      let url: string | null = null;
      if (hasImgbb && imgbbKey) {
        url = await uploadImgbb(buffer, name, imgbbKey, imgbbUrl);
      }
      if (!url && hasCloudinary && CLOUD_NAME && CLOUD_API_KEY && CLOUD_API_SECRET) {
        url = await uploadCloudinary(buffer, name, CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET);
      }

      if (!url) {
        return NextResponse.json(
          {
            error: 'Falha no upload da imagem',
            message: hasImgbb
              ? 'ImgBB não devolveu URL. Verifique IMGBB_API_KEY e o limite da conta.'
              : 'Cloudinary não devolveu URL.',
            urls,
          },
          { status: 502 }
        );
      }
      urls.push(url);
    }

    return NextResponse.json({ urls });
  } catch (e) {
    console.error('Upload error', e);
    return NextResponse.json({ error: 'Erro ao processar upload' }, { status: 500 });
  }
}
