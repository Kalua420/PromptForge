import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Zap, MessageSquare, Code, PenTool,
  Image, Search, Check, Star, Users, Cpu, Shield, ArrowUpRight,
  ChevronDown, Play, X, Video
} from 'lucide-react';

/* ─── Design Tokens ──────────────────────────────────────────── */
const TOKEN = {
  forge: '#FF4D1C',       // brand orange-red
  forgeGlow: '#FF4D1C33',
  ink: '#0A0A0F',
  paper: '#F5F2ED',
  mist: '#C8C4BE',
  smoke: '#1A1A24',
  ember: '#FF6B3D',
  gold: '#FFB800',
};

/* ─── Data ───────────────────────────────────────────────────── */
const USE_CASES = [
  { id:'chatbot',  label:'Chatbot',  Icon:MessageSquare, accent:'#00C896' },
  { id:'coding',   label:'Coding',   Icon:Code,          accent:'#3B9EFF' },
  { id:'writing',  label:'Writing',  Icon:PenTool,       accent:'#A855F7' },
  { id:'research', label:'Research', Icon:Search,        accent:'#FFB800' },
  { id:'image',    label:'Image',    Icon:Image,         accent:'#FF4D1C' },
  { id:'video',    label:'Video',    Icon:Video,         accent:'#EC4899' },
];

const DEMO = {
  chatbot: `You are a warm, knowledgeable customer support agent for a SaaS platform.

PERSONA: Patient · Professional · Solution-first
TONE: Empathetic acknowledgment → Clear steps → Confirm resolution

BOUNDARIES
• Never speculate — escalate to human on complex issues
• No pricing commitments without manager approval

CAPABILITIES
→ Account & billing management
→ Technical troubleshooting (step-by-step)
→ Feature walkthroughs
→ Escalation routing`,

  coding: `Build a Node.js/Express REST endpoint for user registration.

INPUT  { name: string, email: string, password: string }
OUTPUT { user: { id, name, email }, token: JWT }

VALIDATION
• email → RFC 5322 regex
• password → ≥8 chars, 1 uppercase, 1 number
• name → 1–100 chars, no special chars

EDGE CASES
• 409 on duplicate email (index violation catch)
• 400 on missing/malformed fields
• SQL injection prevention via parameterised queries
• Rate-limit: max 5 attempts / 15 min per IP

TESTING → Unit: validation logic · Integration: DB write + token verify`,

  writing: `Write a landing page hero section for a productivity SaaS.

AUDIENCE  Mid-level managers, 50–200 person companies, time-poor
TONE  Confident · Benefit-first · Conversational (not corporate)
PAIN  Too many tools, context-switching, missed deadlines

STRUCTURE
① Headline (≤10 words) — lead with the outcome
② Subheadline (≤20 words) — expand the benefit, hint at mechanism
③ 3 bullet differentiators — each starts with a strong verb
④ CTA button copy — action-oriented, low friction

CONSTRAINTS
→ Active voice only · No jargon · No "revolutionary" or "game-changing"
→ Address the pain directly: "Tired of..." / "Stop juggling..."`,

  research: `Analyze AI coding assistant adoption in enterprise software teams.

QUESTION  What drives adoption vs abandonment of AI coding tools in teams of 20+ devs?

SCOPE  2023–2026 · North America & Western Europe · GitHub Copilot, Cursor, Codeium

FRAMEWORK  Technology Acceptance Model (TAM) + Diffusion of Innovations

STRUCTURE
1. Executive summary — 3 key trends
2. Adoption drivers — productivity delta, learning curve, code quality metrics
3. Barriers — security posture, cost-per-seat, accuracy issues
4. Cross-segmentation — team size × tech stack × industry vertical
5. Recommendations — tool selection criteria + phased rollout playbook

CITATION  APA 7 · Prioritise peer-reviewed + industry surveys (Stack Overflow, JetBrains)`,

  image: `Vast brutalist library interior at golden hour, towering concrete shelves receding to infinity, warm amber shafts of light cutting through industrial skylights, lone figure dwarfed by architecture, holographic card catalogues floating mid-air, dust motes suspended in beams, ultra-detailed photorealism, cinematic anamorphic lens, shallow depth of field, Kodak Vision3 film emulation, warm amber + cold steel colour contrast, 8K, award-winning architectural photography`,

  video: `## Video Concept
60-second explainer showing how AI prompt engineering transforms vague ideas into production-ready outputs — viewers must feel "I need this tool."

## Format & Platform
Short-form explainer · YouTube Shorts / TikTok / Instagram Reels · 9:16 vertical

## Visual Style
Screen recording with animated overlays · Clean UI focus · Fast-paced cuts (3–4s per scene) · Vibrant gradient accents (orange-to-purple) · Modern sans-serif text overlays

## Target Audience
Developers, content creators, marketers using AI daily — frustrated with inconsistent results, want professional-grade prompts without trial-and-error

## Structure & Script Outline
0–5s: Hook — "Your AI is only as good as your prompt" (bold text + visual of bad AI output)
5–15s: Problem — Show messy prompt → poor result (side-by-side comparison)
15–40s: Solution — Demo NexPrompt: paste idea → pick strategy → stream optimized prompt
40–55s: Result — Show same input now producing perfect output
55–60s: CTA — "Start free at nexprompt.site" (logo + URL overlay)

## Tone & Presenter Style
No presenter · Voiceover: confident, fast-paced, direct · Upbeat electronic background music

## Key Messages
1. Bad prompts = wasted time & money
2. NexPrompt = instant professional prompts
3. Works with all major AI providers

## Visual & Audio Elements
B-roll: typing animations, AI provider logos, before/after comparisons · Music: upbeat tech (120 BPM) · Text: bold sans-serif, high contrast

## Call to Action
"Try free — no card required" button overlay at 55s

## Production Notes
1080×1920 (9:16) · Captions required · Brand orange (#FF4D1C) for CTAs`,
};

