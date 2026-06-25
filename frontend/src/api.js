import { getUserManager } from './auth';

async function getToken() {
  const manager = await getUserManager();
  const user = await manager.getUser();
  if (!user || user.expired) {
    await manager.signinRedirect();
    return null;
  }
  return user.access_token;
}

async function request(path, options = {}) {
  const token = await getToken();
  if (!token) return null;

  const res = await fetch('/api' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 409) {
    const err = new Error('Already submitted');
    err.status = 409;
    err.data = await res.json().catch(() => ({}));
    throw err;
  }

  if (!res.ok && res.status !== 202) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export const api = {
  getToday:      ()              => request('/today'),
  submitAnswers: (answers, notes) => request('/today/submit', { method: 'POST', body: JSON.stringify({ answers, notes }) }),
  getResult:     ()              => request('/today/result'),
  getMe:         ()              => request('/me'),
  getWeek:       (date)          => request(`/history/week?date=${date}`),
  getMonth:      (date)          => request(`/history/month?date=${date}`),
  getDayResult:  (date)          => request(`/history/${date}`),
};
