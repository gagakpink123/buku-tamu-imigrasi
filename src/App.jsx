import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, RefreshCw, PenTool, User, MapPin, Phone, Send, CheckCircle2,
  Settings, List, Image as ImageIcon, Copy, Check, Trash2, HelpCircle,
  X, AlertCircle, Download, FolderOpen, Lock, Unlock, ShieldCheck,
  Clock, Calendar, Search, Info, LogOut, ChevronRight, ChevronDown,
  Edit3, Save, ArrowLeft
} from 'lucide-react';

// 1. IMPORT FIREBASE (Sistem Database Real-time)
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

// ==========================================
// KONFIGURASI FIREBASE (WAJIB DIISI NANTI)
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
  // Mencoba menghubungkan ke database
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.log("Firebase berjalan dalam mode lokal sementara.");
}

// --- LOGO MENGGUNAKAN FILE GAMBAR PNG/JPG ---
function ImmigrationLogo({ className = "w-16 h-20 sm:w-20 sm:h-24" }) {
  return (
    <img 
      src="/logo-imigrasi.png" 
      alt="Logo Imigrasi" 
      className={`${className} object-contain`} 
    />
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState('form'); 
  const [adminTab, setAdminTab] = useState('list'); 

  // Pengaturan Teks Header (Default)
  const [eventConfig, setEventConfig] = useState({
    namaKegiatan: 'STAND PAMERAN UMKM FEST',
    lokasi: 'Simpang Lima Gumul Kabupaten Kediri'
  });
  const [tempEventConfig, setTempEventConfig] = useState({ ...eventConfig });

  // Admin Auth
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Realtime Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form Tamu State
  const [formData, setFormData] = useState({
    nama: '', alamat: '', whatsapp: '', layanan: 'Informasi Layanan Paspor', layananLainnya: ''
  });

  const [photoData, setPhotoData] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('user');
  const [cameraError, setCameraError] = useState('');

  const [scriptUrl, setScriptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmittedGuest, setLastSubmittedGuest] = useState(null);
  const [guestList, setGuestList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const videoRef = useRef(null);
  const canvasPhotoRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // MENDENGARKAN PERUBAHAN NAMA PAMERAN DARI FIREBASE SECARA REALTIME
  useEffect(() => {
    if (db) {
      const unsub = onSnapshot(doc(db, "pengaturan", "infoPameran"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEventConfig(data);
          setTempEventConfig(data);
        }
      });
      return () => unsub();
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyCode = (text) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      setCopiedCode(true);
      showToast('Skrip Google Apps Script disalin!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      showToast('Gagal menyalin', 'error');
    }
    document.body.removeChild(el);
  };

  const handleOpenAdmin = () => {
    stopCamera();
    if (!isAdminLoggedIn) {
      setLoginError('');
      setShowLoginModal(true);
    } else {
      setViewMode('admin');
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === '1mk3d1r1') {
      setIsAdminLoggedIn(true);
      setShowLoginModal(false);
      setLoginForm({ username: '', password: '' });
      setLoginError('');
      setViewMode('admin');
      showToast('Berhasil masuk ke Panel Admin!', 'success');
    } else {
      setLoginError('Username atau password admin salah!');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setViewMode('form');
    showToast('Keluar dari Panel Admin', 'info');
  };

  // MENYIMPAN INFO PAMERAN KE FIREBASE (AGAR PERMANEN)
  const handleSaveEventConfig = async (e) => {
    e.preventDefault();
    if (!tempEventConfig.namaKegiatan.trim() || !tempEventConfig.lokasi.trim()) {
      showToast('Nama kegiatan dan lokasi tidak boleh kosong', 'error');
      return;
    }
    
    if (db) {
      try {
        await setDoc(doc(db, "pengaturan", "infoPameran"), tempEventConfig);
        showToast('Info pameran berhasil diperbarui secara permanen!', 'success');
      } catch (err) {
        showToast('Gagal menyimpan ke database.', 'error');
      }
    } else {
      // Jika firebase belum di setting, simpan lokal sementara
      setEventConfig({ ...tempEventConfig });
      showToast('Disimpan lokal (Firebase belum diatur)', 'success');
    }
  };

  // --- CAMERA ---
  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraError('Browser tidak mendukung kamera langsung.');
      }
    } catch (err) {
      setCameraError('Izin akses kamera ditolak.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const switchCamera = () => {
    stopCamera();
    setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
    setTimeout(() => startCamera(), 250);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasPhotoRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoData(dataUrl);
    stopCamera();
    showToast('Foto berhasil diambil!', 'success');
  };

  const handleFileUploadPhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoData(event.target.result);
        showToast('Foto berhasil dimuat!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // --- SIGNATURE PAD ---
  const initSignaturePad = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    if (viewMode === 'form' && !signatureData) {
      initSignaturePad();
    }
  }, [viewMode]);

  const getCanvasCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      const canvas = signatureCanvasRef.current;
      if (canvas) {
        setSignatureData(canvas.toDataURL('image/png'));
      }
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama.trim()) {
      showToast('Masukkan Nama Lengkap', 'error'); return;
    }
    if (!formData.alamat.trim()) {
      showToast('Masukkan Alamat / Instansi', 'error'); return;
    }
    if (!formData.whatsapp.trim()) {
      showToast('Masukkan Nomor WhatsApp aktif', 'error'); return;
    }
    if (formData.layanan === 'Lainnya' && !formData.layananLainnya.trim()) {
      showToast('Harap isi keterangan keperluan lainnya', 'error'); return;
    }
    if (!photoData) {
      showToast('Harap ambil foto pengunjung terlebih dahulu', 'error'); return;
    }
    if (!signatureData) {
      showToast('Harap bubuhkan tanda tangan', 'error'); return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    const finalKeperluan = formData.layanan === 'Lainnya' ? formData.layananLainnya : formData.layanan;

    const newGuest = {
      id: 'KDR-' + Date.now().toString().slice(-6),
      hariTanggal: formattedDate,
      jamKunjungan: formattedTime,
      namaKegiatan: eventConfig.namaKegiatan,
      lokasi: eventConfig.lokasi,
      ...formData,
      layanan: finalKeperluan,
      photo: photoData,
      signature: signatureData,
      driveStatus: scriptUrl ? 'Mengunggah ke Drive...' : 'Tersimpan Lokal'
    };

    if (scriptUrl) {
      try {
        const payload = {
          event: `${eventConfig.namaKegiatan} - ${eventConfig.lokasi}`,
          stand: 'KANTOR IMIGRASI KELAS II TPI KEDIRI',
          hariTanggal: formattedDate,
          jamKunjungan: formattedTime,
          nama: formData.nama,
          alamat: formData.alamat,
          whatsapp: formData.whatsapp,
          layanan: finalKeperluan,
          photoBase64: photoData,
          signatureBase64: signatureData,
          timestampIso: now.toISOString()
        };

        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const resJson = await response.json();
        if (resJson.status === 'success') {
          newGuest.driveStatus = 'Tersimpan di Google Drive';
        } else {
          newGuest.driveStatus = 'Gagal sync ke Drive';
        }
      } catch (err) {
        newGuest.driveStatus = 'Tersimpan Lokal';
      }
    }

    setGuestList((prev) => [newGuest, ...prev]);
    setLastSubmittedGuest(newGuest);
    setShowSuccessModal(true);
    setIsSubmitting(false);

    setFormData({ nama: '', alamat: '', whatsapp: '', layanan: 'Informasi Layanan Paspor', layananLainnya: '' });
    setPhotoData(null);
    setSignatureData(null);
    stopCamera();
    clearSignature();
  };

  const filteredGuests = guestList.filter(
    (g) =>
      g.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.whatsapp.includes(searchQuery) ||
      g.layanan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gasSampleCode = `function doPost(e) { /* Kode Google Apps Script Anda sama seperti sebelumnya */ }`;

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] flex flex-col font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text','Segoe_UI',Roboto,sans-serif] antialiased selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex items-center gap-2.5 text-xs font-medium border backdrop-blur-xl transition-all duration-300 ${toastMessage.type === 'success' ? 'bg-white/95 text-emerald-800 border-emerald-200' : toastMessage.type === 'error' ? 'bg-white/95 text-rose-800 border-rose-200' : 'bg-white/95 text-slate-800 border-slate-200'}`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col flex-1 space-y-6">
        
        {/* HEADER SECTION */}
        <div className="bg-gradient-to-r from-[#003B73] via-[#004B93] to-[#002D59] rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgba(0,59,115,0.25)] text-white transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-6 sm:gap-8">
              <div className="flex-shrink-0">
                <ImmigrationLogo className="w-16 h-20 sm:w-20 sm:h-24" />
              </div>
              <div className="space-y-1">
                <h1 className="text-base sm:text-lg font-black text-white tracking-wide leading-tight">
                  KANTOR IMIGRASI KELAS II TPI KEDIRI
                </h1>
                <p className="text-xs sm:text-sm font-bold text-amber-300 tracking-wide uppercase">
                  {eventConfig.namaKegiatan}
                </p>
                <p className="text-xs text-blue-100 font-medium">
                  {eventConfig.lokasi}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/15">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-md text-xs font-mono font-medium text-amber-300 border border-white/10">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</span>
              </div>
              {viewMode === 'form' ? (
                <button onClick={handleOpenAdmin} className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white text-[#003B73] text-xs font-bold shadow-md hover:bg-blue-50 transition-all duration-150">
                  <Lock className="w-3.5 h-3.5 text-[#003B73]" /><span>Admin</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewMode('form')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition border border-white/20">
                    <ArrowLeft className="w-3.5 h-3.5" /><span>Form Tamu</span>
                  </button>
                  <button onClick={handleAdminLogout} className="p-2 bg-rose-500/80 hover:bg-rose-600 text-white rounded-2xl transition border border-rose-400/30">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TAMPILAN 1: FORMULIR UTAMA */}
        {viewMode === 'form' && (
          <div className="space-y-5">
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center space-y-1.5">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1C1C1E] tracking-tight">DAFTAR KEHADIRAN PENGUNJUNG</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F2F2F7] rounded-full text-xs text-slate-700 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#007AFF]" />
                <span><strong>Hari & tanggal:</strong> {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-6 bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#007AFF]" /> Informasi Pengunjung
                  </h3>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nama Lengkap <span className="text-rose-500">*</span></label>
                  <input type="text" required placeholder="Contoh: Budi Santoso" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] placeholder-slate-400 focus:bg-white focus:border-[#007AFF] text-xs sm:text-sm font-medium outline-none transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Alamat Singkat / Instansi <span className="text-rose-500">*</span></label>
                  <input type="text" required placeholder="Contoh: Kec. Pare / Komunitas UMKM" value={formData.alamat} onChange={(e) => setFormData({ ...formData, alamat: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] placeholder-slate-400 focus:bg-white focus:border-[#007AFF] text-xs sm:text-sm font-medium outline-none transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nomor WhatsApp <span className="text-rose-500">*</span></label>
                  <input type="tel" required placeholder="Contoh: 081234567890" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] placeholder-slate-400 focus:bg-white focus:border-[#007AFF] text-xs sm:text-sm font-mono font-medium outline-none transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Keperluan / Layanan Stand <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select value={formData.layanan} onChange={(e) => setFormData({ ...formData, layanan: e.target.value })} className="w-full appearance-none px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-medium focus:bg-white focus:border-[#007AFF] outline-none cursor-pointer pr-10">
                      <option value="Informasi Layanan Paspor">Informasi Layanan Paspor</option>
                      <option value="Informasi Layanan WNA">Informasi Layanan WNA</option>
                      <option value="Kunjungan Silaturahmi">Kunjungan Silaturahmi</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                {formData.layanan === 'Lainnya' && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="text-xs font-semibold text-[#007AFF]">Sebutkan Keperluan Lainnya <span className="text-rose-500">*</span></label>
                    <input type="text" required placeholder="Masukkan keterangan..." value={formData.layananLainnya} onChange={(e) => setFormData({ ...formData, layananLainnya: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-blue-50/50 border border-blue-200 text-[#1C1C1E] text-xs sm:text-sm font-medium focus:bg-white focus:border-[#007AFF] outline-none transition" />
                  </div>
                )}
              </div>

              <div className="lg:col-span-6 space-y-5">
                {/* Kamera */}
                <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-[#007AFF]" /> Foto Pengunjung <span className="text-rose-500">*</span></h3>
                    {photoData && <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Foto Siap</span>}
                  </div>
                  <div className="relative aspect-video w-full bg-[#E5E5EA] rounded-2xl overflow-hidden border border-slate-200/80 flex items-center justify-center shadow-inner">
                    {isCameraActive && <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`} />}
                    {!isCameraActive && photoData && <img src={photoData} alt="Foto" className="w-full h-full object-cover" />}
                    {!isCameraActive && !photoData && (
                      <div className="flex flex-col items-center justify-center p-4 text-center space-y-1.5">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"><Camera className="w-5 h-5 text-slate-400" /></div>
                        <p className="text-[11px] text-slate-500 font-medium">Kamera belum aktif.</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCameraActive ? (
                      <>
                        <button type="button" onClick={startCamera} className="flex-1 py-2.5 px-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"><Camera className="w-3.5 h-3.5" />{photoData ? 'Ambil Ulang' : 'Buka Kamera'}</button>
                        <label className="cursor-pointer py-2.5 px-3.5 bg-[#F2F2F7] text-slate-700 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition"><ImageIcon className="w-3.5 h-3.5" /><span>Galeri</span><input type="file" accept="image/*" onChange={handleFileUploadPhoto} className="hidden" /></label>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={capturePhoto} className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"><Check className="w-3.5 h-3.5" />Jepret Foto</button>
                        <button type="button" onClick={switchCamera} className="p-2.5 bg-[#F2F2F7] text-slate-700 rounded-2xl"><RefreshCw className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={stopCamera} className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl"><X className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>

                {/* Tanda Tangan */}
                <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><PenTool className="w-3.5 h-3.5 text-[#007AFF]" /> Tanda Tangan <span className="text-rose-500">*</span></h3>
                    <button type="button" onClick={clearSignature} className="text-[11px] font-semibold text-rose-600 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Hapus</button>
                  </div>
                  <div className="relative w-full h-44 bg-[#F9F9FB] rounded-2xl overflow-hidden border border-slate-200/80 touch-none flex items-center justify-center shadow-inner">
                    <canvas ref={signatureCanvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="w-full h-full cursor-crosshair" />
                    {!signatureData && <div className="absolute pointer-events-none text-slate-400 text-xs font-medium px-4">Goreskan tanda tangan di sini</div>}
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 px-5 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,122,255,0.25)] disabled:opacity-50">
                  {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>Menyimpan...</span></> : <><Send className="w-4 h-4" /><span>Simpan Presensi Pengunjung</span></>}
                </button>
              </div>
            </form>
          </div>
        )}

<<<<<<< HEAD
        {/* ======================================================== */}
=======
       {/* ======================================================== */}
>>>>>>> 53d78c8 (Finalisasi lengkap aplikasi buku tamu imigrasi)
        {/* TAMPILAN 2: HALAMAN ADMIN */}
        {/* ======================================================== */}
        {viewMode === 'admin' && (
          <div className="space-y-5">
            {/* Tab Navigasi Admin */}
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-2 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center bg-[#E5E5EA] p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setAdminTab('list')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    adminTab === 'list' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Daftar Pengunjung ({guestList.length})</span>
                </button>

                <button
                  onClick={() => setAdminTab('event')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    adminTab === 'event' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Info Pameran</span>
                </button>

                <button
                  onClick={() => setAdminTab('drive')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    adminTab === 'drive' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Google Drive</span>
                </button>
              </div>
            </div>

            {/* 1. TAB DAFTAR PENGUNJUNG */}
            {adminTab === 'list' && (
              <div className="space-y-4">
                <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h2 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
                      <List className="w-4 h-4 text-[#007AFF]" />
                      Rekapitulasi Pengunjung ({guestList.length})
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Data kehadiran tercatat pada sistem</p>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari nama / alamat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F2F2F7] border border-transparent text-xs text-[#1C1C1E] focus:bg-white focus:border-[#007AFF] outline-none font-medium"
                      />
                    </div>

                    <button
                      onClick={() => {
                        const csvContent =
                          'data:text/csv;charset=utf-8,' +
                          ['Hari / Tanggal,Jam Kunjungan,Nama Lengkap,Alamat / Instansi,WhatsApp,Keperluan'].join(',') +
                          '\n' +
                          guestList
                            .map(
                              (g) =>
                                `"${g.hariTanggal}","${g.jamKunjungan}","${g.nama}","${g.alamat}","'${g.whatsapp}","${g.layanan}"`
                            )
                            .join('\n');
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement('a');
                        link.setAttribute('href', encodedUri);
                        link.setAttribute(
                          'download',
                          `Buku_Tamu_Imigrasi_Kediri_${new Date().toISOString().slice(0, 10)}.csv`
                        );
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      disabled={guestList.length === 0}
                      className="px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </button>
                  </div>
                </div>

                {filteredGuests.length === 0 ? (
                  <div className="bg-white/85 border border-white/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-2">
                    <User className="w-8 h-8 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-800">Belum Ada Tamu Tercatat</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredGuests.map((guest) => (
                      <div
                        key={guest.id}
                        className="bg-white/90 border border-white/80 rounded-2xl p-4 flex gap-3.5 items-center hover:shadow-sm transition-all"
                      >
                        <div
                          onClick={() => setPreviewItem(guest)}
                          className="w-16 h-16 rounded-2xl overflow-hidden bg-[#F2F2F7] border border-slate-200 flex-shrink-0 cursor-pointer relative"
                        >
                          <img src={guest.photo} alt={guest.nama} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-[#1C1C1E] truncate">{guest.nama}</h4>
                            <span className="text-[11px] text-[#007AFF] font-mono font-semibold">
                              {guest.jamKunjungan}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate font-medium">
                            {guest.alamat} • {guest.whatsapp}
                          </p>
                          <div className="pt-1 flex items-center justify-between gap-2">
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F2F2F7] text-slate-700 font-medium truncate">
                              {guest.layanan}
                            </span>
                            <button
                              onClick={() => setPreviewItem(guest)}
                              className="text-[11px] text-[#007AFF] hover:underline flex items-center font-semibold"
                            >
                              Detail <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. TAB INFO PAMERAN */}
            {adminTab === 'event' && (
              <div className="bg-white/90 border border-white/60 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
                <div>
                  <h2 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#007AFF]" />
                    Pengaturan Nama Kegiatan & Lokasi Pameran
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Ubah teks nama kegiatan pameran dan lokasi pada header secara permanen
                  </p>
                </div>

                <form onSubmit={handleSaveEventConfig} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Nama Kegiatan Pameran (Huruf Kapital)</label>
                    <input
                      type="text"
                      required
                      value={tempEventConfig.namaKegiatan}
                      onChange={(e) => setTempEventConfig({ ...tempEventConfig, namaKegiatan: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-bold uppercase focus:bg-white focus:border-[#007AFF] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Lokasi / Keterangan di Bawah Nama Kegiatan</label>
                    <input
                      type="text"
                      required
                      value={tempEventConfig.lokasi}
                      onChange={(e) => setTempEventConfig({ ...tempEventConfig, lokasi: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-medium focus:bg-white focus:border-[#007AFF] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl font-bold text-xs shadow-sm transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Permanen</span>
                  </button>
                </form>
              </div>
            )}
<<<<<<< HEAD

            {/* 3. TAB GOOGLE DRIVE */}
            {adminTab === 'drive' && (
              <div className="bg-white/90 border border-white/60 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[#007AFF]" />
                    Integrasi Google Drive & Spreadsheet
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Masukkan URL Web App dari Google Apps Script agar setiap tamu otomatis masuk ke Spreadsheet dan Google Drive.
                  </p>
                </div>
=======

            {/* 3. TAB GOOGLE DRIVE */}
            {adminTab === 'drive' && (
              <div className="bg-white/90 border border-white/60 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[#007AFF]" />
                    Integrasi Google Drive & Spreadsheet
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Masukkan URL Web App dari Google Apps Script agar setiap tamu otomatis masuk ke Spreadsheet dan Google Drive.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Google Apps Script Web App URL</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={scriptUrl}
                      onChange={(e) => setScriptUrl(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] placeholder-slate-400 text-xs font-mono focus:bg-white focus:border-[#007AFF] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => showToast('URL Webhook Google Drive disimpan!', 'success')}
                      className="px-5 py-3 bg-[#007AFF] text-white font-semibold rounded-2xl text-xs"
                    >
                      Simpan URL
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Kode Google Apps Script:</span>
                    <button
                      onClick={() => handleCopyCode(gasSampleCode)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F2F7] text-xs text-[#007AFF] font-semibold"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? 'Tersalin' : 'Salin Kode'}
                    </button>
                  </div>
                  <pre className="p-4 bg-[#1C1C1E] text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed">
                    {gasSampleCode}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

{/* FOOTER RESMI INSTANSI */}
      <footer className="mt-auto bg-[#002D59] text-white py-6 px-4 text-center border-t border-blue-900/40">
        <div className="max-w-4xl mx-auto space-y-1.5 text-xs">
          <p className="font-black tracking-wider text-amber-300">
            KANTOR IMIGRASI KELAS II TPI KEDIRI
          </p>
          <p className="text-blue-100/90 font-medium leading-relaxed">
            Jl. Jawa No. 135, Bedrek Selatan, Desa Grogol, Kecamatan Grogol, Kabupaten Kediri, Jawa Timur 64151
          </p>
          <p className="text-[11px] text-blue-300 font-mono pt-1">
            &copy; {new Date().getFullYear()} Kantor Imigrasi Kediri • All Rights Reserved
          </p>
        </div>
      </footer>
>>>>>>> 53d78c8 (Finalisasi lengkap aplikasi buku tamu imigrasi)

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Google Apps Script Web App URL</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={scriptUrl}
                      onChange={(e) => setScriptUrl(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] placeholder-slate-400 text-xs font-mono focus:bg-white focus:border-[#007AFF] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => showToast('URL Webhook Google Drive disimpan!', 'success')}
                      className="px-5 py-3 bg-[#007AFF] text-white font-semibold rounded-2xl text-xs"
                    >
                      Simpan URL
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Kode Google Apps Script:</span>
                    <button
                      onClick={() => handleCopyCode(gasSampleCode)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F2F7] text-xs text-[#007AFF] font-semibold"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? 'Tersalin' : 'Salin Kode'}
                    </button>
                  </div>
                  <pre className="p-4 bg-[#1C1C1E] text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed">
                    {gasSampleCode}
                  </pre>
                </div>
              </div>
            )}
          </div>
<<<<<<< HEAD
        )}
=======
        </div>
      )}

      {/* MODAL SUCCESS */}
      {showSuccessModal && lastSubmittedGuest && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl max-w-sm w-full p-6 text-center shadow-[0_16px_40px_rgba(0,0,0,0.15)] space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1C1E]">Presensi Berhasil Disimpan</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Terima kasih telah berkunjung ke Stand Kantor Imigrasi Kediri.</p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl text-xs font-bold transition shadow-sm"
            >
              Pengunjung Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW DETAIL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#1C1C1E]">Detail Kartu Pengunjung</h3>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-full bg-[#F2F2F7] text-slate-500 hover:text-[#1C1C1E] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold uppercase">Foto</label>
                <div className="mt-1 aspect-video bg-[#F2F2F7] rounded-2xl overflow-hidden border border-slate-200">
                  <img src={previewItem.photo} alt="Foto" className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold uppercase">Tanda Tangan</label>
                <div className="mt-1 aspect-video bg-white rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center p-1 shadow-inner">
                  <img src={previewItem.signature} alt="TTD" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            </div>

            <div className="bg-[#F2F2F7] rounded-2xl p-4 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Waktu Kunjungan:</span>
                <span className="font-semibold text-[#007AFF]">{previewItem.hariTanggal} • {previewItem.jamKunjungan}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Nama:</span>
                <span className="font-bold text-[#1C1C1E] text-sm">{previewItem.nama}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Alamat / Instansi:</span>
                <span className="text-slate-700 font-medium">{previewItem.alamat}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Nomor WhatsApp:</span>
                <span className="text-slate-700 font-mono font-medium">{previewItem.whatsapp}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Keperluan:</span>
                <span className="text-slate-700 font-medium">{previewItem.layanan}</span>
              </div>
            </div>

            <button
              onClick={() => setPreviewItem(null)}
              className="w-full py-2.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-slate-800 rounded-2xl text-xs font-semibold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
>>>>>>> 53d78c8 (Finalisasi lengkap aplikasi buku tamu imigrasi)
