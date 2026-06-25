import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import About from './pages/About.jsx';
import Reviews from './pages/Reviews.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      {/* Immersive scroll landing with the live 3D flower — its own layout */}
      <Route path="/" element={<Landing />} />

      {/* Routed glass pages over the same live 3D flower background */}
      <Route element={<Layout />}>
        <Route path="/about" element={<About />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
