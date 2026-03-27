"use client";

import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

const HOUR_HEIGHT = 40; 
const START_HOUR = 10; 
const END_HOUR = 20;
const TZ_OFFSET = 480; // 8小时偏移 (分钟)

export default function FinalWeeklyBoard() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calendar')
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 核心工具函数：获取修正时区后的时间字符串 (HH:mm)
  const getAdjustedTimeStr = (dateStr: string) => {
    const d = new Date(dateStr);
    // 应用 8 小时偏移
    const adjusted = new Date(d.getTime() - (TZ_OFFSET * 60000));
    return adjusted.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

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
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[12px] font-black text-blue-500 uppercase tracking-[0.3em]">{title}</h2>
      </div>
      
      <div className="flex border-t border-l border-gray-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        
        {/* 时间轴列 */}
        <div className="w-10 flex-shrink-0 bg-gray-50/80 border-r border-gray-100">
          <div className="h-12 border-b border-gray-100"></div>
          {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
            <div key={i} style={{ height: HOUR_HEIGHT }} className="text-[9px] text-gray-400 text-center pt-2 border-b border-gray-50 font-mono font-medium">
              {(START_HOUR + i).toString().padStart(2, '0')}
            </div>
          ))}
        </div>

        {/* 七天网格 */}
        <div className="flex-1 grid grid-cols-7">
          {days.map((day, i) => {
            const dayIndex = day.getDay();
            const isWeekend = dayIndex === 0 || dayIndex === 6;
            const isToday = new Date().toDateString() === day.toDateString();
            const dayEvents = events.filter(e => new Date(e.start).toDateString() === day.toDateString());

            return (
              <div key={i} className={`relative border-r border-gray-100 transition-colors ${isToday ? 'bg-blue-50/30' : ''} ${isWeekend ? 'bg-gray-50/40' : ''}`}>
                
                {/* 日期头部 */}
                <div className={`h-12 flex flex-col items-center justify-center border-b border-gray-100 ${isToday ? 'bg-blue-600 text-white' : isWeekend ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-sm font-black leading-none">{day.getDate()}</span>
                </div>

                <div className="relative" style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}>
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, j) => (
                    <div key={j} style={{ height: HOUR_HEIGHT }} className="border-b border-gray-50 w-full" />
                  ))}

                  {/* 周末遮罩 */}
                  {isWeekend && (
                    <div className="absolute inset-0 z-0 pointer-events-none flex flex-col items-center justify-center">
                       <div 
                         className="absolute inset-0 opacity-[0.05]" 
                         style={{ 
                           backgroundImage: `repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 10%)`,
                           backgroundSize: '10px 10px'
                         }} 
                       />
                       <div className="relative flex flex-col items-center gap-1.5 opacity-40">
                         <span className="text-[14px] font-black text-gray-400 uppercase tracking-[0.25em] rotate-90 md:rotate-0">
                           Weekend
                         </span>
                       </div>
                    </div>
                  )}

                  {/* 渲染日程事件 */}
                  {dayEvents.map(event => {
                    const start = new Date(event.start);
                    const end = new Date(event.end);
                    
                    const startMin = (start.getHours() * 60 + start.getMinutes()) - TZ_OFFSET;
                    const duration = (end.getTime() - start.getTime()) / 60000;
                    
                    const top = ((startMin - (START_HOUR * 60)) / 60) * HOUR_HEIGHT;
                    const height = (duration / 60) * HOUR_HEIGHT;

                    if (top < -HOUR_HEIGHT || top >= (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT) return null;

                    // 计算时间区间文本
                    const startTime = getAdjustedTimeStr(event.start);
                    const endTime = getAdjustedTimeStr(event.end);

                    return (
                      <div
                        key={event.id}
                        className="absolute left-[3px] right-[3px] rounded-lg px-2 py-1 text-[10px] font-bold leading-tight overflow-hidden border-l-[3px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] z-10 bg-white/95 border-blue-500 text-blue-800 flex flex-col items-start justify-center transition-all hover:scale-[1.02] hover:shadow-md group"
                        style={{ top, height: Math.max(height, 24) }}
                      >
                        <span className="truncate w-full uppercase tracking-tighter">Available</span>
                        {/* 动态显示时间段：高度足够时显示 */}
                        <span className="text-[8px] opacity-60 font-mono mt-0.5 whitespace-nowrap group-hover:opacity-100">
                          {startTime}-{endTime}
                        </span>
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <div className="font-black text-gray-300 text-xl italic uppercase tracking-[0.2em]">Updating Board...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-12 text-gray-900 selection:bg-blue-100">
      <div className="max-w-[1100px] mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <CalendarIcon size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Schedule</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Published by Elliot</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-black text-gray-400 shadow-sm uppercase tracking-widest">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live UTC+08
          </div>
        </header>

        {renderWeekRow(week1, "Week 01 - Current")}
        {renderWeekRow(week2, "Week 02 - Next")}
      </div>
    </div>
  );
}