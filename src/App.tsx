import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabaseClient';
import {
  Ticket,
  Store,
  User,
  Mail,
  IdCard,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trophy,
  XCircle,
  ChevronRight,
  Upload,
  Search,
  Info,
  X,
  Calendar,
  Gift,
  MousePointerClick,
  Hash,
  Phone,
  MapPin,
  Users,
  Settings,
  Building2,
  MapPinned
} from 'lucide-react';

type Step = 'form' | 'animating' | 'result';

// Configuration for Prizes - Edit this array to add/remove prizes
const PRIZES = [
  { id: 'brinquedo', name: 'Brinquedo Surpresa', chance: 0.05, maxPerStore: 10 },
  { id: 'kit_colorir', name: 'Kit de Colorir', chance: 0.08, maxPerStore: 15 },
  { id: 'jogo_tabuleiro', name: 'Jogo de Tabuleiro', chance: 0.03, maxPerStore: 5 },
  { id: 'pelucia', name: 'Pelúcia Fofa', chance: 0.02, maxPerStore: 7 },
  { id: 'vale20', name: 'Vale Brinquedo R$ 20', chance: 0.002, maxPerStore: 2 },
  { id: 'vale50', name: 'Vale Brinquedo R$ 50', chance: 0.003, maxPerStore: 1 },
];

interface StoreData {
  id: number;
  cnpj: string;
  razao_social: string;
  fantasia: string;
  endereco: string;
  city: string;
}

interface WinnerData {
  name: string;
  store: string;
  cpf: string;
  prize_name?: string;
  coupon_number: string;
}

interface FormData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  store: string;
  couponNumber: string;
  receiptImage: string | null;
  receiptBlob: Blob | null;
}

const LOGO_URL = "https://i.ibb.co/fz7xpnpX/099bebc1-d818-4d02-9c7d-4d7a3592c3cc.png";

