import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserManager } from '../auth';

export default function Callback({ onLogin }) {
  const navigate = useNavigate();

  useEffect(() => {
    getUserManager().then((manager) => {
      manager
        .signinRedirectCallback()
        .then((user) => {
          onLogin(user);
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error('OIDC callback error:', err);
          manager.signinRedirect();
        });
    });
  }, []);

  return <p style={{ padding: '2rem' }}>Completing sign-in…</p>;
}
