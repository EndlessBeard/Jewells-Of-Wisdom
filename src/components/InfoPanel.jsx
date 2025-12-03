import React, { useEffect, useRef, useState } from 'react';
import './InfoPanel.css';
import { computeCardLayout } from '../utils/computeLayout';
import Shop_Books from '../assets/Shop_Books.png';
import Shop_Shirts from '../assets/Shop_Shirts.png';
import Shop_Stickers from '../assets/Shop_Stickers.png';
import Shop_Crafts from '../assets/Shop_Crafts.png';

// Sections derived from the outline (mapped to Card labels)
const SECTIONS = [
  {
    id: 'about-us',
    title: 'About Us',
    paragraphs: [
      `Hello, darling. I'm Morgana—yes, the one with the perfectly singed broom bristles and a PhD in hexology from the University of Unapologetic Glamour. I brew better tea than your ex ever brewed commitments, and my credentials include decades of moonlit markets, a small coven of very opinionated plants, and a cat that refuses to accept lesser offerings.`,
      `Mission: To help remarkable humans (you included) stop apologizing for wanting magic in their lives. I consult, I counsel, I stitch curses back together when they get frayed by poor romantic choices. Think of me as a life coach with a cauldron and better hair.`,
      `Vision: A world where tarot is as common as takeout and people ask the Moon for permission before making questionable life choices. Also, a tolerable selection of witchy merch that doesn't scream 'I tried too hard.'`,
      `Values: honesty (even the spicy kind), creativity (misplaced and glorious), consent (ask the spirits, ask your neighbor), and excellent packaging. Also: sparkle—always sparkle.`,
      `I sell talismans that don't double as awkward conversation starters, tarot readings that tell you more than your horoscope app (and less than your mother), and subscription boxes curated for those who prefer their metaphysical goods with a side of sarcasm. If you want sanctimony, leave the coven membership forms by the door; if you want warmth, a little welt of wonder, and herbs that actually work, come on in.`,
    ],
  },
  {
    id: 'author',
    title: 'Author',
    paragraphs: [
      `Fiction: I spin stories like I spin herbs—carefully, with intention, and usually with a pinprick of mischief. My fiction ranges from snug, illustrated tales for the small and stubborn-hearted, to longer, deliciously complicated novels for adults who like their endings morally ambiguous and a little glittery. Expect found family, reluctant heroes, and at least one talking cat who thinks they deserve better.`,
      `Children: Picturebooks that smell faintly of toasted marshmallows and good advice. These are the stories I wish I'd had as a kid: brave children who make bargains with the moon, curious creatures who learn empathy without being lectured, and parents who are allowed to be imperfect but deeply loving.`,
      `Adults: Novels for grown-up humans who still want to be delighted and surprised. Think cozy magic tangled with real feelings, awkward romances redeemed by honesty, and the occasional gentle curse that teaches a lesson. If you enjoy clever, character-forward plots and language that sings, pull up a chair.`,
      `Nonfiction: Practical enchantment, written like a friend who knows a lot and doesn't smother you with jargon. I cover craft, ritual basics, ethical practice, and storytelling techniques—plus the odd essay about grief, joy, and why rituals matter even if you don't believe in magic (spoiler: belief is only part of it).`,
      `Blog: A messy, sincere place where I publish essays, tiny rituals you can do with a teacup, behind-the-scenes of my books, and monthly lunations. Subscribe if you like reading about the process, the failures that become useful, and the small domestic magics that make life softer.`,
      `Subscription: For $10/mo you get early chapters, short stories, and monthly notes from my desk—plus an annual readers' tarot pull (digital). It's a cozy corner of the internet where I send things I think you'll like before they go anywhere else.`,
    ],
  },
  {
    id: 'services',
    title: 'Metaphysical, Coaching, & Officiant Services',
    paragraphs: [
      `Astrology: Personalized transit readings and monthly outlooks. I translate the sky into practical, usable guidance—how to plan your month, when to start something new, and when to nap (the planets approve).`,
      `Tarot: Readings from a tidy one-card check-in to a thorough 3-card monthly subscription. Expect clarity, playful bluntness, and a soft map you can actually use to make decisions.`,
      `Past Life Regression: Gentle, professionally guided sessions to explore resonant past-life themes and how they whisper into your current patterns. Not theatrical—just thoughtful, reflective, and sometimes surprisingly healing.`,
      `Workshops: Hands-on evenings where we learn tarot spreads, basic herbalism, ritual writing, and story-crafting. Bring a notebook, curiosity, and a reusable cup.`,
      `Retreat: Multi-day gatherings blending nature, ritual, movement, and writing. Small groups, deep conversation, and at least one guided stargazing evening.`,
      `Parties/Events: Tarot corners, mini-readings, and gentle chaos for gatherings. Perfect for birthdays, book launches, and poorly planned bachelorette parties that deserve better entertainment.`,
      `Coaching: Practical one-on-one sessions that mix life-coaching with ritual work—goal setting, boundary spells (metaphorical and literal), and accountability with empathy.`,
      `Officiant: I officiate weddings and commitment ceremonies with warmth, inclusivity, and a tiny dramatic flair. Custom rituals available for lovers, friends, and covens alike.`,
    ],
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    // structured tiers so we can render value boxes and prices
    tiers: [
      {
        category: 'Tarot',
        items: [
          { label: '1 card pull monthly (General Reading)', priceMonthly: '$20/mo', priceYearly: '$225/yr ($300 value)' },
          { label: '3 card pull monthly (May submit one question per month.)', priceMonthly: '$30/mo', priceYearly: '$340/yr ($420 value)' },
          { label: '30 minute monthly video appointment', priceMonthly: '$55/mo', priceYearly: '$625/yr ($900 value)' },
          { label: '60 minute monthly video appointment', priceMonthly: '$100/mo', priceYearly: '$1175/yr ($1500 value)' },
        ],
      },
      {
        category: 'Astrology',
        items: [
          { label: 'Transit Month Ahead Outlook (based on rising sign)', priceMonthly: '$10/mo', priceYearly: '$110/yr ($150 value)' },
          { label: 'Moon Magic Month Ahead (New & Full Moon rituals + transit notes)', priceMonthly: '$25/mo', priceYearly: '$280/yr ($375 value)' },
          { label: '30 minute monthly video meeting', priceMonthly: '$55/mo', priceYearly: '$625/yr ($900 value)' },
          { label: '60 minute monthly video meeting', priceMonthly: '$100/mo', priceYearly: '$1175/yr ($1500 value)' },
        ],
      },
      {
        category: 'Witchy Woman Mix & Match',
        items: [
          { label: '1 card pull monthly + Transit Month Ahead Outlook', priceMonthly: '$25/mo', priceYearly: '$280/yr ($375 value)' },
          { label: '3 card pull monthly + Moon Magic Month Ahead', priceMonthly: '$50/mo', priceYearly: '$585/yr ($750 value)' },
          { label: '30 minute monthly video appointment', priceMonthly: '$60/mo', priceYearly: '$700/yr ($1080 value)' },
          { label: '60 minute monthly video appointment', priceMonthly: '$110/mo', priceYearly: '$1680/yr ($1680 value)' },
        ],
      },
    ],
  },
  {
    id: 'shop',
    title: 'Store (coming soon)',
    // Placeholder for the store — implementation will be restarted later.
    paragraphs: [
      `Our shop is taking a brief sabbatical while we brew something even better. Check back soon—curios, books, and wearable magics will appear when the moon approves.`,
    ],
  },
];

