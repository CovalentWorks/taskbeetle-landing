"use client";

import { useEffect, useRef, useState } from "react";

// Defaults to the production API so the deployed site works without env config; override with
// NEXT_PUBLIC_API_BASE_URL for local dev (e.g. http://localhost:8081/taskbeetle-api).
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.taskbeetle.com/taskbeetle-api";

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Page() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // The one place the waitlist POST happens — shared by the hero box and the full form below.
  async function submitJoin(email: string, metadata: Record<string, string>): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, metadata }),
      });
      if (!res.ok) throw new Error(`waitlist responded ${res.status}`);
      setSubmitted(true);
      return true;
    } catch {
      setError("Something went wrong. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleWaitSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "").trim();
    if (!isEmail(email)) {
      emailRef.current?.focus();
      if (emailRef.current) emailRef.current.style.borderColor = "#0BA77E";
      return;
    }
    await submitJoin(email, {
      role: String(data.get("role") || ""),
      location: String(data.get("location") || ""),
      work: String(data.get("work") || ""),
      source: "waitlist-landing",
    });
  }

  // Hero email box: a real join. On success, drop the user at the #join section so they see the
  // confirmation (the full form there flips to the "You are on the list" state).
  async function handleHeroSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.querySelector<HTMLInputElement>('input[type="email"]');
    const email = (input?.value ?? "").trim();
    if (!isEmail(email)) {
      input?.focus();
      if (input) input.style.borderColor = "#0BA77E";
      return;
    }
    const ok = await submitJoin(email, { source: "hero" });
    if (ok) document.getElementById("join")?.scrollIntoView({ behavior: "smooth" });
  }

  // Scroll-reveal, count-up stats, and the rotating live-bid card — ported verbatim from the original
  // landing page's vanilla script, run once on mount and cleaned up on unmount.
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observers: IntersectionObserver[] = [];
    const timers: number[] = [];

    const revs = document.querySelectorAll<HTMLElement>(".reveal");
    if (reduce) {
      revs.forEach((el) => el.classList.add("in"));
    } else {
      const ro = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              ro.unobserve(en.target);
            }
          });
        },
        { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
      );
      revs.forEach((el) => ro.observe(el));
      observers.push(ro);
    }

    const counted = document.querySelectorAll<HTMLElement>("[data-count]");
    function runCount(el: HTMLElement) {
      const target = +(el.getAttribute("data-count") || "0");
      const suffix = el.getAttribute("data-suffix") || "";
      const prefix = el.getAttribute("data-prefix") || "";
      const dec = +(el.getAttribute("data-dec") || 0);
      const fmt = (v: number) => prefix + (dec ? v.toFixed(dec) : Math.round(v)) + suffix;
      if (reduce) {
        el.textContent = fmt(target);
        return;
      }
      let start: number | null = null;
      const dur = 1200;
      function step(ts: number) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        el.textContent = fmt((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmt(target);
      }
      requestAnimationFrame(step);
    }
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            runCount(en.target as HTMLElement);
            co.unobserve(en.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counted.forEach((el) => co.observe(el));
    observers.push(co);

    // rotating live-bid signature across service types
    const tasks = [
      {
        task: "Home deep cleaning",
        budget: "Budget set by poster, NGN 15,000 max",
        bids: [
          { name: "Ada O.", amt: "NGN 12,000", rate: "4.9", col: "#11D6A0" },
          { name: "Blessing K.", amt: "NGN 10,500", rate: "4.8", col: "#9CD7FF" },
          { name: "Chidi N.", amt: "NGN 9,500", rate: "5.0", col: "#F4B53F" },
        ],
      },
      {
        task: "Lawn mowing and cleanup",
        budget: "Budget set by poster, NGN 8,000 max",
        bids: [
          { name: "Emeka A.", amt: "NGN 6,800", rate: "4.7", col: "#11D6A0" },
          { name: "Femi B.", amt: "NGN 6,000", rate: "4.9", col: "#FFB3A7" },
          { name: "Grace U.", amt: "NGN 5,500", rate: "4.8", col: "#9CD7FF" },
        ],
      },
      {
        task: "Car wash at home",
        budget: "Budget set by poster, NGN 5,000 max",
        bids: [
          { name: "Ibrahim S.", amt: "NGN 4,000", rate: "4.8", col: "#F4B53F" },
          { name: "John D.", amt: "NGN 3,500", rate: "5.0", col: "#11D6A0" },
        ],
      },
      {
        task: "Massage at home",
        budget: "Budget set by poster, NGN 12,000 max",
        bids: [
          { name: "Kemi L.", amt: "NGN 10,000", rate: "5.0", col: "#9CD7FF" },
          { name: "Lola M.", amt: "NGN 9,000", rate: "4.9", col: "#11D6A0" },
        ],
      },
      {
        task: "Logo and brand design",
        budget: "Budget set by poster, NGN 40,000 max",
        bids: [
          { name: "Ngozi E.", amt: "NGN 32,000", rate: "4.9", col: "#11D6A0" },
          { name: "Obi R.", amt: "NGN 28,000", rate: "4.8", col: "#F4B53F" },
          { name: "Tunde A.", amt: "NGN 24,000", rate: "5.0", col: "#9CD7FF" },
        ],
      },
    ];
    const list = document.getElementById("bidlist");
    const taskEl = document.getElementById("bidtask");
    const budgetEl = document.getElementById("bidbudget");
    const star = () =>
      '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 6.9H22l-6 4.5 2.3 7L12 16l-6.3 4.4 2.3-7-6-4.5h7.6z" fill="currentColor"/></svg>';
    function render(ti: number, n: number) {
      const t = tasks[ti];
      if (!list || !taskEl || !budgetEl) return;
      taskEl.textContent = t.task;
      budgetEl.textContent = t.budget;
      list.innerHTML = "";
      if (n === 0) {
        const w = document.createElement("div");
        w.className = "bid wait";
        w.textContent = "Waiting for bids";
        list.appendChild(w);
        return;
      }
      for (let i = 0; i < n; i++) {
        const b = t.bids[i];
        const best = n === t.bids.length && i === n - 1;
        const row = document.createElement("div");
        row.className = "bid" + (best ? " best" : "");
        row.style.animationDelay = i * 0.04 + "s";
        row.innerHTML =
          '<div class="ava" style="background:' +
          b.col +
          '">' +
          b.name.charAt(0) +
          "</div>" +
          '<div class="bid-meta"><div class="bid-name">' +
          b.name +
          "</div>" +
          '<div class="bid-rate">' +
          star() +
          b.rate +
          " rating</div></div>" +
          (best
            ? '<div style="text-align:right"><div class="bid-amt">' +
              b.amt +
              '</div><div class="bid-pick">Best value</div></div>'
            : '<div class="bid-amt">' + b.amt + "</div>");
        list.appendChild(row);
      }
    }
    if (reduce) {
      render(0, tasks[0].bids.length);
    } else {
      let ti = 0;
      let n = 0;
      let started = false;
      const card = document.getElementById("bidcard");
      function run() {
        n++;
        render(ti, n);
        if (n < tasks[ti].bids.length) {
          timers.push(window.setTimeout(run, 1000));
        } else {
          timers.push(
            window.setTimeout(() => {
              ti = (ti + 1) % tasks.length;
              n = 0;
              render(ti, 0);
              timers.push(window.setTimeout(run, 750));
            }, 2600)
          );
        }
      }
      const bo = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting && !started) {
              started = true;
              ti = 0;
              n = 0;
              render(0, 0);
              timers.push(window.setTimeout(run, 600));
              bo.unobserve(en.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      if (card) bo.observe(card);
      observers.push(bo);
    }

    return () => {
      observers.forEach((o) => o.disconnect());
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <>
      <nav className="nav">
        <div className="wrap nav-in">
          <div className="brand">
            <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M24 4c-2.6 0-4.8 1.7-5.6 4.1C15.6 6.7 12 8 12 8" stroke="#0BA77E" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M24 4c2.6 0 4.8 1.7 5.6 4.1C32.4 6.7 36 8 36 8" stroke="#0BA77E" strokeWidth="2.4" strokeLinecap="round" />
              <ellipse cx="24" cy="26" rx="12" ry="16" fill="#0BA77E" />
              <path d="M24 12v28" stroke="#0E2E25" strokeWidth="2.2" />
              <path d="M12 22c-4 0-7-2-7-2M36 22c4 0 7-2 7-2M12 30c-4 1-7 4-7 4M36 30c4 1 7 4 7 4M13 38c-3 1-5 4-5 4M35 38c3 1 5 4 5 4" stroke="#0E2E25" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="19.5" cy="20" r="1.7" fill="#0E2E25" />
              <circle cx="28.5" cy="20" r="1.7" fill="#0E2E25" />
            </svg>
            TaskBeetle
          </div>
          <a href="#join" className="btn">Get early access</a>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <p className="eyebrow reveal">Home services, on demand</p>
          <h1 className="reveal d1">
            The gig economy,<br />
            <span className="em">flipped.</span>
          </h1>
          <p className="hero-sub reveal d2">
            Post a job, from home cleaning to lawn care to a logo design. Skilled and semi-skilled workers bid to win it. You
            pick the best, and your money stays safe in the Shell until the work is done right.
          </p>
          <div className="hero-lower">
            <div className="hero-lower-l">
              <form className="hero-form reveal d3" onSubmit={handleHeroSubmit}>
                <input className="field" type="email" name="email" placeholder="Enter your email" aria-label="Email" required />
                <button className="btn" type="submit" disabled={loading}>Get early access</button>
              </form>
              <p className="hero-note reveal d3">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l2.4 6.9H22l-6 4.5 2.3 7L12 16l-6.3 4.4 2.3-7-6-4.5h7.6z" fill="currentColor" />
                </svg>
                Built for Africa&apos;s next generation of workers.
              </p>

              <div className="bidcard reveal d3" id="bidcard">
                <div className="bidcard-top">
                  <div>
                    <div className="bidcard-task" id="bidtask">Home deep cleaning</div>
                    <div className="bidcard-budget" id="bidbudget">Budget set by poster, NGN 15,000 max</div>
                  </div>
                  <span className="live"><span className="dot"></span>Bidding live</span>
                </div>
                <div className="bidlist" id="bidlist"></div>
              </div>
            </div>

            <div className="hero-art reveal d3" aria-hidden="true">
              <svg viewBox="0 0 360 360" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="tbShell" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#11D6A0" />
                    <stop offset="1" stopColor="#089A78" />
                  </linearGradient>
                </defs>
                <circle cx="184" cy="182" r="150" fill="#0BA77E" opacity="0.07" />
                <circle cx="184" cy="182" r="150" fill="none" stroke="#0BA77E" strokeOpacity="0.16" strokeWidth="2" strokeDasharray="3 11" />
                <g fill="#F4B53F">
                  <circle cx="300" cy="120" r="6" />
                  <circle cx="78" cy="252" r="5" />
                  <circle cx="308" cy="250" r="4" />
                </g>
                <path d="M70 96 l3.6 9 9 3.6 -9 3.6 -3.6 9 -3.6 -9 -9 -3.6 9 -3.6z" fill="#F4B53F" />
                <g transform="rotate(-7 184 190)">
                  <g stroke="#0E2E25" strokeWidth="7" strokeLinecap="round">
                    <path d="M126 150 C108 142 96 142 86 150" />
                    <path d="M120 190 C100 190 88 192 78 200" />
                    <path d="M126 230 C108 238 96 244 88 256" />
                    <path d="M242 150 C260 142 272 142 282 150" />
                    <path d="M248 190 C268 190 280 192 290 200" />
                    <path d="M242 230 C260 238 272 244 280 256" />
                  </g>
                  <g stroke="#0BA77E" strokeWidth="7" strokeLinecap="round">
                    <path d="M166 96 C158 78 152 70 142 66" />
                    <path d="M198 96 C206 78 212 70 222 66" />
                  </g>
                  <circle cx="140" cy="64" r="6" fill="#F4B53F" />
                  <circle cx="224" cy="64" r="6" fill="#F4B53F" />
                  <ellipse cx="184" cy="104" rx="30" ry="24" fill="#0E2E25" />
                  <ellipse cx="184" cy="196" rx="78" ry="94" fill="url(#tbShell)" />
                  <line x1="184" y1="110" x2="184" y2="286" stroke="#0E2E25" strokeWidth="7" />
                  <path d="M144 142 C124 180 130 240 150 268" stroke="#8BF5D8" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
                  <circle cx="175" cy="100" r="4.5" fill="#EAF7F1" />
                  <circle cx="193" cy="100" r="4.5" fill="#EAF7F1" />
                  <circle cx="212" cy="172" r="7" fill="#0E2E25" opacity="0.16" />
                  <circle cx="204" cy="222" r="6" fill="#0E2E25" opacity="0.16" />
                </g>
                <g transform="translate(74 140)">
                  <circle r="25" fill="#0E2E25" />
                  <text x="0" y="9" textAnchor="middle" fontFamily="Familjen Grotesk, sans-serif" fontWeight="700" fontSize="25" fill="#11D6A0">₦</text>
                </g>
                <g transform="translate(300 168)">
                  <rect x="-25" y="-25" width="50" height="50" rx="15" fill="#fff" />
                  <path d="M-11 1 L-2 10 L13 -9" stroke="#0BA77E" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </header>

      <section className="mist">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow reveal">What we cover</p>
            <h2 className="reveal d1">All the help your home needs.</h2>
            <p className="reveal d2">From everyday chores to skilled digital work. Post it, and the right people come to you.</p>
          </div>
          <div className="cats">
            <div className="cat reveal">
              <div className="cat-ico">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l2-7h10l2 7M5 13h14M5 13v5a1 1 0 001 1h12a1 1 0 001-1v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Home cleaning</h3>
              <p>Deep cleans, tidy-ups, move-outs</p>
            </div>
            <div className="cat reveal d1">
              <div className="cat-ico">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 22V11M12 11c0-3-2-5-5-5M12 11c0-4 2-6 6-6M7 13c-2 0-4-1-4-1M17 14c2 0 4-1 4-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Lawn care</h3>
              <p>Mowing, trimming, cleanup</p>
            </div>
            <div className="cat reveal d2">
              <div className="cat-ico">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l1.5-4.5A2 2 0 018.4 7h7.2a2 2 0 011.9 1.5L19 13M5 13h14v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Car wash</h3>
              <p>Washed and detailed at home</p>
            </div>
            <div className="cat reveal d1">
              <div className="cat-ico">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 12a3 3 0 100-6 3 3 0 000 6zM4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Home massage</h3>
              <p>Therapists who come to you</p>
            </div>
            <div className="cat reveal d2">
              <div className="cat-ico">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Digital and design</h3>
              <p>Logos, sites, skilled work</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow reveal">How it works</p>
            <h2 className="reveal d1">Three steps, no chasing.</h2>
            <p className="reveal d2">You stop hunting for the right person. The right people come to you, and compete to do the job well.</p>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="step-n">1</div>
              <h3>Post your job</h3>
              <p>Describe what you need and set your budget. It takes about a minute to get started.</p>
            </div>
            <div className="step reveal d1">
              <div className="step-n">2</div>
              <h3>Workers bid to win</h3>
              <p>Skilled and semi-skilled people compete for your job with real bids and ratings. You see who is best, not just who is cheapest.</p>
            </div>
            <div className="step reveal d2">
              <div className="step-n">3</div>
              <h3>Pay through the Shell</h3>
              <p>Your money is held safely in escrow and released only when you approve the finished work. No one is left exposed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dark">
        <div className="wrap">
          <div className="shell-grid">
            <div className="shell-art reveal">
              <svg viewBox="0 0 240 240" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#11D6A0" />
                    <stop offset="1" stopColor="#089A78" />
                  </linearGradient>
                </defs>
                <ellipse cx="120" cy="124" rx="86" ry="92" fill="#143b30" stroke="url(#sg)" strokeWidth="3" />
                <path d="M120 32v184" stroke="url(#sg)" strokeWidth="3" opacity=".45" />
                <path d="M120 60c34 0 62 28 62 64M120 60c-34 0-62 28-62 64" stroke="url(#sg)" strokeWidth="2.4" opacity=".32" />
                <g transform="translate(120 124)">
                  <circle r="40" fill="url(#sg)" />
                  <text x="0" y="9" textAnchor="middle" fontFamily="Familjen Grotesk" fontWeight="700" fontSize="22" fill="#0E2E25">NGN</text>
                </g>
              </svg>
            </div>
            <div className="shell-copy reveal d1">
              <p className="eyebrow">The Shell</p>
              <h2>Money that is protected, not promised.</h2>
              <p>Every payment locks into the Shell, our escrow, the moment a job is funded. The worker knows it is secured, so they start with confidence. You release it only when the work is right.</p>
              <ul className="shell-points">
                <li>{CHECK}Funds held the instant a job starts</li>
                <li>{CHECK}Released only when you approve</li>
                <li>{CHECK}No one paid for work they did not get</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mist">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow reveal">Why now</p>
            <h2 className="reveal d1">We are building for the world&apos;s next workforce.</h2>
            <p className="reveal d2">The talent is already here, the largest and youngest pool of workers on earth, skilled and semi-skilled alike. The work just is not reaching it yet.</p>
          </div>

          <div className="stats-banner reveal">
            <div className="q">By 2040, Africa&apos;s working-age population will be the largest on earth, bigger than India and China combined.</div>
            <div className="src">Source: ISS African Futures</div>
          </div>

          <div className="statgrid">
            <div className="stat reveal">
              <div className="stat-num"><span data-count="85" data-suffix="%">0%</span></div>
              <div className="stat-lab">of the world&apos;s workforce growth through 2050 will come from Africa.</div>
              <div className="stat-src">OECD</div>
            </div>
            <div className="stat reveal d1">
              <div className="stat-num">1 in 3</div>
              <div className="stat-lab">young people on earth will be African by 2050.</div>
              <div className="stat-src">UN ECA</div>
            </div>
            <div className="stat reveal d2">
              <div className="stat-num"><span data-count="18">0</span></div>
              <div className="stat-lab">is the median age in Sub-Saharan Africa today.</div>
              <div className="stat-src">World Bank</div>
            </div>
          </div>

          <p className="mission reveal">
            A whole generation is ready to work, from cleaners and gardeners to designers and developers. TaskBeetle exists to
            put that work in their hands, and <span className="em">build the gig economy that generation deserves.</span>
          </p>

          <div className="sec-head" style={{ marginTop: "62px" }}>
            <h2 className="reveal">The whole world is going freelance. Nigeria already has.</h2>
          </div>
          <div className="statgrid statgrid-4">
            <div className="stat reveal">
              <div className="stat-num"><span data-count="674" data-prefix="$" data-suffix="bn">$0bn</span></div>
              <div className="stat-lab">The global gig economy in 2026, on the way to $2.2 trillion.</div>
              <div className="stat-src">Market reports, 2026</div>
            </div>
            <div className="stat reveal d1">
              <div className="stat-num"><span data-count="92" data-suffix="%">0%</span></div>
              <div className="stat-lab">Of Nigeria&apos;s workforce already earns informally and independently.</div>
              <div className="stat-src">NBS, 2024</div>
            </div>
            <div className="stat reveal d2">
              <div className="stat-num"><span data-count="1.57" data-dec="2" data-suffix="bn">0bn</span></div>
              <div className="stat-lab">Freelancers worldwide, nearly half the planet&apos;s workforce.</div>
              <div className="stat-src">Industry estimates, 2025</div>
            </div>
            <div className="stat reveal d3">
              <div className="stat-num"><span data-count="70" data-suffix="%">0%</span></div>
              <div className="stat-lab">Up to 70% of freelancers have been paid late or stiffed. The Shell ends that.</div>
              <div className="stat-src">Payment research, 2025</div>
            </div>
          </div>
          <p className="mission reveal">TaskBeetle just makes the way Nigeria already works <span className="em">safe and fair.</span></p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow reveal">Two sides, one marketplace</p>
            <h2 className="reveal d1">Whichever side you are on.</h2>
          </div>
          <div className="duo">
            <div className="side side-a reveal">
              <h3>Got a job? Post it.</h3>
              <p>Describe the task, set a budget, and let the right workers come to you.</p>
              <ul>
                <li>{CHECK}Competing bids, in your favour</li>
                <li>{CHECK}Pick on quality, not just price</li>
                <li>{CHECK}Pay only when it is done right</li>
              </ul>
            </div>
            <div className="side side-b reveal d1">
              <h3>Got skills? Win work.</h3>
              <p>Whether you clean homes, mow lawns, wash cars, or design brands, bid on real jobs and get paid when you deliver.</p>
              <ul>
                <li>{CHECK}Real jobs, real budgets</li>
                <li>{CHECK}Your ratings work for you</li>
                <li>{CHECK}Paid from the Shell, on time</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="cta" id="join">
        <div className="wrap">
          {!submitted ? (
            <div id="waitWrap">
              <p className="eyebrow reveal">Be first</p>
              <h2 className="reveal">Get early access.</h2>
              <p className="reveal d1">
                We open in Lagos first. Tell us how you will use TaskBeetle and we will bring you in early, whether you are
                getting tasks done or getting paid to do them.
              </p>
              <form className="wait-form reveal d2" id="waitForm" onSubmit={handleWaitSubmit}>
                <select className="field" id="wRole" name="role" aria-label="I want to" defaultValue="">
                  <option value="">I want to...</option>
                  <option>Get tasks done</option>
                  <option>Earn as a pro</option>
                  <option>Both</option>
                </select>
                <input ref={emailRef} className="field" type="email" id="wEmail" name="email" placeholder="Email" aria-label="Email" required />
                <input className="field" type="text" id="wLoc" name="location" placeholder="Where are you? e.g. Lekki, Lagos" aria-label="Where are you" />
                <input className="field" type="text" id="wWork" name="work" placeholder="What kind of work? e.g. cleaning, design, errands" aria-label="What kind of work" />
                <button className="btn" type="submit" disabled={loading}>Get early access</button>
              </form>
              <p className="cta-note reveal d2">{error ?? "We will only use this to reach you about the launch."}</p>
            </div>
          ) : (
            <div className="cta-done" id="waitDone">
              <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
                <path d="M50 14 C28 22 20 40 22 64 C24 84 38 92 50 92 C62 92 76 84 78 64 C80 40 72 22 50 14 Z" fill="none" stroke="#11D6A0" strokeWidth="7" />
                <path d="M39 53 L47 62 L63 43" stroke="#11D6A0" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3>You are on the list.</h3>
              <p>We will reach out before TaskBeetle opens in Lagos.</p>
            </div>
          )}
        </div>
      </section>

      <footer>
        <div className="wrap foot-in">
          <div className="foot-col">
            <div className="foot-brand">
              <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <ellipse cx="24" cy="26" rx="12" ry="16" fill="#0BA77E" />
                <path d="M24 12v28" stroke="#0E2E25" strokeWidth="2.2" />
                <path d="M12 22c-4 0-7-2-7-2M36 22c4 0 7-2 7-2M12 30c-4 1-7 4-7 4M36 30c4 1 7 4 7 4M13 38c-3 1-5 4-5 4M35 38c3 1 5 4 5 4" stroke="#0E2E25" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M24 10c-2-3-6-2-6-2M24 10c2-3 6-2 6-2" stroke="#0BA77E" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              TaskBeetle
            </div>
            <p className="foot-def">task·beetle &nbsp;·&nbsp; small, tireless, armoured. It gets the job done, and makes sure everyone gets paid.</p>
            <p className="foot-mission">The gig economy of the future, built for Africa.</p>
          </div>
          <div className="foot-col foot-col-r">
            <div className="foot-links">
              <a href="#join">Early access</a>
              <a href="#">How it works</a>
              <a href="#">The Shell</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
            <p className="foot-copy">2026 TaskBeetle</p>
          </div>
        </div>
      </footer>
    </>
  );
}
