import { useState, useEffect, useMemo } from "react";
import "./App.css";

const WHATSAPP = "2349017842279";
const INSTAGRAM_URL = "https://www.instagram.com/itg_nails_26";
const TIKTOK_URL = "https://www.tiktok.com/@itg_nails";
const LOGO = "/gallery/itglogo.jpg";

// Published Google Sheet (prices). Isha edits the sheet and the site follows.
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQjL7kxSzgpOw2OGUOrMn3iuO70-gGIVaQ5sTK3fC9PW3ks2gZDM6tEYA3djVgFQpRt_-SEvVYK3hL9/pub?gid=0&single=true&output=csv";

// Studio account details for deposits (shown in the "Pay deposit to" card).
const BANK = { bank: "Moniepoint", number: "5008646691", name: "Aishat Bukola" };

// Photos in public/gallery. To add a photo, put it in that folder
// and add its exact file name to this list.
const PHOTO_FILES = [
  "itg_nails1.jpg",
  "itg_nails2.jpg",
  "itg_nails3.jpg",
  "itg_nails4.jpg",
  "itg_nails5.jpg",
  "itg-nails6.jpg",
  "itg_nails7.jpg",
  "itg-nails8.jpg",
  "itg-nails9.jpg",
  "itg-nails10.jpg",
  "itg-nails11.jpg",
  "itg-nails12.jpg",
  "itg-nails13.jpg",
  "itg-nails14.jpg",
  "itg-nails15.jpg",
  "itg-nails16.jpg",
  "itg-nails17.jpg",
  "itg-nails18.jpg",
  "itg-nails19.jpg",
];
const gallery = PHOTO_FILES.map((f) => `/gallery/${f}`);
const PREVIEW = 8; // photos shown before "View full album"

// Columns: category, service, price
const DEFAULT_ROWS = [
  ["Gel / Gel-X", "X short", "₦6,000"],
  ["Gel / Gel-X", "Short", "₦8,000"],
  ["Gel / Gel-X", "Medium", "₦10,000"],
  ["Gel / Gel-X", "Long", "₦12,000–₦14,000"],
  ["Gel / Gel-X", "X long", "₦15,000–₦17,000"],
  ["Gel / Gel-X", "On natural nails", "₦4,000"],

  ["BIAB / Hard Gel", "Short natural nails", "₦15,000"],
  ["BIAB / Hard Gel", "Long natural nails", "₦18,000"],
  ["BIAB / Hard Gel", "Extension", "₦20,000"],

  ["Acrylic", "Overlay", "₦15,000"],
  ["Acrylic", "Short", "₦18,000"],
  ["Acrylic", "Medium", "₦22,000"],
  ["Acrylic", "Long", "₦25,000–₦30,000"],
  ["Acrylic", "X long", "₦35,000"],

  ["Nail Art", "French tip", "₦250"],
  ["Nail Art", "Chrome", "₦250"],
  ["Nail Art", "Stones / Pearls", "₦200"],
  ["Nail Art", "Cat eyes", "₦500"],
  ["Nail Art", "Blooming gel", "₦300"],
  ["Nail Art", "3D flower", "₦300"],
  ["Nail Art", "3D swirls", "₦300"],
  ["Nail Art", "Air brush design", "₦400"],
  ["Nail Art", "Hand painted", "₦250"],

  ["Mani & Pedi", "Manicure", "₦7,000"],
  ["Mani & Pedi", "Pedicure", "₦10,000"],
  ["Mani & Pedi", "Mani & Pedi combo", "₦20,000"],

  ["Toes", "Plain toes (without fixing)", "₦4,000"],
  ["Toes", "Plain toes (with big toe fixed)", "₦5,000"],
  ["Toes", "All fixed (plain)", "₦7,000"],
  ["Toes", "Acrylic overlay", "₦9,000"],
  ["Toes", "Acrylic with extension", "₦12,000"],
];