const STEPS = [
  { n:'01', title:'Describe your goal', body:'Write what you want in plain language — no prompting expertise required.', Icon:MessageSquare },
  { n:'02', title:'Choose a strategy', body:'Five domain-tuned strategies for Chatbot, Coding, Writing, Research, and Image.', Icon:Zap },
  { n:'03', title:'Pick your AI', body:'Groq, SambaNova, Anthropic, Gemini, or OpenCode — switch anytime, mid-session.', Icon:Cpu },
  { n:'04', title:'Stream the result', body:'Watch a superior AI response appear in real time. Cancel, refine, repeat.', Icon:Sparkles },
];

const PROVIDERS = [
  { name:'Groq',      model:'LLaMA 3.3 70B',        tag:'Fastest',   color:'#00C896' },
  { name:'SambaNova', model:'DeepSeek-V3.1',        tag:'Powerful',  color:'#3B9EFF' },
  { name:'Anthropic', model:'Claude 3.5 Sonnet',     tag:'Nuanced',   color:'#A855F7' },
  { name:'Gemini',    model:'Gemini 2.0 Flash',      tag:'Versatile', color:'#FFB800' },
  { name:'OpenCode',  model:'DeepSeek V4',            tag:'Code-first',color:'#FF4D1C' },
];

const PLANS = [
  { name:'Free',       price:'₹0',  mo:true,  features:['50 prompts / month','1 AI provider','10 free templates','Conversation history'], to:'/register' },
  { name:'Pro',        price:'₹19', mo:true,  features:['Unlimited prompts','All 5 providers','All 24+ templates','Email support','7-day trial'], to:'/subscription', hot:true },
  { name:'Team',       price:'₹49', mo:true,  features:['Everything in Pro','Team workspace (3+ seats)','Custom strategies','API access','Dedicated manager','14-day trial'], to:'/subscription' },
];

/* ─── Typewriter ─────────────────────────────────────────────── */
const TAGLINES = [
  'Your AI is only as good as your prompt.',
  'Stop guessing. Start forging.',
  'From rough idea to precision prompt.',
  'The layer between you and better AI.',
];
function useTypewriter(texts, ts=48, ds=28, pause=2200) {
  const [display, setDisplay] = useState('');
  const [ti, setTi] = useState(0);
  const [ci, setCi] = useState(0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    const cur = texts[ti];
    const id = setTimeout(() => {
      if (!del) {
        if (ci < cur.length) { setDisplay(cur.slice(0,ci+1)); setCi(c=>c+1); }
        else setTimeout(()=>setDel(true), pause);
      } else {
        if (ci > 0) { setDisplay(cur.slice(0,ci-1)); setCi(c=>c-1); }
        else { setDel(false); setTi(i=>(i+1)%texts.length); }
      }
    }, del ? ds : ts);
    return ()=>clearTimeout(id);
  }, [ci, del, ti, texts, ts, ds, pause]);
  return display;
}

/* ─── Count-up ───────────────────────────────────────────────── */
function useCountUp(target, dur=1800) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const t0 = Date.now();
        const tick = ()=>{
          const p = Math.min((Date.now()-t0)/dur,1);
          setN(Math.floor((1-Math.pow(1-p,3))*target));
          if (p<1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    },{threshold:0.4});
    if (ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[target,dur]);
  return [n, ref];
}

/* ─── Noise texture SVG ──────────────────────────────────────── */
const Noise = () => (
  <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.035,pointerEvents:'none',zIndex:1}} xmlns="http://www.w3.org/2000/svg">
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    <rect width="100%" height="100%" filter="url(#noise)"/>
  </svg>
);

