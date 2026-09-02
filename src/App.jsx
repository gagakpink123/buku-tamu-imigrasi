import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, RefreshCw, PenTool, User, MapPin, Phone, Send, CheckCircle2,
  Settings, List, Image as ImageIcon, Copy, Check, Trash2, HelpCircle,
  X, AlertCircle, Download, FolderOpen, Lock, Unlock, ShieldCheck,
  Clock, Calendar, Search, Info, LogOut, ChevronRight, ChevronDown,
  Edit3, Save, ArrowLeft, Trash, Printer
} from 'lucide-react';

// 1. IMPORT FIREBASE
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

const resolveImageSrc = (imageData) => {
  if (!imageData) return "";
  if (imageData.startsWith('data:')) return imageData;
  if (imageData.includes('drive.google.com') || imageData.includes('googleusercontent.com')) {
    try {
      let fileId = '';
      if (imageData.includes('/d/')) fileId = imageData.split('/d/')[1].split('/')[0];
      else if (imageData.includes('id=')) fileId = imageData.split('id=')[1].split('&')[0];
      if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}`;
    } catch (e) { return imageData; }
  }
  return imageData;
};

// --- LOGO ---
function ImmigrationLogo({ className = "w-16 h-20 sm:w-20 sm:h-24" }) {
  return (
    <img 
      src="/logo-imigrasi.png" 
      alt="Logo Imigrasi" 
      className={`${className} object-contain filter drop-shadow-md`} 
      onError={(e) => {
        e.target.onerror = null; 
        e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Logo_of_the_Directorate_General_of_Immigration_%28Indonesia%29.svg/1024px-Logo_of_the_Directorate_General_of_Immigration_%28Indonesia%29.svg.png";
      }}
    />
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState('form'); 
  const [adminTab, setAdminTab] = useState('list'); 

  const [eventConfig, setEventConfig] = useState(() => {
    const saved = localStorage.getItem('imigrasi_event_config');
    return saved ? JSON.parse(saved) : {
      namaKegiatan: 'STAND PAMERAN UMKM FEST',
      lokasi: 'Simpang Lima Gumul Kabupaten Kediri'
    };
  });
  const [tempEventConfig, setTempEventConfig] = useState({ ...eventConfig });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [currentTime, setCurrentTime] = useState(new Date());
  const [userIpAddress, setUserIpAddress] = useState('Memuat IP...');
  const [gpsLocation, setGpsLocation] = useState('Meminta akses lokasi...');

  const [formData, setFormData] = useState({
    nama: '', alamat: '', whatsapp: '', layanan: 'Informasi Layanan Paspor', layananLainnya: '', kesan: ''
  });

  const [photoData, setPhotoData] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('user');
  const [cameraError, setCameraError] = useState('');

  // ⚠️ GANTI URL INI JIKA ADA DEPLOYMENT GOOGLE APPS SCRIPT BARU
  const [scriptUrl, setScriptUrl] = useState("https://script.google.com/macros/s/AKfycbyH36FxJxLJOmkR79Qj2osgF-jNXLBBfUiNAWqs2BvakGxhkW_0iwRBUJdyH1EXJU59/exec")
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmittedGuest, setLastSubmittedGuest] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [guestList, setGuestList] = useState(() => {
    const saved = localStorage.getItem('imigrasi_guest_list');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const videoRef = useRef(null);
  const canvasPhotoRef = useRef(null);
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
          setEventConfig(data); setTempEventConfig(data);
          localStorage.setItem('imigrasi_event_config', JSON.stringify(data));
        }
      });
      return () => unsubPameran();
    }
  }, []);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type }); setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdmin = () => {
    stopCamera();
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
    if (!tempEventConfig.namaKegiatan.trim() || !tempEventConfig.lokasi.trim()) { showToast('Nama kegiatan dan lokasi tidak boleh kosong', 'error'); return; }
    setEventConfig({ ...tempEventConfig }); localStorage.setItem('imigrasi_event_config', JSON.stringify(tempEventConfig));
    if (db) { try { await setDoc(doc(db, "pengaturan", "infoPameran"), tempEventConfig); showToast('Info disinkronisasi ke Cloud!', 'success'); } catch (err) { showToast('Info disimpan lokal.', 'info'); } }
  };

  const startCamera = async () => {
    setCameraError(''); setIsCameraActive(true);
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing, width: 640, height: 480 }, audio: false }); if (videoRef.current) videoRef.current.srcObject = stream; } 
    catch (err) { setCameraError('Izin akses kamera ditolak.'); }
  };
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) { videoRef.current.srcObject.getTracks().forEach(t => t.stop()); videoRef.current.srcObject = null; }
    setIsCameraActive(false);
  };
  useEffect(() => { return () => stopCamera(); }, [viewMode]);
  const switchCamera = () => { stopCamera(); setCameraFacing(p => p === 'user' ? 'environment' : 'user'); setTimeout(() => startCamera(), 300); };
  const capturePhoto = () => {
    if (!videoRef.current) return; const video = videoRef.current; const canvas = canvasPhotoRef.current || document.createElement('canvas');
    const scale = 480 / video.videoWidth; canvas.width = 480; canvas.height = video.videoHeight * scale; const ctx = canvas.getContext('2d');
    if (cameraFacing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); } ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoData(canvas.toDataURL('image/jpeg', 0.65)); stopCamera(); showToast('Foto ditangkap!', 'success');
  };
  const handleFileUploadPhoto = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 5000000) { const reader = new FileReader(); reader.onload = (ev) => { setPhotoData(ev.target.result); showToast('Foto dimuat!', 'success'); }; reader.readAsDataURL(file); } 
    else { showToast('Ukuran foto terlalu besar', 'error'); }
  };
  const initSignaturePad = () => {
    const canvas = signatureCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; canvas.height = rect.height * 2; ctx.scale(2, 2);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  };
  useEffect(() => {
    if (viewMode === 'form' && !signatureData) { initSignaturePad(); const handleResize = () => { if(!signatureData) initSignaturePad(); }; window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }
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
    if (formData.layanan === 'Lainnya' && !formData.layananLainnya.trim()) { showToast('Sebutkan keperluan Anda secara spesifik', 'error'); return; }
    if (!photoData) { showToast('Harap ambil foto pengunjung (Wajib)', 'error'); return; }
    if (!signatureData) { showToast('Harap bubuhkan tanda tangan (Wajib)', 'error'); return; }

    setIsSubmitting(true);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    const finalKeperluan = formData.layanan === 'Lainnya' ? formData.layananLainnya : formData.layanan;
    const uniqueId = 'KDR-' + Date.now().toString().slice(-6);

    const newGuest = {
      id: uniqueId, hariTanggal: formattedDate, jamKunjungan: formattedTime,
      namaKegiatan: eventConfig.namaKegiatan, lokasi: eventConfig.lokasi,
      ipAddress: userIpAddress, gps: gpsLocation, ...formData,
      kesan: formData.kesan || '-', layanan: finalKeperluan,
      photo: photoData, signature: signatureData, driveStatus: 'Mengunggah ke Cloud...'
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
        if (resJson.status === 'success') newGuest.driveStatus = 'Tersimpan di Google Server'; else newGuest.driveStatus = 'Gagal upload (Tersimpan Lokal)';
      } catch (err) { newGuest.driveStatus = 'Tersimpan Lokal (Koneksi Gagal)'; }
    }

    setGuestList((prev) => [newGuest, ...prev]); setLastSubmittedGuest(newGuest); setShowSuccessModal(true); setIsSubmitting(false);
    setFormData({ nama: '', alamat: '', whatsapp: '', layanan: 'Informasi Layanan Paspor', layananLainnya: '', kesan: '' });
    setPhotoData(null); setSignatureData(null); stopCamera(); clearSignature();
  };

  const handleDeleteSingleGuest = async (guestId) => {
    if (!window.confirm("Yakin ingin menghapus data tamu ini secara PERMANEN?")) return;
    setIsSyncing(true);
    try {
      if (scriptUrl) { await fetch(scriptUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'delete', id: guestId }) }); }
      setGuestList(prev => prev.filter(g => g.id !== guestId)); setPreviewItem(null); showToast('Terhapus permanen.', 'success');
    } catch (err) { showToast('Gagal menghapus dari server.', 'error'); } finally { setIsSyncing(false); }
  };

  const handleRefreshSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(scriptUrl); const remoteGuestList = await response.json();
      if (Array.isArray(remoteGuestList)) { setGuestList(remoteGuestList); showToast(`Sinkronisasi sukses! ${remoteGuestList.length} tamu dimuat.`, 'success'); }
    } catch (err) { showToast('Gagal terhubung ke cloud.', 'error'); } finally { setIsSyncing(false); }
  };

  // --- FUNGSI CETAK LAPORAN PDF (EDITABLE & GAMBAR UTUH) ---
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up diblokir browser. Izinkan pop-up untuk mencetak laporan PDF.', 'error');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Laporan Rekapitulasi Pengunjung - Imigrasi Kediri</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1c1c1e; margin: 15px; background: #ffffff; }
          .header-report { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #003B73; padding-bottom: 15px; }
          .header-report h2 { margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase; color: #003B73; letter-spacing: 1px; }
          .header-report h3 { margin: 6px 0; font-size: 13pt; font-weight: bold; color: #1c1c1e; text-transform: uppercase; }
          .header-report p { margin: 3px 0; font-size: 10pt; color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
          th, td { border: 1px solid #94a3b8; padding: 6px 8px; font-size: 9pt; text-align: left; vertical-align: middle; word-wrap: break-word; }
          th { background-color: #003B73; color: white; text-align: center; font-weight: bold; font-size: 9.5pt; }
          .center { text-align: center; }
          .img-thumbnail { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1; display: block; margin: 0 auto; }
          .sign-thumbnail { width: 60px; height: 30px; object-fit: contain; background: #fff; border: 1px solid #e2e8f0; display: block; margin: 0 auto; }
          @media print {
            body { margin: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-report">
          <h2>DAFTAR PENGUNJUNG</h2>
          <h3>STAND KANTOR IMIGRASI KEDIRI</h3>
          <p><b>${eventConfig.namaKegiatan}</b> &bull; ${eventConfig.lokasi}</p>
          <p style="font-size: 8.5pt; color: #666; margin-top: 5px;">Waktu Cetak Laporan: ${new Date().toLocaleString('id-ID')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px;">No</th>
              <th style="width: 85px;">Hari/Tanggal</th>
              <th style="width: 100px;">Nama</th>
              <th style="width: 100px;">Alamat</th>
              <th style="width: 85px;">No HP/WA</th>
              <th style="width: 90px;">Keperluan</th>
              <th style="width: 90px;">Kesan/Pesan</th>
              <th style="width: 85px;">Titik Koordinat</th>
              <th style="width: 55px;">Foto</th>
              <th style="width: 65px;">Tanda Tangan</th>
            </tr>
          </thead>
          <tbody>
            ${guestList.map((g, idx) => `
              <tr>
                <td class="center"><b>${idx + 1}</b></td>
                <td style="font-size: 8pt;">${g.hariTanggal || '-'}</td>
                <td><b>${g.nama}</b></td>
                <td>${g.alamat}</td>
                <td style="font-family: monospace;">${g.whatsapp}</td>
                <td>${g.layanan}</td>
                <td style="font-style: italic; color: #444;">${g.kesan || '-'}</td>
                <td style="font-size: 7.5pt; font-family: monospace;">${g.gps || '-'}</td>
                <td class="center">
                  ${g.photo ? `<img src="${resolveImageSrc(g.photo)}" class="img-thumbnail" />` : '-'}
                </td>
                <td class="center">
                  ${g.signature ? `<img src="${resolveImageSrc(g.signature)}" class="sign-thumbnail" />` : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
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

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] flex flex-col font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text','Segoe_UI',Roboto,sans-serif] antialiased">
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex items-center gap-2.5 text-xs font-medium border backdrop-blur-xl transition-all duration-300 ${toastMessage.type === 'success' ? 'bg-white/95 text-emerald-800 border-emerald-200' : toastMessage.type === 'error' ? 'bg-white/95 text-rose-800 border-rose-200' : 'bg-white/95 text-slate-800 border-slate-200'}`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      <div className="max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col flex-1 space-y-6">
        
        {/* ========================================================= */}
        {/* HEADER SECTION - REVISI DESAIN RAPI, BERSIH, PROFESIONAL  */}
        {/* ========================================================= */}
        <div className="bg-gradient-to-br from-[#003B73] via-[#004B93] to-[#001B36] rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,59,115,0.25)] text-white relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            
            {/* Logo & Judul */}
            <div className="flex items-center gap-5 sm:gap-7">
              <div className="flex-shrink-0 bg-white/10 p-3 sm:p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                <ImmigrationLogo className="w-14 h-16 sm:w-16 sm:h-20" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-[10px] sm:text-xs font-bold text-blue-200 tracking-[0.2em] uppercase mb-1.5 opacity-90">
                  Kantor Imigrasi Kelas II TPI Kediri
                </h1>
                <p className="text-xl sm:text-3xl font-black text-white uppercase leading-tight drop-shadow-md">
                  {eventConfig.namaKegiatan}
                </p>
                <div className="flex items-center gap-1.5 mt-2 sm:mt-2.5 text-amber-300">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 drop-shadow-sm" />
                  <p className="text-xs sm:text-sm font-semibold tracking-wide drop-shadow-sm">
                    {eventConfig.lokasi}
                  </p>
                </div>
              </div>
            </div>

            {/* Jam & Tombol Admin */}
            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-white/15">
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md text-xs font-mono font-medium text-amber-300 border border-white/10">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</span>
              </div>
              {viewMode === 'form' ? (
                <button onClick={handleOpenAdmin} className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-white text-[#003B73] text-xs font-bold shadow-md hover:bg-blue-50 transition">
                  <Lock className="w-3.5 h-3.5" /><span>Admin</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewMode('form')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition border border-white/20">
                    <ArrowLeft className="w-3.5 h-3.5" /><span>Form Tamu</span>
                  </button>
                  <button onClick={handleAdminLogout} className="p-2.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-2xl transition border border-rose-400/30">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TAMPILAN 1: FORMULIR UTAMA */}
        {viewMode === 'form' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-sm text-center space-y-1.5">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1C1C1E] tracking-tight">DAFTAR KEHADIRAN PENGUNJUNG</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F2F2F7] rounded-full text-xs text-slate-700 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#007AFF]" />
                <span><strong>Hari/Tanggal:</strong> {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-6 bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#007AFF]" /> Informasi Pengunjung</h3>
                </div>
                
                {/* AUTO KAPITAL: NAMA & ALAMAT */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nama Lengkap <span className="text-rose-500">*</span></label>
                  <input type="text" required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })} className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-medium focus:bg-white focus:border-[#007AFF] outline-none transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Alamat / Instansi <span className="text-rose-500">*</span></label>
                  <input type="text" required value={formData.alamat} onChange={(e) => setFormData({ ...formData, alamat: e.target.value.toUpperCase() })} className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-medium focus:bg-white focus:border-[#007AFF] outline-none transition" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nomor WhatsApp <span className="text-rose-500">*</span></label>
                  <input type="tel" required value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-mono font-medium focus:bg-white focus:border-[#007AFF] outline-none transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Keperluan / Layanan Stand <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select value={formData.layanan} onChange={(e) => setFormData({ ...formData, layanan: e.target.value })} className="w-full appearance-none px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-medium focus:bg-white focus:border-[#007AFF] outline-none cursor-pointer pr-10">
                      <option value="Informasi Layanan Paspor">Informasi Layanan Paspor</option>
                      <option value="Informasi Layanan WNA">Informasi Layanan WNA</option>
                      <option value="PASPORIA (Urus Paspor)">PASPORIA (Urus Paspor)</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                {formData.layanan === 'Lainnya' && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="text-xs font-semibold text-[#007AFF]">Sebutkan Keperluan Lainnya <span className="text-rose-500">*</span></label>
                    <input type="text" required value={formData.layananLainnya} onChange={(e) => setFormData({ ...formData, layananLainnya: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-blue-50/50 border border-blue-200 text-[#1C1C1E] text-xs sm:text-sm font-medium focus:bg-white focus:border-[#007AFF] outline-none transition" />
                  </div>
                )}

                {/* LABEL KESAN / PESAN (OPSIONAL) */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-700">Kesan/Pesan <span className="text-slate-400 font-normal">(Opsional)</span></label>
                  <textarea value={formData.kesan} onChange={(e) => setFormData({ ...formData, kesan: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-medium focus:bg-white focus:border-[#007AFF] outline-none transition resize-none h-20" />
                </div>
              </div>

              <div className="lg:col-span-6 space-y-5">
                <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3.5">
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
                        <label className="cursor-pointer py-2.5 px-3.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-slate-700 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition"><ImageIcon className="w-3.5 h-3.5" /><span>Galeri</span><input type="file" accept="image/*" onChange={handleFileUploadPhoto} className="hidden" /></label>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={capturePhoto} className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"><Check className="w-3.5 h-3.5" />Jepret Foto</button>
                        <button type="button" onClick={switchCamera} className="p-2.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-slate-700 rounded-2xl transition" title="Ganti Kamera"><RefreshCw className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={stopCamera} className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl transition" title="Tutup Kamera"><X className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><PenTool className="w-3.5 h-3.5 text-[#007AFF]" /> Tanda Tangan <span className="text-rose-500">*</span></h3>
                    <button type="button" onClick={clearSignature} className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"><Trash2 className="w-3 h-3" /> Hapus</button>
                  </div>
                  <div className="relative w-full h-44 bg-[#F9F9FB] rounded-2xl overflow-hidden border border-slate-200/80 touch-none flex items-center justify-center shadow-inner">
                    <canvas ref={signatureCanvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="w-full h-full cursor-crosshair" />
                    {!signatureData && <div className="absolute pointer-events-none text-slate-400 text-xs font-medium px-4">Goreskan tanda tangan di sini</div>}
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-4 px-5 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,122,255,0.25)] disabled:opacity-50 transition">
                  {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>Menyimpan & Mengunggah...</span></> : <><Send className="w-4 h-4" /><span>Simpan Presensi Pengunjung</span></>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAMPILAN 2: HALAMAN ADMIN */}
        {viewMode === 'admin' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-2 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center bg-[#E5E5EA] p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                <button onClick={() => setAdminTab('list')} className={`flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${adminTab === 'list' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-slate-600 hover:bg-black/5'}`}>
                  <List className="w-3.5 h-3.5" /><span>Daftar Pengunjung ({guestList.length})</span>
                </button>
                <button onClick={() => setAdminTab('event')} className={`flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${adminTab === 'event' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-slate-600 hover:bg-black/5'}`}>
                  <Edit3 className="w-3.5 h-3.5" /><span>Info Pameran</span>
                </button>
              </div>
            </div>

            {adminTab === 'list' && (
              <div className="space-y-4">
                <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h2 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2"><List className="w-4 h-4 text-[#007AFF]" />Rekapitulasi Pengunjung ({guestList.length})</h2>
                    <p className="text-xs text-slate-500 font-medium">Data sinkron otomatis dengan Google Spreadsheet Cloud</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
                      <input type="text" placeholder="Cari nama / alamat..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F2F2F7] border border-transparent text-xs text-[#1C1C1E] focus:bg-white focus:border-[#007AFF] outline-none font-medium transition" />
                    </div>
                    <button onClick={handleRefreshSync} disabled={isSyncing} className="px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Data</button>
                    
                    {/* TOMBOL LAPORAN PDF */}
                    <button onClick={handleDownloadPDF} disabled={guestList.length === 0} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm">
                      <Printer className="w-3.5 h-3.5" /> Laporan PDF
                    </button>
                  </div>
                </div>

                {filteredGuests.length === 0 ? (
                  <div className="bg-white/85 border border-white/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-2">
                    <User className="w-8 h-8 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-800">Belum Ada Tamu Tercatat</h3>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredGuests.map((guest) => (
                      <div key={guest.id} className="bg-white/90 border border-white/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-all relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${guest.driveStatus && guest.driveStatus.includes('Gagal') ? 'bg-rose-400' : 'bg-emerald-400'}`} title={guest.driveStatus} />
                        <div className="flex items-center gap-4 pl-2">
                          <div onClick={() => setPreviewItem(guest)} className="w-14 h-14 rounded-2xl overflow-hidden bg-[#F2F2F7] border border-slate-200 flex-shrink-0 cursor-pointer shadow-inner">
                            <img src={resolveImageSrc(guest.photo)} alt={guest.nama} className="w-full h-full object-cover" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2"><h4 className="font-bold text-[#1C1C1E] text-sm">{guest.nama}</h4><span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-[#007AFF] font-semibold">{guest.layanan}</span></div>
                            <p className="text-xs text-slate-500 font-medium">{guest.alamat} • WhatsApp: <span className="font-mono">{guest.whatsapp}</span></p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono"><Clock className="w-3 h-3 text-slate-400" /> {guest.hariTanggal || '-'} • {guest.jamKunjungan}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="hidden lg:flex flex-col items-end text-[11px] text-slate-400 font-mono">
                            <span>ID: {guest.id}</span>
                            <span className="text-emerald-600 font-medium">{guest.driveStatus || 'Tersimpan'}</span>
                          </div>
                          <button onClick={() => setPreviewItem(guest)} className="px-4 py-2 bg-[#F2F2F7] hover:bg-[#007AFF] hover:text-white text-[#007AFF] rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-sm">
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
              <div className="bg-white/90 border border-white/60 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
                <div><h2 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2"><Edit3 className="w-4 h-4 text-[#007AFF]" />Pengaturan Nama Kegiatan & Lokasi</h2></div>
                <form onSubmit={handleSaveEventConfig} className="space-y-4">
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-700">Nama Kegiatan Pameran</label><input type="text" required value={tempEventConfig.namaKegiatan} onChange={(e) => setTempEventConfig({ ...tempEventConfig, namaKegiatan: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-bold uppercase focus:bg-white focus:border-[#007AFF] outline-none transition" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-700">Lokasi / Keterangan</label><input type="text" required value={tempEventConfig.lokasi} onChange={(e) => setTempEventConfig({ ...tempEventConfig, lokasi: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-medium focus:bg-white focus:border-[#007AFF] outline-none transition" /></div>
                  <button type="submit" className="flex items-center gap-2 px-5 py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl font-bold text-xs shadow-sm transition"><Save className="w-4 h-4" /><span>Simpan Perubahan</span></button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="mt-auto bg-[#002D59] text-white py-6 px-4 text-center border-t border-blue-900/40">
        <div className="max-w-4xl mx-auto space-y-1.5 text-xs">
          <p className="font-black tracking-wider text-amber-300">KANTOR IMIGRASI KELAS II TPI KEDIRI</p>
          <p className="text-blue-100/90 font-medium leading-relaxed">Jl. Jawa No. 135, Bedrek Selatan, Desa Grogol, Kecamatan Grogol, Kabupaten Kediri, Jawa Timur 64151</p>
          <p className="text-[11px] text-blue-300 font-mono pt-1">&copy; {new Date().getFullYear()} Kantor Imigrasi Kediri • All Rights Reserved</p>
        </div>
      </footer>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl max-w-xs w-full p-6 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.15)] scale-100">
            <div className="text-center space-y-1"><div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-2xl bg-[#007AFF]/10 text-[#007AFF]"><ShieldCheck className="w-6 h-6" /></div><h3 className="text-base font-bold text-[#1C1C1E]">Login Petugas Admin</h3></div>
            {loginError && <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-center font-medium">{loginError}</div>}
            <form onSubmit={handleAdminLogin} className="space-y-2.5">
              <input type="text" required placeholder="Username" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs font-medium focus:bg-white focus:border-[#007AFF] outline-none" />
              <input type="password" required placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs font-medium focus:bg-white focus:border-[#007AFF] outline-none" />
              <div className="flex gap-2 pt-2"><button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-2.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-slate-700 rounded-xl text-xs font-semibold transition">Batal</button><button type="submit" className="flex-1 py-2.5 bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold rounded-xl text-xs transition shadow-sm">Masuk</button></div>
            </form>
          </div>
        </div>
      )}

      {showSuccessModal && lastSubmittedGuest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 className="w-8 h-8" /></div>
            <div>
              <h3 className="text-lg font-bold text-[#1C1C1E]">Presensi Berhasil Disimpan</h3>
              <p className="text-sm text-slate-500 font-medium mt-1.5 mb-2">Terima kasih telah berkunjung ke Stand Kantor Imigrasi Kediri.</p>
            </div>
            <button 
              onClick={() => setShowSuccessModal(false)} 
              className="w-full py-3.5 mt-2 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl text-sm font-black tracking-widest transition shadow-[0_4px_16px_rgba(0,122,255,0.3)]"
            >
              TUTUP
            </button>
          </div>
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#1C1C1E]">Detail Kartu Pengunjung</h3>
              <button onClick={() => setPreviewItem(null)} className="p-1.5 rounded-full bg-[#F2F2F7] text-slate-500 hover:text-[#1C1C1E] transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] text-slate-400 font-semibold uppercase">Foto Selfie</label><div className="mt-1 aspect-video bg-[#F2F2F7] rounded-2xl overflow-hidden border border-slate-200"><img src={resolveImageSrc(previewItem.photo)} alt="Foto" className="w-full h-full object-cover" /></div></div>
              <div><label className="text-[11px] text-slate-400 font-semibold uppercase">Tanda Tangan</label><div className="mt-1 aspect-video bg-white rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center p-1 shadow-inner"><img src={resolveImageSrc(previewItem.signature)} alt="TTD" className="max-h-full max-w-full object-contain" /></div></div>
            </div>
            
            <div className="bg-[#F2F2F7] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Status Data:</span><span className={`font-semibold ${previewItem.driveStatus && previewItem.driveStatus.includes('Gagal') ? 'text-rose-600' : 'text-emerald-600'}`}>{previewItem.driveStatus || 'Tersimpan'}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Tanggal Kunjungan:</span><span className="font-semibold text-[#007AFF] text-right">{previewItem.hariTanggal || '-'} • {previewItem.jamKunjungan}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Nama:</span><span className="font-bold text-[#1C1C1E] text-sm text-right">{previewItem.nama}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Instansi:</span><span className="text-slate-700 font-medium text-right">{previewItem.alamat}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">WhatsApp:</span><span className="text-slate-700 font-mono font-medium">{previewItem.whatsapp}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Keperluan:</span><span className="text-slate-700 font-medium text-right">{previewItem.layanan}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Titik GPS:</span><span className="text-slate-700 font-mono font-medium text-right text-[10px]"><a href={`https://maps.google.com/?q=${previewItem.gps}`} target="_blank" rel="noreferrer" className="text-[#007AFF] hover:underline">{previewItem.gps}</a></span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-medium">IP Address:</span><span className="text-slate-700 font-mono font-medium text-[10px]">{previewItem.ipAddress}</span></div>
            </div>

            {previewItem.kesan && previewItem.kesan !== '-' && (
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                <span className="text-xs text-[#003B73] font-bold block mb-1">Kesan / Pesan:</span>
                <p className="text-xs text-slate-700 italic leading-relaxed">{previewItem.kesan}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => handleDeleteSingleGuest(previewItem.id)} className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"><Trash2 className="w-4 h-4" /> Hapus Permanen</button>
              <button onClick={() => setPreviewItem(null)} className="flex-1 py-3 bg-[#E5E5EA] hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