// The order the sections appear on the website
const ORDER = [
  "Gel / Gel-X",
  "BIAB / Hard Gel",
  "Acrylic",
  "Nail Art",
  "Mani & Pedi",
  "Toes",
];
// Categories that are never shown, even if they are in the Google Sheet
const HIDDEN = ["Other"];

const TITLES = {
  "Gel / Gel-X": "Plain Nail Service · Gel / Gel-X",
  "BIAB / Hard Gel": "BIAB / Hard Gel",
  Acrylic: "Acrylic",
  "Nail Art": "Nail Art & Design · Per Finger",
  "Mani & Pedi": "Pedicure & Manicure",
  Toes: "Toe Nail Service",
};
const NOTES = {
  "Mani & Pedi": "Mani & Pedi combo includes complimentary toe polishing.",
  Toes: "French tips, charms and designs: ₦200 per toe.",
  "Nail Art": "Complex or custom artwork may require a separate quote.",
};

// Turns 10000, 12000-14000, 12-14,000, 25k-30k or ₦10,000 into nice naira prices
const fmt = (v) => {
  const s = (v || "").trim();
  if (!s) return null;
  if (!/\d/.test(s)) return s;
  if (/[a-z]/i.test(s.replace(/\dk/gi, ""))) return s;
  const nums = [...s.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k)?/gi)].map((m) => {
    let n = Number(m[1].replace(/,/g, ""));
    if (m[2]) n *= 1000;
    return n;
  });
  if (nums.length === 2 && nums[0] < 1000 && nums[1] >= 1000 && !/k/i.test(s)) {
    nums[0] *= 1000;
  }
  return nums.map((n) => "₦" + n.toLocaleString("en-NG")).join("–");
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function buildMenu(rows) {
  const cats = {};
  rows.forEach(([cat, service, price]) => {
    const c = (cat || "").trim();
    const name = (service || "").trim();
    if (!c || !name || HIDDEN.includes(c)) return;
    if (!cats[c]) cats[c] = [];
    cats[c].push([name, fmt(price) || "—"]);
  });

  const rank = (c) => {
    const i = ORDER.indexOf(c);
    return i === -1 ? ORDER.length : i;
  };

  const groups = Object.keys(cats)
    .sort((a, b) => rank(a) - rank(b))
    .map((c) => ({
      key: c,
      title: TITLES[c] || c,
      items: cats[c],
      note: NOTES[c],
    }));

  const bookable = {};
  groups
    .filter((g) => g.key !== "Nail Art")
    .forEach((g) => {
      bookable[g.key] = g.items.map((i) => i[0]);
    });

  return { groups, bookable };
}

const policies = [
  ["₦5,000 deposit", "Required to secure your appointment and deducted from your final service bill."],
  ["One reschedule", "Allowed with at least 24 hours' notice. Please contact us as early as possible."],
  ["Non-refundable", "The deposit is non-refundable in the event of a no-show. Your appointment is confirmed only after ITG_NAILS approves the request and receives the deposit."],
];

const times = ["10:00 am", "11:00 am", "12:00 pm", "1:00 pm", "2:00 pm", "3:00 pm", "4:00 pm", "5:00 pm"];

const NAV_LINKS = [
  ["Home", "#top"],
  ["Services", "#services"],
  ["Portfolio", "#portfolio"],
  ["Studio", "#studio"],
  ["Appointment", "#booking"],
];

const icons = {
  Instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.6 2.1 4.2 5 4.4" />
    </svg>
  ),
  WhatsApp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l1.65-4.8A8.5 8.5 0 1 1 8 19.4L3 21z" />
      <path d="M9.2 9.2c.4 2.4 2.7 4.8 5.6 5.6l1.3-1.3-2-1-.9.8c-.9-.4-1.9-1.4-2.3-2.3l.8-.9-1-2-1.5 1.1z" fill="currentColor" stroke="none" />
    </svg>
  ),
};

