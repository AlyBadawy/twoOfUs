import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getUserManager } from '../auth';

// ── Token system (from design) ────────────────────────────────────────────────
const t = {
  bg:               '#F4EFE8',
  card:             '#FFFFFF',
  accent:           '#B85C43',
  accentLight:      '#F2E4DE',
  accentBorder:     '#C4826D',
  accentText:       '#8A3A28',
  accentDark:       '#7A3525',
  teal:             '#4A8B8B',
  tealLight:        '#DEF0EE',
  tealBorder:       '#7ABABA',
  tealText:         '#2A6060',
  matchGreen:       '#7AB87D',
  matchGreenLight:  '#EBF3EC',
  matchGreenText:   '#5E9B6B',
  dark:             '#1C1917',
  mid:              '#4A3F3C',
  muted:            '#8B7D77',
  faint:            '#B0A49E',
  border:           '#EDE7E1',
  optionBg:         '#FAFAF8',
  optionLabelBg:    '#F0EBE5',
  divider:          '#DDD6CF',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const TODAY_KEY = 'twoofus_submitted';
const todayStr  = new Date().toISOString().split('T')[0];

function hasSubmittedToday() {
  try { return JSON.parse(localStorage.getItem(TODAY_KEY))?.date === todayStr; }
  catch { return false; }
}
function markSubmittedToday() {
  localStorage.setItem(TODAY_KEY, JSON.stringify({ date: todayStr }));
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function optionText(question, letter) {
  return { A: question.optionA, B: question.optionB,
           C: question.optionC, D: question.optionD }[letter] ?? letter;
}

// ── Check icon ────────────────────────────────────────────────────────────────
const CheckIcon = ({ color = t.accent, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
    <path d="M2 7L5.5 10.5L12 4" stroke={color} strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── AppHeader ─────────────────────────────────────────────────────────────────
function AppHeader({ title, date, theme, username, onCalendar }) {
  const initial = (username || 'Y')[0].toUpperCase();
  return (
    <>
      <div style={{ padding: '14px 20px 8px', display: 'flex',
                    alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ font: "italic 27px/1.15 'DM Serif Display', serif",
                       color: t.dark, margin: 0 }}>
            {title}
          </h1>
          {date && (
            <p style={{ font: "400 12px/1 'DM Sans', sans-serif",
                        color: t.muted, marginTop: 5 }}>
              {date}
            </p>
          )}
          {theme && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: t.accentLight, borderRadius: 20,
                          padding: '5px 10px', marginTop: 9 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%',
                            background: t.accent, flexShrink: 0 }} />
              <span style={{ font: "500 10px/1 'DM Sans', sans-serif",
                             color: t.accent, letterSpacing: '0.02em' }}>
                {theme}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginTop: 2 }}>
          {/* Calendar / history button */}
          <button onClick={onCalendar} title="View history"
            style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${t.border}`,
                     background: t.card, cursor: 'pointer', display: 'flex',
                     alignItems: 'center', justifyContent: 'center',
                     boxShadow: '0 1px 6px rgba(28,25,23,0.07)' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
              <rect x="1" y="2.5" width="13" height="11" rx="2" stroke={t.muted} strokeWidth="1.4"/>
              <path d="M1 6.5H14" stroke={t.muted} strokeWidth="1.4"/>
              <path d="M5 1V4M10 1V4" stroke={t.muted} strokeWidth="1.4" strokeLinecap="round"/>
              <rect x="3.5" y="9" width="2" height="2" rx="0.5" fill={t.muted}/>
              <rect x="6.5" y="9" width="2" height="2" rx="0.5" fill={t.muted}/>
              <rect x="9.5" y="9" width="2" height="2" rx="0.5" fill={t.muted}/>
            </svg>
          </button>

          {username && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                          background: t.card, borderRadius: 20,
                          padding: '5px 10px 5px 5px',
                          boxShadow: '0 1px 10px rgba(28,25,23,0.1)' }}>
              <div style={{ width: 27, height: 27, borderRadius: '50%',
                            background: t.accent, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ font: "600 11px/1 'DM Sans', sans-serif", color: '#FFF' }}>
                  {initial}
                </span>
              </div>
              <span style={{ font: "500 12px/1 'DM Sans', sans-serif", color: t.dark }}>
                {username}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1,
                    background: `linear-gradient(to right, transparent, ${t.divider}, transparent)`,
                    margin: '0 20px 14px' }} />
    </>
  );
}

// ── QuestionCard ──────────────────────────────────────────────────────────────
function QuestionCard({ question, selected, onSelect, locked }) {
  return (
    <div style={{ margin: '0 16px 10px', background: t.card, borderRadius: 16,
                  padding: 18, boxShadow: '0 2px 14px rgba(28,25,23,0.07)' }}>
      <span style={{ display: 'inline-block',
                     font: "600 10px/1 'DM Sans', sans-serif",
                     color: t.accent, background: t.accentLight,
                     borderRadius: 20, padding: '4px 10px',
                     letterSpacing: '0.04em', marginBottom: 10 }}>
        Q{question.position}
      </span>
      <p style={{ font: "400 14px/1.5 'DM Sans', sans-serif",
                  color: t.dark, marginBottom: 12 }}>
        {question.questionText}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {['A', 'B', 'C', 'D'].map(key => {
          const isSelected = selected === key;
          const isLocked   = locked;

          const bg     = isLocked
            ? (isSelected ? t.accentLight : t.bg)
            : (isSelected ? t.accentLight : t.optionBg);

          const border = isLocked
            ? (isSelected ? `1.5px solid ${t.accentBorder}` : '1.5px solid rgba(237,231,225,0.4)')
            : (isSelected ? `1.5px solid ${t.accent}` : `1.5px solid ${t.border}`);

          const opacity = isLocked && !isSelected ? 0.35 : 1;

          const labelBg    = isSelected ? t.accent : t.optionLabelBg;
          const labelColor = isSelected ? '#FFF'   : t.muted;

          return (
            <button key={key}
              disabled={isLocked}
              onClick={() => onSelect(question.position, key)}
              style={{ display: 'flex', alignItems: 'center', gap: 10,
                       background: bg, border, borderRadius: 12,
                       padding: '10px 12px', cursor: isLocked ? 'default' : 'pointer',
                       opacity, textAlign: 'left', width: '100%',
                       transition: 'background 0.15s, border-color 0.15s' }}>
              <span style={{ width: 25, height: 25, borderRadius: 8,
                             background: labelBg, display: 'flex',
                             alignItems: 'center', justifyContent: 'center',
                             font: "600 11px/1 'DM Sans', sans-serif",
                             color: labelColor, flexShrink: 0 }}>
                {key}
              </span>
              <span style={{ font: isSelected
                               ? "500 13px/1.35 'DM Sans', sans-serif"
                               : "400 13px/1.35 'DM Sans', sans-serif",
                             color: isSelected ? t.accentText : t.mid, flex: 1 }}>
                {optionText(question, key)}
              </span>
              {isSelected && <CheckIcon />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── SubmitBar ─────────────────────────────────────────────────────────────────
function SubmitBar({ questions, selected, phase, onSubmit }) {
  const allAnswered = questions && Object.keys(selected).length === questions.length;
  const submitting  = phase === 'submitting';

  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '100%', maxWidth: 430, padding: '10px 20px 32px',
                  background: `linear-gradient(to top, ${t.bg} 72%, transparent)` }}>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
        {questions?.map(q => (
          <div key={q.position} style={{ width: 7, height: 7, borderRadius: '50%',
                                         background: selected[q.position] ? t.accent : t.divider }} />
        ))}
      </div>

      <button onClick={onSubmit} disabled={!allAnswered || submitting}
        style={{ width: '100%', padding: '15px 20px', borderRadius: 14, border: 'none',
                 background: allAnswered && !submitting ? t.accent : '#D0C9C3',
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 cursor: allAnswered && !submitting ? 'pointer' : 'default',
                 transition: 'background 0.2s' }}>
        <span style={{ font: "600 15px/1 'DM Sans', sans-serif",
                       color: allAnswered && !submitting
                                ? '#FFF' : 'rgba(255,255,255,0.72)' }}>
          {submitting ? 'Submitting…' : 'Submit Answers'}
        </span>
      </button>

      {!allAnswered && (
        <p style={{ font: "400 11px/1 'DM Sans', sans-serif",
                    color: t.faint, textAlign: 'center', marginTop: 9 }}>
          Answer all 5 to submit
        </p>
      )}
    </div>
  );
}

// ── WaitingBar ────────────────────────────────────────────────────────────────
function WaitingBar() {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '100%', maxWidth: 430, padding: '16px 20px 36px',
                  background: `linear-gradient(to top, ${t.bg} 72%, transparent)` }}>
      <div style={{ background: t.card, borderRadius: 14, padding: '14px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 2px 14px rgba(28,25,23,0.1)', border: `1px solid ${t.border}` }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.teal,
                      flexShrink: 0, animation: 'pulse-dot 2.2s ease-in-out infinite' }} />
        <span style={{ font: "500 14px/1 'DM Sans', sans-serif", color: t.teal }}>
          Waiting for your partner…
        </span>
      </div>
    </div>
  );
}

// ── SuccessBanner ─────────────────────────────────────────────────────────────
function SuccessBanner() {
  return (
    <div style={{ margin: '10px 16px 0',
                  background: 'linear-gradient(135deg, #EBF5F1, #DEF0EE)',
                  borderRadius: 14, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: '1px solid #C2DEDA' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.teal,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CheckIcon color="#FFF" size={14} />
      </div>
      <span style={{ font: "500 13px/1.3 'DM Sans', sans-serif", color: '#2D6B6B' }}>
        Your answers are in ✓
      </span>
    </div>
  );
}

// ── ScoreHero ─────────────────────────────────────────────────────────────────
function ScoreHero({ score, total }) {
  const label = score === total
    ? 'Perfect match! 🎉'
    : score >= 3 ? `You matched on ${score} questions 🎉`
    : `You matched on ${score} questions`;

  return (
    <div style={{ margin: '0 16px 16px',
                  background: 'linear-gradient(140deg, #F2E4DE 0%, #FDF9F7 60%, #DEF0EE 100%)',
                  borderRadius: 20, padding: '24px 20px 20px', textAlign: 'center',
                  border: '1px solid rgba(237,231,225,0.6)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    gap: 4, marginBottom: 6 }}>
        <span style={{ font: "italic 68px/1 'DM Serif Display', serif",
                       color: t.accent, letterSpacing: '-0.02em' }}>
          {score}
        </span>
        <span style={{ font: "italic 32px/1.6 'DM Serif Display', serif",
                       color: '#C8BCB6', paddingBottom: 6 }}>
          &nbsp;/ {total}
        </span>
      </div>
      <p style={{ font: "400 14px/1 'DM Sans', sans-serif", color: '#5A4A46', marginBottom: 16 }}>
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

// ── ResultCard ────────────────────────────────────────────────────────────────
function ResultCard({ detail, question }) {
  return (
    <div style={{ margin: '0 16px 10px', background: t.card, borderRadius: 16,
                  padding: 16, boxShadow: '0 2px 14px rgba(28,25,23,0.07)',
                  borderLeft: detail.match ? `3px solid ${t.matchGreen}` : 'none' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, flex: 1, minWidth: 0 }}>
          <span style={{ font: "600 10px/1 'DM Sans', sans-serif",
                         color: t.accent, background: t.accentLight,
                         borderRadius: 20, padding: '3px 8px',
                         flexShrink: 0, marginTop: 2 }}>
            Q{detail.position}
          </span>
          <p style={{ font: "400 13px/1.45 'DM Sans', sans-serif", color: t.dark, margin: 0 }}>
            {detail.questionText}
          </p>
        </div>
        {detail.match && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3,
                        background: t.matchGreenLight, borderRadius: 20,
                        padding: '4px 8px', flexShrink: 0 }}>
            <CheckIcon color={t.matchGreenText} size={10} />
            <span style={{ font: "600 10px/1 'DM Sans', sans-serif",
                           color: t.matchGreenText }}>Match</span>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: t.border, marginBottom: 10 }} />

      {/* You row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <span style={{ font: "500 10px/1 'DM Sans', sans-serif",
                       color: t.muted, width: 44, flexShrink: 0 }}>You</span>
        <div style={{ flex: 1, background: t.accentLight, borderRadius: 8,
                      padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ font: "700 10px/1 'DM Sans', sans-serif",
                         color: t.accent, flexShrink: 0 }}>
            {detail.myAnswer}
          </span>
          <span style={{ font: "400 12px/1 'DM Sans', sans-serif", color: t.accentDark }}>
            {question ? optionText(question, detail.myAnswer) : detail.myAnswer}
          </span>
        </div>
      </div>

      {/* Partner row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ font: "500 10px/1 'DM Sans', sans-serif",
                       color: t.muted, width: 44, flexShrink: 0 }}>Partner</span>
        <div style={{ flex: 1, background: t.tealLight, borderRadius: 8,
                      padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ font: "700 10px/1 'DM Sans', sans-serif",
                         color: t.teal, flexShrink: 0 }}>
            {detail.partnerAnswer}
          </span>
          <span style={{ font: "400 12px/1 'DM Sans', sans-serif", color: t.tealText }}>
            {question ? optionText(question, detail.partnerAnswer) : detail.partnerAnswer}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────
const page = { maxWidth: 430, margin: '0 auto', minHeight: '100vh' };

// ── Today (main component) ────────────────────────────────────────────────────
export default function Today() {
  const navigate = useNavigate();
  const [phase, setPhase]           = useState('loading');
  const [questionSet, setQuestionSet] = useState(null);
  const [selected, setSelected]     = useState({});
  const [result, setResult]         = useState(null);
  const [username, setUsername]     = useState(null);
  const [error, setError]           = useState(null);

  const pollRef = useRef(null);

  const clearPoll = () => { clearInterval(pollRef.current); pollRef.current = null; };

  const startPollingResults = useCallback(() => {
    clearPoll();
    pollRef.current = setInterval(async () => {
      try {
        const data = await api.getResult();
        if (data?.status === 'revealed') {
          clearPoll();
          setResult(data);
          setPhase('revealed');
        }
      } catch (e) { console.error('Result poll error', e); }
    }, 5000);
  }, []);

  const loadToday = useCallback(async () => {
    try {
      const data = await api.getToday();
      if (data?.status === 'generating') { setPhase('generating'); return; }
      setQuestionSet(data);

      if (hasSubmittedToday()) {
        const res = await api.getResult();
        if (res?.status === 'revealed') { setResult(res); setPhase('revealed'); }
        else { setPhase('waiting'); startPollingResults(); }
      } else {
        setPhase('questions');
      }
    } catch (e) { setError('Could not load today\'s questions.'); console.error(e); }
  }, [startPollingResults]);

  // Fetch OIDC profile for username
  useEffect(() => {
    getUserManager().then(m => m.getUser()).then(u => {
      const name = u?.profile?.preferred_username || u?.profile?.name || null;
      setUsername(name);
    });
  }, []);

  useEffect(() => { loadToday(); return clearPoll; }, [loadToday]);

  // Poll while generating
  useEffect(() => {
    if (phase !== 'generating') return;
    const id = setInterval(loadToday, 10_000);
    return () => clearInterval(id);
  }, [phase, loadToday]);

  const handleSelect = (position, key) =>
    setSelected(prev => ({ ...prev, [position]: key }));

  const handleSubmit = async () => {
    setPhase('submitting');
    const answers = questionSet.questions
      .sort((a, b) => a.position - b.position)
      .map(q => selected[q.position]);
    try {
      await api.submitAnswers(answers);
      markSubmittedToday();
      setPhase('waiting');
      startPollingResults();
    } catch (e) {
      if (e.status === 409) { markSubmittedToday(); setPhase('waiting'); startPollingResults(); }
      else { setError('Could not submit. Please try again.'); setPhase('questions'); }
    }
  };

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ ...page, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 16, padding: '2rem' }}>
        <p style={{ font: "400 15px/1.5 'DM Sans', sans-serif", color: '#C0392B',
                    textAlign: 'center' }}>{error}</p>
        <button onClick={() => { setError(null); setPhase('loading'); loadToday(); }}
          style={{ padding: '12px 28px', borderRadius: 12, border: 'none',
                   background: t.accent, color: '#FFF',
                   font: "600 14px/1 'DM Sans', sans-serif", cursor: 'pointer' }}>
          Try again
        </button>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{ ...page, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ font: "400 14px/1 'DM Sans', sans-serif", color: t.muted }}>
          Loading…
        </p>
      </div>
    );
  }

  // ── Generating ─────────────────────────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div style={{ ...page, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    minHeight: '100vh', gap: 10, padding: '2rem' }}>
        <h1 style={{ font: "italic 32px/1.2 'DM Serif Display', serif",
                     color: t.dark, textAlign: 'center' }}>
          Today's questions are on their way…
        </h1>
        <p style={{ font: "400 14px/1.5 'DM Sans', sans-serif",
                    color: t.muted, textAlign: 'center' }}>
          Check back in a moment.
        </p>
      </div>
    );
  }

  // ── Results revealed ───────────────────────────────────────────────────────
  if (phase === 'revealed' && result) {
    const questionsMap = Object.fromEntries(
      (questionSet?.questions ?? []).map(q => [q.position, q])
    );
    return (
      <div style={page}>
        <div style={{ paddingBottom: 40 }}>
          <AppHeader title="Today's Results"
                     date={questionSet ? formatDate(questionSet.date) : ''}
                     username={username}
                     onCalendar={() => navigate('/calendar')} />
          <ScoreHero score={result.score} total={result.totalQuestions} />

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center',
                        margin: '0 16px 14px' }}>
            {[
              { label: 'You', bg: t.accentLight, border: t.accentBorder },
              { label: 'Partner', bg: t.tealLight, border: t.tealBorder },
            ].map(({ label, bg, border }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3,
                              background: bg, border: `1px solid ${border}` }} />
                <span style={{ font: "400 11px/1 'DM Sans', sans-serif", color: t.muted }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {result.details.map(d => (
            <ResultCard key={d.position} detail={d} question={questionsMap[d.position]} />
          ))}
        </div>
      </div>
    );
  }

  // ── Questions / Submitted / Waiting ────────────────────────────────────────
  const isWaiting   = phase === 'waiting';
  const isSubmitting = phase === 'submitting';
  const locked      = isWaiting || isSubmitting;

  return (
    <div style={page}>
      {isWaiting && <SuccessBanner />}

      <AppHeader
        title="Today's Questions"
        date={questionSet ? formatDate(questionSet.date) : ''}
        theme={questionSet?.theme}
        username={username}
        onCalendar={() => navigate('/calendar')}
      />

      <div style={{ paddingBottom: 140 }}>
        {questionSet?.questions.map(q => (
          <QuestionCard key={q.id} question={q}
                        selected={selected[q.position]}
                        onSelect={handleSelect}
                        locked={locked} />
        ))}
      </div>

      {isWaiting
        ? <WaitingBar />
        : <SubmitBar questions={questionSet?.questions} selected={selected}
                     phase={phase} onSubmit={handleSubmit} />
      }
    </div>
  );
}
