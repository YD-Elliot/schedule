"use client";
export const dynamic = 'force-dynamic'; // 强制动态渲染，跳过构建时的静态预检查

import React, { useEffect, useState } from 'react';
import { Menu, Globe, Loader2, Lock, Clock, Calendar as CalendarIcon } from 'lucide-react';

export default function ProfessionalCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const HOUR_HEIGHT = 36; // 稍微增加一点点高度，保证文字可读
  const START_HOUR = 8;
  const END_HOUR = 22;
  const HOURS_ARRAY = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  useEffect(() => {
    fetch('/api/calendar')
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getTwoWeeks = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const week1 = [];
    const week2 = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayData = {
        dateObject: d,
        displayDate: d.getDate(),
        displayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: d.toDateString() === new Date().toDateString(),
      };
      if (i < 7) week1.push(dayData);
      else week2.push(dayData);
    }
    return { week1, week2 };
  };

  const { week1, week2 } = getTwoWeeks();

  // 格式化时间显示 (例如 09:30)
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const calculatePosition = (startTime: string) => {
    const date = new Date(startTime);
    const hours = date.getHours() + date.getMinutes() / 60;
    const top = Math.max(0, (hours - START_HOUR) * HOUR_HEIGHT);
    return { top: `${top}px` };
  };

  const calculateHeight = (start: string, end: string) => {
    const duration = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
    return { height: `${Math.max(20, duration * HOUR_HEIGHT)}px` };
  };

  const WeekGrid = ({ days, title }: { days: any[], title: string }) => (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-1 h-4 bg-blue-600 rounded-full" />
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">{title}</h3>
      </div>
      
      <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 左侧垂直时间轴标尺 */}
        <div className="w-12 flex-shrink-0 border-r border-gray-50 bg-gray-50/50 pt-[53px]">
          {HOURS_ARRAY.map(hour => (
            <div key={hour} style={{ height: HOUR_HEIGHT }} className="text-[10px] text-gray-400 text-right pr-2 leading-none">
              {hour}:00
            </div>
          ))}
        </div>

        {/* 七天网格 */}
        <div className="flex-1 grid grid-cols-7 bg-gray-100 gap-[1px]">
          {days.map((day, i) => {
            const dayEvents = events.filter(e => 
              new Date(e.start).toDateString() === day.dateObject.toDateString()
            );

            return (
              <div key={i} className={`bg-white min-h-[540px] flex flex-col ${day.isToday ? 'bg-blue-50/10' : ''}`}>
                <div className="p-3 text-center border-b border-gray-50">
                  <div className={`text-[10px] font-bold uppercase ${day.isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                    {day.displayName}
                  </div>
                  <div className={`text-sm mt-0.5 font-semibold ${day.isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day.displayDate}
                  </div>
                </div>
                
                <div 
                  className="relative flex-1 bg-[linear-gradient(to_bottom,#f8f9fa_1px,transparent_1px)]"
                  style={{ backgroundSize: `100% ${HOUR_HEIGHT}px` }}
                >
                  {dayEvents.map((event, idx) => (
                    <div 
                      key={idx}
                      style={{ ...calculatePosition(event.start), ...calculateHeight(event.start, event.end) }}
                      className="absolute inset-x-0.5 bg-blue-50 border-l-2 border-blue-500 rounded-sm p-1 text-[9px] overflow-hidden group hover:z-10 hover:shadow-md transition-all"
                    >
                      <div className="font-bold text-blue-700 flex items-center gap-0.5">
                        <Lock size={7} className="flex-shrink-0" /> BUSY
                      </div>
                      <div className="text-[8px] text-blue-500 font-medium truncate">
                        {formatTime(event.start)}-{formatTime(event.end)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col font-sans text-gray-700">
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">C</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">Availability</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-wider">
            iCloud Live
          </div>
          <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-white shadow-sm" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 lg:px-32">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Weekly Sync</h1>
              <p className="text-gray-400 text-sm mt-1">Check my availability for meetings & calls.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <Globe size={14} /> Asia/Shanghai (GMT+8)
            </div>
          </div>

          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <span className="text-sm font-medium text-gray-400">Syncing with Calendar...</span>
            </div>
          ) : (
            <>
              <WeekGrid days={week1} title="Current Week" />
              <WeekGrid days={week2} title="Upcoming Week" />
            </>
          )}

          <div className="mt-20 flex flex-col items-center pb-16">
            <div className="px-12 py-5 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-4 hover:bg-black transition-all cursor-pointer group active:scale-95">
              <Clock size={22} className="text-blue-400 group-hover:rotate-12 transition-transform" />
              <div className="flex flex-col">
                <span className="text-base font-bold">Contact via WeChat</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Best for quick response</span>
              </div>
            </div>
            <p className="mt-6 text-[10px] text-gray-300 uppercase font-bold tracking-[0.3em]">Privacy Guaranteed • Automated 脱敏</p>
          </div>
        </div>
      </main>
    </div>
  );
}