function SocialButtons({ className = "" }) {
  const links = [
    { name: "Instagram", href: INSTAGRAM_URL },
    { name: "TikTok", href: TIKTOK_URL },
    { name: "WhatsApp", href: `https://wa.me/${WHATSAPP}` },
  ];
  return (
    <div className={`social-btns ${className}`}>
      {links.map((l) => (
        <a
          key={l.name}
          href={l.href}
          className="social-btn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.name}
          title={l.name}
        >
          {icons[l.name]}
        </a>
      ))}
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="header">
      <a href="#top" className="brand" onClick={close}>
        <img src={LOGO} alt="ITG_NAILS logo" />
        <span className="brand-text">
          <strong>ITG_NAILS</strong>
          <em>Isha's Touch &amp; Glam</em>
        </span>
      </a>

      <nav className="nav">
        {NAV_LINKS.map(([label, href]) => (
          <a key={href} href={href}>{label}</a>
        ))}
      </nav>

      <div className="header-actions">
        <a href="#booking" className="btn btn-primary btn-sm" onClick={close}>Book now</a>
        <button
          type="button"
          className="menu-btn"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="mobile-nav">
          {NAV_LINKS.map(([label, href]) => (
            <a key={href} href={href} onClick={close}>{label}</a>
          ))}
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow">Nail studio · Lagos</p>
        <h1>
          Beautiful nails.
          <span> Thoughtful details.</span>
        </h1>
        <p className="lead">
          Nail extensions, overlays, gel polish and considered nail artistry in a calm,
          welcoming studio.
        </p>
        <div className="btn-row">
          <a href="#booking" className="btn btn-primary">Book an appointment</a>
          <a href="#services" className="btn btn-ghost">View services →</a>
        </div>
        <SocialButtons />
      </div>

      <div className="hero-bento">
        <div className="hb hb-main">
          <img src={gallery[0]} alt="Nail set by ITG_NAILS" />
        </div>
        <div className="hb hb-a">
          <img src={gallery[3]} alt="Nail set by ITG_NAILS" />
        </div>
        <div className="hb hb-badge">
          <small>Open</small>
          <strong>Mon–Sat</strong>
          <span>10am – 6pm</span>
        </div>
        <div className="hb hb-b">
          <img src={gallery[5]} alt="Nail art detail" />
        </div>
      </div>
    </section>
  );
}

function Services({ menu }) {
  return (
    <section className="section" id="services">
      <header className="section-head">
        <p className="eyebrow">The service menu</p>
        <h2>Find your <em>next set</em></h2>
        <p className="muted">
          Prices are in Nigerian naira. Nail art, length and special detailing may affect the final quote.
        </p>
      </header>

      <div className="bento">
        {menu.groups.map((g) => (
          <article className="tile s3" key={g.key}>
            <h3>{g.title}</h3>
            <ul className="rows">
              {g.items.map(([n, p]) => (
                <li key={n}><span>{n}</span><strong>{p}</strong></li>
              ))}
            </ul>
            {g.note && <p className="note">{g.note}</p>}
          </article>
        ))}
        <article className="tile s6 tile-gold">
          <small>Studio combos</small>
          <h3>Coming soon</h3>
          <p>Value packages for clients who want to combine services. Follow our socials for launch offers.</p>
        </article>
      </div>
    </section>
  );
}

