export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import ical from 'node-ical';
import https from 'https';

export async function GET() {
  const url = process.env.APPLE_CALENDAR_URL;

  if (!url) {
    return NextResponse.json({ error: 'Config missing' }, { status: 400 });
  }

  try {
    // 💡 解决本地 Node.js 访问 .cn 域名的 SSL 握手问题
    const agent = new https.Agent({ rejectUnauthorized: false });

    const response = await fetch(url.replace('webcal://', 'https://'), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'text/calendar',
      },
      // @ts-ignore
      agent, 
      cache: 'no-store'
    });

    if (!response.ok) throw new Error(`iCloud error: ${response.status}`);

    const icsText = await response.text();
    const rawData = ical.parseICS(icsText);
    
    // --- 计算本周视窗 (从周一零点开始) ---
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - diffToMonday);
    startOfThisWeek.setHours(0, 0, 0, 0);
    const endWindow = new Date(startOfThisWeek);
    endWindow.setDate(startOfThisWeek.getDate() + 14);

    const events = Object.values(rawData)
      .filter((ev) => {
        if (ev.type !== 'VEVENT' || !ev.start || !ev.end) return false;

        // 1. 过滤全天事件 (过滤掉节假日、生日、24节气)
        const durationHours = (new Date(ev.end).getTime() - new Date(ev.start).getTime()) / (1000 * 60 * 60);
        if (durationHours % 24 === 0) return false;

        // 2. 过滤已取消日程
        if (ev.status === 'CANCELLED') return false;

        // 3. 时间窗口限制 (本周一到未来两周)
        const eventStart = new Date(ev.start);
        const eventEnd = new Date(ev.end);
        return eventEnd >= startOfThisWeek && eventStart <= endWindow;
      })
      .map((ev: any) => ({
        start: ev.start,
        end: ev.end,
        // 💡 部署前确保这里是 'Occupied' 以隐藏具体内容
        title: 'Occupied' 
      }))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("🔥 Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}