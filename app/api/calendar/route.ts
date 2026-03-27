export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';

export async function GET() {
  // 1. 构建阶段直接闭嘴，不给 Vercel 报错的机会
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ message: 'Bypassing build' });
  }

  try {
    // 2. 动态加载 node-ical (解决 BigInt 报错的核心)
    const ical = await import('node-ical');
    const url = process.env.APPLE_CALENDAR_URL;

    if (!url) {
      return NextResponse.json({ error: 'Calendar URL not set' }, { status: 500 });
    }

    // 3. 这里的逻辑可以放回你之前的解析代码
    const data = await ical.async.fromURL(url);
    
    // 示例：保留你之前的过滤或格式化逻辑
    const events = Object.values(data)
      .filter(event => event.type === 'VEVENT')
      .map(event => ({
        id: event.uid,
        summary: event.summary,
        start: event.start,
        end: event.end,
        location: event.location
      }));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}