import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getUserManager } from '../auth';

const t = {
  bg:              '#F4EFE8',
  card:            '#FFFFFF',
  accent:          '#B85C43',
  accentLight:     '#F2E4DE',
  accentBorder:    '#C4826D',
  accentText:      '#8A3A28',
  accentDark:      '#7A3525',
  teal:            '#4A8B8B',
  tealLight:       '#DEF0EE',
  tealBorder:      '#7ABABA',
  tealText:        '#2A6060',
  matchGreen:      '#7AB87D',
  matchGreenLight: '#EBF3EC',
  matchGreenText:  '#5E9B6B',
  dark:            '#1C1917',
  mid:             '#4A3F3C',
  muted:           '#8B7D77',
  faint:           '#B0A49E',
  border:          '#EDE7E1',
  divider:         '#DDD6CF',
};

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function optionText(detail, letter) {
  return { A: detail.optionA, B: detail.optionB,
           C: detail.optionC, D: detail.optionD }[letter] ?? letter;
}

const CheckIcon = ({ color = t.accent, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
    <path d="M2 7L5.5 10.5L12 4" stroke={color} strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ROMANTIC_LABELS = ['Just getting started', 'A little spark', 'Growing closer',
                         'Beautiful harmony', 'Nearly in sync', 'Perfect match! 🎉'];

const HeartSvg = ({ fill = '#B85C43' }) => (
  <svg width="11" height="10" viewBox="0 0 11 10" fill="none">
    <path d="M5.5 9C5.5 9 1 6 1 3C1 1.9 1.9 1 3 1C3.85 1 4.55 1.5 5.5 2.5C6.45 1.5 7.15 1 8 1C9.1 1 10 1.9 10 3C10 6 5.5 9 5.5 9Z" fill={fill}/>
  </svg>
);

function ScoreHero({ score, total, username }) {
  const matchLabel = score === total
    ? `You matched on all ${total} questions 🎉`
    : score >= 3 ? `You matched on ${score} questions 🎉`
    : `You matched on ${score} questions`;

  const pct = `${Math.round((score / total) * 100)}%`;
  const initial = (username || 'Y')[0].toUpperCase();

  return (
    <div style={{ margin: '0 16px 16px',
                  background: 'linear-gradient(140deg, #F2E4DE 0%, #FDF9F7 60%, #DEF0EE 100%)',
                  borderRadius: 20, padding: '24px 20px 20px', textAlign: 'center',
                  border: '1px solid rgba(237,231,225,0.6)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    gap: 4, marginBottom: 6 }}>
        <span style={{ font: `italic 68px/1 'DM Serif Display', serif`,
                       color: t.accent, letterSpacing: '-0.02em' }}>
          {score}
        </span>
        <span style={{ font: `italic 32px/1.6 'DM Serif Display', serif`,
                       color: '#C8BCB6', paddingBottom: 6 }}>
          &nbsp;/ {total}
        </span>
      </div>
      <p style={{ font: `400 14px/1 'DM Sans', sans-serif`, color: '#5A4A46', marginBottom: 16 }}>
        {matchLabel}
      </p>

      {/* Romantic progress bar */}
      <div style={{ padding: '0 4px', marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* You */}
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: t.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, boxShadow: '0 2px 8px rgba(184,92,67,0.35)' }}>
            <span style={{ font: `600 10px/1 'DM Sans', sans-serif`, color: '#FFF' }}>
              {initial}
            </span>
          </div>

          {/* Track */}
          <div style={{ flex: 1, position: 'relative', padding: '10px 0' }}>
            <div style={{ height: 7, background: 'rgba(28,25,23,0.1)', borderRadius: 20,
                          position: 'relative', overflow: 'visible' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct,
                            background: 'linear-gradient(to right, #B85C43, #C4795A, #B8965A, #4A8B8B)',
                            borderRadius: 20 }} />
              <div style={{ position: 'absolute', left: pct, top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 22, height: 22, borderRadius: '50%', background: '#FFF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: 'heart-glow 2.4s ease-in-out infinite', zIndex: 2 }}>
                <HeartSvg />
              </div>
            </div>
          </div>

          {/* Partner */}
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: t.teal,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, boxShadow: '0 2px 8px rgba(74,139,139,0.3)' }}>
            <HeartSvg fill="#FFF" />
          </div>
        </div>

        <p style={{ font: `italic 13px/1 'DM Serif Display', serif`,
                    color: t.muted, textAlign: 'center', margin: '5px 0 0',
                    letterSpacing: '0.01em' }}>
          {ROMANTIC_LABELS[Math.min(score, ROMANTIC_LABELS.length - 1)]}
        </p>
      </div>
    </div>
  );
}

function ResultCard({ detail }) {
  return (
    <div style={{ margin: '0 16px 10px', background: t.card, borderRadius: 16,
                  padding: 16, boxShadow: '0 2px 14px rgba(28,25,23,0.07)',
                  borderLeft: detail.match ? `3px solid ${t.matchGreen}` : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, flex: 1 }}>
          <span style={{ font: `600 10px/1 'DM Sans', sans-serif`,
                         color: t.accent, background: t.accentLight,
                         borderRadius: 20, padding: '3px 8px', flexShrink: 0, marginTop: 2 }}>
            Q{detail.position}
          </span>
          <p style={{ font: `400 13px/1.45 'DM Sans', sans-serif`, color: t.dark, margin: 0 }}>
            {detail.questionText}
          </p>
        </div>
        {detail.match && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3,
                        background: t.matchGreenLight, borderRadius: 20,
                        padding: '4px 8px', flexShrink: 0 }}>
            <CheckIcon color={t.matchGreenText} size={10} />
            <span style={{ font: `600 10px/1 'DM Sans', sans-serif`,
                           color: t.matchGreenText }}>Match</span>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: t.border, marginBottom: 10 }} />

      {detail.match ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: `500 10px/1 'DM Sans', sans-serif`,
                           color: t.matchGreenText, width: 44, flexShrink: 0 }}>Both</span>
            <div style={{ flex: 1, background: t.matchGreenLight, borderRadius: 8,
                          padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6,
                          border: `1px solid rgba(122,184,125,0.3)` }}>
              <span style={{ font: `700 10px/1 'DM Sans', sans-serif`,
                             color: t.matchGreenText, flexShrink: 0 }}>
                {detail.myAnswer}
              </span>
              <span style={{ font: `400 12px/1 'DM Sans', sans-serif`, color: t.matchGreenText }}>
                {optionText(detail, detail.myAnswer)}
              </span>
            </div>
          </div>
          {(detail.myNote || detail.partnerNote) && (
            <div style={{ marginTop: 8, paddingLeft: 52, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {detail.myNote && (
                <p style={{ margin: 0, font: `italic 11px/1.4 'DM Sans', sans-serif`, color: t.accentText, opacity: 0.9 }}>
                  <strong style={{ fontStyle: 'normal', marginRight: 4 }}>You:</strong>{detail.myNote}
                </p>
              )}
              {detail.partnerNote && (
                <p style={{ margin: 0, font: `italic 11px/1.4 'DM Sans', sans-serif`, color: t.tealText, opacity: 0.9 }}>
                  <strong style={{ fontStyle: 'normal', marginRight: 4 }}>Partner:</strong>{detail.partnerNote}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: `500 10px/1 'DM Sans', sans-serif`,
                           color: t.muted, width: 44, flexShrink: 0 }}>You</span>
            <div style={{ flex: 1, background: t.accentLight, borderRadius: 8,
                          padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ font: `700 10px/1 'DM Sans', sans-serif`,
                             color: t.accent, flexShrink: 0 }}>{detail.myAnswer}</span>
              <span style={{ font: `400 12px/1 'DM Sans', sans-serif`, color: t.accentDark }}>
                {optionText(detail, detail.myAnswer)}
              </span>
            </div>
          </div>
          {detail.myNote && (
            <p style={{ margin: '4px 0 0', paddingLeft: 52,
                        font: `italic 11px/1.4 'DM Sans', sans-serif`, color: t.accentText, opacity: 0.9 }}>
              {detail.myNote}
            </p>
          )}

          <div style={{ height: 7 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: `500 10px/1 'DM Sans', sans-serif`,
                           color: t.muted, width: 44, flexShrink: 0 }}>Partner</span>
            <div style={{ flex: 1, background: t.tealLight, borderRadius: 8,
                          padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ font: `700 10px/1 'DM Sans', sans-serif`,
                             color: t.teal, flexShrink: 0 }}>{detail.partnerAnswer}</span>
              <span style={{ font: `400 12px/1 'DM Sans', sans-serif`, color: t.tealText }}>
                {optionText(detail, detail.partnerAnswer)}
              </span>
            </div>
          </div>
          {detail.partnerNote && (
            <p style={{ margin: '4px 0 0', paddingLeft: 52,
                        font: `italic 11px/1.4 'DM Sans', sans-serif`, color: t.tealText, opacity: 0.9 }}>
              {detail.partnerNote}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function DayResult() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    api.getDayResult(date)
      .then(setResult)
      .catch(() => setError('Results not available for this day.'));
  }, [date]);

  useEffect(() => {
    getUserManager().then(m => m.getUser()).then(u => {
      setUsername(u?.profile?.preferred_username || u?.profile?.name || null);
    });
  }, []);

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: t.bg }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/calendar')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
                   padding: 4, display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 15L7 10L12 5" stroke={t.mid} strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ font: `italic 22px/1.1 'DM Serif Display', serif`,
                       color: t.dark, margin: 0 }}>
            {result ? formatDate(result.date) : formatDate(date)}
          </h1>
          {result?.theme && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: t.accentLight, borderRadius: 20,
                          padding: '4px 10px', marginTop: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.accent }} />
              <span style={{ font: `500 10px/1 'DM Sans', sans-serif`,
                             color: t.accent, letterSpacing: '0.02em' }}>
                {result.theme}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${t.divider}, transparent)`,
                    margin: '0 20px 14px' }} />

      {error ? (
        <div style={{ padding: '2rem 20px', textAlign: 'center' }}>
          <p style={{ font: `400 14px/1.5 'DM Sans', sans-serif`, color: t.muted }}>
            {error}
          </p>
        </div>
      ) : !result ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <p style={{ font: `400 14px/1 'DM Sans', sans-serif`, color: t.muted }}>Loading…</p>
        </div>
      ) : (
        <div style={{ paddingBottom: 40 }}>
          <ScoreHero score={result.score} total={result.totalQuestions} username={username} />

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', margin: '0 16px 14px' }}>
            {[
              { label: 'You', bg: t.accentLight, border: t.accentBorder },
              { label: 'Partner', bg: t.tealLight, border: t.tealBorder },
            ].map(({ label, bg, border }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3,
                              background: bg, border: `1px solid ${border}` }} />
                <span style={{ font: `400 11px/1 'DM Sans', sans-serif`, color: t.muted }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {result.details.map(d => <ResultCard key={d.position} detail={d} />)}
        </div>
      )}
    </div>
  );
}
