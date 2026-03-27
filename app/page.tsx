"use client";

import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

const HOUR_HEIGHT = 40; 
const START_HOUR = 10; 
const END_HOUR = 20;

export default function FinalWeeklyBoard() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calendar').then(res => res.json()).then(data => {
      setEvents(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const getDateGroups = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(new Date().setDate(diff));
    const week1 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
    const week2 = week1.map(d => {
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 7);
      return nextD;
    });
    return { week1, week2 };
  };

  const { week1, week2 } = getDateGroups();

  const renderWeekRow = (days: Date[], title: string) => (
    <div className="mb-10">
      <h2 className="text-[12px] font-black text-blue-500 mb-3 px-1 uppercase tracking-[0.3em]">{title}</h2>
      <div className="flex border-t border-l border-gray-200 bg-white shadow-sm rounded-xl overflow-hidden">
        
        {/* 时间轴 */}
        <div className="w-10 flex-shrink-0 bg-gray-50/50 border-r border-gray-100">
          <div className="h-12 border-b border-gray-100"></div>
          {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
            <div key={i} style={{ height: HOUR_HEIGHT }} className="text-[8px] text-gray-400 text-center pt-1 border-b border-gray-50 font-mono">
              {START_HOUR + i}
            </div>
          ))}
        </div>

        {/* 七天网格 */}
        <div className="flex-1 grid grid-cols-7">
          {days.map((day, i) => {
            const isToday = new Date().toDateString() === day.toDateString();
            const dayEvents = events.filter(e => new Date(e.start).toDateString() === day.toDateString());

            return (
              <div key={i} className={`relative border-r border-gray-100 ${isToday ? 'bg-blue-50/20' : ''}`}>
                <div className={`h-12 flex flex-col items-center justify-center border-b border-gray-100 ${isToday ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-xs font-black">{day.getDate()}</span>
                </div>

                <div className="relative" style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}>
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, j) => (
                    <div key={j} style={{ height: HOUR_HEIGHT }} className="border-b border-gray-50 w-full" />
                  ))}

                  {dayEvents.map(event => {
                    const start = new Date(event.start);
                    const end = new Date(event.end);
                    
                    // 【关键修正】：手动减去 8 小时的偏移量 (8 * 60 = 480 分钟)
                    // 这样原本显示在 17:00 的块会回到 09:00 的位置
                    const TZ_OFFSET = 480; 
                    const startMin = (start.getHours() * 60 + start.getMinutes()) - TZ_OFFSET;
                    const duration = (end.getTime() - start.getTime()) / 60000;
                    
                    // 计算相对于看板起始时间 (10:00) 的 top 值
                    const top = ((startMin - (START_HOUR * 60)) / 60) * HOUR_HEIGHT;
                    const height = (duration / 60) * HOUR_HEIGHT;

                    // 允许一点点溢出显示，或者严格限制在 10-20 点
                    if (top < -HOUR_HEIGHT || top >= (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT) return null;

                    return (
                      <div
                        key={event.id}
                        className="absolute left-[2px] right-[2px] rounded px-1 py-0.5 text-[10px] font-bold leading-none overflow-hidden border-l-2 shadow-sm z-10 bg-blue-100/90 border-blue-500 text-blue-800 flex items-center justify-center text-center transition-all"
                        style={{ top, height: Math.max(height, 15) }}
                      >
                        <span className="truncate uppercase tracking-tighter">Available</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="p-20 text-center font-black text-gray-200 text-2xl animate-pulse italic uppercase tracking-widest">Updating...</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-2 md:p-8">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex items-center gap-2 mb-8 opacity-90">
          <CalendarIcon size={22} strokeWidth={3} className="text-blue-600" />
          <h1 className="text-2xl font-black tracking-tighter uppercase italic text-gray-900">Schedule</h1>
        </div>

        {renderWeekRow(week1, "Week 01")}
        {renderWeekRow(week2, "Week 02")}
      </div>
    </div>
  );
}