import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Splash from './components/Splash';
import Home from './pages/Home';
import Rules from './pages/Rules';
import Bracket from './pages/Bracket';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

const SPLASH_KEY = 'ssc_splash_seen';

export default function App() {
  // Show the jump-smash intro once per browser session.
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem(SPLASH_KEY);
    } catch {
      return true;
    }
  });

  const dismissSplash = () => {
    try {
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      /* ignore storage errors (private mode) */
    }
    setShowSplash(false);
  };

  return (
    <>
      <AnimatePresence>{showSplash && <Splash key="splash" onDone={dismissSplash} />}</AnimatePresence>

      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="rules" element={<Rules />} />
          <Route path="bracket" element={<Bracket />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
