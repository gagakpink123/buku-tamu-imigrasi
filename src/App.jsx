import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, RefreshCw, PenTool, User, MapPin, Phone, Send, CheckCircle2,
  Settings, List, Copy, Check, Trash2, HelpCircle,
  X, AlertCircle, Download, FolderOpen, Lock, Unlock, ShieldCheck,
  Clock, Calendar, Search, Info, LogOut, ChevronRight, ChevronDown,
  Edit3, Save, ArrowLeft, Trash, Printer, ExternalLink, Palette, ImagePlus, Crop
} from 'lucide-react';

// 1. IMPORT FIREBASE (Koneksi Database Cloud)
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

// ==========================================
// KONFIGURASI FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDBpslV-mau0ENE3JllX5r4nDB5_7PGXek",
  authDomain: "buku-tamu-5bfdd.firebaseapp.com",
  projectId: "buku-tamu-5bfdd",
  storageBucket: "buku-tamu-5bfdd.firebasestorage.app",
  messagingSenderId: "467168216766",
  appId: "1:467168216766:web:e1322874f74d05ddbfc0ef",
  measurementId: "G-PW30Y9WYQ6"
};

let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase berjalan dalam mode lokal (fallback).");
}

// ==========================================
// KONFIGURASI TEMA APLIKASI (GRADIENT ELEGAN)
// ==========================================
const THEMES = {
  'biru': {
    label: 'Biru (Navy & Royal Gradient)',
    headerBg: 'bg-gradient-to-r from-[#001E3D] to-[#003B73]',
    headerText: 'text-white',
    subHeaderBg: 'bg-gradient-to-r from-[#003B73] to-[#0056B3]',
    subHeaderText: 'text-white',
    footerBg: '#001E3D',
    footerText: 'text-blue-100',
    button: 'bg-[#007AFF] hover:bg-[#0062CC] text-white',
    text: 'text-[#007AFF]',
    border: 'focus:border-[#007AFF]',
    lightBg: 'bg-blue-50/60',
    lightBorder: 'border-blue-200',
    hexHeader: '#001E3D'
  },
  'biru muda': {
    label: 'Biru Muda (Ocean Gradient)',
    headerBg: 'bg-gradient-to-r from-[#034A72] to-[#0284C7]',
    headerText: 'text-white',
    subHeaderBg: 'bg-gradient-to-r from-[#0284C7] to-[#38BDF8]',
    subHeaderText: 'text-white',
    footerBg: '#034A72',
    footerText: 'text-sky-100',
    button: 'bg-[#0EA5E9] hover:bg-[#0284C7] text-white',
    text: 'text-[#0EA5E9]',
    border: 'focus:border-[#0EA5E9]',
    lightBg: 'bg-sky-50/60',
    lightBorder: 'border-sky-200',
    hexHeader: '#034A72'
  },
  'hijau': {
    label: 'Hijau (Forest & Emerald Gradient)',
    headerBg: 'bg-gradient-to-r from-[#022C22] to-[#064E3B]',
    headerText: 'text-white',
    subHeaderBg: 'bg-gradient-to-r from-[#064E3B] to-[#059669]',
    subHeaderText: 'text-white',
    footerBg: '#022C22',
    footerText: 'text-emerald-100',
    button: 'bg-[#10B981] hover:bg-[#059669] text-white',
    text: 'text-[#10B981]',
    border: 'focus:border-[#10B981]',
    lightBg: 'bg-emerald-50/60',
    lightBorder: 'border-emerald-200',
    hexHeader: '#022C22'
  },
  'turquoise': {
    label: 'Turquoise (Deep Teal Gradient)',
    headerBg: 'bg-gradient-to-r from-[#042F2E] to-[#115E59]',
    headerText: 'text-white',
    subHeaderBg: 'bg-gradient-to-r from-[#115E59] to-[#0D9488]',
    subHeaderText: 'text-white',
    footerBg: '#042F2E',
    footerText: 'text-teal-100',
    button: 'bg-[#14B8A6] hover:bg-[#0D9488] text-white',
    text: 'text-[#14B8A6]',
    border: 'focus:border-[#14B8A6]',
    lightBg: 'bg-teal-50/60',
    lightBorder: 'border-teal-200',
    hexHeader: '#042F2E'
  },
  'maron': {
    label: 'Maron (Burgundy Gradient)',
    headerBg: 'bg-gradient-to-r from-[#2B030F] to-[#4C0519]',
    headerText: 'text-white',
    subHeaderBg: 'bg-gradient-to-r from-[#4C0519] to-[#9F1239]',
    subHeaderText: 'text-white',
    footerBg: '#2B030F',
    footerText: 'text-rose-100',
    button: 'bg-[#E11D48] hover:bg-[#BE123C] text-white',
    text: 'text-[#E11D48]',
    border: 'focus:border-[#E11D48]',
    lightBg: 'bg-rose-50/60',
    lightBorder: 'border-rose-200',
    hexHeader: '#2B030F'
  },
  'dark-grey': {
    label: 'Dark Grey (Charcoal Gradient)',
    headerBg: 'bg-gradient-to-r from-[#020617] to-[#0F172A]',
    headerText: 'text-white',
    subHeaderBg: 'bg-gradient-to-r from-[#0F172A] to-[#334155]',
    subHeaderText: 'text-white',
    footerBg: '#020617',
    footerText: 'text-slate-300',
    button: 'bg-[#475569] hover:bg-[#334155] text-white',
    text: 'text-[#475569]',
    border: 'focus:border-[#475569]',
    lightBg: 'bg-slate-100',
    lightBorder: 'border-slate-300',
    hexHeader: '#020617'
  },
  'putih': {
    label: 'Putih Minimalis (Clean Slate Gradient)',
    headerBg: 'bg-gradient-to-r from-[#CBD5E1] to-[#E2E8F0]',
    headerText: 'text-slate-900',
    subHeaderBg: 'bg-gradient-to-r from-[#FFFFFF] to-[#F8FAFC]',
    subHeaderText: 'text-slate-900',
    subHeaderLight: true,
    footerBg: '#CBD5E1',
    footerText: 'text-slate-800',
    button: 'bg-[#0F172A] hover:bg-[#334155] text-white',
    text: 'text-[#0F172A]',
    border: 'focus:border-[#0F172A]',
    lightBg: 'bg-slate-50',
    lightBorder: 'border-slate-200',
    hexHeader: '#475569'
  },
  'hitam': {
    label: 'Hitam (Obsidian Gradient)',
    headerBg: 'bg-gradient-to-r from-[#000000] to-[#121212]',
    headerText: 'text-white',
    subHeaderBg: 'bg-gradient-to-r from-[#121212] to-[#27272A]',
    subHeaderText: 'text-zinc-100',
    footerBg: '#000000',
    footerText: 'text-zinc-400',
    button: 'bg-[#3F3F46] hover:bg-[#52525B] text-white',
    text: 'text-[#18181B]',
    border: 'focus:border-[#18181B]',
    lightBg: 'bg-zinc-100',
    lightBorder: 'border-zinc-300',
    hexHeader: '#000000'
  }
};