/* ─── Ember particles ────────────────────────────────────────── */
function Embers({ count=18 }) {
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      {Array.from({length:count}).map((_,i)=>(
        <motion.div key={i}
          style={{
            position:'absolute',
            width: 2+Math.random()*3,
            height: 2+Math.random()*3,
            borderRadius:'50%',
            background: i%3===0 ? TOKEN.forge : i%3===1 ? TOKEN.gold : '#fff',
            left:`${5+Math.random()*90}%`,
            top:`${Math.random()*100}%`,
          }}
          animate={{ y:[0,-(60+Math.random()*80),0], opacity:[0,0.7,0], scale:[0.5,1,0.5] }}
          transition={{ duration:3+Math.random()*5, repeat:Infinity, delay:Math.random()*4, ease:'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ─── Live Demo Widget ───────────────────────────────────────── */
function LiveDemo() {
  const [uc, setUc] = useState('chatbot');
  const [raw, setRaw] = useState('');
  const [out, setOut] = useState('');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const outRef = useRef(null);
  const ivRef = useRef(null);

  const PLACEHOLDER = {
    chatbot:'I need a support bot that helps users reset passwords without frustration.',
    coding:'Build me a Node.js API for user registration with validation.',
    writing:'Write a landing page headline for a remote-team productivity tool.',
    research:'How are enterprise teams adopting AI coding assistants?',
    image:'A futuristic library at sunset with holographic books.',
  };

  const run = useCallback(()=>{
    if (!raw.trim()||running) return;
    setRunning(true); setDone(false); setOut('');
    const result = DEMO[uc];
    let i=0;
    ivRef.current = setInterval(()=>{
      if (i<result.length) {
        setOut(result.slice(0,++i));
        if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
      } else {
        clearInterval(ivRef.current);
        setRunning(false); setDone(true);
      }
    }, 12);
  },[raw,uc,running]);

  const reset = ()=>{ clearInterval(ivRef.current); setOut(''); setDone(false); setRunning(false); };

  const cur = USE_CASES.find(u=>u.id===uc);

  return (
    <div style={{
      background:'rgba(10,10,15,0.85)',
      border:`1px solid rgba(255,77,28,0.18)`,
      borderRadius:20,
      overflow:'hidden',
      backdropFilter:'blur(24px)',
      boxShadow:'0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
    }}>
      {/* Window chrome */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <span style={{width:12,height:12,borderRadius:'50%',background:'#FF5F57'}}/>
        <span style={{width:12,height:12,borderRadius:'50%',background:'#FFBD2E'}}/>
        <span style={{width:12,height:12,borderRadius:'50%',background:'#28C840'}}/>
        <span style={{marginLeft:8,fontSize:11,color:'rgba(255,255,255,0.25)',fontFamily:'monospace'}}>nexprompt — workspace</span>
        <span style={{marginLeft:'auto',fontSize:10,color:TOKEN.forge,opacity:0.7}}>● LIVE</span>
      </div>

      <div style={{padding:'20px 20px 24px'}}>
        {/* Use case pills */}
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:16}}>
          {USE_CASES.map(u=>{
            const active = u.id===uc;
            return (
              <button key={u.id} onClick={()=>{setUc(u.id);reset();}}
                style={{
                  display:'flex',alignItems:'center',gap:6,
                  padding:'7px 14px',borderRadius:99,border:'none',cursor:'pointer',
                  whiteSpace:'nowrap',fontSize:12,fontWeight:500,
                  background: active ? u.accent+'22' : 'rgba(255,255,255,0.04)',
                  color: active ? u.accent : 'rgba(255,255,255,0.35)',
                  outline: active ? `1px solid ${u.accent}44` : '1px solid transparent',
                  transition:'all 0.18s',
                }}>
                <u.Icon size={13}/>{u.label}
              </button>
            );
          })}
        </div>

        {/* Input */}
        <div style={{position:'relative',marginBottom:12}}>
          <textarea
            value={raw}
            onChange={e=>setRaw(e.target.value)}
            placeholder={PLACEHOLDER[uc]}
            rows={2}
            style={{
              width:'100%',boxSizing:'border-box',
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:12,padding:'12px 14px',
              color:'rgba(255,255,255,0.85)',fontSize:13,
              outline:'none',resize:'none',
              fontFamily:'inherit',lineHeight:1.55,
            }}
            onFocus={e=>e.target.style.borderColor='rgba(255,77,28,0.5)'}
            onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Forge button */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:out?16:0}}>
          <motion.button
            onClick={run}
            disabled={!raw.trim()||running}
            whileHover={raw.trim()&&!running?{scale:1.03}:{}}
            whileTap={raw.trim()&&!running?{scale:0.97}:{}}
            style={{
              display:'flex',alignItems:'center',gap:8,
              padding:'10px 22px',borderRadius:99,border:'none',cursor:raw.trim()&&!running?'pointer':'not-allowed',
              background: raw.trim()&&!running
                ? `linear-gradient(135deg, ${TOKEN.forge}, ${TOKEN.ember})`
                : 'rgba(255,255,255,0.07)',
              color:'white',fontSize:13,fontWeight:600,
              opacity:raw.trim()||running?1:0.4,
              boxShadow: raw.trim()&&!running ? `0 4px 24px ${TOKEN.forgeGlow}` : 'none',
              transition:'all 0.2s',
            }}>
            {running
              ? <motion.span animate={{rotate:360}} transition={{repeat:Infinity,duration:0.8,ease:'linear'}} style={{display:'inline-block',width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff'}}/>
              : <Sparkles size={14}/>}
            {running ? 'Forging...' : 'Forge Prompt'}
          </motion.button>
          {done && <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>{out.length} chars · optimized</span>}
        </div>

        {/* Output */}
        <AnimatePresence>
          {out && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
              <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <span style={{
                    display:'inline-flex',alignItems:'center',gap:5,
                    fontSize:11,fontWeight:600,color:cur.accent,
                    background:cur.accent+'18',borderRadius:99,padding:'3px 10px',
                  }}>
                    <cur.Icon size={10}/>{cur.label} · optimized
                  </span>
                </div>
                <div ref={outRef} style={{
                  maxHeight:200,overflowY:'auto',
                  background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:10,padding:'14px 16px',
                  fontSize:12,lineHeight:1.7,whiteSpace:'pre-wrap',
                  fontFamily:'monospace',color:'rgba(255,255,255,0.7)',
                }}>
                  {out}
                  {running && (
                    <motion.span animate={{opacity:[1,0]}} transition={{repeat:Infinity,duration:0.7}}
                      style={{display:'inline-block',width:7,height:13,background:TOKEN.forge,marginLeft:2,verticalAlign:'text-bottom'}}/>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────── */
function StatCard({ value, suffix, label, Icon }) {
  const [n, ref] = useCountUp(value);
  return (
    <motion.div ref={ref}
      initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
      style={{textAlign:'center',padding:'28px 16px',
        background:'rgba(255,255,255,0.025)',
        border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,
      }}>
      <div style={{
        width:44,height:44,borderRadius:12,margin:'0 auto 14px',
        background:TOKEN.forgeGlow,display:'flex',alignItems:'center',justifyContent:'center',
      }}>
        <Icon size={20} color={TOKEN.forge}/>
      </div>
      <div style={{fontSize:36,fontWeight:700,
        background:`linear-gradient(135deg,${TOKEN.forge},${TOKEN.gold})`,
        WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
        fontFamily:'"Clash Display",sans-serif',
      }}>{n}{suffix}</div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.35)',marginTop:4}}>{label}</div>
    </motion.div>
  );
}

/* ─── Section heading ────────────────────────────────────────── */
function SectionHead({ tag, title, sub }) {
  return (
    <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
      style={{textAlign:'center',marginBottom:56}}>
      {tag && (
        <span style={{
          display:'inline-block',fontSize:11,fontWeight:700,letterSpacing:'0.12em',
          textTransform:'uppercase',color:TOKEN.forge,
          background:TOKEN.forgeGlow,borderRadius:99,padding:'4px 14px',marginBottom:16,
        }}>{tag}</span>
      )}
      <h2 style={{fontSize:'clamp(28px,4vw,44px)',fontWeight:700,margin:'0 0 14px',lineHeight:1.15,
        fontFamily:'"Clash Display",sans-serif',color:'#fff',
      }}>{title}</h2>
      {sub && <p style={{fontSize:16,color:'rgba(255,255,255,0.4)',maxWidth:480,margin:'0 auto',lineHeight:1.65}}>{sub}</p>}
    </motion.div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function Landing() {
  const tagline = useTypewriter(TAGLINES);
  const [activeUc, setActiveUc] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0,80], ['rgba(10,10,15,0)', 'rgba(10,10,15,0.92)']);

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });

  return (
    <div style={{ background:TOKEN.ink, color:'#fff', minHeight:'100vh', fontFamily:'"Satoshi",system-ui,sans-serif', overflowX:'hidden' }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${TOKEN.forge}55; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${TOKEN.forge}55; border-radius: 4px; }
        .forge-grad { background: linear-gradient(135deg, ${TOKEN.forge}, ${TOKEN.gold}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .provider-card:hover { border-color: rgba(255,255,255,0.18) !important; transform: translateY(-6px) !important; }
        .plan-card { transition: transform 0.25s, border-color 0.25s; }
        .plan-card:hover { transform: translateY(-6px); }
        .step-card:hover .step-icon { transform: scale(1.12); }
      `}</style>

      {/* ── Header ── */}
      <motion.header style={{
        position:'fixed',top:0,left:0,right:0,zIndex:100,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'0 clamp(16px,4vw,48px)',height:64,
        background:headerBg,
        backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
      }}>
        <span onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
          style={{fontSize:20,fontWeight:800,cursor:'pointer',fontFamily:'"Syne",sans-serif',
            background:`linear-gradient(90deg,${TOKEN.forge},${TOKEN.gold})`,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
          }}>
          NexPrompt
        </span>

        <nav style={{display:'flex',alignItems:'center',gap:32}}>
          {[['how-it-works','Process'],['strategies','Strategies'],['providers','Models'],['pricing','Pricing']].map(([id,label])=>(
            <button key={id} onClick={()=>scrollTo(id)}
              style={{background:'none',border:'none',color:'rgba(255,255,255,0.45)',fontSize:13,fontWeight:500,cursor:'pointer',transition:'color 0.15s'}}
              onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.45)'}>
              {label}
            </button>
          ))}
        </nav>

        <div style={{display:'flex',gap:8}}>
          <Link to="/login" style={{
            padding:'8px 18px',borderRadius:99,border:'1px solid rgba(255,255,255,0.12)',
            color:'rgba(255,255,255,0.6)',fontSize:13,fontWeight:500,textDecoration:'none',
            transition:'all 0.15s',
          }}
          onMouseEnter={e=>{e.target.style.borderColor='rgba(255,255,255,0.3)';e.target.style.color='#fff';}}
          onMouseLeave={e=>{e.target.style.borderColor='rgba(255,255,255,0.12)';e.target.style.color='rgba(255,255,255,0.6)';}}>
            Sign in
          </Link>
          <Link to="/register" style={{
            padding:'8px 18px',borderRadius:99,
            background:`linear-gradient(135deg,${TOKEN.forge},${TOKEN.ember})`,
            color:'#fff',fontSize:13,fontWeight:600,textDecoration:'none',
            boxShadow:`0 4px 16px ${TOKEN.forgeGlow}`,
            transition:'opacity 0.15s',
          }}
          onMouseEnter={e=>e.target.style.opacity='0.85'} onMouseLeave={e=>e.target.style.opacity='1'}>
            Get started free
          </Link>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section style={{
        position:'relative',minHeight:'100vh',display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',
        padding:'120px clamp(16px,6vw,80px) 80px',textAlign:'center',
        overflow:'hidden',
      }}>
        <Noise/>
        <Embers count={22}/>

        {/* Background glow */}
        <div style={{position:'absolute',top:'20%',left:'50%',transform:'translateX(-50%)',
          width:700,height:500,borderRadius:'50%',
          background:`radial-gradient(ellipse, ${TOKEN.forge}12 0%, transparent 65%)`,
          pointerEvents:'none',zIndex:0,
        }}/>

        {/* Grid lines */}
        <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,
          backgroundImage:`linear-gradient(rgba(255,77,28,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,28,0.05) 1px, transparent 1px)`,
          backgroundSize:'60px 60px',
        }}/>

        <div style={{position:'relative',zIndex:2}}>
          <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
            <span style={{
              display:'inline-flex',alignItems:'center',gap:8,
              fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
              color:TOKEN.forge,background:TOKEN.forgeGlow,
              border:`1px solid ${TOKEN.forge}33`,borderRadius:99,padding:'6px 16px',marginBottom:28,
            }}>
              <Sparkles size={11}/>  AI Prompt Engineering Platform
            </span>
          </motion.div>

          <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.6}}
            style={{
              fontSize:'clamp(44px,8vw,100px)',fontWeight:800,lineHeight:1.0,
              fontFamily:'"Syne",sans-serif',letterSpacing:'-0.03em',
              maxWidth:900,margin:'0 auto 24px',
            }}>
            Forge perfect<br/>
            <span className="forge-grad">prompts</span> with AI
          </motion.h1>

          <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.25}}
            style={{fontSize:18,color:'rgba(255,255,255,0.45)',maxWidth:520,margin:'0 auto 40px',lineHeight:1.6,minHeight:28}}>
            {tagline}
            <motion.span animate={{opacity:[1,0]}} transition={{repeat:Infinity,duration:0.75}}
              style={{display:'inline-block',width:2,height:18,background:TOKEN.forge,marginLeft:3,verticalAlign:'middle'}}/>
          </motion.p>

          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.35}}
            style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:64}}>
            <Link to="/register" style={{
              display:'inline-flex',alignItems:'center',gap:8,
              padding:'14px 32px',borderRadius:99,
              background:`linear-gradient(135deg,${TOKEN.forge},${TOKEN.ember})`,
              color:'#fff',fontSize:15,fontWeight:700,textDecoration:'none',
              boxShadow:`0 8px 32px ${TOKEN.forgeGlow}`,
              transition:'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e=>{e.target.style.transform='translateY(-2px)';e.target.style.boxShadow=`0 12px 40px ${TOKEN.forge}55`;}}
            onMouseLeave={e=>{e.target.style.transform='translateY(0)';e.target.style.boxShadow=`0 8px 32px ${TOKEN.forgeGlow}`;}}>
              Start building <ArrowRight size={15}/>
            </Link>
            <button onClick={()=>scrollTo('strategies')} style={{
              display:'inline-flex',alignItems:'center',gap:8,
              padding:'14px 32px',borderRadius:99,
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.12)',
              color:'rgba(255,255,255,0.7)',fontSize:15,fontWeight:600,cursor:'pointer',
              transition:'all 0.2s',
            }}
            onMouseEnter={e=>{e.target.style.background='rgba(255,255,255,0.08)';e.target.style.borderColor='rgba(255,255,255,0.25)';e.target.style.color='#fff';}}
            onMouseLeave={e=>{e.target.style.background='rgba(255,255,255,0.04)';e.target.style.borderColor='rgba(255,255,255,0.12)';e.target.style.color='rgba(255,255,255,0.7)';}}>
              <Play size={14}/> See it work
            </button>
          </motion.div>

          {/* Demo */}
          <motion.div initial={{opacity:0,y:32}} animate={{opacity:1,y:0}} transition={{delay:0.5,duration:0.7}}
            style={{maxWidth:700,margin:'0 auto',width:'100%'}}>
            <LiveDemo/>
          </motion.div>

          <motion.button initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.4}}
            onClick={()=>scrollTo('how-it-works')}
            style={{
              background:'none',border:'none',cursor:'pointer',
              display:'flex',flexDirection:'column',alignItems:'center',gap:6,
              color:'rgba(255,255,255,0.2)',marginTop:48,
              transition:'color 0.2s',
            }}
            onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.5)'}
            onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.2)'}>
            <span style={{fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase'}}>Explore</span>
            <motion.div animate={{y:[0,5,0]}} transition={{repeat:Infinity,duration:1.6}}>
              <ChevronDown size={16}/>
            </motion.div>
          </motion.button>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{padding:'60px clamp(16px,6vw,80px)',maxWidth:900,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16}}>
          {[
            {value:24,suffix:'+',label:'Expert Templates',Icon:Sparkles},
            {value:5,suffix:'',label:'AI Providers',Icon:Cpu},
            {value:99,suffix:'%',label:'Uptime SLA',Icon:Shield},
            {value:3,suffix:'K+',label:'Active Users',Icon:Users},
          ].map((s,i)=>(
            <motion.div key={s.label} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.09}}>
              <StatCard {...s}/>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{padding:'80px clamp(16px,6vw,80px)',maxWidth:1100,margin:'0 auto'}}>
        <SectionHead tag="Process" title="Four steps to a better prompt" sub="From rough idea to optimized AI response — in under 10 seconds."/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:20,position:'relative'}}>
          {/* Connector line */}
          <div style={{position:'absolute',top:36,left:'12%',right:'12%',height:1,
            background:`linear-gradient(90deg,transparent,${TOKEN.forge}44,transparent)`,
            display:'none',
          }}/>
          {STEPS.map((s,i)=>(
            <motion.div key={s.n} className="step-card"
              initial={{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.12}}
              style={{
                background:'rgba(255,255,255,0.025)',
                border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:18,padding:'32px 24px',
                position:'relative',overflow:'hidden',
              }}>
              <div style={{
                position:'absolute',top:16,right:20,
                fontSize:48,fontWeight:800,color:'rgba(255,255,255,0.03)',
                fontFamily:'"Syne",sans-serif',lineHeight:1,
              }}>{s.n}</div>
              <div className="step-icon" style={{
                width:52,height:52,borderRadius:14,marginBottom:20,
                background:TOKEN.forgeGlow,
                border:`1px solid ${TOKEN.forge}33`,
                display:'flex',alignItems:'center',justifyContent:'center',
                transition:'transform 0.25s',
              }}>
                <s.Icon size={22} color={TOKEN.forge}/>
              </div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.1em',color:TOKEN.forge,textTransform:'uppercase',marginBottom:8}}>{s.n}</div>
              <h3 style={{fontSize:17,fontWeight:700,marginBottom:10,fontFamily:'"Syne",sans-serif'}}>{s.title}</h3>
              <p style={{fontSize:13,color:'rgba(255,255,255,0.4)',lineHeight:1.65}}>{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Strategies ── */}
      <section id="strategies" style={{padding:'80px clamp(16px,6vw,80px)',maxWidth:1100,margin:'0 auto'}}>
        <SectionHead tag="Strategies" title={<>One tool, <span className="forge-grad">five domains</span></>} sub="Each use case has a dedicated strategy engine tuned for its domain."/>

        {/* Tabs */}
        <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:10,marginBottom:32}}>
          {USE_CASES.map((u,i)=>(
            <motion.button key={u.id} onClick={()=>setActiveUc(i)}
              whileTap={{scale:0.96}}
              style={{
                display:'flex',alignItems:'center',gap:8,
                padding:'10px 20px',borderRadius:99,border:'none',cursor:'pointer',
                fontSize:13,fontWeight:600,transition:'all 0.2s',
                background: activeUc===i ? u.accent : 'rgba(255,255,255,0.05)',
                color: activeUc===i ? '#fff' : 'rgba(255,255,255,0.4)',
                boxShadow: activeUc===i ? `0 4px 20px ${u.accent}44` : 'none',
              }}>
              <u.Icon size={14}/>{u.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeUc}
            initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:0.22}}>
            <div style={{
              background:'rgba(255,255,255,0.025)',
              border:`1px solid ${USE_CASES[activeUc].accent}33`,
              borderRadius:20,padding:'28px 32px',maxWidth:780,margin:'0 auto',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
                <div style={{
                  width:48,height:48,borderRadius:14,
                  background:USE_CASES[activeUc].accent+'20',
                  border:`1px solid ${USE_CASES[activeUc].accent}44`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}>
                  {React.createElement(USE_CASES[activeUc].Icon, {size:22,color:USE_CASES[activeUc].accent})}
                </div>
                <div>
                  <h3 style={{fontSize:16,fontWeight:700,fontFamily:'"Syne",sans-serif'}}>{USE_CASES[activeUc].label} Strategy</h3>
                  <p style={{fontSize:12,color:'rgba(255,255,255,0.35)',marginTop:2}}>Optimized output format for this domain</p>
                </div>
              </div>
              <div style={{
                background:'rgba(0,0,0,0.4)',borderRadius:12,padding:'18px 20px',
                fontFamily:'monospace',fontSize:12,lineHeight:1.75,
                color:'rgba(255,255,255,0.65)',whiteSpace:'pre-wrap',maxHeight:260,overflowY:'auto',
                border:'1px solid rgba(255,255,255,0.06)',
              }}>
                {DEMO[USE_CASES[activeUc].id]}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── Providers ── */}
      <section id="providers" style={{padding:'80px clamp(16px,6vw,80px)',maxWidth:1100,margin:'0 auto'}}>
        <SectionHead tag="AI Models" title={<>Powered by <span className="forge-grad">top providers</span></>} sub="Switch between providers at any time — pick the right model for each task."/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:16}}>
          {PROVIDERS.map((p,i)=>(
            <motion.div key={p.name} className="provider-card"
              initial={{opacity:0,scale:0.92}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:i*0.08}}
              style={{
                background:'rgba(255,255,255,0.025)',
                border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:16,padding:'28px 20px',textAlign:'center',
                cursor:'default',transition:'all 0.25s',
              }}>
              <div style={{
                width:52,height:52,borderRadius:16,margin:'0 auto 16px',
                background:p.color+'18',border:`1px solid ${p.color}33`,
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>
                <Cpu size={22} color={p.color}/>
              </div>
              <h3 style={{fontSize:15,fontWeight:700,fontFamily:'"Syne",sans-serif',marginBottom:4}}>{p.name}</h3>
              <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:12}}>{p.model}</p>
              <span style={{
                display:'inline-block',fontSize:10,fontWeight:700,
                padding:'3px 12px',borderRadius:99,
                background:p.color+'18',color:p.color,
                border:`1px solid ${p.color}33`,
              }}>{p.tag}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{padding:'80px clamp(16px,6vw,80px)',maxWidth:1100,margin:'0 auto'}}>
        <SectionHead tag="Features" title="Built for serious AI users" sub="Every detail designed for developers, writers, and teams who work with AI every day."/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:20}}>
          {[
            { title:'Smart prompt engine', body:'Five battle-tested strategies transform rough ideas into precision-crafted prompts tuned for each domain.', Icon:Zap, color:TOKEN.forge },
            { title:'Real-time streaming', body:'Watch AI responses appear token by token. Cancel mid-generation, refine your prompt, stream again — instantly.', Icon:MessageSquare, color:'#00C896' },
            { title:'Prompt refinement', body:'Click Refine and the AI asks you clarifying questions first — so the output fits exactly what you had in mind.', Icon:Search, color:'#3B9EFF' },
            { title:'Template marketplace', body:'24+ ready-to-use prompts across all categories. Start with free templates, unlock advanced ones with Pro.', Icon:Star, color:TOKEN.gold },
            { title:'Conversation history', body:'Every prompt and response is saved. Revisit, fork, and build on your best work anytime.', Icon:MessageSquare, color:'#A855F7' },
            { title:'Multi-provider switching', body:'Your prompts are never locked to one AI. Switch providers mid-session to find the best result for any task.', Icon:Cpu, color:'#FF6B3D' },
          ].map((f,i)=>(
            <motion.div key={f.title}
              initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.08}}
              style={{
                background:'rgba(255,255,255,0.025)',
                border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:16,padding:'28px 24px',
                transition:'border-color 0.25s, transform 0.25s',
              }}
              whileHover={{y:-6,borderColor:`${f.color}44`}}>
              <div style={{
                width:48,height:48,borderRadius:14,marginBottom:18,
                background:f.color+'18',border:`1px solid ${f.color}33`,
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>
                <f.Icon size={22} color={f.color}/>
              </div>
              <h3 style={{fontSize:15,fontWeight:700,marginBottom:10,fontFamily:'"Syne",sans-serif'}}>{f.title}</h3>
              <p style={{fontSize:13,color:'rgba(255,255,255,0.4)',lineHeight:1.7}}>{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{padding:'80px clamp(16px,6vw,80px)',maxWidth:1000,margin:'0 auto'}}>
        <SectionHead tag="Pricing" title="Simple, honest pricing" sub="Start free. Upgrade when you need more power. No hidden fees."/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:20}}>
          {PLANS.map((p,i)=>(
            <motion.div key={p.name} className="plan-card"
              initial={{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}
              style={{
                background: p.hot ? 'rgba(255,77,28,0.06)' : 'rgba(255,255,255,0.025)',
                border: p.hot ? `1px solid ${TOKEN.forge}55` : '1px solid rgba(255,255,255,0.07)',
                borderRadius:20,padding:'32px 28px',display:'flex',flexDirection:'column',
                position:'relative',overflow:'hidden',
              }}>
              {p.hot && (
                <div style={{
                  position:'absolute',top:0,left:0,right:0,height:2,
                  background:`linear-gradient(90deg,${TOKEN.forge},${TOKEN.gold})`,
                }}/>
              )}
              {p.hot && (
                <div style={{
                  display:'inline-flex',alignItems:'center',gap:5,
                  fontSize:10,fontWeight:700,color:TOKEN.forge,
                  background:TOKEN.forgeGlow,border:`1px solid ${TOKEN.forge}33`,
                  borderRadius:99,padding:'4px 12px',marginBottom:16,alignSelf:'flex-start',
                  textTransform:'uppercase',letterSpacing:'0.08em',
                }}>
                  <Star size={9}/> Most popular
                </div>
              )}
              <h3 style={{fontSize:18,fontWeight:700,fontFamily:'"Syne",sans-serif',marginBottom:8}}>{p.name}</h3>
              <div style={{marginBottom:24}}>
                <span style={{
                  fontSize:42,fontWeight:800,fontFamily:'"Syne",sans-serif',
                  background:`linear-gradient(135deg,${TOKEN.forge},${TOKEN.gold})`,
                  WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
                }}>{p.price}</span>
                <span style={{fontSize:14,color:'rgba(255,255,255,0.35)',marginLeft:4}}>/mo</span>
              </div>
              <ul style={{listStyle:'none',flex:1,marginBottom:28,display:'flex',flexDirection:'column',gap:12}}>
                {p.features.map(f=>(
                  <li key={f} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'rgba(255,255,255,0.6)'}}>
                    <Check size={14} color={TOKEN.forge} style={{flexShrink:0}}/>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={p.to} style={{
                display:'block',textAlign:'center',padding:'13px 0',borderRadius:99,
                background: p.hot ? `linear-gradient(135deg,${TOKEN.forge},${TOKEN.ember})` : 'rgba(255,255,255,0.07)',
                border: p.hot ? 'none' : '1px solid rgba(255,255,255,0.12)',
                color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none',
                boxShadow: p.hot ? `0 4px 24px ${TOKEN.forgeGlow}` : 'none',
                transition:'opacity 0.2s',
              }}
              onMouseEnter={e=>e.target.style.opacity='0.85'} onMouseLeave={e=>e.target.style.opacity='1'}>
                {p.name==='Free' ? 'Get started free' : 'Subscribe now'} <ArrowUpRight size={12} style={{display:'inline',verticalAlign:'middle'}}/>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{padding:'80px clamp(16px,6vw,80px) 100px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <Embers count={10}/>
        <div style={{
          position:'absolute',inset:0,
          background:`radial-gradient(ellipse at center, ${TOKEN.forge}10 0%, transparent 65%)`,
          pointerEvents:'none',
        }}/>
        <motion.div initial={{opacity:0,scale:0.96}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}
          style={{
            maxWidth:660,margin:'0 auto',
            background:'rgba(255,255,255,0.025)',
            border:`1px solid ${TOKEN.forge}25`,
            borderRadius:28,padding:'60px 48px',
            backdropFilter:'blur(12px)',
            position:'relative',
          }}>
          <div style={{
            position:'absolute',top:0,left:'20%',right:'20%',height:1,
            background:`linear-gradient(90deg,transparent,${TOKEN.forge}66,transparent)`,
          }}/>
          <h2 style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,lineHeight:1.1,fontFamily:'"Syne",sans-serif',marginBottom:16}}>
            Ready to <span className="forge-grad">forge</span><br/>better prompts?
          </h2>
          <p style={{fontSize:16,color:'rgba(255,255,255,0.4)',marginBottom:36,lineHeight:1.65}}>
            Join thousands of users who stopped guessing and started getting better AI results — in seconds.
          </p>
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
            <Link to="/register" style={{
              display:'inline-flex',alignItems:'center',gap:8,
              padding:'14px 32px',borderRadius:99,
              background:`linear-gradient(135deg,${TOKEN.forge},${TOKEN.ember})`,
              color:'#fff',fontSize:15,fontWeight:700,textDecoration:'none',
              boxShadow:`0 8px 32px ${TOKEN.forgeGlow}`,
            }}>
              Get started — it's free <ArrowRight size={15}/>
            </Link>
            <Link to="/templates" style={{
              display:'inline-flex',alignItems:'center',gap:8,
              padding:'14px 32px',borderRadius:99,
              background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',
              color:'rgba(255,255,255,0.7)',fontSize:15,fontWeight:600,textDecoration:'none',
            }}>
              Browse templates
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop:'1px solid rgba(255,255,255,0.06)',
        padding:'40px clamp(16px,6vw,80px)',
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:24,marginBottom:24}}>
          <span style={{
            fontSize:18,fontWeight:800,fontFamily:'"Syne",sans-serif',
            background:`linear-gradient(90deg,${TOKEN.forge},${TOKEN.gold})`,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
          }}>NexPrompt</span>
          <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
            {[['Sign in','/login'],['Get started','/register'],['Templates','/templates']].map(([label,to])=>(
              <Link key={to} to={to} style={{fontSize:12,color:'rgba(255,255,255,0.3)',textDecoration:'none',transition:'color 0.15s'}}
                onMouseEnter={e=>e.target.style.color='rgba(255,255,255,0.7)'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.3)'}>
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,paddingTop:24,borderTop:'1px solid rgba(255,255,255,0.04)'}}>
          <p style={{fontSize:12,color:'rgba(255,255,255,0.25)'}}>© 2026 NexPrompt. Craft perfect prompts with AI.</p>
          <div style={{display:'flex',gap:20}}>
            {[['Terms & Conditions','/terms'],['Privacy Policy','/privacy']].map(([label,to])=>(
              <Link key={to} to={to} style={{fontSize:11,color:'rgba(255,255,255,0.25)',textDecoration:'none',transition:'color 0.15s'}}
                onMouseEnter={e=>e.target.style.color='rgba(255,255,255,0.5)'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.25)'}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}