function Portfolio() {
  const [open, setOpen] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? gallery : gallery.slice(0, PREVIEW);

  const next = () => setOpen((i) => (i + 1) % gallery.length);
  const prev = () => setOpen((i) => (i - 1 + gallery.length) % gallery.length);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i + 1) % gallery.length);
      if (e.key === "ArrowLeft") setOpen((i) => (i - 1 + gallery.length) % gallery.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <section className="section wide alt" id="portfolio">
        <header className="section-head">
          <p className="eyebrow">The ITG portfolio</p>
          <h2>Made with <em>detail</em></h2>
          <p className="muted">
            {gallery.length} photos · tap any photo to open it. More designs are added as the album grows.
          </p>
        </header>

        <div className="album">
          {shown.map((src, i) => (
            <button
              type="button"
              key={src}
              className="album-item"
              onClick={() => setOpen(i)}
              aria-label={`Open photo ${i + 1}`}
            >
              <img src={src} alt={`ITG nail work ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>

        {gallery.length > PREVIEW && (
          <div className="album-more">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowAll((s) => !s)}
            >
              {showAll ? "Show fewer photos" : `View full album (${gallery.length})`}
            </button>
          </div>
        )}
      </section>

      {open !== null && (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <button type="button" className="lb-close" onClick={() => setOpen(null)} aria-label="Close">×</button>
          <button type="button" className="lb-nav lb-prev"
            onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous photo">‹</button>
          <img
            src={gallery[open]}
            alt={`ITG nail work ${open + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          <button type="button" className="lb-nav lb-next"
            onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next photo">›</button>
          <span className="lb-count">{open + 1} / {gallery.length}</span>
        </div>
      )}
    </>
  );
}

function Policy() {
  return (
    <section className="section">
      <header className="section-head">
        <p className="eyebrow">Before you book</p>
        <h2>Simple <em>policies</em></h2>
      </header>
      <div className="policy-grid">
        {policies.map(([t, d], i) => (
          <article className="policy" key={t}>
            <span className="num">0{i + 1}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Studio() {
  return (
    <section className="section wide alt" id="studio">
      <header className="section-head">
        <p className="eyebrow">Visit the studio</p>
        <h2>Your ITG <em>appointment</em></h2>
      </header>
      <div className="bento">
        <article className="tile s3">
          <small>Location</small>
          <h3>Sangrose Plaza, Lagos</h3>
        </article>
        <article className="tile s3">
          <small>Opening hours</small>
          <h3>Mon–Sat · 10am–6pm</h3>
          <p className="muted">Sunday closed</p>
        </article>
        <article className="tile s6 tile-gold">
          <small>Home service</small>
          <h3>Available on request</h3>
          <p>The fee depends on your location. Contact us for a quote.</p>
        </article>
      </div>
    </section>
  );
}

function PayCard() {
  const [copied, setCopied] = useState(false);
  if (!BANK.number) return null;

  const who = [BANK.name, BANK.bank].filter(Boolean).join(" · ");

  const copy = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(BANK.number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="paycard">
      <span>Pay deposit to</span>
      <strong>{BANK.number}</strong>
      {who && <small>{who}</small>}
      <button type="button" className="copy-btn" onClick={copy}>
        {copied ? "Copied ✓" : "Copy account number"}
      </button>
      <small>Send your payment receipt on WhatsApp to confirm your booking.</small>
    </div>
  );
}

function Booking({ bookable }) {
  const [cat, setCat] = useState(Object.keys(bookable)[0] || "");
  const [form, setForm] = useState({
    name: "", phone: "", service: "",
    type: "Studio appointment", date: "", time: "", details: "",
  });
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const today = new Date().toISOString().split("T")[0];
  const fullService = form.service ? `${cat} — ${form.service}` : "";

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.service || !form.date || !form.time) {
      setError("Please fill in your name, number, service, date and time.");
      return;
    }
    setError("");
    const lines = [
      "Hello ITG_NAILS, I'd like to request an appointment.",
      "",
      `Name: ${form.name}`,
      `WhatsApp: ${form.phone}`,
      `Service: ${fullService}`,
      `Type: ${form.type}`,
      `Preferred date: ${form.date}`,
      `Preferred time: ${form.time}`,
    ];
    if (form.details) lines.push(`Design ideas: ${form.details}`);
    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener"
    );
  };

  return (
    <section className="section wide booking" id="booking">
      <header className="section-head">
        <p className="eyebrow">Appointments</p>
        <h2>Request your <em>booking</em></h2>
        <p className="muted">
          This is a request, not an automatic confirmation. We'll check availability and get back to you.
        </p>
      </header>

      <form className="book-grid" onSubmit={submit}>
        <div className="steps">
          <div className="step">
            <h4><b>1</b> Choose your service</h4>
            <div className="pills scroll">
              {Object.keys(bookable).map((c) => (
                <button type="button" key={c}
                  className={`pill ${cat === c ? "on" : ""}`}
                  onClick={() => { setCat(c); set("service", ""); }}>
                  {c}
                </button>
              ))}
            </div>
            <div className="chips">
              {(bookable[cat] || []).map((s) => (
                <button type="button" key={s}
                  className={`chip ${form.service === s ? "on" : ""}`}
                  onClick={() => set("service", s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="step">
            <h4><b>2</b> Where</h4>
            <div className="segment">
              {["Studio appointment", "Home service"].map((t) => (
                <button type="button" key={t}
                  className={form.type === t ? "on" : ""}
                  onClick={() => set("type", t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="step">
            <h4><b>3</b> Pick a date &amp; time</h4>
            <input className="field" type="date" min={today} value={form.date}
              onChange={(e) => set("date", e.target.value)} />
            <div className="slots">
              {times.map((t) => (
                <button type="button" key={t}
                  className={`slot ${form.time === t ? "on" : ""}`}
                  onClick={() => set("time", t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="step">
            <h4><b>4</b> Your details</h4>
            <input className="field" placeholder="Full name" value={form.name}
              onChange={(e) => set("name", e.target.value)} />
            <input className="field" type="tel" inputMode="tel" placeholder="WhatsApp number"
              value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            <textarea className="field" rows={3}
              placeholder="Design ideas or extra details (optional)"
              value={form.details} onChange={(e) => set("details", e.target.value)} />
            <p className="muted small">
              Have an inspiration photo? Send it in the WhatsApp chat after your message opens.
            </p>
          </div>
        </div>

        <aside className="summary">
          <p className="eyebrow">Your request</p>
          <dl>
            <div><dt>Service</dt><dd>{fullService || "—"}</dd></div>
            <div><dt>Type</dt><dd>{form.type}</dd></div>
            <div><dt>Date</dt><dd>{form.date || "—"}</dd></div>
            <div><dt>Time</dt><dd>{form.time || "—"}</dd></div>
          </dl>
          <div className="deposit">
            <span>Deposit</span>
            <strong>₦5,000</strong>
            <small>Deducted from your service total</small>
          </div>
          <PayCard />
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary full" type="submit">Continue to WhatsApp</button>
          <p className="muted small">
            WhatsApp opens with your details filled in. Tap Send. Your appointment stays pending
            until we confirm availability and receive your deposit.
          </p>
        </aside>
      </form>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <h3>ITG_NAILS <em>by Isha's Touch &amp; Glam</em></h3>
      <p>Beautiful nails. Thoughtful details.</p>
      <SocialButtons className="center" />
    </footer>
  );
}

export default function App() {
  const [rows, setRows] = useState(DEFAULT_ROWS);

  useEffect(() => {
    if (!SHEET_URL) return;
    fetch(SHEET_URL)
      .then((r) => r.text())
      .then((t) => {
        let data = parseCSV(t);
        if (data[0] && (data[0][0] || "").trim().toLowerCase() === "category") {
          data = data.slice(1);
        }
        data = data.filter((r) => r[0] && r[1]);
        if (data.length) setRows(data);
      })
      .catch(() => {});
  }, []);

  const menu = useMemo(() => buildMenu(rows), [rows]);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services menu={menu} />
        <Portfolio />
        <Policy />
        <Studio />
        <Booking bookable={menu.bookable} />
      </main>
      <Footer />
    </>
  );
}