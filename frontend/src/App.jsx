import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getUserManager } from './auth';
import Callback from './pages/Callback';
import Today from './pages/Today';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    getUserManager().then((manager) => {
      if (!mounted) return;

      manager.getUser().then((u) => {
        if (!mounted) return;
        setUser(u);
        if ((!u || u.expired) && !location.pathname.startsWith('/callback')) {
          manager.signinRedirect();
        }
      });

      const onLoaded   = (u) => { if (mounted) setUser(u);    };
      const onUnloaded = ()  => { if (mounted) setUser(null); };
      manager.events.addUserLoaded(onLoaded);
      manager.events.addUserUnloaded(onUnloaded);

      return () => {
        manager.events.removeUserLoaded(onLoaded);
        manager.events.removeUserUnloaded(onUnloaded);
      };
    });

    return () => { mounted = false; };
  }, []);

  if (user === undefined && !location.pathname.startsWith('/callback')) {
    return null;
  }

  return (
    <Routes>
      <Route path="/callback" element={<Callback onLogin={setUser} />} />
      <Route path="/*" element={<Today />} />
    </Routes>
  );
}
