import React, { useEffect } from 'react';
import { useRoute } from './router.js';
import { useStore, currentProfile } from './lib/store.js';
import { stop } from './lib/audio.js';
import Home from './screens/Home.jsx';
import ProfileSetup from './screens/ProfileSetup.jsx';
import Subject from './screens/Subject.jsx';
import Activity from './screens/Activity.jsx';
import Bravo from './screens/Bravo.jsx';
import Stars from './screens/Stars.jsx';
import ParentArea from './screens/ParentArea.jsx';
import Admin from './screens/Admin.jsx';
import Print from './screens/Print.jsx';

export default function App() {
  const r = useRoute();
  const profile = useStore(currentProfile);
  useEffect(() => () => stop(), [r.join('/')]);

  const [page, a, b] = r;
  if (!profile && !['parent', 'admin', 'fiche'].includes(page)) return <ProfileSetup />;
  switch (page) {
    case 'profil': return <ProfileSetup edit />;
    case 'matiere': return <Subject id={a} />;
    case 'activite': return <Activity key={a} id={a} />;
    case 'bravo': return <Bravo id={a} />;
    case 'etoiles': return <Stars />;
    case 'parent': return <ParentArea tab={a} />;
    case 'admin': return <ParentArea tab="admin" editId={a} />;
    case 'fiche': return <Print kind={a} id={b} />;
    default: return <Home />;
  }
}
