import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, RefreshCw, PenTool, User, MapPin, Phone, Send, CheckCircle2,
  Settings, List, Image as ImageIcon, Copy, Check, Trash2, HelpCircle,
  X, AlertCircle, Download, FolderOpen, Lock, Unlock, ShieldCheck,
  Clock, Calendar, Search, Info, LogOut, ChevronRight, ChevronDown,
  Edit3, Save, ArrowLeft, Trash
} from 'lucide-react';

// 1. IMPORT FIREBASE (Sistem Database Real-time)
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

function ImmigrationLogo({ className = "w-16 h-20 sm:w-20 sm:h-24" }) {
  return (
    <img 
      src="/logo-imigrasi.png" 
      alt="Logo Imigrasi" 
      className={`${className} object-contain`} 
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
  const [isSyncing, setIsSyncing] = useState(false);

  // Pengaturan Teks Header (Dilengkapi localStorage fallback)
  const [eventConfig, setEventConfig] = useState(() => {
    const saved = localStorage.getItem('imigrasi_event_config');
    return saved ? JSON.parse(saved) : {
      namaKegiatan: 'STAND PAMERAN UMKM FEST',
      lokasi: 'Simpang Lima Gumul Kabupaten Kediri'
    };
  });
  const [tempEventConfig, setTempEventConfig] = useState({ ...eventConfig });

  // Admin Auth
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Realtime Clock & IP Address
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userIpAddress, setUserIpAddress] = useState('Memuat IP...');

  // State Formulir
  const [formData, setFormData] = useState({
    nama: '', alamat: '', whatsapp: '', layanan: 'Informasi Layanan Paspor', layananLainnya: ''
  });

  const [photoData, setPhotoData] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('user');
  const [cameraError, setCameraError] = useState('');

  // URL App Script disimpan di localStorage agar permanen
  const [scriptUrl, setScriptUrl] = useState(() => localStorage.getItem('imigrasi_script_url') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmittedGuest, setLastSubmittedGuest] = useState(null);
  
  // DAFTAR TAMU (Disimpan di localStorage agar tidak hilang saat refresh)
  const [guestList, setGuestList] = useState(() => {
    const saved = localStorage.getItem('imigrasi_guest_list');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const videoRef = useRef(null);
  const canvasPhotoRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Toast Notification Helper
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast('Kode GAS berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  useEffect(() => {
    localStorage.setItem('imigrasi_guest_list', JSON.stringify(guestList));
  }, [guestList]);

  useEffect(() => {
    localStorage.setItem('imigrasi_script_url', scriptUrl);
  }, [scriptUrl]);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIpAddress(data.ip))
      .catch(() => setUserIpAddress('IP Tidak Diketahui'));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Firebase Realtime Listener untuk Info Pameran & URL Script (Otomatis Sync ke semua HP Pengunjung)
  useEffect(() => {
    if (db) {
      const unsubPameran = onSnapshot(doc(db, "pengaturan", "infoPameran"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEventConfig(data);
          setTempEventConfig(data);
          localStorage.setItem('imigrasi_event_config', JSON.stringify(data));
        }
      });

      const unsubIntegrasi = onSnapshot(doc(db, "pengaturan", "integrasi"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.scriptUrl) {
            setScriptUrl(data.scriptUrl);
            localStorage.setItem('imigrasi_script_url', data.scriptUrl);
          }
        }
      });

      return () => {
        unsubPameran();
        unsubIntegrasi();
      };
    }
  }, []);

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

  const handleSaveEventConfig = async (e) => {
    e.preventDefault();
    if (!tempEventConfig.namaKegiatan.trim() || !tempEventConfig.lokasi.trim()) {
      showToast('Nama kegiatan dan lokasi tidak boleh kosong', 'error');
      return;
    }
    
    setEventConfig({ ...tempEventConfig });
    localStorage.setItem('imigrasi_event_config', JSON.stringify(tempEventConfig));
    
    if (db) {
      try {
        await setDoc(doc(db, "pengaturan", "infoPameran"), tempEventConfig);
        showToast('Info pameran berhasil disinkronisasi ke Cloud!', 'success');
      } catch (err) {
        showToast('Info disimpan lokal (Gagal ke Cloud).', 'info');
      }
    } else {
      showToast('Info disimpan lokal.', 'success');
    }
  };

  // Menyimpan URL Script ke Firebase Cloud agar semua HP Pengunjung otomatis tahu URL-nya
  const handleSaveScriptUrl = async () => {
    if (!scriptUrl.trim()) {
      showToast('URL Google Apps Script tidak boleh kosong', 'error');
      return;
    }
    localStorage.setItem('imigrasi_script_url', scriptUrl);
    if (db) {
      try {
        await setDoc(doc(db, "pengaturan", "integrasi"), { scriptUrl: scriptUrl }, { merge: true });
        showToast('URL Google Drive berhasil disinkronisasi ke Cloud (Semua HP tamu siap)!', 'success');
      } catch (err) {
        showToast('URL disimpan lokal (Gagal ke Cloud Firebase).', 'info');
      }
    } else {
      showToast('URL Webhook Google Drive disimpan secara lokal.', 'success');
    }
  };

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
        setCameraError('Browser tidak mendukung akses kamera langsung.');
      }
    } catch (err) {
      setCameraError('Izin akses kamera ditolak oleh perangkat.');
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

  useEffect(() => {
    return () => stopCamera();
  }, [viewMode]);

  const switchCamera = () => {
    stopCamera();
    setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
    setTimeout(() => startCamera(), 300);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasPhotoRef.current || document.createElement('canvas');
    const MAX_WIDTH = 480; 
    const scale = MAX_WIDTH / video.videoWidth;
    canvas.width = MAX_WIDTH;
    canvas.height = video.videoHeight * scale;
    const ctx = canvas.getContext('2d');

    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
    setPhotoData(dataUrl);
    stopCamera();
    showToast('Foto berhasil ditangkap!', 'success');
  };

  const handleFileUploadPhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran foto terlalu besar (Maks 5MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoData(event.target.result);
        showToast('Foto berhasil dimuat!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const initSignaturePad = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    if (viewMode === 'form' && !signatureData) {
      initSignaturePad();
      const handleResize = () => { if (!signatureData) initSignaturePad(); };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [viewMode, signatureData]);

  const getCanvasCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama.trim()) { showToast('Masukkan Nama Lengkap', 'error'); return; }
    if (!formData.alamat.trim()) { showToast('Masukkan Alamat / Instansi', 'error'); return; }
    if (!formData.whatsapp.trim()) { showToast('Masukkan Nomor WhatsApp', 'error'); return; }
    if (formData.layanan === 'Lainnya' && !formData.layananLainnya.trim()) {
      showToast('Sebutkan keperluan Anda secara spesifik', 'error'); return;
    }
    if (!photoData) { showToast('Harap ambil foto pengunjung (Wajib)', 'error'); return; }
    if (!signatureData) { showToast('Harap bubuhkan tanda tangan (Wajib)', 'error'); return; }

    setIsSubmitting(true);
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    const finalKeperluan = formData.layanan === 'Lainnya' ? formData.layananLainnya : formData.layanan;
    const uniqueId = 'KDR-' + Date.now().toString().slice(-6);

    const newGuest = {
      id: uniqueId,
      hariTanggal: formattedDate,
      jamKunjungan: formattedTime,
      namaKegiatan: eventConfig.namaKegiatan,
      lokasi: eventConfig.lokasi,
      ipAddress: userIpAddress,
      ...formData,
      layanan: finalKeperluan,
      photo: photoData,
      signature: signatureData,
      driveStatus: scriptUrl ? 'Mengunggah ke Cloud...' : 'Tersimpan Lokal'
    };

    if (scriptUrl) {
      try {
        const payload = {
          id: uniqueId,
          tanggal: formattedDate,
          jam: formattedTime,
          eventName: eventConfig.namaKegiatan,
          eventLocation: eventConfig.lokasi,
          nama: formData.nama,
          alamat: formData.alamat,
          whatsapp: formData.whatsapp,
          keperluan: finalKeperluan,
          ipAddress: userIpAddress,
          photoBase64: photoData,
          signatureBase64: signatureData
        };

        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const resJson = await response.json();
        if (resJson.status === 'success') {
          newGuest.driveStatus = 'Tersimpan di Google Server';
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

    setFormData({ nama: '', alamat: '', whatsapp: '', layanan: 'Informasi Layanan Paspor', layananLainnya: '' });
    setPhotoData(null);
    setSignatureData(null);
    stopCamera();
    clearSignature();
  };

  const handleClearGuestList = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat data tamu lokal di perangkat ini?")) {
      setGuestList([]);
      showToast('Seluruh riwayat lokal dibersihkan.', 'success');
    }
  };

  const filteredGuests = guestList.filter(
    (g) =>
      g.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.whatsapp.includes(searchQuery) ||
      g.layanan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefreshSync = async () => {
    if (!scriptUrl) {
      showToast('Simpan URL Google Apps Script di tab Google Drive terlebih dahulu.', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      const response = await fetch(scriptUrl);
      const remoteGuestList = await response.json();
      if (Array.isArray(remoteGuestList)) {
        setGuestList(remoteGuestList);
        showToast(`Berhasil ditarik! ${remoteGuestList.length} tamu sinkron.`, 'success');
      }
    } catch (err) {
      showToast('Gagal menarik data dari Google Spreadsheet.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const gasSampleCode = `function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    
    if (lastRow < 2) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
    var dataRange = sheet.getRange(2, 1, lastRow - 1, lastColumn);
    var values = dataRange.getValues();
    var guestList = [];
    
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var jsDate = new Date(row[0]); 
      var hariTanggal = Utilities.formatDate(jsDate, Session.getScriptTimeZone(), "EEEE, d MMMM yyyy");
      
      guestList.push({
        id: row[1],
        hariTanggal: hariTanggal,
        jamKunjungan: row[2], 
        namaKegiatan: row[3],
        lokasi: row[4],
        nama: row[5],         
        alamat: row[6],       
        whatsapp: row[7].toString(), 
        layanan: row[8],      
        ipAddress: row[9],    
        photo: row[10],       
        signature: row[11],   
        driveStatus: 'Tersimpan di Cloud'
      });
    }
    
    guestList.reverse();
    return ContentService.createTextOutput(JSON.stringify(guestList)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "ID Tamu", "Jam", "Nama Pameran", "Lokasi", "Nama Lengkap", "Alamat", "WhatsApp", "Keperluan", "IP", "Link Foto", "Link TTD"]);
      sheet.getRange("A1:L1").setBackground("#003B73").setFontColor("#FFFFFF").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    
    var folderName = "Buku_Tamu_Imigrasi_Kediri";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    
    var photoBlob = Utilities.newBlob(Utilities.base64Decode(data.photoBase64.split(",")[1]), "image/jpeg", "FOTO_" + data.nama.replace(/[^a-zA-Z0-9]/g, '_') + "_" + data.id + ".jpg");
    var photoFile = folder.createFile(photoBlob);
    photoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var signBlob = Utilities.newBlob(Utilities.base64Decode(data.signatureBase64.split(",")[1]), "image/png", "TTD_" + data.nama.replace(/[^a-zA-Z0-9]/g, '_') + "_" + data.id + ".png");
    var signFile = folder.createFile(signBlob);
    signFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    sheet.appendRow([new Date(), data.id, data.jam, data.eventName, data.eventLocation, data.nama, data.alamat, "'" + data.whatsapp, data.keperluan, data.ipAddress, photoFile.getUrl(), signFile.getUrl()]);
    
    return ContentService.createTextOutput(JSON.stringify({status: "success", message: "Tersimpan"})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] flex flex-col font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text','Segoe_UI',Roboto,sans-serif] antialiased selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex items-center gap-2.5 text-xs font-medium border backdrop-blur-xl transition-all duration-300 ${toastMessage.type === 'success' ? 'bg-white/95 text-emerald-800 border-emerald-200' : 'bg-white/95 text-rose-800 border-rose-200'}`}>
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
          <div className="space-y-5 animate-in fade-in duration-300">
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

                {/* Tanda Tangan */}
                <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><PenTool className="w-3.5 h-3.5 text-[#007AFF]" /> Tanda Tangan <span className="text-rose-500">*</span></h3>
                    <button type="button" onClick={clearSignature} className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"><Trash2 className="w-3 h-3" /> Hapus</button>
                  </div>
                  <div className="relative w-full h-44 bg-[#F9F9FB] rounded-2xl overflow-hidden border border-slate-200/80 touch-none flex items-center justify-center shadow-inner">
                    <canvas ref={signatureCanvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="w-full h-full cursor-crosshair" />
                    {!signatureData && <div className="absolute pointer-events-none text-slate-400 text-xs font-medium px-4">Goreskan tanda tangan di sini</div>}
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 px-5 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,122,255,0.25)] disabled:opacity-50 transition">
                  {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>Menyimpan & Mengunggah...</span></> : <><Send className="w-4 h-4" /><span>Simpan Presensi Pengunjung</span></>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAMPILAN 2: HALAMAN ADMIN */}
        {/* ======================================================== */}
        {viewMode === 'admin' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Tab Navigasi Admin */}
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-2 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center bg-[#E5E5EA] p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                <button onClick={() => setAdminTab('list')} className={`flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${adminTab === 'list' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-slate-600 hover:bg-black/5'}`}>
                  <List className="w-3.5 h-3.5" /><span>Daftar Pengunjung ({guestList.length})</span>
                </button>
                <button onClick={() => setAdminTab('event')} className={`flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${adminTab === 'event' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-slate-600 hover:bg-black/5'}`}>
                  <Edit3 className="w-3.5 h-3.5" /><span>Info Pameran</span>
                </button>
                <button onClick={() => setAdminTab('drive')} className={`flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${adminTab === 'drive' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-slate-600 hover:bg-black/5'}`}>
                  <FolderOpen className="w-3.5 h-3.5" /><span>Google Drive</span>
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
                    <p className="text-xs text-slate-500 font-medium">Data kehadiran dari Google Spreadsheet utama</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari nama / alamat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F2F2F7] border border-transparent text-xs text-[#1C1C1E] focus:bg-white focus:border-[#007AFF] outline-none font-medium transition"
                      />
                    </div>

                    <button
                      onClick={handleRefreshSync}
                      disabled={isSyncing}
                      className="px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Data
                    </button>

                    <button
                      onClick={() => {
                        const csvContent = 'data:text/csv;charset=utf-8,' +
                          ['ID,Tanggal,Jam,Nama Pameran,Lokasi,IP,Nama,Alamat,WhatsApp,Keperluan'].join(',') + '\n' +
                          guestList.map(g => `"${g.id}","${g.hariTanggal}","${g.jamKunjungan}","${g.namaKegiatan}","${g.lokasi}","${g.ipAddress}","${g.nama}","${g.alamat}","'${g.whatsapp}","${g.layanan}"`).join('\n');
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement('a');
                        link.setAttribute('href', encodedUri);
                        link.setAttribute('download', `Buku_Tamu_Imigrasi_Kediri_${new Date().toISOString().slice(0, 10)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      disabled={guestList.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> CSV
                    </button>
                    
                    <button
                      onClick={handleClearGuestList}
                      disabled={guestList.length === 0}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      title="Bersihkan daftar dari perangkat ini"
                    >
                      <Trash className="w-3.5 h-3.5" /> Bersihkan
                    </button>
                  </div>
                </div>

                {filteredGuests.length === 0 ? (
                  <div className="bg-white/85 border border-white/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-2">
                    <User className="w-8 h-8 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-800">Belum Ada Tamu Tercatat</h3>
                    <p className="text-xs text-slate-500">Klik tombol <strong>Sync Data</strong> di atas untuk menarik data terbaru dari Google Spreadsheet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredGuests.map((guest) => (
                      <div key={guest.id} className="bg-white/90 border border-white/80 rounded-2xl p-4 flex gap-3.5 items-center hover:shadow-sm transition-all relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-1.5 h-full ${guest.driveStatus.includes('Gagal') ? 'bg-rose-400' : 'bg-emerald-400'}`} title={guest.driveStatus} />
                        <div onClick={() => setPreviewItem(guest)} className="w-16 h-16 rounded-2xl overflow-hidden bg-[#F2F2F7] border border-slate-200 flex-shrink-0 cursor-pointer">
                          <img src={guest.photo} alt={guest.nama} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-[#1C1C1E] truncate pr-2">{guest.nama}</h4>
                            <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{guest.jamKunjungan}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate font-medium">{guest.alamat} • {guest.whatsapp}</p>
                          <div className="pt-1 flex items-center justify-between gap-2">
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F2F2F7] text-slate-700 font-medium truncate">{guest.layanan}</span>
                            <button onClick={() => setPreviewItem(guest)} className="text-[11px] text-[#007AFF] hover:underline flex items-center font-semibold flex-shrink-0">
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
                  <h2 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2"><Edit3 className="w-4 h-4 text-[#007AFF]" />Pengaturan Nama Kegiatan & Lokasi</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Ubah teks nama kegiatan pameran dan lokasi pada header secara permanen</p>
                </div>
                <form onSubmit={handleSaveEventConfig} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Nama Kegiatan Pameran (Huruf Kapital)</label>
                    <input type="text" required value={tempEventConfig.namaKegiatan} onChange={(e) => setTempEventConfig({ ...tempEventConfig, namaKegiatan: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-bold uppercase focus:bg-white focus:border-[#007AFF] outline-none transition" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Lokasi / Keterangan di Bawah Nama Kegiatan</label>
                    <input type="text" required value={tempEventConfig.lokasi} onChange={(e) => setTempEventConfig({ ...tempEventConfig, lokasi: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs sm:text-sm font-medium focus:bg-white focus:border-[#007AFF] outline-none transition" />
                  </div>
                  <button type="submit" className="flex items-center gap-2 px-5 py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl font-bold text-xs shadow-sm transition"><Save className="w-4 h-4" /><span>Simpan Perubahan Permanen</span></button>
                </form>
              </div>
            )}

            {/* 3. TAB GOOGLE DRIVE */}
            {adminTab === 'drive' && (
              <div className="bg-white/90 border border-white/60 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2"><FolderOpen className="w-4 h-4 text-[#007AFF]" />Integrasi Google Drive & Spreadsheet</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Masukkan URL Web App dari Google Apps Script. Saat Anda klik Simpan URL, URL ini akan otomatis tersinkronisasi ke Firebase Cloud sehingga seluruh HP/Tablet pengunjung langsung siap mengirim data ke spreadsheet utama!</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Google Apps Script Web App URL</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="url" placeholder="https://script.google.com/macros/s/.../exec" value={scriptUrl} onChange={(e) => setScriptUrl(e.target.value)} className="flex-1 px-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] placeholder-slate-400 text-xs font-mono focus:bg-white focus:border-[#007AFF] outline-none transition" />
                    <button type="button" onClick={handleSaveScriptUrl} className="px-5 py-3 bg-[#007AFF] hover:bg-[#0062CC] transition text-white font-semibold rounded-2xl text-xs">Simpan URL</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Kode Google Apps Script Lengkap (`doGet` & `doPost`):</span>
                    <button onClick={() => handleCopyCode(gasSampleCode)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F2F7] text-xs text-[#007AFF] font-semibold hover:bg-[#E5E5EA] transition">
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? 'Tersalin' : 'Salin Kode'}
                    </button>
                  </div>
                  <pre className="p-4 bg-[#1C1C1E] text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed shadow-inner">
                    {gasSampleCode}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* FOOTER RESMI INSTANSI */}
      <footer className="mt-auto bg-[#002D59] text-white py-6 px-4 text-center border-t border-blue-900/40">
        <div className="max-w-4xl mx-auto space-y-1.5 text-xs">
          <p className="font-black tracking-wider text-amber-300">KANTOR IMIGRASI KELAS II TPI KEDIRI</p>
          <p className="text-blue-100/90 font-medium leading-relaxed">Jl. Jawa No. 135, Bedrek Selatan, Desa Grogol, Kecamatan Grogol, Kabupaten Kediri, Jawa Timur 64151</p>
          <p className="text-[11px] text-blue-300 font-mono pt-1">&copy; {new Date().getFullYear()} Kantor Imigrasi Kediri • All Rights Reserved</p>
        </div>
      </footer>

      {/* MODAL ADMIN LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl max-w-xs w-full p-6 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.15)] scale-100">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-2xl bg-[#007AFF]/10 text-[#007AFF]"><ShieldCheck className="w-6 h-6" /></div>
              <h3 className="text-base font-bold text-[#1C1C1E]">Login Petugas Admin</h3>
              <p className="text-xs text-slate-500 font-medium">Masukkan akun untuk membuka panel admin</p>
            </div>
            {loginError && <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-center font-medium">{loginError}</div>}
            <form onSubmit={handleAdminLogin} className="space-y-2.5">
              <input type="text" required placeholder="Username" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs font-medium focus:bg-white focus:border-[#007AFF] outline-none" />
              <input type="password" required placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[#F2F2F7] border border-transparent text-[#1C1C1E] text-xs font-medium focus:bg-white focus:border-[#007AFF] outline-none" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-2.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-slate-700 rounded-xl text-xs font-semibold transition">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold rounded-xl text-xs transition shadow-sm">Masuk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUCCESS */}
      {showSuccessModal && lastSubmittedGuest && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl max-w-sm w-full p-6 text-center shadow-[0_16px_40px_rgba(0,0,0,0.15)] space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 className="w-7 h-7" /></div>
            <div>
              <h3 className="text-base font-bold text-[#1C1C1E]">Presensi Berhasil Disimpan</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Terima kasih telah berkunjung ke Stand Kantor Imigrasi Kediri.</p>
            </div>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl text-xs font-bold transition shadow-sm">Pengunjung Berikutnya</button>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW DETAIL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#1C1C1E]">Detail Kartu Pengunjung</h3>
              <button onClick={() => setPreviewItem(null)} className="p-1.5 rounded-full bg-[#F2F2F7] text-slate-500 hover:text-[#1C1C1E] transition"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold uppercase">Foto (Compressed)</label>
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
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Status Data:</span><span className={`font-semibold ${previewItem.driveStatus.includes('Gagal') ? 'text-rose-600' : 'text-emerald-600'}`}>{previewItem.driveStatus}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Waktu Kunjungan:</span><span className="font-semibold text-[#007AFF]">{previewItem.jamKunjungan}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Pameran:</span><span className="font-medium text-[#1C1C1E] text-right">{previewItem.namaKegiatan}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Nama:</span><span className="font-bold text-[#1C1C1E] text-sm text-right">{previewItem.nama}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Instansi:</span><span className="text-slate-700 font-medium text-right">{previewItem.alamat}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">WhatsApp:</span><span className="text-slate-700 font-mono font-medium">{previewItem.whatsapp}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5"><span className="text-slate-500 font-medium">Keperluan:</span><span className="text-slate-700 font-medium text-right max-w-[150px] truncate">{previewItem.layanan}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-medium">IP Address:</span><span className="text-slate-700 font-mono font-medium">{previewItem.ipAddress}</span></div>
            </div>

            <button onClick={() => setPreviewItem(null)} className="w-full py-2.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-slate-800 rounded-2xl text-xs font-semibold transition">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