const resolveImageSrc = (imageData) => {
  if (!imageData) return "";
  if (imageData.startsWith('data:')) return imageData;
  if (imageData.includes('drive.google.com') || imageData.includes('googleusercontent.com')) {
    try {
      let fileId = '';
      if (imageData.includes('/d/')) fileId = imageData.split('/d/')[1].split('/')[0];
      else if (imageData.includes('id=')) fileId = imageData.split('id=')[1].split('&')[0];
      if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}`;
    } catch (e) { 
      return imageData; 
    }
  }
  return imageData;
};

const formatTanggalIndo = (dateObj) => {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${hari[dateObj.getDay()]}, ${dateObj.getDate()} ${bulan[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
};

const translateDateToIndo = (dateStr) => {
  if (!dateStr) return '-';
  let res = dateStr;
  const dict = {
    'Sunday': 'Minggu', 'Monday': 'Senin', 'Tuesday': 'Selasa', 'Wednesday': 'Rabu', 'Thursday': 'Kamis', 'Friday': 'Jumat', 'Saturday': 'Sabtu',
    'January': 'Januari', 'February': 'Februari', 'March': 'Maret', 'April': 'April', 'May': 'Mei', 'June': 'Juni', 'July': 'Juli', 'August': 'Agustus', 'September': 'September', 'October': 'Oktober', 'November': 'November', 'December': 'Desember'
  };
  for (const [en, id] of Object.entries(dict)) {
    res = res.replace(new RegExp(en, 'gi'), id);
  }
  return res;
};

const LOGO_FALLBACK = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Logo_of_the_Directorate_General_of_Immigration_%28Indonesia%29.svg/1024px-Logo_of_the_Directorate_General_of_Immigration_%28Indonesia%29.svg.png";
// Posisi logo pada header Laporan PDF: 'left' atau 'right' (teks tetap di tengah halaman)
const PDF_LOGO_SIDE = 'left';

function ImmigrationLogo({ className = "w-10 h-10" }) {
  return (
    <img 
      src="/logo-imigrasi.png" 
      alt="Logo Imigrasi" 
      className={`${className} object-contain filter drop-shadow-sm`} 
      onError={(e) => {
        e.target.onerror = null; 
        e.target.src = LOGO_FALLBACK;
      }}
    />
  );
}

// ==========================================
// DESIGN SYSTEM RINGAN (font, token, animasi)
// ==========================================
const BANNER_RATIO = 16 / 9; // sub-header tetap 16:9 di desktop dan HP
const BANNER_W = 1280;  // lebar maksimum hasil kompres (px)
const PHOTO_W = 800, PHOTO_H = 600; // foto pengunjung 4:3

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
html,body,button,input,select,textarea{font-family:'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
body{background:#F4F6FA;-webkit-tap-highlight-color:transparent}
.app-root{background:#F4F6FA;color:#0F172A;line-height:1.5}
.card{background:#fff;border:1px solid rgba(15,23,42,.07);box-shadow:0 1px 2px rgba(15,23,42,.04),0 14px 32px -18px rgba(15,23,42,.18)}
.banner-img{opacity:.55;-webkit-mask-image:linear-gradient(to bottom,#000 35%,transparent 100%);mask-image:linear-gradient(to bottom,#000 35%,transparent 100%);animation:banner-in .9s ease both}
.fade-soft,.overlay-in{animation:fade-soft .22s ease both}
.modal-card{animation:pop-in .3s cubic-bezier(.22,1,.36,1) both}
.sheet[data-state=open]{animation:fade-soft .22s ease both}
.sheet[data-state=closed]{animation:fade-out .2s ease both}
.sheet[data-state=open] .sheet-card{animation:pop-in .32s cubic-bezier(.22,1,.36,1) both}
.sheet[data-state=closed] .sheet-card{animation:pop-out .2s ease-in both}
@keyframes fade-soft{from{opacity:0}to{opacity:1}}
@keyframes fade-out{to{opacity:0}}
.sub-wrap{container-type:inline-size}
.sub-text{padding:0 6% 5% 8%}
.sub-title{font-size:clamp(.9rem,3.6vw,1.5rem);font-size:clamp(.9rem,3.4cqw,1.5rem);line-height:1.25;letter-spacing:.03em;margin:0 0 .35em;text-wrap:pretty}
.sub-loc{font-size:clamp(.72rem,2.2vw,.9375rem);font-size:clamp(.72rem,2cqw,.9375rem);line-height:1.4;text-wrap:pretty}
.sub-loc-icon{width:1.1em;height:1.1em;margin-top:.15em}
.splash{transition:transform .85s cubic-bezier(.76,0,.24,1);will-change:transform}
.splash[data-state=out]{transform:translateY(-100%)}
.splash-content{animation:splash-in .8s cubic-bezier(.22,1,.36,1) both;transition:opacity .35s ease,transform .5s ease}
.splash[data-state=out] .splash-content{opacity:0;transform:translateY(-18px)}
.splash-name{font-size:.9375rem;font-weight:600;color:rgba(255,255,255,.88);text-align:center;padding:0 24px}
.splash-bar{display:block;width:120px;height:2px;border-radius:2px;background:rgba(255,255,255,.2);overflow:hidden}
.splash-bar i{display:block;height:100%;background:#fff;transform-origin:left;animation:splash-bar 1.1s cubic-bezier(.65,0,.35,1) both}
@keyframes splash-in{from{opacity:0;transform:translateY(14px) scale(.96)}}
@keyframes splash-bar{from{transform:scaleX(0)}}
@keyframes rise{from{opacity:0;transform:translateY(16px)}}
@keyframes page-out{to{opacity:0}}
.is-loading .rise{opacity:0}
.is-ready .rise{animation:rise .7s cubic-bezier(.22,1,.36,1) both;animation-delay:var(--d,0ms)}
.is-leaving{animation:page-out .38s ease-in both}
@keyframes banner-in{from{opacity:0}}
@keyframes pop-in{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
@keyframes pop-out{to{opacity:0;transform:translateY(8px) scale(.97)}}
button:not(:disabled):active{transform:scale(.98)}
button:focus-visible,a:focus-visible,select:focus-visible{outline:2px solid #0F172A;outline-offset:2px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;
const GlobalStyles = () => <style>{GLOBAL_CSS}</style>;

// Portal: semua pop-up dirender di <body> agar benar-benar di tengah LAYAR
// (bukan tengah halaman) dan tidak ikut bergeser oleh transform/scroll elemen induk.
const Portal = ({ children }) => createPortal(children, document.body);

// Pop-up tengah layar dengan animasi masuk & keluar
function Sheet({ open, onClose, label, className = 'max-w-md', children }) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(t);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!mounted) return null;
  return (
    <Portal>
      <div
        className="sheet fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-900/60 p-4 backdrop-blur-sm"
        data-state={open ? 'open' : 'closed'} role="dialog" aria-modal="true" aria-label={label}
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className={`sheet-card card w-full rounded-xl p-4 sm:p-5 ${className}`}>{children}</div>
      </div>
    </Portal>
  );
}

// Kamera: rasio tetap 4:3, tanpa mirror, kamera depan/belakang, crop otomatis dari tengah
function CameraModal({ open, onClose, onCapture, onError, btn }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState('user');
  const [failed, setFailed] = useState(false);

  const attach = (el) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play?.().catch(() => {});
    }
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFailed(false);
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        attach(videoRef.current);
      })
      .catch(() => { if (!cancelled) { setFailed(true); onError?.('Izin kamera ditolak atau perangkat tidak mendukung.'); } });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, facing]);

  const shoot = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const r = PHOTO_W / PHOTO_H;
    let sw = v.videoWidth, sh = v.videoHeight, sx = 0, sy = 0;
    if (sw / sh > r) { const w = sh * r; sx = (sw - w) / 2; sw = w; } else { const h = sw / r; sy = (sh - h) / 2; sh = h; }
    const c = document.createElement('canvas');
    c.width = PHOTO_W; c.height = PHOTO_H;
    c.getContext('2d').drawImage(v, sx, sy, sw, sh, 0, 0, PHOTO_W, PHOTO_H); // tanpa mirror
    onCapture(c.toDataURL('image/jpeg', 0.72));
  };

  return (
    <Sheet open={open} onClose={onClose} label="Ambil foto pengunjung" className="max-w-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900"><Camera className="h-4 w-4" />Ambil foto pengunjung</h3>
        <button type="button" onClick={onClose} aria-label="Tutup kamera" className="rounded-full bg-slate-100 p-2.5 text-slate-500 transition hover:bg-slate-200"><X className="h-4 w-4" /></button>
      </div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-900">
        <video ref={attach} autoPlay playsInline muted className="h-full w-full object-cover" />
        {failed && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-medium text-white/80">Kamera tidak dapat dibuka. Izinkan akses kamera di browser, lalu coba lagi.</p>}
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">Hadapkan wajah ke kamera. Foto otomatis dipotong rasio 4:3.</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))} className="flex min-h-[48px] items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
          <RefreshCw className="h-4 w-4" />{facing === 'user' ? 'Kamera belakang' : 'Kamera depan'}
        </button>
        <button type="button" onClick={shoot} disabled={failed} aria-label="Jepret foto" className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm transition disabled:opacity-40 ${btn}`}>
          <Camera className="h-4 w-4" />Jepret
        </button>
      </div>
    </Sheet>
  );
}

