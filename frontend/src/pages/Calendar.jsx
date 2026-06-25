import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const t = {
  bg:          '#F4EFE8',
  card:        '#FFFFFF',
  accent:      '#B85C43',
  accentLight: '#F2E4DE',
  teal:        '#4A8B8B',
  matchGreen:  '#7AB87D',
  dark:        '#1C1917',
  mid:         '#4A3F3C',
  muted:       '#8B7D77',
  faint:       '#B0A49E',
  border:      '#EDE7E1',
  divider:     '#DDD6CF',
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_HEADERS = ['S','M','T','W','T','F','S'];

const todayStr = new Date().toISOString().split('T')[0];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Back up to the Sunday on or before the 1st
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  // Forward to the Saturday on or after the last
  const end = new Date(lastDay);
  end.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  const cells = [];
  const cur = new Date(start);
  while (cur <= end) {
    cells.push({ dateStr: toDateStr(cur), inMonth: cur.getMonth() === month, dayNum: cur.getDate() });
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}

// ── Day cell ──────────────────────────────────────────────────────────────────
function DayCell({ cell, data, onClick }) {
  const { dateStr, inMonth, dayNum } = cell;
  const isToday = dateStr === todayStr;

  if (!inMonth) {
    return (
      <div style={{ minHeight: 58, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', paddingTop: 6, opacity: 0.18 }}>
        <span style={{ font: `400 13px/1 'DM Sans', sans-serif`, color: t.dark }}>
          {dayNum}
        </span>
      </div>
    );
  }

  const bothAnswered = data?.hasQuestions && data.mySubmitted && data.partnerSubmitted;
  const clickable    = bothAnswered && !data?.isFuture;
  const isFuture     = data?.isFuture ?? (dateStr > todayStr);

  let bg     = 'transparent';
  let border = 'none';
  if (isToday && !bothAnswered) border = `1.5px solid ${t.accent}`;
  if (bothAnswered)             { bg = '#F0FAF1'; border = `1.5px solid rgba(122,184,125,0.35)`; }

  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        minHeight: 58, display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: 6, gap: 4,
        borderRadius: 8, background: bg, border, boxSizing: 'border-box',
        cursor: clickable ? 'pointer' : 'default',
        opacity: isFuture ? 0.28 : 1,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (clickable) e.currentTarget.style.background = '#E2F5E3'; }}
      onMouseLeave={e => { if (clickable) e.currentTarget.style.background = bg; }}
    >
      <span style={{
        font: `${isToday ? '700' : '400'} 13px/1 'DM Sans', sans-serif`,
        color: isToday ? t.accent : t.dark,
      }}>
        {dayNum}
      </span>

      {data?.hasQuestions && !isFuture && (
        bothAnswered ? (
          <span style={{ font: `italic 12px/1 'DM Serif Display', serif`, color: t.matchGreen }}>
            {data.score}/{data.totalQuestions}
          </span>
        ) : (
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%',
                          background: data.mySubmitted      ? t.accent : 'transparent',
                          border: `1.5px solid ${t.accent}` }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%',
                          background: data.partnerSubmitted ? t.teal   : 'transparent',
                          border: `1.5px solid ${t.teal}` }} />
          </div>
        )
      )}
    </div>
  );
}

// ── Calendar page ─────────────────────────────────────────────────────────────
export default function Calendar() {
  const navigate = useNavigate();
  const now = new Date();

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [dayData, setDayData] = useState({});
  const [loading, setLoading] = useState(true);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const isFirstMonth   = year === 2026 && month === 5; // June 2026

  const prevMonth = () => {
    if (isFirstMonth) return;
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else             { setMonth(m => m - 1); }
  };

  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else              { setMonth(m => m + 1); }
  };

  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  useEffect(() => {
    setLoading(true);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    api.getMonth(dateStr).then(data => {
      const map = {};
      data.forEach(d => { map[d.date] = d; });
      setDayData(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year, month]);

  const cells = useMemo(() => buildGrid(year, month), [year, month]);

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: t.bg }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
                   padding: 4, display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 15L7 10L12 5" stroke={t.mid} strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 style={{ font: `italic 24px/1 'DM Serif Display', serif`,
                     color: t.dark, margin: 0, flex: 1 }}>
          History
        </h1>
        {!isCurrentMonth && (
          <button onClick={goToday}
            style={{ font: `500 12px/1 'DM Sans', sans-serif`,
                     color: t.accent, background: t.accentLight,
                     border: 'none', borderRadius: 20, padding: '6px 12px', cursor: 'pointer' }}>
            Today
          </button>
        )}
      </div>

      <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${t.divider}, transparent)`,
                    margin: '0 20px 14px' }} />

      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 20px', marginBottom: 12 }}>
        <button onClick={prevMonth} disabled={isFirstMonth}
          style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${t.border}`,
                   background: t.card, cursor: isFirstMonth ? 'default' : 'pointer',
                   opacity: isFirstMonth ? 0.35 : 1,
                   display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7L9 3" stroke={t.mid} strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span style={{ font: `500 14px/1 'DM Sans', sans-serif`, color: t.mid }}>
          {MONTH_NAMES[month]} {year}
        </span>

        <button onClick={nextMonth} disabled={isCurrentMonth}
          style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${t.border}`,
                   background: t.card, cursor: isCurrentMonth ? 'default' : 'pointer',
                   opacity: isCurrentMonth ? 0.35 : 1,
                   display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke={t.mid} strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 14px 40px' }}>
        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                      marginBottom: 4 }}>
          {DAY_HEADERS.map((d, i) => (
            <div key={i} style={{ textAlign: 'center',
                                  font: `500 10px/1 'DM Sans', sans-serif`,
                                  color: t.faint, padding: '4px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} style={{ minHeight: 58, borderRadius: 8,
                                    background: 'rgba(255,255,255,0.4)',
                                    border: `1px solid ${t.border}` }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map(cell => (
              <DayCell
                key={cell.dateStr}
                cell={cell}
                data={dayData[cell.dateStr]}
                onClick={() => navigate(`/history/${cell.dateStr}`)}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 18 }}>
          {[
            { label: 'You', color: t.accent },
            { label: 'Partner', color: t.teal },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ font: `400 11px/1 'DM Sans', sans-serif`, color: t.muted }}>
                {label}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: t.matchGreen }} />
            <span style={{ font: `400 11px/1 'DM Sans', sans-serif`, color: t.muted }}>
              Both answered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
