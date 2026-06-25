import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

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

function ScoreHero({ score, total }) {
  const label = score === total
    ? 'Perfect match! 🎉'
    : `You matched on ${score} question${score !== 1 ? 's' : ''}`;
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
        {label}
      </p>
      <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: '50%',
                                background: i < score ? t.accent : t.divider }} />
        ))}
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

      {[
        { label: 'You', bg: t.accentLight, letterColor: t.accent,
          textColor: t.accentDark, answer: detail.myAnswer },
        { label: 'Partner', bg: t.tealLight, letterColor: t.teal,
          textColor: t.tealText, answer: detail.partnerAnswer },
      ].map(({ label, bg, letterColor, textColor, answer }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8,
                                  marginBottom: label === 'You' ? 7 : 0 }}>
          <span style={{ font: `500 10px/1 'DM Sans', sans-serif`,
                         color: t.muted, width: 44, flexShrink: 0 }}>{label}</span>
          <div style={{ flex: 1, background: bg, borderRadius: 8,
                        padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: `700 10px/1 'DM Sans', sans-serif`,
                           color: letterColor, flexShrink: 0 }}>{answer}</span>
            <span style={{ font: `400 12px/1 'DM Sans', sans-serif`, color: textColor }}>
              {optionText(detail, answer)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DayResult() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.getDayResult(date)
      .then(setResult)
      .catch(() => setError('Results not available for this day.'));
  }, [date]);

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
          <ScoreHero score={result.score} total={result.totalQuestions} />

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