export default function App() {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    store: '',
    couponNumber: '',
    receiptImage: null,
    receiptBlob: null
  });
  const [isWinner, setIsWinner] = useState(false);
  const [wonPrizeName, setWonPrizeName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const [showWinners, setShowWinners] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });

  const [cityFilter, setCityFilter] = useState('');
  const [cpfFilter, setCpfFilter] = useState('');

  const [stores, setStores] = useState<StoreData[]>([]);
  const [winners, setWinners] = useState<WinnerData[]>([]);
  const [adminStore, setAdminStore] = useState({
    cnpj: '',
    razaoSocial: '',
    fantasia: '',
    endereco: '',
    city: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchStores();
    fetchWinners();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      setShowAdmin(true);
    }
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('fantasia', { ascending: true });

      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  const fetchWinners = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('name, store, cpf, prize_name, coupon_number')
        .eq('is_winner', 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWinners(data || []);
    } catch (err) {
      console.error("Error fetching winners:", err);
    }
  };

  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminStore(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const adminUser = import.meta.env.VITE_ADMIN_USER || "admin";
      const adminPass = import.meta.env.VITE_ADMIN_PASS || "hexa2026";

      if (adminCredentials.username === adminUser && adminCredentials.password === adminPass) {
        setIsAdminLoggedIn(true);
      } else {
        alert("Usuário ou senha inválidos. Verifique as variáveis de ambiente VITE_ADMIN_USER e VITE_ADMIN_PASS.");
      }
    } catch (err) {
      alert("Erro ao realizar login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('stores')
        .insert([{
          cnpj: adminStore.cnpj,
          razao_social: adminStore.razaoSocial,
          fantasia: adminStore.fantasia,
          endereco: adminStore.endereco,
          city: adminStore.city
        }]);

      if (error) throw error;

      setAdminStore({ cnpj: '', razaoSocial: '', fantasia: '', endereco: '', city: '' });
      fetchStores();
      alert("Loja cadastrada com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao cadastrar loja.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'cpf' || name === 'couponNumber') {
      const numericValue = value.replace(/\D/g, '');
      if (name === 'cpf') {
        setFormData(prev => ({ ...prev, [name]: numericValue.slice(0, 11) }));
      } else {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const compressImage = (file: File): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context failed'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ blob, dataUrl });
              } else {
                reject(new Error('Canvas to Blob failed'));
              }
            },
            'image/jpeg',
            0.7
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const { blob, dataUrl } = await compressImage(file);
        setFormData(prev => ({
          ...prev,
          receiptBlob: blob,
          receiptImage: dataUrl
        }));
      } catch (err) {
        console.error("Compression error:", err);
        setError("Erro ao processar imagem. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.receiptImage) {
      setError("Por favor, envie uma foto do cupom fiscal.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const trimmedStore = formData.store.trim();
      const trimmedCoupon = formData.couponNumber.trim();
      const trimmedCpf = formData.cpf.trim();

      const { data: existingCoupon, error: couponError } = await supabase
        .from('registrations')
        .select('*')
        .eq('store', trimmedStore)
        .eq('coupon_number', trimmedCoupon)
        .maybeSingle();

      if (couponError) throw couponError;
      if (existingCoupon) {
        throw new Error("Este cupom já foi cadastrado para esta loja!");
      }

      const startDate = new Date("2026-09-01T00:00:00");
      const now = new Date();
      let isWinnerResult = 0;
      let selectedPrizeName: string | null = null;

      if (now >= startDate) {
        const { data: prizeCounts, error: prizeCountsError } = await supabase
          .from('registrations')
          .select('prize_name')
          .eq('store', trimmedStore)
          .eq('is_winner', 1);

        if (prizeCountsError) throw prizeCountsError;

        const availablePrizes = PRIZES.filter(prize => {
          const count = prizeCounts?.filter(p => p.prize_name === prize.name).length || 0;
          return count < prize.maxPerStore;
        });

        const sortedPrizes = [...availablePrizes].sort((a, b) => a.chance - b.chance);

        for (const prize of sortedPrizes) {
          if (Math.random() < prize.chance) {
            isWinnerResult = 1;
            selectedPrizeName = prize.name;
            break;
          }
        }
      }

      let receiptPath = "no_image";
      if (formData.receiptBlob) {
        const fileName = `${Date.now()}_${trimmedCoupon}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, formData.receiptBlob, {
            contentType: 'image/jpeg'
          });

        if (uploadError) throw uploadError;
        receiptPath = uploadData.path;
      }

      const { error: insertError } = await supabase
        .from('registrations')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.trim(),
          cpf: trimmedCpf,
          phone: formData.phone.trim(),
          store: trimmedStore,
          coupon_number: trimmedCoupon,
          receipt_path: receiptPath,
          prize_name: selectedPrizeName,
          is_winner: isWinnerResult
        }]);

      if (insertError) throw insertError;

      setIsWinner(isWinnerResult === 1);
      setWonPrizeName(selectedPrizeName);
      setStep('animating');

      setTimeout(() => {
        setStep('result');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep('form');
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      store: '',
      couponNumber: '',
      receiptImage: null,
      receiptBlob: null
    });
    setIsWinner(false);
    setWonPrizeName(null);
    setError(null);
  };

  const confettiEmojis = ['🎉', '⭐', '🎈', '🎊', '❤️', '✨'];
  const confettiItems = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    emoji: confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)],
    x: (Math.random() - 0.5) * 600,
    y: (Math.random() - 0.5) * 600,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 2,
    scale: 0.5 + Math.random() * 1
  })), []);

  const floatingDecorations = useMemo(() => [
    { emoji: '🎈', x: -100, y: -50, delay: 0 },
    { emoji: '⭐', x: 120, y: -20, delay: 0.2 },
    { emoji: '🎁', x: -80, y: 150, delay: 0.4 },
    { emoji: '✨', x: 100, y: 120, delay: 0.1 },
    { emoji: '🌟', x: 0, y: -100, delay: 0.5 }
  ], []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden bg-white">
      {floatingDecorations.map((dec, i) => (
        <motion.div
          key={i}
          initial={{ y: dec.y, x: dec.x, opacity: 0.6 }}
          animate={{ y: [dec.y, dec.y - 30, dec.y], rotate: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity, delay: dec.delay }}
          className="absolute text-4xl z-0 pointer-events-none"
          style={{ left: '50%', top: '50%', marginLeft: dec.x, marginTop: dec.y }}
        >
          {dec.emoji}
        </motion.div>
      ))}

      <header className="w-full max-w-md mb-8 text-center z-10">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-white bg-kids-sky px-3 py-1.5 rounded-full hover:brightness-110 transition-all uppercase tracking-wider shadow-lg"
          >
            <Info size={12} /> Regulamento
          </button>
          <button
            onClick={() => {
              fetchStores();
              setShowStores(true);
            }}
            className="flex items-center gap-1 text-[10px] font-bold text-white bg-kids-pink px-3 py-1.5 rounded-full hover:brightness-110 transition-all uppercase tracking-wider shadow-lg"
          >
            <MapPin size={12} /> Lojas Participantes
          </button>
          <button
            onClick={() => {
              fetchWinners();
              setShowWinners(true);
            }}
            className="flex items-center gap-1 text-[10px] font-bold text-white bg-kids-green px-3 py-1.5 rounded-full hover:brightness-110 transition-all uppercase tracking-wider shadow-lg"
          >
            <Users size={12} /> Ganhadores
          </button>
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4"
        >
          <div className="relative inline-block p-4">
            <img
              src={LOGO_URL}
              alt="Logo"
              className="w-full max-w-[280px] h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)] mx-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://picsum.photos/seed/gift/200/200";
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
        <motion.h1 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl font-black text-kids-sky tracking-tighter"
        >
          DIVERSÃO PREMIADA
        </motion.h1>
        <p className="text-kids-dark font-bold uppercase text-xs tracking-widest mt-1">Dia das Crianças é na Francal! 🎈</p>
      </header>

      <main className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-kids-sky z-10">
        <div className="bg-gradient-to-r from-kids-sky via-kids-pink to-kids-yellow py-3 px-6 text-center text-white">
          <span className="font-black text-sm tracking-widest">✨ Cadastre seu Cupom!</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-kids-sky uppercase tracking-wider flex items-center gap-2">
                    <User size={14} className="text-kids-yellow" /> Seu Nome
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-kids-sky focus:ring-4 focus:ring-kids-sky/10 outline-none transition-all font-medium"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-kids-sky uppercase tracking-wider flex items-center gap-2">
                      <Mail size={14} className="text-kids-yellow" /> E-mail
                    </label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-kids-sky focus:ring-4 focus:ring-kids-sky/10 outline-none transition-all font-medium"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-kids-sky uppercase tracking-wider flex items-center gap-2">
                      <IdCard size={14} className="text-kids-yellow" /> CPF
                    </label>
                    <input
                      required
                      type="text"
                      name="cpf"
                      inputMode="numeric"
                      maxLength={11}
                      value={formData.cpf}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-kids-sky focus:ring-4 focus:ring-kids-sky/10 outline-none transition-all font-medium"
                      placeholder="00000000000"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-kids-sky uppercase tracking-wider flex items-center gap-2">
                    <Phone size={14} className="text-kids-yellow" /> WhatsApp
                  </label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-kids-sky focus:ring-4 focus:ring-kids-sky/10 outline-none transition-all font-medium"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-kids-sky uppercase tracking-wider flex items-center gap-2">
                    <Store size={14} className="text-kids-yellow" /> Loja onde comprou
                  </label>
                  <select
                    required
                    name="store"
                    value={formData.store}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-kids-sky focus:ring-4 focus:ring-kids-sky/10 outline-none transition-all bg-white font-medium"
                  >
                    <option value="">Selecione a loja</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.fantasia}>{store.fantasia}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-kids-sky uppercase tracking-wider flex items-center gap-2">
                    <Hash size={14} className="text-kids-yellow" /> Número do Cupom
                  </label>
                  <input
                    required
                    type="text"
                    name="couponNumber"
                    inputMode="numeric"
                    value={formData.couponNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-kids-sky focus:ring-4 focus:ring-kids-sky/10 outline-none transition-all font-medium"
                    placeholder="Ex: 123456"
                  />
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Cada cupom é uma chance única por loja. 🍀</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-kids-sky uppercase tracking-wider flex items-center gap-2">
                    <Camera size={14} className="text-kids-yellow" /> Foto da Nota Fiscal
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${formData.receiptImage ? 'border-kids-pink bg-kids-pink/5' : 'border-gray-200 hover:border-kids-pink/50'}`}
                  >
                    {formData.receiptImage ? (
                      <div className="flex items-center gap-3 text-kids-pink">
                        <CheckCircle2 size={24} className="text-kids-pink" />
                        <span className="font-bold text-sm">Nota anexada!</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-kids-pink/30 mb-2" size={32} />
                        <span className="text-sm text-gray-500 font-medium">Clique para enviar a foto</span>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-medium"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}

                <button
                  disabled={isLoading}
                  type="submit"
                  className="w-full bg-gradient-to-r from-kids-orange to-kids-pink text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 text-lg"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      🎁 ABRIR MEU PRESENTE <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'animating' && (
            <motion.div
              key="animating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 flex flex-col items-center justify-center text-center space-y-12 min-h-[400px]"
            >
              <div className="relative w-48 h-48">
                {[
                  { e: '⭐', t: -40, l: 0, d: 0 },
                  { e: '🎈', t: -20, l: 150, d: 0.2 },
                  { e: '🎉', t: 100, l: -30, d: 0.4 },
                  { e: '✨', t: 150, l: 140, d: 0.1 },
                  { e: '🌟', t: 80, l: 170, d: 0.5 },
                  { e: '🎊', t: -10, l: 80, d: 0.3 }
                ].map((dec, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: dec.d }}
                    className="absolute text-2xl"
                    style={{ top: dec.t, left: dec.l }}
                  >
                    {dec.e}
                  </motion.div>
                ))}

                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{
                      y: [0, -20, 0],
                      rotate: [-5, 5, -5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-[96px]"
                  >
                    🎁
                  </motion.div>
                </div>
              </div>

              <div className="space-y-4">
                <motion.h2
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-4xl font-black text-kids-sky"
                >
                  🎁 ABRINDO SEU PRESENTE...
                </motion.h2>
                <p className="text-kids-dark font-bold mx-auto leading-tight text-sm">
                  Será que você ganhou? ✨
                </p>
              </div>

              <div className="w-full max-w-[200px] bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                  className="bg-gradient-to-r from-kids-sky to-kids-pink h-full"
                />
              </div>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center min-h-[400px] flex flex-col justify-center relative"
            >
              {isWinner ? (
                <div className="space-y-8 relative">
                  {confettiItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{ 
                        opacity: [0, 1, 1, 0], 
                        scale: [0, item.scale, item.scale, 0],
                        x: item.x,
                        y: item.y,
                        rotate: Math.random() * 360
                      }}
                      transition={{ duration: item.duration, delay: item.delay, ease: "easeOut" }}
                      className="absolute left-1/2 top-1/2 text-3xl pointer-events-none z-50"
                      style={{ marginLeft: -15, marginTop: -15 }}
                    >
                      {item.emoji}
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 100 }}
                    className="bg-gradient-to-r from-kids-purple to-kids-pink p-1 rounded-3xl shadow-2xl relative overflow-hidden"
                  >
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center gap-4 relative">
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl">
                        <motion.div
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                        />
                      </div>

                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Gift className="text-kids-orange w-20 h-20 drop-shadow-lg" />
                      </motion.div>
                      
                      <div className="w-full border-t-2 border-kids-purple/20 my-2" />
                      <p className="font-black text-2xl text-kids-purple uppercase text-center">
                        {wonPrizeName || "PRESENTE ESPECIAL"}
                      </p>
                      <div className="text-[10px] font-mono text-kids-purple/60 mt-2 bg-kids-yellow/30 px-2 py-1 rounded">
                        KIDS-ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4"
                  >
                    <h3 className="text-3xl font-black text-kids-sky">🎉 PARABÉNS! VOCÊ GANHOU!</h3>
                    <p className="text-kids-dark font-medium text-sm" dangerouslySetInnerHTML={{
                      __html: `Uhuuu, <strong>${formData.name.split(' ')[0]}</strong>! Seu presente está te esperando! Leve seu cupom e documento até a loja para retirar. 🎈`
                    }} />
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                    className="w-32 h-32 bg-kids-cream rounded-full flex items-center justify-center mx-auto border-4 border-kids-yellow/30 text-7xl"
                  >
                    🥺
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-kids-sky">Poxa, não foi dessa vez...</h2>
                    <p className="text-kids-dark font-medium max-w-[250px] mx-auto">
                      Mas não desanima! Tente de novo com outra notinha e quem sabe o presente vem! 🎈✨
                    </p>
                  </div>
                </div>
              )}

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={reset}
                className="mt-12 w-full bg-kids-yellow text-kids-dark font-black py-4 rounded-2xl shadow-lg border-b-4 border-kids-orange/30 hover:brightness-105 transition-all active:scale-95 text-lg"
              >
                🔄 TENTAR DE NOVO
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-12 text-center text-[10px] text-kids-dark/50 max-w-xs z-10 font-bold uppercase tracking-widest flex flex-col items-center gap-2">
        <p>© 2026 DIVERSÃO PREMIADA - FRANCAL DISTRIBUIDORA</p>
        <p className="mt-1">Promoção especial de Dia das Crianças! 🎈</p>
        <button
          onClick={() => setShowAdmin(true)}
          className="mt-4 flex items-center gap-1 text-[10px] text-kids-dark/60 hover:text-kids-dark transition-colors bg-kids-sky/10 px-2 py-1 rounded"
        >
          <Settings size={12} /> ÁREA ADMIN
        </button>
      </footer>

      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kids-dark/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-gradient-to-r from-kids-sky to-kids-pink p-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Gift size={24} />
                  <h2 className="text-xl font-black">📋 REGULAMENTO OFICIAL</h2>
                </div>
                <button
                  onClick={() => setShowRules(false)}
                  className="hover:bg-white/10 p-2 rounded-full transition-all text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 text-kids-dark">
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-kids-sky font-black">
                    <Gift size={20} />
                    <h3>PREMIAÇÃO</h3>
                  </div>
                  <p className="text-sm leading-relaxed font-medium">
                    Os participantes sorteados receberão um dos <span className="text-kids-sky font-bold">BRINDES EXCLUSIVOS</span> disponíveis na loja selecionada no momento do cadastro do cupom premiado.
                  </p>
                  <div className="bg-kids-sky/5 p-3 rounded-xl border-l-4 border-kids-sky">
                    <p className="text-xs font-bold text-kids-dark">
                      * O prêmio ficará disponível em até 72 horas após análise. Enviaremos um WhatsApp confirmando a liberação.
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-kids-sky font-black">
                    <Calendar size={20} />
                    <h3>DURAÇÃO DA PROMOÇÃO</h3>
                  </div>
                  <p className="text-sm leading-relaxed font-medium">
                    A promoção é válida de <span className="font-bold">01/09/2026</span> até <span className="font-bold">31/10/2026</span>. O sorteio é instantâneo no momento do cadastro da nota fiscal.
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-kids-sky font-black">
                    <MousePointerClick size={20} />
                    <h3>COMO PARTICIPAR E RESGATAR</h3>
                  </div>
                  <ul className="text-sm space-y-2 font-medium list-disc pl-5">
                    <li>Realize uma compra em qualquer loja participante.</li>
                    <li>Cadastre seus dados, o número do cupom e a foto legível do cupom fiscal.</li>
                    <li><span className="text-kids-sky font-bold">Importante:</span> Não é permitido repetir o número do cupom na mesma loja. Cada cupom é apenas uma chance.</li>
                    <li><span className="text-kids-sky font-bold">Importante:</span> Preencha o número do Whatsapp corretamente, iremos entrar em contato para liberação do prêmio de Vale Compras.</li>
                    <li>Pode ser cadastrados o mesmo CPF várias vezes, desde que sejam cupons diferentes.</li>
                    <li>Em caso de contemplação, o cupom passará por uma análise técnica.</li>
                    <li>Após aprovação (até 72h), você receberá uma confirmação via WhatsApp para retirada do prêmio.</li>
                    <li><span className="text-kids-sky font-bold">Importante:</span> Após confirmação do prêmio, comparecer a loja portando documentos pessoais.</li>
                  </ul>
                </section>

                <div className="bg-kids-yellow/10 p-4 rounded-2xl border border-kids-yellow/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-center">
                    Promoção realizada pela Francal Distribuidora. Dia das Crianças. Imagens meramente ilustrativas.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => setShowRules(false)}
                  className="w-full bg-kids-sky text-white font-black py-4 rounded-2xl shadow-lg hover:brightness-105 transition-all text-lg"
                >
                  ENTENDI, VAMOS LÁ! 🎈
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showStores && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kids-dark/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-gradient-to-r from-kids-green to-kids-sky p-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <MapPinned size={24} />
                  <h2 className="text-xl font-black uppercase">📍 LOJAS PARTICIPANTES</h2>
                </div>
                <button
                  onClick={() => {
                    setShowStores(false);
                    setCityFilter('');
                  }}
                  className="hover:bg-white/10 p-2 rounded-full transition-all text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Filtrar por cidade..."
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-kids-sky outline-none text-sm"
                  />
                </div>

                {stores.filter(s => s.city.toLowerCase().includes(cityFilter.toLowerCase())).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma loja encontrada para esta cidade.</p>
                ) : (
                  stores
                    .filter(s => s.city.toLowerCase().includes(cityFilter.toLowerCase()))
                    .map(store => (
                      <div key={store.id} className="bg-kids-cream/50 p-4 rounded-2xl border border-kids-sky/10 space-y-1">
                        <h3 className="font-black text-kids-sky uppercase">{store.fantasia}</h3>
                        <p className="text-xs font-bold text-kids-dark">{store.razao_social}</p>
                        <div className="flex items-start gap-2 text-xs text-gray-600 mt-2">
                          <MapPin size={14} className="text-kids-orange shrink-0 mt-0.5" />
                          <span>{store.endereco} - {store.city}</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showWinners && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kids-dark/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-gradient-to-r from-kids-yellow to-kids-orange p-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Trophy size={24} />
                  <h2 className="text-xl font-black uppercase">🏆 NOSSOS GANHADORES</h2>
                </div>
                <button
                  onClick={() => {
                    setShowWinners(false);
                    setCpfFilter('');
                  }}
                  className="hover:bg-white/10 p-2 rounded-full transition-all text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Pesquisar seu CPF..."
                    value={cpfFilter}
                    onChange={(e) => setCpfFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-kids-orange outline-none text-sm"
                  />
                </div>

                {winners.filter(w => w.cpf.includes(cpfFilter)).length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <Search size={48} className="mx-auto text-gray-200" />
                    <p className="text-gray-500 font-medium">Nenhum ganhador encontrado com este CPF.</p>
                  </div>
                ) : (
                  winners
                    .filter(w => w.cpf.includes(cpfFilter))
                    .map((winner, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-kids-yellow/5 p-4 rounded-2xl border border-kids-yellow/20">
                        <div className="w-12 h-12 bg-kids-yellow rounded-full flex items-center justify-center text-kids-orange">
                          <Trophy size={24} />
                        </div>
                        <div>
                          <h3 className="font-black text-kids-sky uppercase">{winner.name}</h3>
                          <p className="text-xs font-bold text-kids-purple uppercase tracking-wider">{winner.prize_name || "Voucher R$ 200"}</p>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            <p className="text-[10px] text-kids-dark/60 font-bold uppercase tracking-tight">Premiado na {winner.store}</p>
                            <p className="text-[10px] text-kids-sky font-black uppercase tracking-tight">Cupom: {winner.coupon_number}</p>
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono mt-1">
                            CPF: {winner.cpf.length === 11
                              ? winner.cpf.replace(/^(\d{3})\d{6}(\d{2})$/, '$1.***.***-$2')
                              : winner.cpf}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kids-dark/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-kids-dark p-6 flex items-center justify-between text-kids-yellow">
                <div className="flex items-center gap-3">
                  <Settings size={24} />
                  <h2 className="text-xl font-black uppercase">⚙️ PAINEL ADMINISTRATIVO</h2>
                </div>
                <button
                  onClick={() => {
                    setShowAdmin(false);
                    setIsAdminLoggedIn(false);
                    setAdminCredentials({ username: '', password: '' });
                  }}
                  className="hover:bg-white/10 p-2 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {!isAdminLoggedIn ? (
                  <form onSubmit={handleAdminLogin} className="space-y-4 py-8">
                    <div className="text-center space-y-2 mb-6">
                      <div className="w-16 h-16 bg-kids-sky/20 rounded-full flex items-center justify-center mx-auto text-kids-sky">
                        <Settings size={32} />
                      </div>
                      <h3 className="font-black text-kids-dark uppercase">Acesso Restrito</h3>
                      <p className="text-xs text-gray-500 font-medium">Insira suas credenciais para gerenciar as lojas.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-kids-sky uppercase">Usuário</label>
                        <input
                          required
                          type="text"
                          value={adminCredentials.username}
                          onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-kids-sky outline-none font-medium"
                          placeholder="Digite seu usuário"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-kids-sky uppercase">Senha</label>
                        <input
                          required
                          type="password"
                          value={adminCredentials.password}
                          onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-kids-sky outline-none font-medium"
                          placeholder="••••••••"
                        />
                      </div>
                      <button
                        disabled={isLoading}
                        type="submit"
                        className="w-full bg-kids-sky text-white font-black py-4 rounded-xl shadow-lg hover:brightness-105 transition-all text-lg uppercase"
                      >
                        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : "ENTRAR NO PAINEL"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="bg-kids-sky/10 p-4 rounded-2xl border border-kids-sky/30">
                      <h3 className="text-sm font-black text-kids-dark uppercase flex items-center gap-2 mb-4">
                        <Building2 size={18} /> Cadastrar Nova Loja
                      </h3>
                      <form onSubmit={handleAddStore} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-kids-sky uppercase">CNPJ</label>
                            <input
                              required
                              name="cnpj"
                              value={adminStore.cnpj}
                              onChange={handleAdminInputChange}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                              placeholder="00.000.000/0000-00"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-kids-sky uppercase">Cidade</label>
                            <input
                              required
                              name="city"
                              value={adminStore.city}
                              onChange={handleAdminInputChange}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                              placeholder="Cidade - UF"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-kids-sky uppercase">Razão Social</label>
                          <input
                            required
                            name="razaoSocial"
                            value={adminStore.razaoSocial}
                            onChange={handleAdminInputChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            placeholder="Nome Jurídico da Empresa"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-kids-sky uppercase">Nome Fantasia</label>
                          <input
                            required
                            name="fantasia"
                            value={adminStore.fantasia}
                            onChange={handleAdminInputChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            placeholder="Nome que aparece no site"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-kids-sky uppercase">Endereço Completo</label>
                          <input
                            required
                            name="endereco"
                            value={adminStore.endereco}
                            onChange={handleAdminInputChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            placeholder="Rua, Número, Bairro"
                          />
                        </div>
                        <button
                          disabled={isLoading}
                          type="submit"
                          className="w-full bg-kids-sky text-white font-black py-3 rounded-xl shadow-lg hover:brightness-105 transition-all text-sm uppercase"
                        >
                          {isLoading ? "CADASTRANDO..." : "SALVAR LOJA PARTICIPANTE"}
                        </button>
                      </form>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-kids-dark uppercase flex items-center gap-2">
                        <MapPinned size={18} /> Lojas Cadastradas ({stores.length})
                      </h3>
                      <div className="space-y-2">
                        {stores.map(store => (
                          <div key={store.id} className="text-[10px] p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                            <div>
                              <p className="font-black text-kids-sky uppercase">{store.fantasia}</p>
                              <p className="text-gray-500">{store.cnpj}</p>
                            </div>
                            <p className="font-bold text-kids-dark">{store.city}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
