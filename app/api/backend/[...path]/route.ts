import { NextRequest, NextResponse } from 'next/server';
import { normalizeBaseUrl } from '@/lib/api';

/**
 * Encaminha pedidos ao backend (NEXT_PUBLIC_BASE_URL).
 * O browser fala só com o Next (same origin) → evita CORS e diferenças vs Postman
 * (Origin/Referer no pedido ao Render).
 */
async function forward(request: NextRequest, pathSegments: string[], method: string) {
  const base = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
  if (!base) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_BASE_URL não definida' }, { status: 500 });
  }

  const suffix = pathSegments.length ? `/${pathSegments.join('/')}` : '';
  const url = `${base}${suffix}${request.nextUrl.search}`;

  const headers: Record<string, string> = {
    Accept: request.headers.get('accept') || 'application/json',
  };
  const auth = request.headers.get('authorization');
  if (auth) headers.Authorization = auth;

  const contentType = request.headers.get('content-type');
  if (contentType && method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = contentType;
  }

  const init: RequestInit = { method, headers };

  if (method !== 'GET' && method !== 'HEAD') {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > 0) init.body = buf;
  }

  const res = await fetch(url, init);
  const body = await res.arrayBuffer();
  const out = new NextResponse(body, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(request, path ?? [], 'GET');
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(request, path ?? [], 'POST');
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(request, path ?? [], 'PATCH');
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(request, path ?? [], 'PUT');
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(request, path ?? [], 'DELETE');
}
