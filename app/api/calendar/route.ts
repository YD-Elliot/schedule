export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.APPLE_CALENDAR_URL;

  if (!url) {
    return NextResponse.json({ error: 'Environment variable missing' }, { status: 500 });
  }

  try {
    // 1. 协议转换与数据抓取
    const targetUrl = url.replace('webcal://', 'https://');
    const response = await fetch(targetUrl, { 
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const text = await response.text();

    const events: any[] = [];
    const vevents = text.split('BEGIN:VEVENT');
    vevents.shift(); // 移除第一个头部信息

    // 2. 核心解析逻辑
    vevents.forEach((item) => {
      const summaryMatch = item.match(/SUMMARY:(.*)/);
      // 匹配日期，处理 DTSTART;VALUE=DATE 或 DTSTART;TZID=... 等变体
      const dtstartMatch = item.match(/DTSTART(?:;[^:]*)?:(\d{8}T\d{6}Z?|\d{8})/);
      const dtendMatch = item.match(/DTEND(?:;[^:]*)?:(\d{8}T\d{6}Z?|\d{8})/);
      const locationMatch = item.match(/LOCATION:(.*)/);
      const uidMatch = item.match(/UID:(.*)/);

      if (dtstartMatch) {
        const startRaw = dtstartMatch[1];
        const endRaw = dtendMatch ? dtendMatch[1] : startRaw;

        events.push({
          id: uidMatch ? uidMatch[1].trim() : Math.random().toString(36),
          summary: summaryMatch ? summaryMatch[1].trim() : '无题日程',
          start: parseIcsDate(startRaw),
          end: parseIcsDate(endRaw),
          location: locationMatch ? locationMatch[1].trim() : ''
        });
      }
    });

    // 3. 时间过滤：计算“本周+下周”
    // 获取今天凌晨 00:00:00
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    // 往后推 14 天
    const twoWeeksLater = new Date(todayStart.getTime() + 14 * 24 * 60 * 60 * 1000);

    const filteredEvents = events
      .filter((event) => {
        const eventDate = new Date(event.start);
        return eventDate >= todayStart && eventDate <= twoWeeksLater;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json(filteredEvents);
  } catch (error) {
    console.error('Calendar API Error:', error);
    return NextResponse.json({ error: 'Failed to sync calendar' }, { status: 500 });
  }
}

/**
 * ics 日期格式转换辅助函数
 * 解决时间偏移 8 小时的核心逻辑：
 * 如果你的日程晚了 8h，说明系统把原本是北京时间的数字当成了 UTC。
 * 我们在这里手动减去 8 小时的偏移量，让前端显示回归正常。
 */
function parseIcsDate(icsDate: string) {
  try {
    const year = icsDate.substring(0, 4);
    const month = icsDate.substring(4, 6);
    const day = icsDate.substring(6, 8);
    
    if (icsDate.includes('T')) {
      const hour = icsDate.substring(9, 11);
      const minute = icsDate.substring(11, 13);
      const second = icsDate.substring(13, 15);
      
      // 关键修正：直接构造一个标准的 ISO 字符串并加上 'Z' (表示 UTC)
      // 这会强制浏览器按原样显示时间，不再进行 +8 或 -8 的偏移
      return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
    }
    
    // 全天日程
    return `${year}-${month}-${day}T00:00:00.000Z`;
  } catch (e) {
    return new Date().toISOString();
  }
}