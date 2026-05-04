import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  ArrowUpRight, Mail, ChevronDown, Cpu, Watch, Shield, BookOpen,
  Wrench, Rocket, Send, CheckCircle2, AlertCircle, Code2, Network, Sparkles, CandlestickChart, Feather
} from 'lucide-react';

// ============================================================================
// CONFIG
// ============================================================================
const TURNSTILE_SITEKEY = "0x4AAAAAADFk34QHrSswkgud";
const WEBHOOK_URL = "https://northconsulting.app.n8n.cloud/webhook/9b8bbc86-ab11-47f1-a310-427f5f59095a";



// ============================================================================
// HOOKS
// ============================================================================
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// Fetches the live GitHub commit streak (excluding today, in case the day's
// commits aren't in yet) via a CORS-enabled JSON wrapper around the
// contribution graph. Falls back to null on any failure or suspiciously low
// count, so the UI keeps the static "1,000+" label rather than showing
// something wrong.
function GithubIcon({ size = 14 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function useGitHubStreak(username = 'isaacljubic', minBound = 1000) {
  const [streak, setStreak] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${username}?y=all`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const days = (data.contributions || []).slice();
        days.sort((a, b) => new Date(a.date) - new Date(b.date));
        const today = new Date().toISOString().slice(0, 10);
        let count = 0;
        for (let i = days.length - 1; i >= 0; i--) {
          const day = days[i];
          if (day.date >= today) continue;
          if (day.count > 0) count++;
          else break;
        }
        // Only use the live value if it's at or above our static lower bound.
        // If the API returns less (rate limit, partial data, network glitch),
        // we leave streak as null so the static fallback shows.
        if (!cancelled && count >= minBound) setStreak(count);
      } catch (err) {
        // Silent fail — UI keeps static fallback.
      }
    })();
    return () => { cancelled = true; };
  }, [username, minBound]);
  return streak;
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// CUSTOM CURSOR
// ============================================================================
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMove);

    const onDown = () => ringRef.current?.classList.add('ring-press');
    const onUp = () => ringRef.current?.classList.remove('ring-press');
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    const hoverables = () => document.querySelectorAll('a, button, .magnetic, input, textarea');
    const onOver = (e) => {
      if (e.target.closest('a, button, .magnetic, input, textarea')) {
        ringRef.current?.classList.add('ring-hover');
      }
    };
    const onOut = (e) => {
      if (e.target.closest('a, button, .magnetic, input, textarea')) {
        ringRef.current?.classList.remove('ring-hover');
      }
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    let raf;
    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (dotRef.current) dotRef.current.style.transform = `translate(${mx}px, ${my}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

// ============================================================================
// THREE.JS HERO SCENE — reactive wireframe terrain with cursor ripples
// ============================================================================
function HeroScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth, H = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    camera.position.set(0, 4.5, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Terrain plane: 80x80 vertex grid that we displace per-frame.
    const SIZE = 24;
    const SEG = 80;
    const planeGeo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    planeGeo.rotateX(-Math.PI / 2);
    const baseZ = planeGeo.attributes.position.array.slice();

    // Build a custom wireframe so every grid cell shows two lines (right + down).
    // We will rewrite line positions each frame from the deformed plane.
    const stride = SEG + 1;
    let lineSegmentCount = 0;
    for (let z = 0; z <= SEG; z++) {
      for (let x = 0; x <= SEG; x++) {
        if (x < SEG) lineSegmentCount++;
        if (z < SEG) lineSegmentCount++;
      }
    }
    const linePositions = new Float32Array(lineSegmentCount * 6);

    const wireMat = new THREE.LineBasicMaterial({
      color: 0xede8da, transparent: true, opacity: 0.45,
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const wire = new THREE.LineSegments(lineGeo, wireMat);
    scene.add(wire);

    const buildLines = (positionsArr) => {
      let idx = 0;
      for (let z = 0; z <= SEG; z++) {
        for (let x = 0; x <= SEG; x++) {
          const i = z * stride + x;
          if (x < SEG) {
            const j = i + 1;
            linePositions[idx++] = positionsArr[i*3];
            linePositions[idx++] = positionsArr[i*3+1];
            linePositions[idx++] = positionsArr[i*3+2];
            linePositions[idx++] = positionsArr[j*3];
            linePositions[idx++] = positionsArr[j*3+1];
            linePositions[idx++] = positionsArr[j*3+2];
          }
          if (z < SEG) {
            const j = i + stride;
            linePositions[idx++] = positionsArr[i*3];
            linePositions[idx++] = positionsArr[i*3+1];
            linePositions[idx++] = positionsArr[i*3+2];
            linePositions[idx++] = positionsArr[j*3];
            linePositions[idx++] = positionsArr[j*3+1];
            linePositions[idx++] = positionsArr[j*3+2];
          }
        }
      }
    };

    // Mouse tracking. Listen on WINDOW (not the mount div) so hovering over
    // sibling overlays like the hero text still triggers ripples. Bounding-
    // rect check disables ripples when the cursor leaves the hero area.
    const mouseWorld = new THREE.Vector3(0, 0, 999);
    let mouseActive = false;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    const onMove = (e) => {
      const r = mount.getBoundingClientRect();
      const inside =
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top  && e.clientY <= r.bottom;
      if (!inside) { mouseActive = false; return; }
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hit = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, hit);
      if (hit) { mouseWorld.copy(hit); mouseActive = true; }
    };
    const onLeave = () => { mouseActive = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('blur', onLeave);

    const positionsArr = planeGeo.attributes.position.array;
    const N = positionsArr.length / 3;

    let raf;
    const t0 = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = (performance.now() - t0) / 1000;

      for (let i = 0; i < N; i++) {
        const x = baseZ[i*3];
        const z = baseZ[i*3 + 2];
        // Layered sine waves for organic terrain motion.
        let y =
            Math.sin(x * 0.35 + t * 0.6) * 0.35 +
            Math.cos(z * 0.45 - t * 0.4) * 0.30 +
            Math.sin((x + z) * 0.22 + t * 0.3) * 0.25 +
            Math.sin(x * 0.9 + z * 0.7 + t * 0.8) * 0.10;

        // Cursor ripple: damped sinusoid radiating from mouseWorld.
        if (mouseActive) {
          const dx = x - mouseWorld.x;
          const dz = z - mouseWorld.z;
          const dist = Math.sqrt(dx*dx + dz*dz);
          const ripple = Math.exp(-dist * 0.4) * Math.sin(dist * 1.5 - t * 4) * 0.6;
          y += ripple;
        }
        positionsArr[i*3 + 1] = y;
      }

      buildLines(positionsArr);
      lineGeo.attributes.position.needsUpdate = true;

      // Slow camera orbit for ambient motion.
      const cx = Math.sin(t * 0.05) * 1.0;
      const cz = 8 + Math.cos(t * 0.05) * 0.5;
      camera.position.x = cx;
      camera.position.z = cz;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      if (W === 0 || H === 0) return; // skip until container has real size
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener('resize', onResize);

    // ResizeObserver fires the first time the container actually has
    // dimensions, fixing the "have to manually resize the window" issue
    // when the scene mounts before the browser finishes initial layout.
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      mount.removeChild(renderer.domElement);
      planeGeo.dispose();
      lineGeo.dispose();
      wireMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="hero-scene" />;
}

// ============================================================================
// SCRAMBLED TEXT — letters resolve from random characters
// ============================================================================
function Scrambled({ text, delay = 0, className = '' }) {
  const [out, setOut] = useState(text);
  const ref = useRef(null);
  useEffect(() => {
    const chars = '!<>-_\\/[]{}=+*^?#________';
    let frame = 0;
    let interval;
    const start = () => {
      frame = 0;
      interval = setInterval(() => {
        let result = '';
        let done = 0;
        for (let i = 0; i < text.length; i++) {
          const startFrame = i * 1.4;
          const endFrame = startFrame + 10;
          if (frame >= endFrame) { result += text[i]; done++; }
          else if (frame >= startFrame) {
            result += text[i] === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
          } else result += ' ';
        }
        setOut(result);
        frame++;
        if (done === text.length) clearInterval(interval);
      }, 32);
    };
    const t = setTimeout(start, delay);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, [text, delay]);
  return <span ref={ref} className={className}>{out}</span>;
}

// ============================================================================
// MAGNETIC WRAPPER — subtle attraction to cursor
// ============================================================================
function Magnetic({ children, strength = 0.25, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };
    const onLeave = () => { el.style.transform = ''; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [strength]);
  return <div ref={ref} className={`magnetic ${className}`}>{children}</div>;
}

// ============================================================================
// NAVIGATION
// ============================================================================
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [
    { href: '#ventures', label: 'Ventures' },
    { href: '#now', label: 'Today' },
    { href: '#future', label: 'Future' },
    { href: '#contact', label: 'Contact' },
  ];
  return (
    <nav className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="nav-inner">
        <a href="#top" className="nav-logo">
          <span className="nav-logo-mark">Isaac Ljubic</span>
          <span className="nav-logo-meta">/ engineer / founder</span>
        </a>
        <div className="nav-links">
          {links.map((l, i) => (
            <a key={l.href} href={l.href} className="nav-link">
              <span className="nav-link-num">0{i + 1}</span>
              <span className="nav-link-label">{l.label}</span>
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// HERO
// ============================================================================
function Hero() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const d = new Date();
      const opts = { timeZone: 'Australia/Brisbane', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      setTime(new Intl.DateTimeFormat('en-AU', opts).format(d) + ' AEST');
    };
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, []);

  return (
    <section id="top" className="hero">
      <HeroScene />
      <div className="hero-grid-overlay" />
      <div className="hero-vignette" />

      <div className="hero-meta hero-meta-tl">
        <div className="meta-row">
          <span className="meta-dot" />
          <span>SYS_OK</span>
        </div>
        <div className="meta-row meta-faint">{time}</div>
      </div>

      <div className="hero-meta hero-meta-tr">
        <div className="meta-row">LAT 27.4698°S / LNG 153.0251°E</div>
        <div className="meta-row meta-faint">BRISBANE / AUSTRALIA</div>
      </div>

      <div className="hero-meta hero-meta-bl">
        <div className="meta-row meta-faint">SCROLL</div>
        <ChevronDown size={14} className="bounce-y" />
      </div>

      <div className="hero-meta hero-meta-br">
        <div className="meta-row meta-faint">v.2026</div>
      </div>

      <div className="hero-content">
        <div className="hero-eyebrow">
          <span className="eyebrow-bar" />
          <span>Computer Systems Engineer · Founder</span>
        </div>
        <h1 className="hero-title">
          <span className="hero-line"><Scrambled text="ISAAC" delay={150} /></span>
          <span className="hero-line"><Scrambled text="LJUBIC." delay={650} /></span>
        </h1>
        <p className="hero-sub">
          Building deeply technical systems at the intersection of <em>cryptography</em>,
          <em> hardware</em> and <em>artificial intelligence</em>. Bridging <em>low-level engineering</em> and applied systems.
        </p>
        <div className="hero-actions">
          <Magnetic strength={0.18}>
            <a href="#ventures" className="btn btn-primary">
              <span>Explore Ventures</span>
              <ArrowUpRight size={16} />
            </a>
          </Magnetic>
          <Magnetic strength={0.18}>
            <a href="#contact" className="btn btn-ghost">
              <span>Get in Touch</span>
              <Mail size={14} />
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION HEADER
// ============================================================================
function SectionHeader({ index, kicker, title }) {
  return (
    <Reveal>
      <header className="sec-header">
        <div className="sec-index">{index}</div>
        <div>
          <div className="sec-kicker">{kicker}</div>
          <h2 className="sec-title">{title}</h2>
        </div>
      </header>
    </Reveal>
  );
}

// ============================================================================
// ABOUT
// ============================================================================
function About() {
  const streak = useGitHubStreak('isaacljubic');
  const streakLabel = streak !== null
    ? `${streak.toLocaleString()} day commit streak`
    : '1,000+ day commit streak';
  return (
    <section className="section">
      <div className="container">
        <SectionHeader index="00" kicker="// brief" title="The short version." />
        <div className="about-grid">
          <Reveal delay={100}>
            <p className="about-lede">
              I'm a computer systems engineer working across the stack, from
              cryptography and embedded hardware to AI systems. I go deep on problems, design solutions properly and
              then ship.
            </p>
            <p className="about-lede">
              My work spans three companies, open-source crypto networks, mechanical hardware, AI systems, two patents and a dissertation on RAG optimisation.
            </p>
          </Reveal>
          <Reveal delay={200} className="about-side">
            <div className="kv"><span>Discipline</span><span>Computer Systems Engineering</span></div>
            <div className="kv"><span>Education</span><span>B.Eng (Hons), USQ</span></div>
            <div className="kv"><span>Patents</span><span>2 Provisional</span></div>
            <div className="kv"><span>Companies</span><span>3 Founded</span></div>
            <div className="kv"><span>GitHub</span><span className="kv-accent">{streakLabel}</span></div>
            <div className="kv kv-stack">
              <span>Currently</span>
              <div className="kv-roles">
                <span>Head of Engineering @ North Consulting</span>
                <span>Co-Founder @ OEX Timepieces</span>
                <span>Founder @ Valency</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}


// ============================================================================
// VENTURES
// ============================================================================
// ============================================================================
// VENTURES GAP FILLER — animated circuit-board pattern
// ============================================================================
// The Filler Animated Circuit Board Background
function VenturesFiller({ colStart }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    const DARK = '#0b0b0d';
    const CELL = 14;
    const FIL = CELL - 1; // 1px gap shows lighter bg through

    let W = 0, H = 0, raf;
    let traces = [];
    let junctions = []; // junctions[i] = [{pos, otherIdx, otherPos}] sorted by pos
    let racers = [];

    const trLen = (tr) => tr.type === 'h' ? tr.end - tr.c : tr.end - tr.r;

    const posToXY = (tr, pos) => {
      const len = trLen(tr);
      const cx = FIL / 2;
      if (tr.type === 'h') return { x: tr.c * CELL + pos * len * CELL + cx, y: tr.r * CELL + cx };
      return { x: tr.c * CELL + cx, y: tr.r * CELL + pos * len * CELL + cx };
    };

    const build = () => {
      traces = [];
      const cols = Math.ceil(W / CELL) + 2;
      const rows = Math.ceil(H / CELL) + 2;

      for (let r = 0; r < rows; r++) {
        let c = 0;
        while (c < cols - 1) {
          if (Math.random() < 0.48) {
            const ec = Math.min(c + 3 + Math.floor(Math.random() * 9), cols - 1);
            if (ec > c) traces.push({ type: 'h', r, c, end: ec });
            c = ec + 1 + Math.floor(Math.random() * 2);
          } else c++;
        }
      }
      for (let c = 0; c < cols; c++) {
        let r = 0;
        while (r < rows - 1) {
          if (Math.random() < 0.4) {
            const er = Math.min(r + 2 + Math.floor(Math.random() * 7), rows - 1);
            if (er > r) traces.push({ type: 'v', r, c, end: er });
            r = er + 1 + Math.floor(Math.random() * 3);
          } else r++;
        }
      }

      // Pre-compute H×V intersections
      junctions = traces.map(() => []);
      for (let i = 0; i < traces.length; i++) {
        for (let j = i + 1; j < traces.length; j++) {
          const a = traces[i], b = traces[j];
          if (a.type === b.type) continue;
          const h = a.type === 'h' ? a : b, v = a.type === 'v' ? a : b;
          const hi = a.type === 'h' ? i : j, vi = a.type === 'v' ? i : j;
          const hl = trLen(h), vl = trLen(v);
          if (!hl || !vl) continue;
          if (v.c >= h.c && v.c <= h.end && h.r >= v.r && h.r <= v.end) {
            const ph = (v.c - h.c) / hl;
            const pv = (h.r - v.r) / vl;
            junctions[hi].push({ pos: ph, otherIdx: vi, otherPos: pv });
            junctions[vi].push({ pos: pv, otherIdx: hi, otherPos: ph });
          }
        }
      }
      junctions.forEach(j => j.sort((a, b) => a.pos - b.pos));

      // Spawn racers preferring connected traces
      racers = [];
      const connected = traces.map((_, i) => i).filter(i => junctions[i].length > 0);
      const pool = connected.length > 0 ? connected : traces.map((_, i) => i);
      const n = Math.max(5, Math.floor((W * H) / 18000));
      for (let i = 0; i < n; i++) {
        if (!pool.length) break;
        const ti = pool[Math.floor(Math.random() * pool.length)];
        racers.push({
          ti,
          pos: 0.1 + Math.random() * 0.8,
          dir: Math.random() < 0.5 ? 1 : -1,
          speed: 2 + Math.random() * 3,       // cells/sec
          tail: [],
          tailLen: 12 + Math.floor(Math.random() * 20),
          turnOdds: 0.2 + Math.random() * 0.4, // chance to take each junction
        });
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      W = wrap.clientWidth; H = wrap.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    resize();
    let last = performance.now();

    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, W, H);

      const cols = Math.ceil(W / CELL) + 2;
      const rows = Math.ceil(H / CELL) + 2;

      // Grid tiles (dark squares, 1px lighter gap shows through)
      ctx.fillStyle = DARK;
      for (let r = 0; r <= rows; r++)
        for (let c = 0; c <= cols; c++)
          ctx.fillRect(c * CELL, r * CELL, FIL, FIL);

      // Circuit traces
      for (const tr of traces) {
        ctx.fillStyle = DARK;
        if (tr.type === 'h') ctx.fillRect(tr.c * CELL, tr.r * CELL, (tr.end - tr.c) * CELL + FIL, FIL);
        else ctx.fillRect(tr.c * CELL, tr.r * CELL, FIL, (tr.end - tr.r) * CELL + FIL);
      }

      // Junction nodes
      ctx.fillStyle = '#161620';
      for (let i = 0; i < traces.length; i++) {
        for (const jn of junctions[i]) {
          if (jn.otherIdx > i) {
            const pt = posToXY(traces[i], jn.pos);
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2); ctx.fill();
          }
        }
      }

      // Endpoint pads
      ctx.fillStyle = '#131318';
      for (const tr of traces) {
        const cx = FIL / 2;
        const dot = (x, y) => { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill(); };
        if (tr.type === 'h') {
          dot(tr.c * CELL + cx, tr.r * CELL + cx);
          dot(tr.end * CELL + cx, tr.r * CELL + cx);
        } else {
          dot(tr.c * CELL + cx, tr.r * CELL + cx);
          dot(tr.c * CELL + cx, tr.end * CELL + cx);
        }
      }

      // Racers — navigate junctions, clear tail on turn
      for (const r of racers) {
        const tr = traces[r.ti];
        if (!tr) continue;
        const len = trLen(tr);
        if (!len) continue;

        const prev = r.pos;
        r.pos += r.dir * r.speed * dt / len;

        // Check every junction this racer's trace has
        const jns = junctions[r.ti];
        let turned = false;
        for (const jn of jns) {
          const crossed = r.dir > 0
            ? prev < jn.pos && r.pos >= jn.pos
            : prev > jn.pos && r.pos <= jn.pos;
          if (crossed && Math.random() < r.turnOdds) {
            r.tail = [];           // flush tail — no visual jump across traces
            r.ti = jn.otherIdx;
            r.pos = jn.otherPos;
            r.dir = Math.random() < 0.5 ? 1 : -1;
            turned = true;
            break;
          }
        }

        // Bounce at dead ends
        if (!turned) {
          if (r.pos >= 1) { r.pos = 0.98; r.dir = -1; }
          if (r.pos <= 0) { r.pos = 0.02; r.dir = 1; }
        }

        const pt = posToXY(traces[r.ti], r.pos);
        r.tail.push({ x: pt.x, y: pt.y });
        if (r.tail.length > r.tailLen) r.tail.shift();
        if (r.tail.length < 2) continue;

        // Draw tail with fading opacity — purely dark-palette
        for (let i = 1; i < r.tail.length; i++) {
          const alpha = (i / r.tail.length) * 0.88;
          ctx.strokeStyle = `rgba(26, 26, 36, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(r.tail[i - 1].x, r.tail[i - 1].y);
          ctx.lineTo(r.tail[i].x, r.tail[i].y);
          ctx.stroke();
        }

        // Head
        ctx.fillStyle = '#222230';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    requestAnimationFrame(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div
      data-filler="true"
      ref={wrapRef}
      className="ventures-filler"
      style={{ gridColumn: `${colStart} / -1` }}
    >
      <canvas ref={canvasRef} className="ventures-filler-canvas" />
    </div>
  );
}

function Ventures() {
  const gridRef = useRef(null);
  const [showFiller, setShowFiller] = useState(false);
  const [colCount, setColCount] = useState(3);

  const items = [
    {
      icon: Cpu,
      year: '2021 →',
      name: 'FrontierVR',
      role: 'Founder',
      tag: 'Hardware · VR',
      status: 'paused',
      blurb: 'A VR haptics hardware company founded the day I turned 18. Goal: let people experience real-life sensations inside virtual environments.',
      meta: 'Founded · age 18',
    },
    {
      icon: Sparkles,
      year: '2021',
      name: 'GPU Ray-Tracing Optimisation',
      role: 'Inventor',
      tag: 'Provisional Patent',
      status: 'patent',
      blurb: 'Filed a provisional patent two months after starting FrontierVR. A novel optimisation approach for GPU-side ray tracing, more specifically a software system for square-root approximation. Square-root operations are the main bottleneck when it comes to rendering ray-traced graphics so improving this improved the performance of Ray Tracing engines noticeably.',
      meta: '1st provisional patent',
    },
    {
      icon: Network,
      year: '2022 / 2024',
      name: 'The Valency Project',
      role: 'Founder · Architect',
      tag: 'Cryptography · Network',
      status: 'archived',
      blurb: 'A custom cryptocurrency network. Authored a 100+ page whitepaper over 5 months, then shipped Valency-Core: open-source crypto, UI and networking frameworks in C++. Archived when I switched to the Valency Exchange - which is the for-profit half of the Valency Project.',
      meta: 'Whitepaper · 100+ pages',
      links: [
        { href: 'https://valency.dev/The-Valency-Project.pdf', label: 'Whitepaper' },
        { href: 'https://github.com/thevalencyproject', label: 'Valency-Core' },
      ],
    },
    {
      icon: CandlestickChart,
      year: '2023 →',
      name: 'Valency Exchange',
      role: 'Founder · CEO',
      tag: 'Fintech · Open Source',
      status: 'live',
      blurb: 'The world\'s first fully open-source centralised crypto exchange. AUSTRAC registered. Partnered with world-leading liquidity providers. Currently working around the Australian debanking landscape to bring it to market.',
      meta: 'Crypto Exchange',
      links: [
        { href: 'https://valency.exchange', label: 'Site' },
        { href: 'https://github.com/Valency-Australia', label: 'Github' },
      ],
    },
    {
      icon: Watch,
      year: '2025 →',
      name: 'OEX Timepieces',
      role: 'Co-Founder',
      tag: 'Hardware · D2C',
      status: 'live',
      blurb: 'Co-founded with Rorey Stewart. Fully custom mechanical watches built through an in-browser configurator: preview, configure, build and ship the watch of your dreams. Launching on Kickstarter soon however our website is already up.',
      meta: 'Approaching launch',
      links: [
        { href: 'https://oextime.com', label: 'Site' },
        { href: 'https://www.instagram.com/oextime', label: 'Instagram' },
      ],
    },
    {
      icon: Feather,
      year: '2025',
      name: 'HolyAI',
      role: 'Creator',
      tag: 'AI Chatbot · One-Month Project',
      status: 'live',
      blurb: 'Lets you have meaningful conversations with AI Jesus, Pope Francis, God and a Pastor. The backend + frontend was built from scratch using FastAPI and React. The model is open-source and fine-tuned on religious information. Personas are done through prompt injection. Full stripe implementation with no-account, free, and paid tiers. It is a full platform with conversation tracking, settings and account management.',
      meta: 'Religious AI · Side Project',
      links: [
        { href: 'https://holyai.app', label: 'Try it out' },
      ]
    },
    {
      icon: Shield,
      year: '2025 →',
      name: 'Valency Crypto Wallet',
      role: 'Creator',
      tag: 'Hardware · Crypto Wallet',
      status: 'in-progress',
      blurb: 'Built under the Valency brand - this is the Worlds thinnest usb-c device. Currently in prototype phase, this device includes all the features of other Crypto Hardware Wallets + the worlds thinnest USB-C device design, metal frame, bluetooth and a High-Resolution OLED display.',
      meta: 'Consumer Hardware · Super-Thin Device',
    },
    {
      icon: Rocket,
      year: '2025 →',
      name: 'North Consulting',
      role: 'Head of Engineering',
      tag: 'GTM · AI Systems',
      status: 'live',
      blurb: 'Head of Engineering at North Consulting, a B2B revenue consulting and engineering firm. As of updating this site we have shipped over 2,000 campaigns and enriched over 1 million ICP datapoints for clients. We Grow Revenue without growing headcount.',
      meta: 'AI Sales Systems for Revenue Growth',
      links: [
        { href: 'https://northconsulting.com.au', label: 'Site' },
      ],
    },
    {
      icon: BookOpen,
      year: '2025',
      name: 'RAG Optimisation Dissertation',
      role: 'Author',
      tag: 'Research',
      status: 'published',
      blurb: 'Final dissertion for B.Eng (Hons): Optimising Retrieval-Augmented Generation (RAG) Workflows for Large Language Models: A look at Accuracy, Efficiency and Reliability in Knowledge-Intensive Applications.',
      meta: 'Final-year dissertation',
    },
    {
      icon: Sparkles,
      year: '2026',
      name: 'LLM Optimisation System',
      role: 'Inventor',
      tag: 'Provisional Patent',
      status: 'patent',
      blurb: 'Filed a provisional patent at the start of 2026 covering a novel optimisation system for large language models. The system reduces token usage in High Parameter-Count LLMs significantly.',
      meta: '2nd provisional patent',
    },
  ];

  useEffect(() => {
  const grid = gridRef.current;
  if (!grid) return;
  const check = () => {
    const colStr = getComputedStyle(grid).gridTemplateColumns;
    const count = colStr === 'none' ? 1
      : colStr.trim().split(/\s+/).filter(Boolean).length;
    setColCount(count);
    setShowFiller(items.length % count !== 0);
  };
  check();
  const ro = new ResizeObserver(check);
  ro.observe(grid);
  return () => ro.disconnect();
}, []);

const fillerColStart = (items.length % colCount) + 1;

  return (
    <section id="ventures" className="section">
      <div className="container">
        <SectionHeader index="01" kicker="// ventures" title="Companies, patents, papers." />
        <div className="ventures-grid" ref={gridRef}>
          {items.map((v, i) => {
            const Icon = v.icon;
            return (
              <Reveal key={v.name} delay={(i % 3) * 100}>
                <article className={`venture-card status-${v.status}`}>
                  <div className="venture-top">
                    <div className="venture-icon"><Icon size={18} /></div>
                    <div className={`venture-status venture-status-${v.status}`}>
                      <span className="status-dot" />
                      {v.status === 'live' && 'ACTIVE'}
                      {v.status === 'in-progress' && 'IN PROGRESS'}
                      {v.status === 'paused' && 'PAUSED'}
                      {v.status === 'archived' && 'ARCHIVED'}
                      {v.status === 'patent' && 'FILED'}
                      {v.status === 'published' && 'PUBLISHED'}
                      {v.status === 'completed' && 'COMPLETE'}
                    </div>
                  </div>
                  <div className="venture-year">{v.year}</div>
                  <h3 className="venture-name">{v.name}</h3>
                  <div className="venture-role">
                    <span>{v.role}</span>
                    <span className="venture-divider">·</span>
                    <span>{v.tag}</span>
                  </div>
                  <p className="venture-blurb">{v.blurb}</p>
                  <div className="venture-foot">
                    <span className="venture-meta">{v.meta}</span>
                    {v.links && (
                      <div className="venture-links">
                        {v.links.map(l => (
                          <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="venture-link">
                            {l.label} <ArrowUpRight size={12} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="venture-glow" />
                </article>
              </Reveal>
            );
          })}
          {showFiller && <VenturesFiller colStart={fillerColStart} />}
        </div>
      </div>
    </section>
  );
}


// ============================================================================
// TODAY — interactive priority queue (CPU-scheduler-style)
// ============================================================================
function TypewriterText({ text, speed = 40, start = false, onDone }) {
  const [out, setOut] = useState('');
  // onDone may be re-created by the parent on every render; stash in a ref so
  // changes don't restart the typing effect.
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    if (!start) { setOut(''); return; }
    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (i < text.length) {
        setOut(text.slice(0, i + 1));
        i++;
        setTimeout(tick, speed);
      } else if (onDoneRef.current) {
        onDoneRef.current();
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [text, speed, start]);
  return <>{out}</>;
}

function Today() {
  const tasks = [
    {
      id: 'p01',
      priority: 'PRIORITY_01',
      title: 'North Consulting',
      tagline: 'Building AI-Systems for Revenue Growth. ',
      detail: 'Busy through the work week and the occasional weekend. Designing, building and shipping... I lead the engineering function of the company.',
      status: 'RUNNING',
      cmd: 'exec --priority=high --schedule=weekdays+occasional-weekends',
    },
    {
      id: 'p02',
      priority: 'PRIORITY_02',
      title: 'OEX Timepieces',
      tagline: 'Finalising infrastructure that facilitates the ordering and build of Custom Timepieces',
      detail: 'Always running in parallel to all my other commitments. Kickstarter pre-launch is closing in.',
      status: 'RUNNING',
      cmd: 'exec --priority=high --schedule=continuous',
    },
    {
      id: 'p03',
      priority: 'PRIORITY_03',
      title: 'Valency Exchange',
      tagline: 'Working through the debanking landscape toward launch.',
      detail: 'Always running in parallel. Active engineering and operations. Currently finishing up the Webapp, then will be on to alpha testing.',
      status: 'RUNNING',
      cmd: 'exec --priority=high --schedule=continuous',
    },
    {
      id: 'p04',
      priority: 'PRIORITY_04',
      title: '[PAUSED] Side Projects',
      tagline: 'Weekend builds, patents + whatever comes next. Paused for a while now while I am working on the above companies.',
      detail: 'Reserved cycles for research, prototypes and the next thing on the horizon.',
      status: 'QUEUED',
      cmd: 'exec --priority=low --schedule=spare-cycles',
    },
  ];

  const [openId, setOpenId] = useState('p01');
  const [revealed, setRevealed] = useState(false);

  // Live YYYY.MM stamp for the uptime row, recomputed once per minute so a
  // long-open tab eventually rolls over month boundaries.
  const [uptimeStamp, setUptimeStamp] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setUptimeStamp(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`);
    };
    const int = setInterval(tick, 60_000);
    return () => clearInterval(int);
  }, []);

  const wrapperRef = useRef(null);
  useEffect(() => {
    if (!wrapperRef.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setRevealed(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="now" className="section section-alt">
      <div className="container">
        <SectionHeader index="02" kicker="// now" title="The current priority queue." />

        <Reveal>
          <div className="queue-meta">
            <div className="queue-meta-row">
              <span className="queue-meta-key">PROCESS</span>
              <span className="queue-meta-val">isaac.runtime</span>
            </div>
            <div className="queue-meta-row">
              <span className="queue-meta-key">SCHEDULER</span>
              <span className="queue-meta-val">priority-based · preemptive</span>
            </div>
            <div className="queue-meta-row">
              <span className="queue-meta-key">UPTIME</span>
              <span className="queue-meta-val queue-blink">{uptimeStamp} · live</span>
            </div>
          </div>
        </Reveal>

        <div className="queue-list" ref={wrapperRef}>
          {tasks.map((t, i) => {
            const isOpen = openId === t.id;
            const isActive = t.status === 'RUNNING';
            const isLead = i === 0; // Lead row gets the typewriter + caret treatment
            return (
              <button
                key={t.id}
                className={`queue-row ${isOpen ? 'queue-open' : ''} ${isActive ? 'queue-active' : ''}`}
                onClick={() => setOpenId(isOpen ? null : t.id)}
                style={{ '--qi': i }}
              >
                <div className="queue-row-head">
                  <div className="queue-row-id">
                    <span className="queue-bracket">[</span>
                    {t.priority}
                    <span className="queue-bracket">]</span>
                  </div>
                  <div className="queue-row-title">
                    <span className="queue-title-text">{t.title}</span>
                  </div>
                  <div className={`queue-row-status status-${t.status.toLowerCase()}`}>
                    <span className="queue-status-dot" />
                    {t.status}
                  </div>
                  <div className="queue-row-toggle">
                    <span className="toggle-line toggle-h" />
                    <span className="toggle-line toggle-v" />
                  </div>
                </div>

                <div className="queue-row-tagline">
                  {isLead && revealed ? (
                    <TypewriterText
                      text={t.tagline}
                      speed={28}
                      start={revealed}
                    />
                  ) : t.tagline}
                </div>

                <div className="queue-row-expand">
                  <div className="queue-expand-inner">
                    <div className="queue-expand-detail">{t.detail}</div>
                    <div className="queue-expand-cmd">
                      <span className="queue-prompt">$</span> {t.cmd}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}


// ============================================================================
// FUTURE
// ============================================================================
function Future() {
  const items = [
    {
      icon: Wrench,
      title: 'Open-Source Industrial Automation',
      kind: 'Non-Profit Organisation',
      tagline: 'An Open-Source Framework that allows anyone to go from raw material to fully-automated production line.',
      pillars: [
        { k: 'Vision',     v: 'Open-Source Machines, planning and design tools to accomodate a more open industrial automation standard.' },
        { k: 'Scope',     v: 'Hardware and Software. I envision this becoming THE standard in Industrial Automation.' },
        { k: 'Blueprints',   v: 'Every machine and process documented, free, with tools to assist factory/workshop design.' },
        { k: 'Outcome',      v: 'Build anything, anywhere, without supply-chain restrictions. The ultimate goal for this would be to have everything up to and beyond an open-source photolithography machine - this would make historically unreliable supply chains much more efficient and decentralise critical manufacturing infrastructure. The reach and economic impact of a non-profit like this would be of proportions rivaling or even beating that of the Linux Foundation.' },
      ],
    },
    {
      icon: Code2,
      title: 'FrontierVR Relaunch',
      kind: 'Hardware Product Company',
      tagline: 'Returning to where it started... just with more time, resources, greater engineering expertise and better component maturity.',
      pillars: [
        { k: 'Vision',  v: 'Engineer and market a full-body haptic system so finely-tuned that it genuinely feels like you are experiencing real life inside of VR.' },
        { k: 'Scope',   v: 'Hardware and Firmware. I envisage developers being reluctant to develop experiences for the system so some demos or even full-length video games may have to be developed in-house.' },
        { k: 'Why in the Future', v: 'The reason FrontierVR was paused in the first place was due to the sheer cost of getting electronics certified. VR quality and component maturity is the second reason. Both of these problems are solved, with the only roadblock being the time commitment.' },
        { k: 'Outcome',   v: 'The sheer thought of a device that let any human experience a real-life like experience from their living room was science fiction not long ago. It has been a long time since the initial WOW factor of VR, and this system would be that second moment. If the system did what it promises it would become just as necesary as the Smartphone.' },
      ],
    },
  ];
  return (
    <section id="future" className="section">
      <div className="container">
        <SectionHeader index="03" kicker="// future" title="What I'm building toward." />
        <div className="future-grid">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <Reveal key={i} delay={i * 150}>
                <div className="future-card">
                  <div className="future-corner future-corner-tl" />
                  <div className="future-corner future-corner-tr" />
                  <div className="future-corner future-corner-bl" />
                  <div className="future-corner future-corner-br" />
                  <div className="future-icon"><Icon size={22} /></div>
                  <div className="future-kind">{it.kind}</div>
                  <h3 className="future-title">{it.title}</h3>
                  <p className="future-tagline">{it.tagline}</p>
                  <div className="future-pillars">
                    {it.pillars.map((p, j) => (
                      <div className="pillar" key={j}>
                        <div className="pillar-k">// {p.k}</div>
                        <div className="pillar-v">{p.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}


// ============================================================================
// TURNSTILE WIDGET
// ============================================================================
function Turnstile({ onToken }) {
  const ref = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    // Load script once
    const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    if (!document.querySelector(`script[src="${SRC}"]`)) {
      const s = document.createElement('script');
      s.src = SRC;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return;
      if (window.turnstile && ref.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(ref.current, {
            sitekey: TURNSTILE_SITEKEY,
            theme: 'dark',
            appearance: 'interaction-only',
            callback: (token) => onToken(token),
            'error-callback': () => onToken(null),
            'expired-callback': () => onToken(null),
          });
        } catch (e) { /* ignore double-render */ }
      } else {
        setTimeout(tryRender, 200);
      }
    };
    tryRender();
    return () => {
      cancelled = true;
      try {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      } catch (e) {}
    };
  }, [onToken]);

  return <div ref={ref} className="turnstile-mount" />;
}

// ============================================================================
// CONTACT
// ============================================================================
function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[+]?[\d\s\-().]{5,20}$/;

  const handleToken = useCallback((t) => setToken(t), []);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error');
      setErrorMsg('Please fill in name, email and message.');
      return;
    }
    if (!emailRegex.test(form.email)) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (form.phone.trim() && !phoneRegex.test(form.phone)) {
      setStatus('error');
      setErrorMsg('Please enter a valid phone number (or no phone number - it is not a mandatory field)');
      return;
    }
    if (!token) {
      setStatus('error');
      setErrorMsg('Please complete the verification challenge.');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          cfTurnstileToken: token,
          submittedAt: new Date().toISOString(),
          source: 'isaacljubic.com',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
      setToken(null);
      if (window.turnstile) window.turnstile.reset();
    } catch (err) {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again or email me directly.');
    }
  };

  return (
    <section id="contact" className="section">
      <div className="container">
        <SectionHeader index="04" kicker="// contact" title="Get in touch." />
        <div className="contact-grid">
          <Reveal>
            <div className="contact-side">
              <p className="contact-lede">
                Whether it's an interesting engineering problem, a partnership,
                or just a good conversation about hardware, cryptography, or AI,
                drop a message.
              </p>
              <div className="contact-meta">
                <div className="contact-meta-row">
                  <span className="meta-label">Response time</span>
                  <span>Usually within 48 hours</span>
                </div>
                <div className="contact-meta-row">
                  <span className="meta-label">Consult with me</span>
                  <span className="meta-accent">$450 / hour</span>
                </div>
                <div className="contact-meta-row">
                  <span className="meta-label">Location</span>
                  <span>Brisbane, Australia</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="form-wrap">
              <div className="form-inner">
                <div className="form-row form-row-double">
                  <div className="field">
                    <label><span className="field-num">01</span><span>Name</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={update('name')}
                      disabled={status === 'sending'}
                    />
                  </div>
                  <div className="field">
                    <label><span className="field-num">02</span><span>Email</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      disabled={status === 'sending'}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>
                    <span className="field-num">03</span>
                    <span>Phone</span>
                    <span className="field-optional">optional</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                    disabled={status === 'sending'}
                  />
                </div>

                <div className="field">
                  <label><span className="field-num">04</span><span>Message</span></label>
                  <textarea
                    rows="5"
                    value={form.message}
                    onChange={update('message')}
                    disabled={status === 'sending'}
                  />
                </div>

                <Turnstile onToken={handleToken} />

                {status === 'error' && (
                  <div className="form-msg form-msg-error">
                    <AlertCircle size={14} /> {errorMsg}
                  </div>
                )}
                {status === 'success' && (
                  <div className="form-msg form-msg-success">
                    <CheckCircle2 size={14} /> Signal received. I'll get back to you soon.
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={status === 'sending'}
                  className="btn btn-primary btn-submit"
                >
                  {status === 'sending' ? 'TRANSMITTING…' : 'SEND MESSAGE'}
                  <Send size={14} />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}


// ============================================================================
// FOOTER
// ============================================================================
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div className="footer-name">Isaac Ljubic</div>

          <div className="footer-meta">© {new Date().getFullYear()} · Brisbane, Australia</div>
        </div>
        <div className="footer-links">
          <a href="https://github.com/isaacljubic" target="_blank" rel="noreferrer" className="footer-link">
            <GithubIcon size={14} /> Github
          </a>
          <a href="https://valency.dev/The-Valency-Project.pdf" target="_blank" rel="noreferrer" className="footer-link">
            <BookOpen size={14} /> Whitepaper
          </a>
          <a href="#contact" className="footer-link">
            <Mail size={14} /> Contact
          </a>
        </div>
      </div>
    </footer>
  );
}


// ============================================================================
// STYLES
// ============================================================================
function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Geist:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500&display=swap');

      :root {
        --bg: #0b0b0d;
        --bg-2: #111114;
        --surface: #16161b;
        --border: #27272f;
        --border-strong: #3a3a44;
        --text: #ECE7DA;
        --text-dim: #9b9588;
        --text-mute: #5d574d;
        --accent: #ff5722;
        --accent-2: #ff8a4a;
        --accent-soft: rgba(255, 87, 34, 0.12);
        --serif: 'Roboto Mono', ui-monospace, monospace;
        --sans: 'Geist', system-ui, sans-serif;
        --mono: 'JetBrains Mono', ui-monospace, monospace;
      }

      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body, #root, #__root {
        background: var(--bg);
        color: var(--text);
        font-family: var(--sans);
        font-size: 16px;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
        cursor: none;
      }
      a { color: inherit; text-decoration: none; cursor: none; }
      button { cursor: none; }

      ::selection { background: var(--accent); color: var(--bg); }

      /* Background grain */
      body::before {
        content: ''; position: fixed; inset: 0; z-index: 1; pointer-events: none;
        background-image: radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px);
        background-size: 3px 3px;
        opacity: 0.35;
      }

      /* ============ CURSOR ============ */
      .cursor-dot, .cursor-ring {
        position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999;
        will-change: transform;
      }
      .cursor-dot {
        width: 5px; height: 5px; border-radius: 50%;
        background: var(--accent);
        margin: -2.5px 0 0 -2.5px;
      }
      .cursor-ring {
        width: 32px; height: 32px; border-radius: 50%;
        border: 1px solid rgba(236,231,218,0.4);
        margin: -16px 0 0 -16px;
        transition: width 0.25s ease, height 0.25s ease, margin 0.25s ease, border-color 0.25s ease, background 0.25s ease;
      }
      .cursor-ring.ring-hover {
        width: 56px; height: 56px; margin: -28px 0 0 -28px;
        border-color: var(--accent);
        background: rgba(255, 87, 34, 0.06);
      }
      .cursor-ring.ring-press {
        width: 22px; height: 22px; margin: -11px 0 0 -11px;
      }
      @media (max-width: 800px) {
        .cursor-dot, .cursor-ring { display: none; }
        body, a, button { cursor: auto; }
      }

      /* ============ NAV ============ */
      .nav {
        position: fixed; top: 0; left: 0; right: 0; z-index: 100;
        padding: 18px 0;
        transition: background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease;
        border-bottom: 1px solid transparent;
      }
      .nav-scrolled {
        background: rgba(11, 11, 13, 0.78);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-bottom-color: var(--border);
      }
      .nav-inner {
        max-width: 1320px; margin: 0 auto; padding: 0 32px;
        display: flex; align-items: center; justify-content: space-between; gap: 24px;
      }
      .nav-logo {
        display: flex; align-items: baseline; gap: 12px;
        font-family: var(--mono); font-size: 13px; letter-spacing: 0.04em;
      }
      .nav-logo-mark {
        font-family: var(--serif); font-size: 18px; font-weight: 500;
        color: var(--text); letter-spacing: -0.005em;
      }
      .nav-logo-meta { color: var(--text-mute); font-size: 11px; }
      .nav-links { display: flex; gap: 24px; }
      .nav-link {
        font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em;
        display: inline-flex; align-items: baseline; gap: 6px;
        color: var(--text-dim); transition: color 0.2s ease;
        position: relative; padding-bottom: 4px;
      }
      .nav-link::after {
        content: ''; position: absolute; left: 0; bottom: 0; height: 1px;
        width: 0; background: var(--accent); transition: width 0.3s ease;
      }
      .nav-link:hover { color: var(--text); }
      .nav-link:hover::after { width: 100%; }
      .nav-link-num { color: var(--accent); }
      .nav-link-label { text-transform: uppercase; }
      @media (max-width: 700px) {
        .nav-links { display: none; }
      }

      /* ============ HERO ============ */
      .hero {
        position: relative; min-height: 100vh; min-height: 100svh; overflow: hidden;
        display: flex; align-items: center; justify-content: center;
        padding: 120px 32px 80px;
      }
      .hero-scene {
        position: absolute; inset: 0;
        z-index: 1;
        opacity: 0.45;
      }
      .hero-grid-overlay {
        position: absolute; inset: 0; z-index: 2; pointer-events: none;
        background-image:
          linear-gradient(rgba(236,231,218,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(236,231,218,0.04) 1px, transparent 1px);
        background-size: 80px 80px;
        mask-image: radial-gradient(ellipse 70% 60% at center, black 30%, transparent 90%);
        -webkit-mask-image: radial-gradient(ellipse 70% 60% at center, black 30%, transparent 90%);
      }
      .hero-vignette {
        position: absolute; inset: 0; z-index: 3; pointer-events: none;
        background: radial-gradient(ellipse 100% 80% at center, transparent 40%, rgba(11,11,13,0.85) 100%);
      }
      .hero-content {
        position: relative; z-index: 5;
        max-width: 1100px; width: 100%;
      }
      .hero-eyebrow {
        display: inline-flex; align-items: center; gap: 10px;
        font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em;
        color: var(--text-dim); text-transform: uppercase;
        margin-bottom: 32px;
        animation: fadeUp 0.9s ease 0.05s backwards;
      }
      .eyebrow-bar {
        display: inline-block; width: 28px; height: 1px; background: var(--accent);
      }
      .hero-title {
        font-family: var(--serif);
        font-size: clamp(56px, 11.5vw, 180px);
        font-weight: 700;
        line-height: 1.0;
        letter-spacing: -0.07em;
        margin: 0;
      }
      .hero-line {
        display: block;
      }
      .hero-line:nth-child(2) { color: var(--text); padding-left: clamp(20px, 6vw, 80px); }
      .hero-line:nth-child(2)::after { content: ''; }
      .hero-sub {
        max-width: 620px; margin: 36px 0 40px;
        font-size: clamp(15px, 1.4vw, 19px); color: var(--text-dim); line-height: 1.6;
        animation: fadeUp 0.9s ease 1.2s backwards;
      }
      .hero-sub em { color: var(--accent); font-style: normal; }
      .hero-actions {
        display: flex; gap: 14px; flex-wrap: wrap;
        animation: fadeUp 0.9s ease 1.4s backwards;
      }

      /* Hero corner meta */
      .hero-meta {
        position: absolute; z-index: 5; font-family: var(--mono);
        font-size: 11px; letter-spacing: 0.08em; color: var(--text-dim);
      }
      .hero-meta-tl { top: 100px; left: 32px; }
      .hero-meta-tr { top: 100px; right: 32px; text-align: right; }
      .hero-meta-bl { bottom: 32px; left: 32px; }
      .hero-meta-br { bottom: 32px; right: 32px; }
      .meta-row { display: flex; align-items: center; gap: 8px; line-height: 1.8; }
      .hero-meta-tr .meta-row { justify-content: flex-end; }
      .meta-faint { color: var(--text-mute); }
      .meta-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--accent); box-shadow: 0 0 10px var(--accent);
        animation: pulseDot 2s ease infinite;
      }
      .bounce-y { animation: bounceY 1.8s ease infinite; }

      @media (max-width: 800px) {
        .hero-meta-tl, .hero-meta-tr { display: none; }
        .hero-meta-bl, .hero-meta-br { font-size: 10px; }
      }

      /* ============ BUTTONS ============ */
      .btn {
        display: inline-flex; align-items: center; gap: 10px;
        padding: 14px 22px;
        font-family: var(--mono); font-size: 12px; letter-spacing: 0.1em;
        text-transform: uppercase; font-weight: 500;
        border: 1px solid transparent;
        transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease, transform 0.18s ease;
        position: relative; overflow: hidden;
      }
      .btn-primary {
        background: var(--accent); color: var(--bg);
        border-color: var(--accent);
      }
      .btn-primary:hover { background: var(--accent-2); border-color: var(--accent-2); }
      .btn-ghost {
        background: transparent; color: var(--text);
        border-color: var(--border-strong);
      }
      .btn-ghost:hover { border-color: var(--text); background: rgba(236,231,218,0.04); }

      /* ============ REVEAL ============ */
      .reveal {
        opacity: 0; transform: translateY(30px);
        transition: opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .reveal-in { opacity: 1; transform: translateY(0); }

      /* ============ MAGNETIC ============ */
      .magnetic {
        display: inline-flex;
        transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
        will-change: transform;
      }

      /* ============ CONTAINER / SECTIONS ============ */
      .container { max-width: 1320px; margin: 0 auto; padding: 0 32px; position: relative; z-index: 5; }
      .section { padding: 120px 0; position: relative; }
      .section-alt { background: var(--bg-2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }

      .sec-header {
        display: flex; align-items: flex-start; gap: 24px;
        margin-bottom: 64px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--border);
      }
      .sec-index {
        font-family: var(--mono); font-size: 13px;
        color: var(--accent);
        padding-top: 12px;
        min-width: 40px;
      }
      .sec-kicker {
        font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em;
        color: var(--text-mute); text-transform: uppercase; margin-bottom: 8px;
      }
      .sec-title {
        font-family: var(--serif); font-style: italic;
        font-size: clamp(32px, 4.5vw, 56px); font-weight: 500;
        margin: 0; letter-spacing: -0.05em; line-height: 1.05;
      }

      /* ============ ABOUT ============ */
      .about-grid {
        display: grid; grid-template-columns: 1.5fr 1fr; gap: 80px;
        align-items: start;
      }
      .about-lede {
        font-family: var(--sans); font-weight: 300;
        font-size: clamp(20px, 2.2vw, 28px); line-height: 1.45;
        letter-spacing: -0.015em;
        color: var(--text); margin: 0;
      }
      .about-lede + .about-lede { margin-top: 22px; }
      .about-side { display: flex; flex-direction: column; gap: 0; }
      .kv {
        display: flex; justify-content: space-between; gap: 16px;
        font-family: var(--mono); font-size: 12px; letter-spacing: 0.04em;
        padding: 14px 0; border-top: 1px solid var(--border);
      }
      .kv:last-child { border-bottom: 1px solid var(--border); }
      .kv span:first-child { color: var(--text-mute); text-transform: uppercase; }
      .kv-accent { color: var(--accent) !important; }
      .kv-stack { align-items: flex-start; }
      .kv-roles {
        display: flex; flex-direction: column; gap: 6px;
        text-align: right;
      }
      .kv-roles span { color: var(--text); }
      .kv-roles span:first-child { color: var(--accent); }
      @media (max-width: 900px) {
        .about-grid { grid-template-columns: 1fr; gap: 40px; }
      }

      /* ============ TIMELINE ============ */
      .timeline { position: relative; padding-left: 80px; }
      .timeline-spine {
        position: absolute; left: 31px; top: 8px; bottom: 8px;
        width: 1px; background: linear-gradient(to bottom, transparent, var(--border-strong), transparent);
      }
      .timeline-item {
        display: flex; gap: 32px; align-items: flex-start;
        margin-bottom: 32px; position: relative;
      }
      .timeline-node {
        position: absolute; left: -80px; top: 18px;
        width: 64px; height: 64px; border-radius: 50%;
        background: var(--bg);
        border: 1px solid var(--border-strong);
        display: flex; align-items: center; justify-content: center;
        font-family: var(--mono); font-size: 13px;
        color: var(--text-dim);
        transition: border-color 0.3s ease, color 0.3s ease, background 0.3s ease;
      }
      .reveal-in .timeline-node {
        border-color: var(--accent);
        color: var(--accent);
      }
      .timeline-card {
        flex: 1; padding: 24px 28px;
        background: var(--surface);
        border: 1px solid var(--border);
        transition: border-color 0.3s ease, transform 0.3s ease, background 0.3s ease;
      }
      .timeline-card:hover {
        border-color: var(--accent);
        transform: translateX(6px);
        background: var(--bg-2);
      }
      .timeline-card-meta {
        font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
        color: var(--text-mute); text-transform: uppercase; margin-bottom: 8px;
      }
      .timeline-card h3 {
        font-family: var(--serif); font-style: italic;
        font-size: 24px; font-weight: 400;
        margin: 0 0 8px; letter-spacing: -0.01em;
      }
      .timeline-card p { margin: 0; color: var(--text-dim); font-size: 14px; }
      @media (max-width: 700px) {
        .timeline { padding-left: 56px; }
        .timeline-spine { left: 19px; }
        .timeline-node { left: -56px; width: 40px; height: 40px; font-size: 11px; }
      }

      /* ============ VENTURES FILLER ============ */
.ventures-filler {
  background: var(--border);
  position: relative;
  overflow: hidden;
  min-height: 440px;
}
.ventures-filler-canvas {
  position: absolute;
  inset: 0;
  display: block;
}

      /* ============ VENTURES ============ */
      .ventures-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        grid-auto-rows: 1fr;
        gap: 1px;
        background: var(--border);
        border: 1px solid var(--border);
      }
      .ventures-grid > .reveal { display: flex; flex-direction: column; }
      .ventures-grid > .reveal > .venture-card { flex: 1; width: 100%; }
      .venture-card {
        position: relative; padding: 36px 32px;
        background: var(--bg);
        transition: background 0.3s ease;
        overflow: hidden;
        display: flex; flex-direction: column;
        min-height: 440px;
      }
      .venture-card:hover { background: var(--bg-2); }
      .venture-card:hover .venture-glow { opacity: 1; }
      .venture-glow {
        position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(circle at 80% 0%, var(--accent-soft), transparent 60%);
        opacity: 0; transition: opacity 0.4s ease;
      }
      .venture-top {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 24px;
      }
      .venture-icon {
        width: 38px; height: 38px;
        border: 1px solid var(--border-strong);
        display: flex; align-items: center; justify-content: center;
        color: var(--text); transition: all 0.3s ease;
      }
      .venture-card:hover .venture-icon {
        border-color: var(--accent);
        color: var(--accent);
        transform: rotate(-6deg);
      }
      .venture-status {
        font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em;
        text-transform: uppercase;
        display: inline-flex; align-items: center; gap: 6px;
        padding: 4px 8px;
        border: 1px solid var(--border-strong);
      }
      .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-mute); }
      .venture-status-live .status-dot { background: #4dd35a; box-shadow: 0 0 8px #4dd35a; animation: pulseDot 2s infinite; }
      .venture-status-live { color: #4dd35a; border-color: rgba(77,211,90,0.4); }
      .venture-status-in-progress .status-dot { background: #4dd35a; box-shadow: 0 0 8px #4dd35a; animation: pulseDot 2s infinite; }
      .venture-status-in-progress { color: #4dd35a; border-color: rgba(77,211,90,0.4); }
      .venture-status-paused { color: #f5b342; border-color: rgba(245,179,66,0.4); }
      .venture-status-paused .status-dot { background: #f5b342; }
      .venture-status-archived { color: var(--text-mute); }
      .venture-status-patent { color: #4dd35a; border-color: rgba(77,211,90,0.4); }
      .venture-status-patent .status-dot { background: #4dd35a; }
      .venture-status-published { color: #4dd35a; border-color: rgba(77,211,90,0.4); }
      .venture-status-published .status-dot { background: #4dd35a; }
      .venture-status-completed { color: #4dd35a; border-color: rgba(77,211,90,0.4); }
      .venture-status-completed .status-dot { background: #4dd35a; }

      .venture-year {
        font-family: var(--mono); font-size: 11px; color: var(--text-mute);
        letter-spacing: 0.08em; margin-bottom: 10px;
      }
      .venture-name {
        font-family: var(--serif); font-style: italic;
        font-size: 26px; font-weight: 500;
        margin: 0 0 8px; letter-spacing: -0.04em; line-height: 1.15;
        transition: color 0.3s ease;
      }
      .venture-card:hover .venture-name { color: var(--accent); }
      .venture-role {
        font-family: var(--mono); font-size: 11px;
        color: var(--text-dim); letter-spacing: 0.06em;
        margin-bottom: 18px;
      }
      .venture-divider { color: var(--text-mute); margin: 0 8px; }
      .venture-blurb {
        flex: 1; margin: 0 0 24px;
        font-size: 14px; color: var(--text-dim); line-height: 1.6;
      }
      .venture-foot {
        display: flex; justify-content: space-between; align-items: center;
        padding-top: 16px; border-top: 1px solid var(--border);
        font-family: var(--mono); font-size: 11px;
      }
      .venture-meta { color: var(--text-mute); }
      .venture-links { display: flex; gap: 14px; }
      .venture-link {
        display: inline-flex; align-items: center; gap: 4px;
        color: var(--text-dim);
        transition: color 0.2s ease;
      }
      .venture-link:hover { color: var(--accent); }

      /* ============ TODAY ============ */
      /* ===== Now / Priority queue ===== */
      .queue-meta {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1px;
        background: var(--border);
        border: 1px solid var(--border);
        margin-bottom: 32px;
      }
      .queue-meta-row {
        background: var(--bg);
        padding: 14px 18px;
        display: flex; flex-direction: column; gap: 4px;
        font-family: var(--mono); font-size: 11px;
      }
      .queue-meta-key {
        color: var(--text-mute); letter-spacing: 0.14em;
        text-transform: uppercase; font-size: 10px;
      }
      .queue-meta-val { color: var(--text); }
      .queue-blink {
        color: var(--accent);
        animation: queueBlink 6s ease infinite;
      }
      @keyframes queueBlink {
        0%, 60% { opacity: 1; }
        70% { opacity: 0.35; }
        80% { opacity: 1; }
      }

      .queue-list {
        display: flex; flex-direction: column;
        border: 1px solid var(--border);
      }
      .queue-row {
        position: relative;
        background: var(--bg);
        border: none;
        border-bottom: 1px solid var(--border);
        padding: 22px 28px;
        text-align: left;
        font: inherit; color: inherit;
        cursor: pointer;
        transition: background 0.25s ease, padding-left 0.25s ease;
        display: flex; flex-direction: column;
        overflow: hidden;
        outline: none;
      }
      .queue-row:last-child { border-bottom: none; }
      .queue-row::before {
        content: '';
        position: absolute; left: 0; top: 0; bottom: 0;
        width: 2px; background: var(--accent);
        transform: scaleY(0); transform-origin: top;
        transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .queue-row:hover { background: var(--bg-2); padding-left: 36px; }
      .queue-row:hover::before { transform: scaleY(1); }
      .queue-active::before { transform: scaleY(1); }
      .queue-active { padding-left: 36px; }

      .queue-row-head {
        display: grid;
        grid-template-columns: 130px 1fr auto 28px;
        align-items: center;
        gap: 24px;
      }
      .queue-row-id {
        font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em;
        color: var(--text-mute);
      }
      .queue-active .queue-row-id { color: var(--accent); }
      .queue-bracket { color: var(--text-mute); margin: 0 2px; }
      .queue-active .queue-bracket { color: var(--accent); }

      .queue-row-title {
        font-family: var(--serif); font-style: italic;
        font-size: clamp(20px, 2vw, 26px); font-weight: 500;
        letter-spacing: -0.04em; line-height: 1.1;
        color: var(--text);
        display: inline-flex; align-items: center; gap: 8px;
      }
      .queue-active .queue-row-title { color: var(--text); }
      .queue-row:hover .queue-row-title { color: var(--accent); }

      .queue-cursor {
        display: inline-block;
        width: 2px; height: 0.85em;
        background: var(--accent);
        animation: queueCursor 1s steps(2) infinite;
      }
      @keyframes queueCursor {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }

      .queue-row-status {
        display: inline-flex; align-items: center; gap: 8px;
        font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
        padding: 4px 10px;
        border: 1px solid var(--border-strong);
        color: var(--text-mute);
      }
      .queue-status-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--text-mute);
      }
      .status-running {
        color: #4dd35a; border-color: rgba(77,211,90,0.4);
      }
      .status-running .queue-status-dot {
        background: #4dd35a; box-shadow: 0 0 8px #4dd35a;
        animation: queueBlink 2s infinite;
      }
      .status-queued {
        color: #f5b342; border-color: rgba(245,179,66,0.4);
      }
      .status-queued .queue-status-dot { background: #f5b342; }

      .queue-row-toggle {
        position: relative;
        width: 16px; height: 16px;
        opacity: 0.7;
        transition: opacity 0.25s ease, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .queue-row:hover .queue-row-toggle { opacity: 1; }
      .toggle-line {
        position: absolute;
        background: var(--text);
        transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease;
      }
      .toggle-h {
        top: 50%; left: 0; right: 0; height: 1px;
        transform: translateY(-50%);
      }
      .toggle-v {
        top: 0; bottom: 0; left: 50%; width: 1px;
        transform: translateX(-50%);
      }
      .queue-open .toggle-v { transform: translateX(-50%) scaleY(0); }
      .queue-open .queue-row-toggle { transform: rotate(180deg); }

      .queue-row-tagline {
        font-family: var(--sans); font-weight: 300;
        color: var(--text-dim); font-size: 14px; line-height: 1.55;
        margin: 14px 0 0;
        padding-left: 154px; /* aligns under title column */
      }

      .queue-row-expand {
        display: grid; grid-template-rows: 0fr;
        transition: grid-template-rows 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
                    margin-top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        margin-top: 0;
      }
      .queue-open .queue-row-expand {
        grid-template-rows: 1fr;
        margin-top: 18px;
      }
      .queue-expand-inner {
        overflow: hidden;
        padding-left: 154px;
        display: flex; flex-direction: column; gap: 14px;
      }
      .queue-expand-detail {
        font-size: 14px; color: var(--text-dim); line-height: 1.6;
      }
      .queue-expand-cmd {
        font-family: var(--mono); font-size: 12px;
        color: var(--text);
        background: rgba(255,87,34,0.05);
        border-left: 2px solid var(--accent);
        padding: 10px 14px;
        letter-spacing: 0.02em;
      }
      .queue-prompt {
        color: var(--accent); font-weight: 600; margin-right: 6px;
      }

      @media (max-width: 720px) {
        .queue-row { padding: 18px 18px; }
        .queue-row:hover, .queue-active { padding-left: 24px; }
        .queue-row-head {
          grid-template-columns: 1fr auto;
          grid-template-rows: auto auto;
          gap: 8px 16px;
        }
        .queue-row-id {
          grid-column: 1 / -1; order: -1;
        }
        .queue-row-toggle { display: none; }
        .queue-row-tagline { padding-left: 0; font-size: 13px; }
        .queue-expand-inner { padding-left: 0; }
      }

      /* ============ FUTURE ============ */
      .future-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
        grid-auto-rows: 1fr;
        gap: 24px;
      }
      .future-grid > .reveal { display: flex; flex-direction: column; }
      .future-grid > .reveal > .future-card { flex: 1; width: 100%; }
      .future-card {
        position: relative; padding: 48px 40px;
        border: 1px solid var(--border);
        background: var(--surface);
        transition: border-color 0.3s ease, transform 0.4s ease, background 0.3s ease;
        display: flex; flex-direction: column;
      }
      .future-card:hover {
        border-color: var(--accent);
        background: var(--bg-2);
      }
      .future-corner {
        position: absolute; width: 14px; height: 14px;
        border-color: var(--accent); border-style: solid; border-width: 0;
        opacity: 0; transition: opacity 0.3s ease;
      }
      .future-corner-tl { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
      .future-corner-tr { top: -1px; right: -1px; border-top-width: 1px; border-right-width: 1px; }
      .future-corner-bl { bottom: -1px; left: -1px; border-bottom-width: 1px; border-left-width: 1px; }
      .future-corner-br { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; }
      .future-card:hover .future-corner { opacity: 1; }
      .future-icon {
        width: 48px; height: 48px;
        border: 1px solid var(--border-strong);
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 24px; color: var(--accent);
        transition: transform 0.4s ease;
      }
      .future-card:hover .future-icon { transform: rotate(-8deg) scale(1.05); border-color: var(--accent); }
      .future-kind {
        font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
        text-transform: uppercase; color: var(--text-mute); margin-bottom: 12px;
      }
      .future-title {
        font-family: var(--serif); font-style: italic;
        font-size: 30px; font-weight: 500; line-height: 1.15;
        margin: 0 0 20px; letter-spacing: -0.04em;
      }
      .future-desc, .future-tagline {
        color: var(--text-dim); font-size: 14px; line-height: 1.65; margin: 0;
      }
      .future-tagline {
        font-family: var(--serif); font-style: italic;
        font-size: clamp(20px, 1.8vw, 24px); line-height: 1.35;
        color: var(--text); margin: 0 0 28px;
      }
      .future-pillars { display: flex; flex-direction: column; }
      .pillar {
        display: grid; grid-template-columns: 130px 1fr; gap: 20px;
        padding: 14px 0;
        border-top: 1px solid var(--border);
        transition: padding-left 0.25s ease, border-color 0.25s ease;
      }
      .pillar:last-child { border-bottom: 1px solid var(--border); }
      .pillar-k {
        font-family: var(--mono); font-size: 11px;
        letter-spacing: 0.06em; color: var(--accent);
        text-transform: uppercase;
      }
      .pillar-v {
        font-size: 14px; color: var(--text-dim); line-height: 1.5;
      }
      .future-card:hover .pillar { padding-left: 8px; border-color: var(--border-strong); }
      @media (max-width: 600px) {
        .pillar { grid-template-columns: 1fr; gap: 4px; }
      }

      /* ============ CONTACT ============ */
      .contact-grid {
        display: grid; grid-template-columns: 1fr 1.4fr; gap: 64px;
        align-items: start;
      }
      .contact-side .contact-lede {
        font-family: var(--serif); font-style: italic;
        font-size: clamp(22px, 2.4vw, 30px); line-height: 1.35;
        margin: 0 0 40px; color: var(--text);
      }
      .contact-meta { display: flex; flex-direction: column; }
      .contact-meta-row {
        display: flex; justify-content: space-between; gap: 16px;
        font-family: var(--mono); font-size: 12px;
        padding: 14px 0; border-top: 1px solid var(--border);
      }
      .contact-meta-row:last-child { border-bottom: 1px solid var(--border); }
      .meta-label { color: var(--text-mute); text-transform: uppercase; letter-spacing: 0.08em; }
      .meta-accent { color: var(--accent); }

      .form-wrap { position: relative; }

      .form-inner {
        padding: 44px 44px 36px;
        background: var(--surface);
        border: 1px solid var(--border);
        display: flex; flex-direction: column; gap: 28px;
        position: relative;
        overflow: hidden;
      }
      .form-inner::before {
        content: ''; position: absolute; left: 0; top: 0;
        width: 2px; height: 100%; background: var(--accent);
        transform: scaleY(0); transform-origin: top;
        transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s;
      }
      .reveal-in .form-inner::before { transform: scaleY(1); }

      .form-row { display: flex; gap: 28px; }
      .form-row-double > .field { flex: 1; min-width: 0; }
      .field { display: flex; flex-direction: column; gap: 10px; position: relative; }
      .field label {
        display: flex; align-items: baseline; gap: 10px;
        font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em;
        color: var(--text); text-transform: uppercase;
      }
      .field-num {
        color: var(--accent);
        font-weight: 500;
      }
      .field-optional {
        margin-left: auto;
        color: var(--text-mute);
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: lowercase;
        font-style: italic;
      }
      .field input, .field textarea {
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--border-strong);
        padding: 8px 0 12px;
        color: var(--text);
        font-family: var(--sans);
        font-size: 16px;
        outline: none;
        resize: vertical;
        width: 100%;
      }
      .field textarea {
        min-height: 110px;
        line-height: 1.5;
      }
      /* Animated focus underline */
      .field { padding-bottom: 1px; }
      .field::after {
        content: '';
        position: absolute; left: 0; bottom: 0;
        width: 100%; height: 1px;
        background: var(--accent);
        transform: scaleX(0); transform-origin: left;
        transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        pointer-events: none;
      }
      .field:focus-within::after { transform: scaleX(1); }
      .field input:disabled, .field textarea:disabled { opacity: 0.5; }

      .turnstile-mount { }

      .form-msg {
        display: flex; align-items: center; gap: 10px;
        font-family: var(--mono); font-size: 12px;
        padding: 12px 16px;
        animation: fadeUp 0.4s ease;
      }
      .form-msg-error { color: #ff6f4a; background: rgba(255, 87, 34, 0.06); border-left: 2px solid var(--accent); }
      .form-msg-success { color: #4dd35a; background: rgba(77, 211, 90, 0.06); border-left: 2px solid #4dd35a; }

      .btn-submit { align-self: flex-start; margin-top: 4px; }
      .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

      @media (max-width: 900px) {
        .contact-grid { grid-template-columns: 1fr; gap: 40px; }
        .form-row { flex-direction: column; gap: 28px; }
        .form-inner { padding: 32px 24px 28px; }
      }

      /* ============ FOOTER ============ */
      .footer { padding: 28px 0 32px; border-top: 1px solid var(--border); }
      .footer-inner {
        display: flex; justify-content: space-between; align-items: flex-end;
        gap: 32px; flex-wrap: wrap;
      }
      .footer-name {
        font-family: var(--serif); font-style: italic; font-size: 30px;
        font-weight: 500; letter-spacing: -0.05em;
      }
      .footer-meta { font-family: var(--mono); font-size: 11px; color: var(--text-mute); margin-top: 4px; }
      .footer-links { display: flex; gap: 24px; }
      .footer-link {
        display: inline-flex; align-items: center; gap: 6px;
        font-family: var(--mono); font-size: 12px;
        color: var(--text-dim); transition: color 0.2s ease;
      }
      .footer-link:hover { color: var(--accent); }

      /* ============ KEYFRAMES ============ */
      @keyframes pulseDot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      @keyframes bounceY {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(4px); }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Disable parallax cursor on touch */
      @media (hover: none) {
        .magnetic { transform: none !important; }
      }
    `}</style>
  );
}

// ============================================================================
// APP
// ============================================================================
export default function App() {
  // Smooth scroll for anchor links
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <>
      <Styles />
      <CustomCursor />
      <Nav />
      <main>
        <Hero />
        <About />
        <Ventures />
        <Today />
        <Future />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
