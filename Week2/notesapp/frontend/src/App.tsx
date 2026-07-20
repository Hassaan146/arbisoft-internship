import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import NotesPage from './pages/NotesPage';

// App shell with no router: a landing hero that opens the notes workspace.
export default function App() {
  const [open, setOpen] = useState(false);

  if (open) {
    return <NotesPage onBack={() => setOpen(false)} />;
  }
  return <LandingPage onOpen={() => setOpen(true)} />;
}
