import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const t = {
  bg:          '#F4EFE8',
  card:        '#FFFFFF',
  accent:      '#B85C43',
  accentLight: '#F2E4DE',
  teal:        '#4A8B8B',
  tealLight:   '#DEF0EE',
  matchGreen:  '#7AB87D',
  dark:        '#1C1917',
  mid:         '#4A3F3C',
  muted:       '#8B7D77',
  faint:       '#B0A49E',
  border:      '#EDE7E1',
  divider:     '#DDD6CF',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMondayOf(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function formatWeekRange(mondayStr) {
  const mon = new Date(mondayStr + 'T12:00:00');
  const sun = new Date(mondayStr + 'T12:00:00');
  sun.setDate(mon.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${mon.toLocaleDateString('en-US', opts)} – ${sun.toLocaleDateString('en-US', opts)}`;
}

function formatDayNum(dateStr) {
  return new Date(dateStr + 'T12:00:00').getDate();
}

const todayStr = new Date().toISOString().split('T')[0];
const todayMonday = getMondayOf(todayStr);

// ── Day card ─────────────────────────────────────────────────────────────────
function DayCard({ day, index, onClick }) {
  const isToday   = day.date === todayStr;
  const clickable = day.mySubmitted && day.partnerSubmitted && !day.isFuture;

  let bg     = t.card;
  let border = `1px solid ${t.border}`;
  let cursor = 'default';

  if (day.isFuture) {
    bg = 'rgba(255,255,255,0.4)';
    border = `1px solid ${t.border}`;
  } else if (clickable) {
    bg = '#F7FBF7';
    border = `1.5px solid ${t.matchGreen}`;
    cursor = 'pointer';
  } else if (isToday) {
    border = `1.5px solid ${t.accent}`;
  }

  return (
    <div onClick={clickable ? onClick : undefined}
      style={{ flex: '1 0 0', minWidth: 44, borderRadius: 12,
               background: bg, border, cursor,
               display: 'flex', flexDirection: 'column', alignItems: 'center',
               padding: '10px 4px 10px', gap: 4,
               opacity: day.isFuture ? 0.4 : 1,
               transition: 'transform 0.1s',
             }}
      onMouseEnter={e => { if (clickable) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Day name */}
      <span style={{ font: `500 10px/1 'DM Sans', sans-serif`, color: t.muted,
                     letterSpacing: '0.04em' }}>
        {DAY_NAMES[index]}
      </span>

      {/* Date number */}
      <span style={{ font: isToday
          ? `700 16px/1 'DM Sans', sans-serif`
          : `400 16px/1 'DM Sans', sans-serif`,
                     color: isToday ? t.accent : t.dark }}>
        {formatDayNum(day.date)}
      </span>

      {/* Status */}
      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4, minHeight: 40 }}>
        {!day.hasQuestions && !day.isFuture && (
          <span style={{ font: `400 9px/1.2 'DM Sans', sans-serif`,
                         color: t.faint, textAlign: 'center' }}>
            No quiz
          </span>
        )}

        {day.hasQuestions && day.mySubmitted && day.partnerSubmitted && (
          <>
            <span style={{ font: `italic 18px/1 'DM Serif Display', serif`,
                           color: t.matchGreen }}>
              {day.score}/{day.totalQuestions}
            </span>
            <span style={{ font: `400 9px/1 'DM Sans', sans-serif`,
                           color: t.matchGreen }}>
              matched
            </span>
          </>
        )}

        {day.hasQuestions && (!day.mySubmitted || !day.partnerSubmitted) && !day.isFuture && (
          <div style={{ display: 'flex', gap: 4 }}>
            <div title="You" style={{ width: 10, height: 10, borderRadius: '50%',
                                       background: day.mySubmitted ? t.accent : 'transparent',
                                       border: `1.5px solid ${t.accent}` }} />
            <div title="Partner" style={{ width: 10, height: 10, borderRadius: '50%',
                                           background: day.partnerSubmitted ? t.teal : 'transparent',
                                           border: `1.5px solid ${t.teal}` }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Calendar page ─────────────────────────────────────────────────────────────
export default function Calendar() {
  const navigate = useNavigate();
  const [weekMonday, setWeekMonday] = useState(todayMonday);
  const [days, setDays]             = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getWeek(weekMonday).then(data => {
      setDays(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [weekMonday]);

  const goBack    = () => setWeekMonday(prev => addDays(prev, -7));
  const goForward = () => setWeekMonday(prev => addDays(prev, 7));
  const goToday   = () => setWeekMonday(todayMonday);

  const isCurrentWeek = weekMonday === todayMonday;

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: t.bg }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 8px', display: 'flex',
                    alignItems: 'center', gap: 10 }}>
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
        {!isCurrentWeek && (
          <button onClick={goToday}
            style={{ font: `500 12px/1 'DM Sans', sans-serif`,
                     color: t.accent, background: t.accentLight,
                     border: 'none', borderRadius: 20, padding: '6px 12px',
                     cursor: 'pointer' }}>
            Today
          </button>
        )}
      </div>

      <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${t.divider}, transparent)`,
                    margin: '0 20px 16px' }} />

      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 20px', marginBottom: 14 }}>
        <button onClick={goBack}
          style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${t.border}`,
                   background: t.card, cursor: 'pointer', display: 'flex',
                   alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7L9 3" stroke={t.mid} strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span style={{ font: `500 13px/1 'DM Sans', sans-serif`, color: t.mid }}>
          {formatWeekRange(weekMonday)}
        </span>

        <button onClick={goForward} disabled={isCurrentWeek}
          style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${t.border}`,
                   background: t.card, cursor: isCurrentWeek ? 'default' : 'pointer',
                   opacity: isCurrentWeek ? 0.35 : 1,
                   display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke={t.mid} strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day cards */}
      <div style={{ padding: '0 14px 40px' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} style={{ flex: '1 0 0', height: 110, borderRadius: 12,
                                    background: 'rgba(255,255,255,0.5)',
                                    border: `1px solid ${t.border}` }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            {(days ?? []).map((day, i) => (
              <DayCard key={day.date} day={day} index={i}
                onClick={() => navigate(`/history/${day.date}`)} />
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
