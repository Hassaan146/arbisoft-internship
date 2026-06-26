/**
 * Immersive scroll-driven landing — a faithful replica of the Veldara reference.
 * Composes the background video, a particle field, a fading hero, mask-wipe
 * cards, and an IntersectionObserver reveal, each owned by its own hook.
 */
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { VIDEO_URL } from '../videoSource.js';
import { SocialLinks } from '../components/ui/index.js';
import { landingCards } from '../data/landingCards.js';
import { useAutoplayVideo } from '../hooks/useAutoplayVideo.js';
import { useParticles } from '../hooks/useParticles.js';
import { useHeroFade } from '../hooks/useHeroFade.js';
import { useCardScrollMask } from '../hooks/useCardScrollMask.js';
import { useScrollReveal } from '../hooks/useScrollReveal.js';
import './Landing.css';

export default function Landing() {
  const videoRef = useRef(null);
  const particlesRef = useRef(null);
  const heroRef = useRef(null);
  const cardsRef = useRef(null);
  const triggerRef = useRef(null);
  const revealRef = useRef(null);

  const { blocked, play } = useAutoplayVideo(videoRef, { detectBlocked: true });
  useParticles(particlesRef);
  useHeroFade(heroRef);
  useCardScrollMask(cardsRef, triggerRef);
  useScrollReveal(revealRef);

  return (
    <div className="veldara-page">
      {/* Background video — the cinematic flower clip, autoplaying on a loop */}
      <div id="scroll-video-container">
        <video
          ref={videoRef}
          id="landing-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          src={VIDEO_URL}
        />
        <div className="overlay" />
      </div>

      {blocked && (
        <button type="button" className="bg-play-btn" onClick={play}>
          ▶ Play background
        </button>
      )}

      <canvas ref={particlesRef} id="particles-canvas" />

      <div id="fixed-cards" ref={cardsRef}>
        <div className="grid">
          {landingCards.map((card) => (
            <div className="card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </div>

      <nav className="veldara-nav">
        <div className="nav-group">
          <Link to="/" className="logo">
            veldara
          </Link>
          <div className="nav-links">
            <Link to="/about">About</Link>
            <Link to="/reviews">Reviews</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
        <SocialLinks />
      </nav>

      <div id="content">
        <section id="hero" ref={heroRef}>
          <div className="gradient-overlay" />
          <div className="content">
            <p className="subtitle">Our Purpose:</p>
            <h1>
              Instantly craft immersive{' '}
              <span className="underlined">
                <span className="line" />
                <span>3D worlds</span>
              </span>{' '}
              on the web.
            </h1>
            <div className="ctas">
              <div className="code-box">
                <span className="prompt">&gt;</span>
                <code>npm i @veldara/core</code>
              </div>
              <Link to="/contact" className="cta-btn">
                Get Started <span>&rarr;</span>
              </Link>
            </div>
          </div>
          <div className="bounce-arrow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </section>

        <div className="spacer-lg" />
        <div id="cards-trigger" ref={triggerRef} />
        <div className="spacer-md" />

        <section id="section-three">
          <div className="inner" id="section-three-inner" ref={revealRef}>
            <p>Presenting</p>
            <h2>Veldara 8</h2>
          </div>
        </section>
      </div>
    </div>
  );
}