// --- ShopPanel and ShopCarousel components (kept local) ---
const ShopCarousel = ({ items = [] }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (items && items.length > 0 && idx >= items.length) setIdx(0); }, [items, idx]);

  const prev = () => setIdx(i => (i - 1 + items.length) % items.length);
  const next = () => setIdx(i => (i + 1) % items.length);

  // swipe/drag state
  const touchStartX = useRef(null);
  const dragging = useRef(false);

  const onTouchStart = (e) => {
    dragging.current = true;
    touchStartX.current = (e.touches && e.touches[0] && e.touches[0].clientX) || (e.clientX || 0);
  };
  const onTouchMove = (e) => {
    if (!dragging.current) return;
    // prevent native scrolling while swiping horizontally
    try { e.preventDefault(); } catch (e) {}
  };
  const onTouchEnd = (e) => {
    if (!dragging.current) return;
    const endX = (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientX) || (e.clientX || 0);
    const dx = endX - (touchStartX.current || 0);
    dragging.current = false;
    touchStartX.current = null;
    const THRESH = 40;
    if (dx > THRESH) prev();
    else if (dx < -THRESH) next();
  };

  if (!items || items.length === 0) return <div className="shop-empty">No items in this category.</div>;

  // helper to compute shortest circular delta in range [-floor(n/2), ceil(n/2)]
  const computeDelta = (i) => {
    const n = items.length;
    let d = i - idx;
    if (d > n/2) d -= n;
    if (d <= -n/2) d += n;
    return d;
  };

  return (
    <div className="shop-carousel-wrap" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onMouseDown={(e)=>{ onTouchStart(e); }} onMouseMove={(e)=>{ if (dragging.current) onTouchMove(e); }} onMouseUp={(e)=>{ onTouchEnd(e); }} onMouseLeave={(e)=>{ dragging.current && onTouchEnd(e); }}>
      <div className="shop-carousel">
        <button className="carousel-btn left" aria-label="Previous item" onClick={prev}>◀</button>
        <div className="carousel-track" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {items.map((it, i) => {
            const d = computeDelta(i); // -2,-1,0,1,2 etc
            // hide items that are far away for performance
            const visible = Math.abs(d) <= 2;
            const style = {
              ['--pos']: d,
            };
            return (
              <div
                className={`carousel-item carousel-item-pos-${d} ${visible ? 'visible' : 'hidden'}`}
                key={`shop-item-${i}`}
                style={style}
                aria-hidden={d !== 0}
              >
                <div className="shop-card">
                  <div className="shop-card-media">
                    <img src={it.image} alt={it.title} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button className="carousel-btn right" aria-label="Next item" onClick={next}>▶</button>
      </div>
      <div className="shop-item-info" aria-live="polite">
        <div className="item-title">{items[idx].title}</div>
        <a className="shop-link" href={items[idx].link} target="_blank" rel="noreferrer">Buy on Shopify</a>
      </div>
    </div>
  );
};

const ShopPanel = ({ id, cls, title }) => {
  // sample fallback used if the JSON fetch fails or isn't available.
  const FALLBACK_ITEMS = {
    books: [
      { title: 'Grimoire & Guide', image: '/assets/shop/book1.jpg', link: 'https://shop.example.com/book1' },
      { title: 'Pocket Journal', image: '/assets/shop/journal1.jpg', link: 'https://shop.example.com/journal1' },
    ],
    shirts: [
      { title: 'Moon Tee', image: '/assets/shop/shirt1.jpg', link: 'https://shop.example.com/shirt1' },
    ],
    stickers: [
      { title: 'Sigil Sticker Pack', image: '/assets/shop/sticker1.jpg', link: 'https://shop.example.com/sticker1' },
    ],
    crafts: [
      { title: 'Witchy Wreath', image: '/assets/shop/craft1.jpg', link: 'https://shop.example.com/craft1' },
    ],
  };
  const [remoteItems, setRemoteItems] = useState(null);

  // Attempt to load /data/shop-items.json from public. Falls back to FALLBACK_ITEMS.
  useEffect(() => {
    let canceled = false;
    const load = async () => {
      try {
        const res = await fetch('/data/shop-items.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('not ok');
        const json = await res.json();
        if (!canceled) setRemoteItems(json);
      } catch (e) {
        // ignore and leave remoteItems null to use fallback
      }
    };
    load();
    return () => { canceled = true; };
  }, []);
  const [category, setCategory] = useState('books');
  // --- Persisted shop controls: keep keys in sync with Toolbar.jsx (jow.layout.*)
  const [shopCardGap, setShopCardGap] = useState(() => {
    try {
      const v = localStorage.getItem('jow.layout.shopCardGap');
      if (v != null) return Number(v);
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--shop-card-gap');
      if (cs) return Number(cs.replace('px','')) || 12;
    } catch (e) {}
    return 12;
  });

  const [shopCardSizeMultiplier, setShopCardSizeMultiplier] = useState(() => {
    try {
      const v = localStorage.getItem('jow.layout.shopCardSizeMultiplier');
      if (v != null) return Number(v);
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--shop-card-size-multiplier-percent');
      if (cs) return Number(cs) || 100;
    } catch (e) {}
    return 100;
  });

  const [shopPanelHeightPercent, setShopPanelHeightPercent] = useState(() => {
    try {
      const v = localStorage.getItem('jow.layout.shopPanelHeightPercent');
      if (v != null) return Number(v);
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--shop-panel-height-percent');
      if (cs) return Number(cs) || 150;
    } catch (e) {}
    return 150;
  });

  // Apply persisted values to CSS vars on mount so the rendered shop matches saved preferences
  useEffect(() => {
    try { document.documentElement.style.setProperty('--shop-card-gap', `${Number(shopCardGap)}px`); } catch {}
    try { document.documentElement.style.setProperty('--shop-card-size-multiplier-percent', String(Number(shopCardSizeMultiplier))); } catch {}
    try { document.documentElement.style.setProperty('--shop-panel-height-percent', String(Number(shopPanelHeightPercent))); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  }, []);

  const setShopGap = (v) => {
    const n = Number(v) || 0;
    setShopCardGap(n);
    try { localStorage.setItem('jow.layout.shopCardGap', String(n)); } catch {}
    try { document.documentElement.style.setProperty('--shop-card-gap', `${n}px`); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  const setShopSizeMult = (v) => {
    const n = Number(v) || 100;
    setShopCardSizeMultiplier(n);
    try { localStorage.setItem('jow.layout.shopCardSizeMultiplier', String(n)); } catch {}
    try { document.documentElement.style.setProperty('--shop-card-size-multiplier-percent', String(n)); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };

  const setShopPanelHeight = (v) => {
    const n = Number(v) || 0;
    setShopPanelHeightPercent(n);
    try { localStorage.setItem('jow.layout.shopPanelHeightPercent', String(n)); } catch {}
    try { document.documentElement.style.setProperty('--shop-panel-height-percent', String(n)); } catch {}
    try { window.dispatchEvent(new CustomEvent('layout:update')); } catch {}
  };
  const itemsFor = (cat) => {
    try {
      if (remoteItems && typeof remoteItems === 'object' && remoteItems[cat]) return remoteItems[cat];
    } catch (e) {}
    return FALLBACK_ITEMS[cat] || [];
  };

  return (
    <article id={id} className={`panel ${cls}`} tabIndex={-1}>
      <h2 tabIndex={-1}>The Jewell Shop</h2>
      <div className="shop-categories">
        <button aria-label="T-Shirts" data-cat="shirts" className={`cat-btn ${category === 'shirts' ? 'active' : ''}`} onClick={() => setCategory('shirts')}></button>
        <button aria-label="Books / Journals" data-cat="books" className={`cat-btn ${category === 'books' ? 'active' : ''}`} onClick={() => setCategory('books')}></button>
        <button aria-label="Stickers" data-cat="stickers" className={`cat-btn ${category === 'stickers' ? 'active' : ''}`} onClick={() => setCategory('stickers')}></button>
        <button aria-label="Crafts For Witches" data-cat="crafts" className={`cat-btn ${category === 'crafts' ? 'active' : ''}`} onClick={() => setCategory('crafts')}></button>
      </div>
      <ShopCarousel items={itemsFor(category)} />
    </article>
  );
};

const InfoPanel = ({ selectedCard = null }) => {
  const [current, setCurrent] = useState(selectedCard ?? 0);
  const [previous, setPrevious] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('left');
  const wrapperRef = useRef(null);

  // Set CSS custom properties for category background images and handle image loading
  useEffect(() => {
    const root = document.documentElement;
    
    // Test image loading and set classes accordingly
    const testImageLoad = (imageSrc, category) => {
      const img = new Image();
      img.onload = () => {
        // Image loaded successfully, hide text
        const button = document.querySelector(`button[data-cat="${category}"]`);
        if (button) {
          button.classList.add('image-loaded');
          button.classList.remove('image-failed');
        }
      };
      img.onerror = () => {
        // Image failed to load, show text
        const button = document.querySelector(`button[data-cat="${category}"]`);
        if (button) {
          button.classList.add('image-failed');
          button.classList.remove('image-loaded');
        }
      };
      img.src = imageSrc;
    };

    // Set CSS properties and test image loading
    root.style.setProperty('--shop-cat-books-bg-image', `url(${Shop_Books})`);
    root.style.setProperty('--shop-cat-shirts-bg-image', `url(${Shop_Shirts})`);
    root.style.setProperty('--shop-cat-stickers-bg-image', `url(${Shop_Stickers})`);
    root.style.setProperty('--shop-cat-crafts-bg-image', `url(${Shop_Crafts})`);

    testImageLoad(Shop_Books, 'books');
    testImageLoad(Shop_Shirts, 'shirts');
    testImageLoad(Shop_Stickers, 'stickers');
    testImageLoad(Shop_Crafts, 'crafts');
  }, []);

  // Set CSS custom properties for category background images early
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--shop-cat-books-bg-image', `url(${Shop_Books})`);
    root.style.setProperty('--shop-cat-shirts-bg-image', `url(${Shop_Shirts})`);
    root.style.setProperty('--shop-cat-stickers-bg-image', `url(${Shop_Stickers})`);
    root.style.setProperty('--shop-cat-crafts-bg-image', `url(${Shop_Crafts})`);
  }, []);

  // Publish shop carousel card pixel size so the carousel card matches CardArc cards.
  useEffect(() => {
    const updateShopCardSize = () => {
      try {
        const layout = computeCardLayout(window.innerWidth, window.innerHeight, { maxCanvasWidth: 900 });
        const w = layout.cardW;
        const h = layout.cardH;
        document.documentElement.style.setProperty('--shop-card-w', `${w}px`);
        document.documentElement.style.setProperty('--shop-card-h', `${h}px`);
      } catch (e) {
        // ignore
      }
    };
    updateShopCardSize();
    window.addEventListener('resize', updateShopCardSize);
    try { window.addEventListener('layout:update', updateShopCardSize); } catch {}
    return () => {
      window.removeEventListener('resize', updateShopCardSize);
      try { window.removeEventListener('layout:update', updateShopCardSize); } catch {}
    };
  }, []);

  // Sync incoming selectedCard into local state with animation
  useEffect(() => {
    const target = selectedCard == null ? 0 : selectedCard;
    if (target === current) return;
    setPrevious(current);
    setDirection(target > current ? 'left' : 'right');
    setCurrent(target);
    setAnimating(true);
    const t = setTimeout(() => {
      setPrevious(null);
      setAnimating(false);
    }, 360);
    return () => clearTimeout(t);
  }, [selectedCard]);

  // focus the heading of the newly active panel for accessibility
  useEffect(() => {
    if (!animating) {
      const id = SECTIONS[current]?.id;
      if (!id) return;
      const h = document.querySelector(`#${id} h2`);
      if (h) {
        // Try to focus without scrolling; modern browsers support preventScroll option.
        try {
          h.focus({ preventScroll: true });
        } catch (e) {
          // Fallback: remember scroll position, focus, then restore scroll to avoid jump
          const sx = window.scrollX || 0;
          const sy = window.scrollY || 0;
          h.focus && h.focus();
          window.scrollTo(sx, sy);
        }
      }
    }
  }, [animating, current]);

  // Adjust the InfoPanel vertical position so it starts below the
  // CardArc visual bottom with a consistent gap. Query the rendered
  // `.card-arc-arc` element's bounding rect for the browser's actual layout.
  useEffect(() => {
    const adjustPanelPos = () => {
      const el = wrapperRef.current;
      if (!el || typeof window === 'undefined') return;
      try {
        // Find the arc container and measure its bottom in viewport coords
        const arcEl = document.querySelector('.card-arc-arc');
        if (!arcEl) return;
        
        const arcRect = arcEl.getBoundingClientRect();
        const arcBottomPageY = arcRect.top + arcRect.height + (window.scrollY || 0);
        
        // Get the current top of this InfoPanel in page coordinates
        const panelRect = el.getBoundingClientRect();
        const panelTopPageY = panelRect.top + (window.scrollY || 0);
        
        // Calculate gap (should be below arc bottom)
        const desiredGap = 12; // consistent gap in px
        const requiredMarginTop = arcBottomPageY + desiredGap - panelTopPageY;
        
        // Always apply the margin to ensure consistent positioning
        if (requiredMarginTop > 0) {
          el.style.marginTop = `${Math.round(requiredMarginTop)}px`;
        } else {
          el.style.marginTop = '0px';
        }
      } catch (e) {
        // ignore errors silently
      }
    };

    // Run positioning on mount, resize, and layout updates
    adjustPanelPos();
    window.addEventListener('resize', adjustPanelPos);
    try { window.addEventListener('layout:update', adjustPanelPos); } catch {}
    return () => {
      window.removeEventListener('resize', adjustPanelPos);
      try { window.removeEventListener('layout:update', adjustPanelPos); } catch {}
    };
  }, []);

  const renderPanel = (idx, cls) => {
    const s = SECTIONS[idx];
    if (!s) return null;
    // Subscriptions: render structured tiers with price/value boxes
    if (s.id === 'subscriptions') {
      return (
        <article id={s.id} className={`panel ${cls}`} key={s.id} tabIndex={-1}>
          <h2 tabIndex={-1}>{s.title}</h2>
          <p className="muted">All subscribers receive a free 3-card pull in their birth month for the year ahead.</p>
          {s.tiers.map((tier, ti) => (
            <section className="subscription-tier" key={ti}>
              <h3 className="tier-title">{tier.category}</h3>
              <div className="tier-items">
                {tier.items.map((it, ii) => (
                  <div className="tier-row" key={ii}>
                    <div className="tier-desc">
                      <strong>{it.label}</strong>
                      <div className="tier-yearly">{it.priceYearly}</div>
                    </div>
                    <div className="tier-value">
                      <div className="value-box">{it.priceMonthly}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </article>
      );
    }
    // The shop/store panel is rendered by a separate component to avoid calling hooks conditionally
    if (s.id === 'shop') {
      return (
        <ShopPanel id={s.id} cls={cls} title={s.title} key={s.id} />
      );
    }
    return (
      <article id={s.id} className={`panel ${cls}`} key={s.id} tabIndex={-1}>
        <h2 tabIndex={-1}>{s.title}</h2>
        {s.paragraphs && s.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>
    );
  };

  return (
    <section className="info-panel panels" ref={wrapperRef} aria-live="polite">
      <div className="panel-stage">
        {previous != null && renderPanel(previous, `panel-exit panel-exit-${direction}`)}
        {renderPanel(current, `panel-enter panel-enter-${direction}`)}
      </div>
    </section>
  );
};

export default InfoPanel;