// Crop gambar rasio tetap + kompres otomatis (JPEG, maks 1600px, ±200 KB)
function CropDialog({ src, ratio, onCancel, onDone, btn }) {
  const keep = useRef(src);
  if (src) keep.current = src;
  return (
    <Sheet open={!!src} onClose={onCancel} label="Potong gambar latar" className="max-w-2xl">
      {keep.current && <Cropper src={keep.current} ratio={ratio} onCancel={onCancel} onDone={onDone} btn={btn} />}
    </Sheet>
  );
}

function Cropper({ src, ratio, onCancel, onDone, btn }) {
  const boxRef = useRef(null);
  const drag = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [img, setImg] = useState(null);
  const [view, setView] = useState({ zoom: 1, cx: 0.5, cy: 0.5 });

  useEffect(() => { const i = new Image(); i.onload = () => setImg(i); i.src = src; }, [src]);
  useEffect(() => {
    const el = boxRef.current;
    const f = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    f();
    const ro = new ResizeObserver(f); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ready = !!img && box.w > 0;
  const nw = img?.naturalWidth || 1, nh = img?.naturalHeight || 1;
  const scale = Math.max(box.w / nw, box.h / nh) * view.zoom;
  const dw = nw * scale, dh = nh * scale;
  const clamp = (c, size, d) => Math.min(Math.max(c, size / 2 / d), 1 - size / 2 / d);
  const cx = ready ? clamp(view.cx, box.w, dw) : 0.5, cy = ready ? clamp(view.cy, box.h, dh) : 0.5;

  const onDown = (e) => { drag.current = { x: e.clientX, y: e.clientY, cx, cy }; e.currentTarget.setPointerCapture(e.pointerId); };
  const onMove = (e) => {
    const d = drag.current; if (!d || !ready) return;
    setView((v) => ({ ...v, cx: clamp(d.cx - (e.clientX - d.x) / dw, box.w, dw), cy: clamp(d.cy - (e.clientY - d.y) / dh, box.h, dh) }));
  };
  const onUp = () => { drag.current = null; };

  const apply = () => {
    const sw = box.w / scale, sh = box.h / scale;
    const ow = Math.min(BANNER_W, Math.round(sw)), oh = Math.round(ow / ratio);
    const c = document.createElement('canvas'); c.width = ow; c.height = oh;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, ow, oh);
    ctx.drawImage(img, cx * nw - sw / 2, cy * nh - sh / 2, sw, sh, 0, 0, ow, oh);
    let q = 0.82, out = c.toDataURL('image/jpeg', q);
    while (out.length > 300000 && q > 0.5) { q -= 0.08; out = c.toDataURL('image/jpeg', q); }
    onDone(out);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900"><Crop className="h-4 w-4" />Potong gambar latar</h3>
        <button type="button" onClick={onCancel} aria-label="Tutup" className="rounded-full bg-slate-100 p-2.5 text-slate-500 transition hover:bg-slate-200"><X className="h-4 w-4" /></button>
      </div>
      <div ref={boxRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        style={{ aspectRatio: ratio }} className="relative w-full cursor-grab touch-none select-none overflow-hidden rounded-xl bg-slate-900 active:cursor-grabbing">
        {ready && <img src={src} alt="" draggable={false} className="absolute max-w-none" style={{ width: dw, height: dh, left: box.w / 2 - cx * dw, top: box.h / 2 - cy * dh }} />}
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/40" />
      </div>
      <p className="mt-2 text-xs text-slate-500">Geser gambar untuk mengatur posisi. Rasio 16:9 mengikuti ukuran sub-header.</p>
      <label className="mt-2 flex items-center gap-3 text-[13px] font-semibold text-slate-700">Zoom
        <input type="range" min="1" max="3" step="0.01" value={view.zoom} onChange={(e) => setView((v) => ({ ...v, zoom: +e.target.value }))} className="h-11 flex-1 accent-slate-900" />
      </label>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onCancel} className="min-h-[48px] flex-1 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">Batal</button>
        <button type="button" onClick={apply} disabled={!ready} className={`min-h-[48px] flex-1 rounded-xl text-sm font-bold transition disabled:opacity-40 ${btn}`}>Terapkan</button>
      </div>
    </div>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState('form'); 
  const [adminTab, setAdminTab] = useState('list'); 

  // ANIMASI MUAT HALAMAN: splash masuk -> keluar, lalu konten naik bertahap
  const [phase, setPhase] = useState('loading'); // loading -> leaving -> done
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t0 = Date.now();
    let alive = true;
    const fontsReady = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
    fontsReady.then(() => {
      if (alive) setTimeout(() => alive && setPhase('leaving'), reduce ? 0 : Math.max(0, 1200 - (Date.now() - t0)));
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (phase !== 'leaving') return;
    const t = setTimeout(() => setPhase('done'), 900);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    const onShow = (e) => { if (e.persisted) setLeaving(false); };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const [eventConfig, setEventConfig] = useState(() => {
    const saved = localStorage.getItem('imigrasi_event_config');
    return saved ? JSON.parse(saved) : {
      namaKegiatan: 'STAND PAMERAN UMKM FEST',
      lokasi: 'Simpang Lima Gumul Kabupaten Kediri',
      teksSurvei: 'Mohon kesediaan waktu untuk mengisi Survei Kepuasan Layanan berikut.',
      surveiUrl: 'https://star-survei3a.kemenimipas.go.id/ly/H5lLWyie',
      tema: 'biru',
      bannerImage: '',
      bannerOpacity: 55
    };
  });
  const [tempEventConfig, setTempEventConfig] = useState({ ...eventConfig });

  const currentTheme = THEMES[eventConfig.tema] || THEMES['biru'];

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [currentTime, setCurrentTime] = useState(new Date());
  const [userIpAddress, setUserIpAddress] = useState('Memuat IP...');
  const [gpsLocation, setGpsLocation] = useState('Meminta akses lokasi...');

  const [formData, setFormData] = useState({
    nama: '', alamat: '', whatsapp: '', layanan: '', layananLainnya: '', kesan: ''
  });

  const [photoData, setPhotoData] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);

  const [scriptUrl, setScriptUrl] = useState("https://script.google.com/macros/s/AKfycbznj6AU5PMVPxtsjbQ1Whx-LXOOIrEW-0PAVgKr6zgCfFsZoKYlGMXf1sQdIXdNEKJq/exec");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [lastSubmittedGuest, setLastSubmittedGuest] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [guestList, setGuestList] = useState(() => {
    const saved = localStorage.getItem('imigrasi_guest_list');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const signatureCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  useEffect(() => { localStorage.setItem('imigrasi_guest_list', JSON.stringify(guestList)); }, [guestList]);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIpAddress(data.ip))
      .catch(() => setUserIpAddress('IP Tidak Diketahui'));
  }, []);

  useEffect(() => {
    if (viewMode === 'form') {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => { setGpsLocation(`${position.coords.latitude}, ${position.coords.longitude}`); },
          (error) => { setGpsLocation('Akses lokasi ditolak/gagal'); },
          { enableHighAccuracy: true }
        );
      } else {
        setGpsLocation('GPS tidak didukung perangkat');
      }
    }
  }, [viewMode]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (db) {
      const unsubPameran = onSnapshot(doc(db, "pengaturan", "infoPameran"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const mergedData = {
            namaKegiatan: data.namaKegiatan || 'STAND PAMERAN UMKM FEST',
            lokasi: data.lokasi || 'Simpang Lima Gumul Kabupaten Kediri',
            teksSurvei: data.teksSurvei || 'Mohon kesediaan waktu untuk mengisi Survei Kepuasan Layanan berikut.',
            surveiUrl: data.surveiUrl || 'https://star-survei3a.kemenimipas.go.id/ly/H5lLWyie',
            tema: data.tema || 'biru',
            bannerImage: data.bannerImage || '',
            bannerOpacity: typeof data.bannerOpacity === 'number' ? data.bannerOpacity : 55
          };
          setEventConfig(mergedData); 
          setTempEventConfig(mergedData);
          localStorage.setItem('imigrasi_event_config', JSON.stringify(mergedData));
        }
      });
      return () => unsubPameran();
    }
  }, []);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type }); setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdmin = () => {
    if (!isAdminLoggedIn) { setLoginError(''); setShowLoginModal(true); } 
    else { setViewMode('admin'); handleRefreshSync(); }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === '1mk3d1r1') {
      setIsAdminLoggedIn(true); setShowLoginModal(false); setLoginForm({ username: '', password: '' }); setLoginError('');
      setViewMode('admin'); showToast('Berhasil masuk ke Panel Admin!', 'success'); handleRefreshSync(); 
    } else { setLoginError('Username atau password admin salah!'); }
  };

  const handleAdminLogout = () => { setIsAdminLoggedIn(false); setViewMode('form'); showToast('Keluar dari Panel Admin', 'info'); };

  const handleSaveEventConfig = async (e) => {
    e.preventDefault();
    if (!tempEventConfig.namaKegiatan.trim() || !tempEventConfig.lokasi.trim() || !tempEventConfig.teksSurvei.trim() || !tempEventConfig.surveiUrl.trim()) { 
      showToast('Semua kolom pengaturan harus diisi!', 'error'); 
      return; 
    }
    const payload = { ...tempEventConfig, bannerImage: tempEventConfig.bannerImage || '', bannerOpacity: tempEventConfig.bannerOpacity ?? 55 };
    setEventConfig(payload);
    localStorage.setItem('imigrasi_event_config', JSON.stringify(payload));
    if (db) { 
      try { 
        await setDoc(doc(db, "pengaturan", "infoPameran"), payload); 
        showToast('Info & Tema berhasil disinkronisasi ke Cloud!', 'success'); 
      } catch (err) { 
        showToast('Pengaturan disimpan secara lokal.', 'info'); 
      } 
    }
  };

  // Kunci scroll halaman saat ada pop-up (pop-up tidak bisa bergeser)
  const anyModal = showLoginModal || showPdfModal || showSuccessModal || !!previewItem || showCamera || !!cropSrc || phase !== 'done';
  useEffect(() => {
    document.body.style.overflow = anyModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyModal]);

  const initSignaturePad = () => {
    const canvas = signatureCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; canvas.height = rect.height * 2; ctx.scale(2, 2);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  };

  useEffect(() => {
    if (viewMode === 'form' && !signatureData) { 
      initSignaturePad(); 
      const handleResize = () => { if(!signatureData) initSignaturePad(); }; 
      window.addEventListener('resize', handleResize); 
      return () => window.removeEventListener('resize', handleResize); 
    }
  }, [viewMode, signatureData]);

  const getCanvasCoords = (e, c) => { const rect = c.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; return { x: clientX - rect.left, y: clientY - rect.top }; };
  const startDrawing = (e) => { const c = signatureCanvasRef.current; if (!c) return; const ctx = c.getContext('2d'); const { x, y } = getCanvasCoords(e, c); ctx.beginPath(); ctx.moveTo(x, y); isDrawingRef.current = true; };
  const draw = (e) => { if (!isDrawingRef.current) return; e.preventDefault(); const c = signatureCanvasRef.current; if (!c) return; const ctx = c.getContext('2d'); const { x, y } = getCanvasCoords(e, c); ctx.lineTo(x, y); ctx.stroke(); };
  const stopDrawing = () => { if (isDrawingRef.current) { isDrawingRef.current = false; const c = signatureCanvasRef.current; if (c) setSignatureData(c.toDataURL('image/png')); } };
  const clearSignature = () => { const c = signatureCanvasRef.current; if (!c) return; const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); setSignatureData(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) { showToast('Masukkan Nama Lengkap', 'error'); return; }
    if (!formData.alamat.trim()) { showToast('Masukkan Alamat / Instansi', 'error'); return; }
    if (!formData.whatsapp.trim()) { showToast('Masukkan Nomor WhatsApp', 'error'); return; }
    if (!formData.layanan) { showToast('Silakan pilih Keperluan / Layanan Stand', 'error'); return; }
    if (formData.layanan === 'Lainnya' && !formData.layananLainnya.trim()) { showToast('Sebutkan keperluan Anda secara spesifik', 'error'); return; }
    if (!formData.kesan.trim()) { showToast('Masukkan Kesan/Pesan', 'error'); return; }
    if (!photoData) { showToast('Harap jepret foto pengunjung menggunakan kamera (Wajib)', 'error'); return; }
    if (!signatureData) { showToast('Harap bubuhkan tanda tangan (Wajib)', 'error'); return; }

    setIsSubmitting(true);
    const now = new Date();
    const formattedDate = formatTanggalIndo(now);
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    const finalKeperluan = formData.layanan === 'Lainnya' ? formData.layananLainnya : formData.layanan;
    const uniqueId = 'KDR-' + Date.now().toString().slice(-6);

    const newGuest = {
      id: uniqueId, hariTanggal: formattedDate, jamKunjungan: formattedTime, timestampMs: now.getTime(),
      namaKegiatan: eventConfig.namaKegiatan, lokasi: eventConfig.lokasi,
      ipAddress: userIpAddress, gps: gpsLocation, ...formData,
      kesan: formData.kesan || '-', layanan: finalKeperluan,
      photo: photoData, signature: signatureData, driveStatus: 'Mengunggah ke Cloud / Drive...'
    };

    if (scriptUrl) {
      try {
        const payload = {
          id: uniqueId, tanggal: formattedDate, jam: formattedTime, eventName: eventConfig.namaKegiatan, eventLocation: eventConfig.lokasi,
          nama: formData.nama, alamat: formData.alamat, whatsapp: formData.whatsapp, keperluan: finalKeperluan, kesan: formData.kesan || '-',
          ipAddress: userIpAddress, gps: gpsLocation, photoBase64: photoData, signatureBase64: signatureData
        };
        const response = await fetch(scriptUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        const resJson = await response.json();
        if (resJson.status === 'success') {
          newGuest.driveStatus = 'Tersimpan Aman di Google Drive';
          if (resJson.photoUrl && resJson.photoUrl !== '-') newGuest.photo = resJson.photoUrl; 
          if (resJson.signUrl && resJson.signUrl !== '-') newGuest.signature = resJson.signUrl; 
        } else {
          newGuest.driveStatus = 'Gagal upload (Tersimpan Lokal)';
        }
      } catch (err) { 
        newGuest.driveStatus = 'Tersimpan Lokal (Koneksi Gagal)'; 
      }
    }

    setGuestList((prev) => [newGuest, ...prev]); 
    setLastSubmittedGuest(newGuest); 
    setShowSuccessModal(true); 
    setIsSubmitting(false);
  };
  
  const handleOpenSurvei = () => {
    setShowSuccessModal(false);
    setFormData({ nama: '', alamat: '', whatsapp: '', layanan: '', layananLainnya: '', kesan: '' });
    setPhotoData(null); 
    setSignatureData(null); 
    clearSignature();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const surveyUrl = eventConfig.surveiUrl || 'https://star-survei3a.kemenimipas.go.id/ly/H5lLWyie';
    setLeaving(true);
    setTimeout(() => { window.location.href = surveyUrl; }, 380);
  };

  const handleDeleteSingleGuest = async (guestId) => {
    if (!window.confirm("Yakin ingin menghapus data tamu ini secara PERMANEN?")) return;
    setIsSyncing(true);
    try {
      if (scriptUrl) { 
        await fetch(scriptUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'delete', id: guestId }) }); 
      }
      setGuestList(prev => prev.filter(g => g.id !== guestId)); 
      setPreviewItem(null); 
      showToast('Terhapus permanen.', 'success');
    } catch (err) { 
      showToast('Gagal menghapus dari server.', 'error'); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const handleRefreshSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(scriptUrl); 
      const remoteGuestList = await response.json();
      if (Array.isArray(remoteGuestList)) { 
        setGuestList(remoteGuestList); 
        showToast(`Sinkronisasi sukses! ${remoteGuestList.length} tamu dimuat.`, 'success'); 
      }
    } catch (err) { 
      showToast('Gagal terhubung ke cloud.', 'error'); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const getEventDateRange = () => {
    if (guestList.length === 0) return "-";
    const dates = guestList.map(g => translateDateToIndo(g.hariTanggal)).filter(Boolean);
    if (dates.length === 0) return "-";
    const uniqueDates = [...new Set(dates)];
    if (uniqueDates.length === 1) return uniqueDates[0];
    return `${uniqueDates[uniqueDates.length - 1]} - ${uniqueDates[0]}`;
  };

  const handleExecutePDF = (mode) => {
    setShowPdfModal(false);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up diblokir browser. Izinkan pop-up untuk mencetak laporan PDF.', 'error');
      return;
    }

    const dateRangeStr = getEventDateRange();
    const reversedGuestList = [...guestList].reverse();
    const hexTheme = currentTheme.hexHeader;
    const logoHtml = `<img class="hr-logo ${PDF_LOGO_SIDE}" alt="Logo Imigrasi" src="${window.location.origin}/logo-imigrasi.png" onerror="this.onerror=null;this.src='${LOGO_FALLBACK}'" />`;

    const thHtml = `
      <tr>
        <th style="width: 30px;">No</th>
        <th style="width: 85px;">Hari/Tanggal</th>
        <th style="width: 95px;">Nama</th>
        <th style="width: 95px;">Alamat</th>
        <th style="width: 85px;">No HP/WA</th>
        <th style="width: 90px;">Keperluan</th>
        <th style="width: 90px;">Kesan/Pesan</th>
        <th style="width: 85px;">Koordinat Lokasi</th>
        <th style="width: 60px;">Foto</th>
        <th style="width: 70px;">TTD</th>
      </tr>
    `;

    const generateRowHtml = (g, idx) => `
      <tr>
        <td class="center"><b>${idx + 1}</b></td>
        <td style="font-size: 8pt;">${translateDateToIndo(g.hariTanggal)}<br/><span style="font-size: 7.5pt; color: #666;">${g.jamKunjungan}</span></td>
        <td><b>${g.nama}</b></td>
        <td>${g.alamat}</td>
        <td style="font-family: monospace;">${g.whatsapp}</td>
        <td>${g.layanan}</td>
        <td style="font-style: italic; color: #444;">${g.kesan || '-'}</td>
        <td style="font-size: 7.5pt; font-family: monospace;">${g.gps || '-'}</td>
        <td class="center">
          <div class="img-container">
            ${g.photo ? `<img src="${resolveImageSrc(g.photo)}" class="img-thumbnail" />` : '-'}
          </div>
        </td>
        <td class="center">
          ${g.signature ? `<img src="${resolveImageSrc(g.signature)}" class="sign-thumbnail" />` : '-'}
        </td>
      </tr>
    `;

    let tablesContent = '';
    if (mode === 'all') {
      tablesContent = `<table><thead>${thHtml}</thead><tbody>${reversedGuestList.map((g, idx) => generateRowHtml(g, idx)).join('')}</tbody></table>`;
    } else {
      const groupedData = {};
      reversedGuestList.forEach(g => {
        const dStr = translateDateToIndo(g.hariTanggal);
        if (!groupedData[dStr]) groupedData[dStr] = [];
        groupedData[dStr].push(g);
      });
      Object.keys(groupedData).forEach(dateStr => {
        tablesContent += `<h3 class="date-header">Daftar Pengunjung - ${dateStr}</h3><table><thead>${thHtml}</thead><tbody>${groupedData[dateStr].map((g, idx) => generateRowHtml(g, idx)).join('')}</tbody></table>`;
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Laporan Daftar Pengunjung - Imigrasi Kediri</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1c1c1e; margin: 15px; background: #ffffff; }
          .header-report { display: grid; grid-template-columns: 96px 1fr 96px; align-items: center; column-gap: 12px; margin-bottom: 25px; border-bottom: 2px solid ${hexTheme}; padding-bottom: 15px; }
          .header-report .hr-text { text-align: center; }
          .hr-logo { display: block; height: 76px; width: auto; max-width: 92px; object-fit: contain; justify-self: start; }
          .hr-logo.right { justify-self: end; }
          .header-report h2 { margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase; color: ${hexTheme}; letter-spacing: 0.5px; }
          .header-report p { margin: 4px 0; font-size: 10.5pt; color: #333; }
          .date-header { margin-top: 30px; margin-bottom: 10px; font-size: 11pt; color: ${hexTheme}; border-left: 4px solid ${hexTheme}; padding-left: 8px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; margin-bottom: 20px; }
          th, td { border: 1px solid #94a3b8; padding: 6px 8px; font-size: 9pt; text-align: left; vertical-align: middle; word-wrap: break-word; }
          th { background-color: ${hexTheme}; color: white; text-align: center; font-weight: bold; font-size: 9.5pt; }
          .center { text-align: center; }
          .img-container { width: 100%; height: 50px; display: flex; align-items: center; justify-content: center; overflow: hidden; background-color: #f8fafc; }
          .img-thumbnail { width: 100%; height: 100%; object-fit: contain; display: block; }
          .sign-thumbnail { width: 100%; max-width: 70px; height: 35px; object-fit: contain; display: block; margin: 0 auto; background-color: #fff; }
          @media print { body { margin: 0; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header-report">
          ${PDF_LOGO_SIDE === 'left' ? logoHtml : '<div></div>'}
          <div class="hr-text">
          <h2>DAFTAR PENGUNJUNG STAND KANTOR IMIGRASI KEDIRI</h2>
          <p><b>${eventConfig.namaKegiatan} | Lokasi: ${eventConfig.lokasi}</b></p>
          <p style="font-weight: bold; color: ${hexTheme}; font-size: 9.5pt; margin-top: 6px;">Periode: ${dateRangeStr}</p>
          </div>
          ${PDF_LOGO_SIDE === 'right' ? logoHtml : '<div></div>'}
        </div>
        ${tablesContent}
        <script>window.onload = function() { var pend = Array.prototype.slice.call(document.images).filter(function(i) { return !i.complete; }).map(function(i) { return new Promise(function(r) { i.addEventListener('load', r); i.addEventListener('error', r); }); }); Promise.all(pend).then(function() { setTimeout(function() { window.print(); }, 500); }); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredGuests = guestList.filter((g) =>
    g.nama.toLowerCase().includes(searchQuery.toLowerCase()) || g.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.whatsapp.includes(searchQuery) || g.layanan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subLight = !!currentTheme.subHeaderLight;
  const subOp = (eventConfig.bannerOpacity ?? 55) / 100;

  return (
    <div className={`app-root min-h-[100dvh] flex flex-col antialiased ${phase === 'loading' ? 'is-loading' : 'is-ready'}${leaving ? ' is-leaving' : ''}`}>
      <GlobalStyles />
      {phase !== 'done' && (
        <Portal>
          <div className="splash fixed inset-0 z-[100] flex items-center justify-center" data-state={phase === 'leaving' ? 'out' : 'in'} style={{ background: currentTheme.hexHeader }} aria-hidden="true">
            <div className="splash-content flex flex-col items-center gap-5">
              <ImmigrationLogo className="h-20 w-16" />
              <p className="splash-name">Kantor Imigrasi Kelas II TPI Kediri</p>
              <span className="splash-bar"><i /></span>
            </div>
          </div>
        </Portal>
      )}
      {toastMessage && (
        <Portal><div role="status" className={`fade-soft fixed top-4 left-1/2 transform -translate-x-1/2 z-[70] px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex items-center gap-2.5 text-xs font-medium border backdrop-blur-xl transition-all duration-300 ${toastMessage.type === 'success' ? 'bg-white/95 text-emerald-800 border-emerald-200' : 'bg-white/95 text-rose-800 border-rose-200'}`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{toastMessage.msg}</span>
        </div></Portal>
      )}

      <div className="max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col flex-1 space-y-6">
        
        {/* CONTAINER HEADER & SUB-HEADER MENYATU DENGAN GRADIENT */}
        <div className="rise rounded-2xl overflow-hidden shadow-xl border border-black/5 flex flex-col" style={{ '--d': '80ms' }}>
          
          {/* HEADER UTAMA */}
          <div className={`${currentTheme.headerBg} ${currentTheme.headerText} p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-300 z-10 relative`}>
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <ImmigrationLogo className="w-8 h-10 sm:w-9 sm:h-11" />
              <div className="flex flex-col">
                <h1 className="text-xs sm:text-sm font-semibold tracking-wider uppercase">
                  KANTOR IMIGRASI KELAS II TPI KEDIRI
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/25 text-white/90 border border-white/10 text-xs sm:text-xs font-mono font-semibold backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</span>
              </div>
              {viewMode === 'form' ? (
                <button onClick={handleOpenAdmin} className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition backdrop-blur-md border border-white/20 shadow-sm">
                  <Lock className="w-3.5 h-3.5" /><span>Admin</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewMode('form')} className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition backdrop-blur-md border border-white/20">
                    <ArrowLeft className="w-3.5 h-3.5" /><span>Form Tamu</span>
                  </button>
                  <button onClick={handleAdminLogout} className="p-2.5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-xl transition shadow-sm">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SUB-HEADER INFO PAMERAN (rasio tetap 16:9, teks di bawah, rata kiri) */}
          <div className={`sub-wrap relative isolate aspect-video w-full overflow-hidden ${currentTheme.subHeaderBg} ${currentTheme.subHeaderText} border-t border-white/10`}>
            {eventConfig.bannerImage && <img src={eventConfig.bannerImage} alt="" aria-hidden="true" className="banner-img absolute inset-0 -z-10 h-full w-full object-cover" style={{ opacity: subOp }} />}
            <div className="sub-text absolute inset-x-0 bottom-0 text-left" style={{ textShadow: subLight ? 'none' : '0 1px 2px rgba(0,0,0,.35)' }}>
              <h2 className="sub-title font-bold uppercase">{eventConfig.namaKegiatan}</h2>
              <p className="sub-loc flex items-start gap-[.45em] font-medium"><MapPin className="sub-loc-icon shrink-0" /><span>{eventConfig.lokasi}</span></p>
            </div>
          </div>
        </div>

        {viewMode === 'form' && (
          <div className="rise space-y-5" style={{ '--d': '120ms' }}>
            <div className="card rounded-2xl p-5 shadow-sm text-center space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Daftar Kehadiran Pengunjung</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full text-xs text-slate-700 font-medium">
                <Calendar className={`w-3.5 h-3.5 ${currentTheme.text}`} />
                <span><strong>Hari/Tanggal:</strong> {formatTanggalIndo(currentTime)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-6 card rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className={`text-[15px] font-semibold text-slate-800 flex items-center gap-2`}><User className={`w-3.5 h-3.5 ${currentTheme.text}`} /> Informasi Pengunjung</h3>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Nama Lengkap</label>
                  <input type="text" required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })} className={`w-full px-4 min-h-[48px] py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base sm:text-[15px] font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 transition`} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Alamat / Instansi</label>
                  <input type="text" required value={formData.alamat} onChange={(e) => setFormData({ ...formData, alamat: e.target.value.toUpperCase() })} className={`w-full px-4 min-h-[48px] py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base sm:text-[15px] font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 transition`} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Nomor WhatsApp</label>
                  <input type="tel" inputMode="tel" autoComplete="tel" required value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} className={`w-full px-4 min-h-[48px] py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base sm:text-[15px] font-mono font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 transition`} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Keperluan / Layanan Stand</label>
                  <div className="relative">
                    <select required value={formData.layanan} onChange={(e) => setFormData({ ...formData, layanan: e.target.value })} className={`w-full appearance-none px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base sm:text-[15px] font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 cursor-pointer pr-10`}>
                      <option value="" disabled hidden>-- Pilih Keperluan --</option>
                      <option value="Informasi Layanan Paspor">Informasi Layanan Paspor</option>
                      <option value="Informasi Layanan WNA">Informasi Layanan WNA</option>
                      <option value="Urus Paspor (PASPORIA)">Urus Paspor (PASPORIA)</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                {formData.layanan === 'Lainnya' && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className={`text-xs font-semibold ${currentTheme.text}`}>Sebutkan Keperluan Lainnya</label>
                    <input type="text" required value={formData.layananLainnya} onChange={(e) => setFormData({ ...formData, layananLainnya: e.target.value })} className={`w-full px-4 min-h-[48px] py-3 rounded-xl ${currentTheme.lightBg} border ${currentTheme.lightBorder} text-slate-900 text-base sm:text-[15px] font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 transition`} />
                  </div>
                )}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[13px] font-semibold text-slate-700">Kesan/Pesan</label>
                  <textarea required value={formData.kesan} onChange={(e) => setFormData({ ...formData, kesan: e.target.value })} className={`w-full px-4 min-h-[48px] py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base sm:text-[15px] font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 transition resize-none h-20`} />
                </div>
              </div>

              <div className="lg:col-span-6 space-y-5">
                <div className="card rounded-2xl p-5 sm:p-6 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className={`text-[15px] font-semibold text-slate-800 flex items-center gap-2`}><Camera className={`w-3.5 h-3.5 ${currentTheme.text}`} /> Foto Pengunjung</h3>
                    {photoData && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Foto Siap</span>}
                  </div>
                  <button type="button" onClick={() => setShowCamera(true)} aria-label={photoData ? 'Ambil ulang foto pengunjung' : 'Buka kamera untuk foto pengunjung'}
                    className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-100 transition hover:border-slate-400">
                    {photoData ? (
                      <>
                        <img src={resolveImageSrc(photoData)} alt="Foto pengunjung" className="h-full w-full object-cover" />
                        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"><RefreshCw className="h-3.5 w-3.5" />Ambil ulang</span>
                      </>
                    ) : (
                      <span className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition group-hover:scale-105"><Camera className="h-5 w-5 text-slate-500" /></span>
                        <span className="text-sm font-semibold text-slate-700">Kamera belum aktif.</span>
                        <span className="text-xs text-slate-500">Ketuk untuk membuka kamera</span>
                      </span>
                    )}
                  </button>
                </div>

                <div className="card rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className={`text-[15px] font-semibold text-slate-800 flex items-center gap-2`}><PenTool className={`w-3.5 h-3.5 ${currentTheme.text}`} /> Tanda Tangan</h3>
                    <button type="button" onClick={clearSignature} className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2 py-2 transition"><Trash2 className="w-3 h-3" /> Hapus</button>
                  </div>
                  <div className="relative w-full aspect-[4/3] bg-[#F9F9FB] rounded-xl overflow-hidden border border-slate-200/80 touch-none flex items-center justify-center shadow-inner">
                    <canvas ref={signatureCanvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="w-full h-full cursor-crosshair" />
                    {!signatureData && <div className="absolute pointer-events-none text-slate-400 text-xs font-medium px-4">Goreskan tanda tangan di sini</div>}
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className={`w-full py-4 px-5 ${currentTheme.button} text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition`}>
                  {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>Menyimpan & Mengunggah ke Drive...</span></> : <><Send className="w-4 h-4" /><span>Simpan Presensi Pengunjung</span></>}
                </button>
              </div>
            </form>
          </div>
        )}

        {viewMode === 'admin' && (
          <div className="rise space-y-5" style={{ '--d': '120ms' }}>
            <div className="card p-2 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center bg-slate-200 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                <button onClick={() => setAdminTab('list')} className={`flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${adminTab === 'list' ? `bg-white ${currentTheme.text} shadow-sm` : 'text-slate-600 hover:bg-black/5'}`}>
                  <List className="w-3.5 h-3.5" /><span>Daftar Pengunjung ({guestList.length})</span>
                </button>
                <button onClick={() => setAdminTab('event')} className={`flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${adminTab === 'event' ? `bg-white ${currentTheme.text} shadow-sm` : 'text-slate-600 hover:bg-black/5'}`}>
                  <Edit3 className="w-3.5 h-3.5" /><span>Info & Tema Pameran</span>
                </button>
              </div>
            </div>

            {adminTab === 'list' && (
              <div className="space-y-4">
                <div className="card p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><List className={`w-4 h-4 ${currentTheme.text}`} />Rekapitulasi Pengunjung ({guestList.length})</h2>
                    <p className="text-xs text-slate-500 font-medium">Foto aman tersimpan langsung di Google Drive Cloud</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
                      <input type="text" placeholder="Cari nama / alamat..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-100 border border-slate-300 text-base sm:text-sm text-slate-900 min-h-[44px] focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 font-medium transition`} />
                    </div>
                    <button onClick={handleRefreshSync} disabled={isSyncing} className={`px-4 py-2.5 ${currentTheme.button} disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm`}><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Data</button>
                    
                    <button onClick={() => setShowPdfModal(true)} disabled={guestList.length === 0} className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm">
                      <Printer className="w-3.5 h-3.5" /> Laporan PDF
                    </button>
                  </div>
                </div>

                {filteredGuests.length === 0 ? (
                  <div className="card rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-2">
                    <User className="w-8 h-8 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-800">Belum Ada Tamu Tercatat</h3>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredGuests.map((guest) => (
                      <div key={guest.id} className="card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-all relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${guest.driveStatus && guest.driveStatus.includes('Gagal') ? 'bg-rose-400' : 'bg-emerald-400'}`} title={guest.driveStatus} />
                        <div className="flex items-center gap-4 pl-2">
                          <div onClick={() => setPreviewItem(guest)} className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 cursor-pointer shadow-inner">
                            <img src={resolveImageSrc(guest.photo)} alt={guest.nama} className="w-full h-full object-cover" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2"><h4 className="font-bold text-slate-900 text-sm">{guest.nama}</h4><span className={`text-[11px] px-2.5 py-0.5 rounded-full ${currentTheme.lightBg} border ${currentTheme.lightBorder} ${currentTheme.text} font-semibold`}>{guest.layanan}</span></div>
                            <p className="text-xs text-slate-500 font-medium">{guest.alamat} • WhatsApp: <span className="font-mono">{guest.whatsapp}</span></p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 font-mono"><Clock className="w-3 h-3 text-slate-400" /> {translateDateToIndo(guest.hariTanggal)} • {guest.jamKunjungan}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="hidden lg:flex flex-col items-end text-xs text-slate-400 font-mono">
                            <span>ID: {guest.id}</span>
                            <span className="text-emerald-600 font-medium">{guest.driveStatus || 'Tersimpan'}</span>
                          </div>
                          <button onClick={() => setPreviewItem(guest)} className={`px-4 py-2.5 bg-slate-100 hover:bg-slate-200 ${currentTheme.text} rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-sm`}>
                            <span>Detail</span><ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {adminTab === 'event' && (
              <div className="card rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
                <div><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Settings className={`w-4 h-4 ${currentTheme.text}`} />Pengaturan Utama Pameran</h2></div>
                <form onSubmit={handleSaveEventConfig} className="space-y-4">
                  <div className="space-y-1.5"><label className="text-[13px] font-semibold text-slate-700">Nama Kegiatan Pameran</label><input type="text" required value={tempEventConfig.namaKegiatan} onChange={(e) => setTempEventConfig({ ...tempEventConfig, namaKegiatan: e.target.value })} className={`w-full px-4 min-h-[48px] py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base sm:text-[15px] font-bold uppercase focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 transition`} /></div>
                  <div className="space-y-1.5"><label className="text-[13px] font-semibold text-slate-700">Lokasi / Keterangan</label><input type="text" required value={tempEventConfig.lokasi} onChange={(e) => setTempEventConfig({ ...tempEventConfig, lokasi: e.target.value })} className={`w-full px-4 min-h-[48px] py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base sm:text-[15px] font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 transition`} /></div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-700">Teks Ajakan Survei (Pop-up Berhasil)</label>
                    <input type="text" required value={tempEventConfig.teksSurvei || ''} onChange={(e) => setTempEventConfig({ ...tempEventConfig, teksSurvei: e.target.value })} className={`w-full px-4 min-h-[48px] py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base sm:text-[15px] font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 transition`} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-700">Link Website Survei Kepuasan Layanan</label>
                    <input type="url" required value={tempEventConfig.surveiUrl} onChange={(e) => setTempEventConfig({ ...tempEventConfig, surveiUrl: e.target.value })} className={`w-full px-4 min-h-[48px] py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base sm:text-[15px] font-mono font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 transition`} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-700">Gambar latar sub-header (opsional)</label>
                    <p className="text-xs text-slate-500">Rasio 16:9, tampil sama di desktop dan HP. Gambar dipotong dan dikompres otomatis sebelum disimpan.</p>
                    {tempEventConfig.bannerImage && (
                      <div className="space-y-2">
                        <div className={`relative isolate aspect-video overflow-hidden rounded-xl border border-slate-200 ${(THEMES[tempEventConfig.tema] || currentTheme).subHeaderBg}`}>
                          <img src={tempEventConfig.bannerImage} alt="Pratinjau latar sub-header" className="banner-img absolute inset-0 -z-10 h-full w-full object-cover" style={{ opacity: (tempEventConfig.bannerOpacity ?? 55) / 100 }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <label htmlFor="banner-transparency" className="text-[13px] font-semibold text-slate-700">Transparansi gambar</label>
                          <span className="text-xs font-semibold tabular-nums text-slate-600">{100 - (tempEventConfig.bannerOpacity ?? 55)}%</span>
                        </div>
                        <input id="banner-transparency" type="range" min="0" max="90" step="5" value={100 - (tempEventConfig.bannerOpacity ?? 55)}
                          onChange={(e) => { const v = Number(e.target.value); setTempEventConfig((c) => ({ ...c, bannerOpacity: 100 - v })); }}
                          className="h-11 w-full cursor-pointer accent-slate-900" />
                        <p className="text-xs text-slate-500">Geser ke kanan agar gambar lebih transparan dan warna tema lebih terlihat. Pratinjau mengikuti tema yang dipilih.</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 focus-within:ring-4 focus-within:ring-slate-900/10">
                        <ImagePlus className="h-4 w-4" />{tempEventConfig.bannerImage ? 'Ganti gambar' : 'Pilih gambar'}
                        <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; const r = new FileReader(); r.onload = () => setCropSrc(r.result); r.readAsDataURL(f); }} />
                      </label>
                      {tempEventConfig.bannerImage && (
                        <button type="button" onClick={() => setTempEventConfig({ ...tempEventConfig, bannerImage: '' })} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-50 px-4 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"><Trash2 className="h-4 w-4" />Hapus gambar</button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 border-t border-slate-100 pt-4 mt-2">
                    <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Tema Warna Aplikasi</label>
                    <div className="relative">
                      <select required value={tempEventConfig.tema || 'biru'} onChange={(e) => setTempEventConfig({ ...tempEventConfig, tema: e.target.value })} className={`w-full appearance-none px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base sm:text-[15px] font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5 cursor-pointer pr-10`}>
                        {Object.entries(THEMES).map(([key, themeObj]) => (
                          <option key={key} value={key}>{themeObj.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <button type="submit" className={`mt-2 flex items-center gap-2 px-5 py-3 ${currentTheme.button} text-white rounded-xl font-bold text-xs shadow-sm transition`}><Save className="w-4 h-4" /><span>Simpan Perubahan</span></button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER APLIKASI */}
      <footer className={`rise mt-auto py-6 px-4 text-center transition-colors duration-300 border-t border-black/10`} style={{ backgroundColor: currentTheme.hexHeader, color: '#FFFFFF', '--d': '240ms' }}>
        <div className="max-w-4xl mx-auto space-y-1.5 text-xs">
          <p className="font-black tracking-wider uppercase opacity-95">KANTOR IMIGRASI KELAS II TPI KEDIRI</p>
          <p className="font-medium leading-relaxed opacity-85">Jl. Jawa No. 135, Bedrek Selatan, Desa Grogol, Kecamatan Grogol, Kabupaten Kediri, Jawa Timur 64151</p>
          <p className="text-[11px] font-mono pt-1 opacity-70">&copy; {new Date().getFullYear()} Kantor Imigrasi Kediri • All Rights Reserved</p>
        </div>
      </footer>

      <CameraModal open={showCamera} onClose={() => setShowCamera(false)} btn={currentTheme.button} onError={(m) => showToast(m, 'error')}
        onCapture={(d) => { setPhotoData(d); setShowCamera(false); showToast('Foto berhasil diambil.', 'success'); }} />
      <CropDialog src={cropSrc} ratio={BANNER_RATIO} btn={currentTheme.button} onCancel={() => setCropSrc(null)}
        onDone={(d) => { setTempEventConfig((c) => ({ ...c, bannerImage: d })); setCropSrc(null); }} />

      {showLoginModal && (
        <Portal><div className="overlay-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="modal-card bg-white border border-slate-200/70 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.15)] scale-100">
            <div className="text-center space-y-1"><div className={`w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-xl ${currentTheme.lightBg} border ${currentTheme.lightBorder} ${currentTheme.text}`}><ShieldCheck className="w-6 h-6" /></div><h3 className="text-base font-bold text-slate-900">Login Petugas Admin</h3></div>
            {loginError && <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-center font-medium">{loginError}</div>}
            <form onSubmit={handleAdminLogin} className="space-y-2.5">
              <input type="text" required autoFocus autoComplete="username" aria-label="Username" placeholder="Username" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className={`w-full px-4 min-h-[48px] rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5`} />
              <input type="password" required autoComplete="current-password" aria-label="Password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className={`w-full px-4 min-h-[48px] rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base font-medium focus:bg-white ${currentTheme.border} outline-none focus:ring-4 focus:ring-slate-900/5`} />
              <div className="flex gap-2 pt-2"><button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition">Batal</button><button type="submit" className={`flex-1 py-2.5 ${currentTheme.button} text-white font-bold rounded-xl text-xs transition shadow-sm`}>Masuk</button></div>
            </form>
          </div>
        </div></Portal>
      )}

      {showPdfModal && (
        <Portal><div className="overlay-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="modal-card bg-white border border-slate-200/70 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">Format Laporan PDF</h3>
              <button onClick={() => setShowPdfModal(false)} className="p-2.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <button onClick={() => handleExecutePDF('all')} className={`w-full py-3.5 ${currentTheme.button} text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm`}>
                <List className="w-4 h-4"/> 1 Tabel (Keseluruhan Data)
              </button>
              <button onClick={() => handleExecutePDF('per-day')} className={`w-full py-3.5 ${currentTheme.lightBg} border ${currentTheme.lightBorder} ${currentTheme.text} hover:bg-slate-100 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm`}>
                <Calendar className="w-4 h-4"/> Pisah Tabel (Per Hari/Tanggal)
              </button>
            </div>
          </div>
        </div></Portal>
      )}

      {showSuccessModal && lastSubmittedGuest && (
        <Portal><div className="overlay-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="modal-card bg-white border border-slate-200/70 rounded-2xl max-w-sm w-full p-7 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 className="w-8 h-8" /></div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Presensi Berhasil Disimpan</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">Terima kasih telah berkunjung ke Stand Kantor Imigrasi Kediri.</p>
              <p className={`text-xs ${currentTheme.text} font-semibold leading-relaxed pt-1`}>
                {eventConfig.teksSurvei}
              </p>
            </div>
            <button onClick={handleOpenSurvei} className={`w-full py-3.5 mt-2 ${currentTheme.button} text-white rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 transition shadow-md`}>
              <span>SURVEI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div></Portal>
      )}

      {previewItem && (
        <Portal><div className="overlay-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="modal-card bg-white border border-slate-200/70 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Detail Kartu Pengunjung</h3>
              <button onClick={() => setPreviewItem(null)} className="p-2.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-400 font-semibold uppercase">Foto Selfie</label><div className="mt-1 aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden border border-slate-200"><img src={resolveImageSrc(previewItem.photo)} alt="Foto" className="w-full h-full object-cover" /></div></div>
              <div><label className="text-xs text-slate-400 font-semibold uppercase">Tanda Tangan</label><div className="mt-1 aspect-[4/3] bg-white rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center p-1 shadow-inner"><img src={resolveImageSrc(previewItem.signature)} alt="TTD" className="max-h-full max-w-full object-contain" /></div></div>
            </div>
            
            <div className="bg-slate-100 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Status Data:</span><span className={`font-semibold ${previewItem.driveStatus && previewItem.driveStatus.includes('Gagal') ? 'text-rose-600' : 'text-emerald-600'}`}>{previewItem.driveStatus || 'Tersimpan'}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Tanggal Kunjungan:</span><span className={`font-semibold ${currentTheme.text} text-right`}>{translateDateToIndo(previewItem.hariTanggal)} • {previewItem.jamKunjungan}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Nama:</span><span className="font-bold text-slate-900 text-sm text-right">{previewItem.nama}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Instansi:</span><span className="text-slate-700 font-medium text-right">{previewItem.alamat}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">WhatsApp:</span><span className="text-slate-700 font-mono font-medium">{previewItem.whatsapp}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Keperluan:</span><span className="text-slate-700 font-medium text-right">{previewItem.layanan}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Titik GPS:</span><span className="text-slate-700 font-mono font-medium text-right text-[11px]"><a href={`https://maps.google.com/?q=${previewItem.gps}`} target="_blank" rel="noreferrer" className={`${currentTheme.text} hover:underline`}>{previewItem.gps}</a></span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-medium">IP Address:</span><span className="text-slate-700 font-mono font-medium text-[11px]">{previewItem.ipAddress}</span></div>
            </div>

            {previewItem.kesan && previewItem.kesan !== '-' && (
              <div className={`${currentTheme.lightBg} border ${currentTheme.lightBorder} rounded-xl p-4`}>
                <span className={`text-xs ${currentTheme.text} font-bold block mb-1`}>Kesan / Pesan:</span>
                <p className="text-xs text-slate-700 italic leading-relaxed">{previewItem.kesan}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => handleDeleteSingleGuest(previewItem.id)} className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"><Trash2 className="w-4 h-4" /> Hapus Permanen</button>
              <button onClick={() => setPreviewItem(null)} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition">Tutup</button>
            </div>
          </div>
        </div></Portal>
      )}
    </div>
  );
}
