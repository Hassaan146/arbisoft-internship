import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260616_212935_bbf608da-62d1-4f25-9be4-c346e4d09cc8.mp4';

export default function Landing() {
  useEffect(() => {
    let cancelled = false;

    // ===================== SCROLL VIDEO =====================
    const canvas = document.getElementById('video-canvas');
    const videoEl = document.getElementById('video-fallback');
    const ctx = canvas.getContext('2d');
    let frames = [];
    let framesReady = false;
    let lastFrameIndex = -1;
    let videoSeeking = false;
    let videoRaf = 0;
    let particlesRaf = 0;
    let cardsRaf = 0;

    function resizeCanvas() {
      const dpr = Math.min(devicePixelRatio, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      lastFrameIndex = -1;
    }

    async function extractFrames() {
      try {
        const response = await fetch(VIDEO_URL, { mode: 'cors' });
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';
        video.src = objectUrl;

        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject();
          setTimeout(() => reject(), 15000);
        });

        const scale = Math.min(1, 1280 / video.videoWidth);
        const scaledWidth = Math.round(video.videoWidth * scale);
        const scaledHeight = Math.round(video.videoHeight * scale);
        const frameCount = Math.max(
          30,
          Math.min(120, Math.round(video.duration * 24))
        );

        for (let i = 0; i < frameCount; i += 1) {
          if (cancelled) return;
          const time = (i / (frameCount - 1)) * (video.duration - 0.05);
          video.currentTime = time;
          await new Promise((resolve, reject) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resolve();
            };
            video.addEventListener('seeked', onSeeked);
            setTimeout(() => {
              video.removeEventListener('seeked', onSeeked);
              reject();
            }, 3000);
          });
          const bitmap = await createImageBitmap(video, {
            resizeWidth: scaledWidth,
            resizeHeight: scaledHeight,
          });
          frames.push(bitmap);
        }

        if (!cancelled && frames.length > 0) {
          framesReady = true;
          canvas.style.visibility = 'visible';
          videoEl.style.display = 'none';
        }
        URL.revokeObjectURL(objectUrl);
      } catch {
        /* fall back to live video seeking */
      }
    }

    function getScrollBounds() {
      const vh = window.innerHeight;
      return {
        start: vh * 0.5,
        end: document.documentElement.scrollHeight - vh,
      };
    }

    function getProgress() {
      const { start, end } = getScrollBounds();
      const range = end - start;
      if (range <= 0) return 0;
      return Math.max(0, Math.min(1, (window.scrollY - start) / range));
    }

    function drawFrame(frame) {
      const cw = canvas.width;
      const ch = canvas.height;
      const s = Math.max(cw / frame.width, ch / frame.height);
      const dw = frame.width * s;
      const dh = frame.height * s;
      ctx.drawImage(frame, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }

    function videoTick() {
      const progress = getProgress();
      if (framesReady && frames.length > 0) {
        const idx = Math.round(progress * (frames.length - 1));
        if (idx !== lastFrameIndex) {
          lastFrameIndex = idx;
          if (frames[idx]) drawFrame(frames[idx]);
        }
      } else if (
        videoEl.duration &&
        isFinite(videoEl.duration) &&
        videoEl.readyState >= 1
      ) {
        const target = progress * videoEl.duration;
        if (!videoSeeking && Math.abs(videoEl.currentTime - target) > 0.001) {
          videoSeeking = true;
          videoEl.currentTime = target;
        }
      }
      videoRaf = requestAnimationFrame(videoTick);
    }

    const onSeeked = () => {
      videoSeeking = false;
    };
    const onStalled = () => {
      videoSeeking = false;
    };
    const onLoadedData = () => {
      videoEl.currentTime = 0;
    };
    videoEl.addEventListener('seeked', onSeeked);
    videoEl.addEventListener('stalled', onStalled);
    videoEl.addEventListener('loadeddata', onLoadedData);
    canvas.style.visibility = 'hidden';

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    videoRaf = requestAnimationFrame(videoTick);
    extractFrames();

    // ===================== PARTICLES =====================
    const pCanvas = document.getElementById('particles-canvas');
    const pCtx = pCanvas.getContext('2d');
    let particles = [];

    function createParticles() {
      particles = [];
      const count = Math.floor((pCanvas.width * pCanvas.height) / 12000);
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * pCanvas.width,
          y: Math.random() * pCanvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.6 + 0.2,
        });
      }
    }

    function resizeParticles() {
      pCanvas.width = window.innerWidth;
      pCanvas.height = window.innerHeight;
      createParticles();
    }

    function animateParticles() {
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = pCanvas.width;
        if (p.x > pCanvas.width) p.x = 0;
        if (p.y < 0) p.y = pCanvas.height;
        if (p.y > pCanvas.height) p.y = 0;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        pCtx.fill();
      }
      particlesRaf = requestAnimationFrame(animateParticles);
    }

    resizeParticles();
    window.addEventListener('resize', resizeParticles);
    animateParticles();

    // ===================== HERO FADE =====================
    function updateHeroOpacity() {
      const fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.3));
      document.getElementById('hero').style.opacity = fade;
    }
    window.addEventListener('scroll', updateHeroOpacity, { passive: true });

    // ===================== FIXED CARDS =====================
    const fixedCards = document.getElementById('fixed-cards');
    const cardsGrid = fixedCards.querySelector('.grid');

    function tickCards() {
      const trigger = document.getElementById('cards-trigger');
      const rect = trigger.getBoundingClientRect();
      const triggerTop = rect.top + window.scrollY;
      const triggerHeight = rect.height;
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      const start = triggerTop - vh * 0.5;
      const end = triggerTop + triggerHeight - vh * 0.3;
      const range = end - start;

      let progress = range > 0 ? (scrollY - start) / range : 0;
      progress = Math.max(0, Math.min(1, progress));

      const isActive = scrollY >= start - vh * 0.2 && scrollY <= end + vh * 0.3;
      const fadeIn = Math.min(
        1,
        Math.max(0, (scrollY - (start - vh * 0.2)) / (vh * 0.2))
      );
      const fadeOut = Math.min(
        1,
        Math.max(0, (end + vh * 0.3 - scrollY) / (vh * 0.3))
      );
      const containerOpacity = isActive ? Math.min(fadeIn, fadeOut) : 0;

      fixedCards.style.opacity = containerOpacity;
      fixedCards.style.pointerEvents = containerOpacity > 0.1 ? 'auto' : 'none';

      const isMobile = window.innerWidth < 768;
      const revealPct = progress * 130;
      if (isMobile) {
        cardsGrid.style.maskImage = `linear-gradient(to bottom, black ${revealPct}%, transparent ${revealPct + 20}%)`;
        cardsGrid.style.webkitMaskImage = `linear-gradient(to bottom, black ${revealPct}%, transparent ${revealPct + 20}%)`;
      } else {
        cardsGrid.style.maskImage = `linear-gradient(to right, black ${revealPct}%, transparent ${revealPct + 15}%)`;
        cardsGrid.style.webkitMaskImage = `linear-gradient(to right, black ${revealPct}%, transparent ${revealPct + 15}%)`;
      }

      cardsRaf = requestAnimationFrame(tickCards);
    }
    cardsRaf = requestAnimationFrame(tickCards);

    // ===================== SECTION 3 INTERSECTION =====================
    const sectionThreeInner = document.getElementById('section-three-inner');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          sectionThreeInner.classList.add('visible');
          observer.unobserve(sectionThreeInner);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(sectionThreeInner);

    // ===================== CLEANUP =====================
    return () => {
      cancelled = true;
      cancelAnimationFrame(videoRaf);
      cancelAnimationFrame(particlesRaf);
      cancelAnimationFrame(cardsRaf);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('resize', resizeParticles);
      window.removeEventListener('scroll', updateHeroOpacity);
      videoEl.removeEventListener('seeked', onSeeked);
      videoEl.removeEventListener('stalled', onStalled);
      videoEl.removeEventListener('loadeddata', onLoadedData);
      observer.disconnect();
      frames.forEach((f) => {
        if (f.close) f.close();
      });
      frames = [];
    };
  }, []);

  return (
    <div className="veldara-page">
      {/* Scroll Video Background */}
      <div id="scroll-video-container">
        <canvas id="video-canvas" />
        <video
          id="video-fallback"
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          src={VIDEO_URL}
        />
        <div className="overlay" />
      </div>

      {/* Particles */}
      <canvas id="particles-canvas" />

      {/* Fixed Cards */}
      <div id="fixed-cards">
        <div className="grid">
          <div className="card">
            <h3>Explore Nebula</h3>
            <p>
              Nebula merges the elegance of React 18 with the depth of Three.js
              within easy reach. It&apos;s crafted to be robust and adaptable
              while remaining intuitive and simple to grasp.
            </p>
          </div>
          <div className="card">
            <h3>Unlock Three.js</h3>
            <p>
              The web is growing increasingly dimensional. At its heart, Nebula
              offers a composable declarative API for building performant
              Three.js experiences on the web.
            </p>
          </div>
          <div className="card">
            <h3>Connect Everything</h3>
            <p>
              Nebula ships with tooling for physics, XR, animation, layouting,
              model loading, and extensive utilities to make building compelling
              3D apps for the web effortless.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="veldara-nav">
        <div className="nav-group">
          <Link to="/" className="logo">
            nebula
          </Link>
          <div className="nav-links">
            <Link to="/dashboard">Guides</Link>
            <Link to="/pricing">Journal</Link>
          </div>
        </div>
        <div className="social">
          <a href="#" aria-label="GitHub">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a href="#" aria-label="Discord">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
            </svg>
          </a>
          <a href="#" aria-label="X">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <div id="content">
        {/* Section 1: Hero */}
        <section id="hero">
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
                <code>npm i @nebula/core</code>
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

        {/* Spacer */}
        <div style={{ height: '150vh' }} />

        {/* Cards Trigger Zone */}
        <div id="cards-trigger" style={{ height: '200vh' }} />

        {/* Spacer */}
        <div style={{ height: '100vh' }} />

        {/* Section 3 */}
        <section id="section-three">
          <div className="inner" id="section-three-inner">
            <p>Presenting</p>
            <h2>Nebula 8</h2>
          </div>
        </section>
      </div>
    </div>
  );
}
