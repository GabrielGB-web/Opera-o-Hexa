import React, { useState, useRef } from 'react';
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
  Trophy as CupIcon,
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
}

interface FormData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  store: string;
  couponNumber: string;
  receiptImage: string | null;
}

// Placeholder for the logo provided by user
const LOGO_URL = "https://i.ibb.co/Y7XRBpv6/LOGO-GTA-1.png"; // Note: User should replace this with their actual uploaded logo path if needed

export default function App() {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    store: '',
    couponNumber: '',
    receiptImage: null
  });
  const [isWinner, setIsWinner] = useState(false);
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
    
    // Auto-open admin if URL param is present
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
        .select('name, store, cpf')
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, receiptImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
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

      // Check if coupon number already used in the same store
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

      // Check if user already won
      const { data: winner, error: winnerError } = await supabase
        .from('registrations')
        .select('*')
        .eq('cpf', trimmedCpf)
        .eq('is_winner', 1)
        .maybeSingle();

      if (winnerError) throw winnerError;
      if (winner) {
        throw new Error("Você já foi premiado!");
      }

      // Winning logic
      const startDate = new Date("2026-03-01T00:00:00"); // Alterado para teste (Hoje é 08/03)
      const now = new Date();
      let isWinnerResult = 0;

      if (now >= startDate) {
        const diffTime = Math.abs(now.getTime() - startDate.getTime());
        const elapsedWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        const totalAvailablePrizes = elapsedWeeks + 1;

        const { count, error: countError } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('store', trimmedStore)
          .eq('is_winner', 1);

        if (countError) throw countError;
        const prizesUsed = count || 0;
        const remainingPrizes = totalAvailablePrizes - prizesUsed;

        if (remainingPrizes > 0) {
          // 5% de chance de ganhar conforme solicitado
          isWinnerResult = Math.random() < 0.05 ? 1 : 0;
        }
      }

      // Insert registration
      const { error: insertError } = await supabase
        .from('registrations')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.trim(),
          cpf: trimmedCpf,
          phone: formData.phone.trim(),
          store: trimmedStore,
          coupon_number: trimmedCoupon,
          receipt_path: "placeholder_path", // In a real app, upload to Supabase Storage first
          is_winner: isWinnerResult
        }]);

      if (insertError) throw insertError;

      setIsWinner(isWinnerResult === 1);
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
      receiptImage: null
    });
    setIsWinner(false);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-48 bg-brand-green -skew-y-6 -translate-y-24 z-0 shadow-2xl" />
      <div className="absolute bottom-0 left-0 w-full h-48 bg-brand-dark-green skew-y-6 translate-y-24 z-0 opacity-10" />

      {/* Header */}
      <header className="w-full max-w-md mb-8 text-center z-10">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button 
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-white bg-brand-green px-3 py-1.5 rounded-full hover:bg-brand-dark-green transition-all uppercase tracking-wider shadow-lg"
          >
            <Info size={12} /> Regulamento
          </button>
          <button 
            onClick={() => {
              fetchStores();
              setShowStores(true);
            }}
            className="flex items-center gap-1 text-[10px] font-bold text-white bg-brand-green px-3 py-1.5 rounded-full hover:bg-brand-dark-green transition-all uppercase tracking-wider shadow-lg"
          >
            <MapPin size={12} /> Lojas Participantes
          </button>
          <button 
            onClick={() => {
              fetchWinners();
              setShowWinners(true);
            }}
            className="flex items-center gap-1 text-[10px] font-bold text-white bg-brand-green px-3 py-1.5 rounded-full hover:bg-brand-dark-green transition-all uppercase tracking-wider shadow-lg"
          >
            <Users size={12} /> Ganhadores
          </button>
        </div>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4"
        >
          {/* Using a placeholder for the logo, but styled to look like the one provided */}
          <div className="relative inline-block p-4">
             <img 
              src="https://i.ibb.co/Y7XRBpv6/LOGO-GTA-1.png" 
              alt="Operação Hexa" 
              className="w-full max-w-[280px] h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)] mx-auto"
              onError={(e) => {
                // Fallback if image fails
                (e.target as HTMLImageElement).src = "https://picsum.photos/seed/soccer/200/200";
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
        <h1 className="text-4xl font-black text-brand-green tracking-tighter italic">OPERAÇÃO HEXA</h1>
        <p className="text-brand-dark-green font-bold uppercase text-xs tracking-widest mt-1">Sorteio de Cupons Premiados</p>
      </header>

      <main className="w-full max-w-md bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden border-4 border-brand-green z-10">
        <div className="bg-brand-green py-3 px-6 text-center">
          <span className="text-brand-yellow font-black italic text-sm tracking-widest">RUMO AO HEXA!</span>
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
                  <label className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-2">
                    <User size={14} className="text-brand-yellow" /> Nome do Torcedor
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none transition-all font-medium"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-2">
                      <Mail size={14} className="text-brand-yellow" /> E-mail
                    </label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none transition-all font-medium"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-2">
                      <IdCard size={14} className="text-brand-yellow" /> CPF
                    </label>
                    <input
                      required
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none transition-all font-medium"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-2">
                    <Phone size={14} className="text-brand-yellow" /> WhatsApp
                  </label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none transition-all font-medium"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-2">
                    <Store size={14} className="text-brand-yellow" /> Onde você comprou?
                  </label>
                  <select
                    required
                    name="store"
                    value={formData.store}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none transition-all bg-white font-medium"
                  >
                    <option value="">Selecione a loja</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.fantasia}>{store.fantasia}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-2">
                    <Hash size={14} className="text-brand-yellow" /> Número do Cupom
                  </label>
                  <input
                    required
                    type="text"
                    name="couponNumber"
                    value={formData.couponNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none transition-all font-medium"
                    placeholder="Ex: 123456"
                  />
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Cada cupom é uma chance única por loja.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-2">
                    <Camera size={14} className="text-brand-yellow" /> Foto da Nota Fiscal
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${formData.receiptImage ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:border-brand-green/50'}`}
                  >
                    {formData.receiptImage ? (
                      <div className="flex items-center gap-3 text-brand-green">
                        <CheckCircle2 size={24} className="text-brand-yellow" />
                        <span className="font-bold text-sm">Nota anexada!</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-brand-green/30 mb-2" size={32} />
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
                  className="w-full bg-brand-green hover:bg-brand-dark-green text-brand-yellow font-black py-4 rounded-xl shadow-lg shadow-brand-green/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 text-lg italic"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      ENTRAR EM CAMPO <ChevronRight size={18} />
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
                {/* Outer Glow */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-brand-green/20 rounded-full blur-3xl"
                />
                
                {/* Spinning Rings */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-dashed border-brand-yellow rounded-full"
                />
                
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 border-2 border-brand-green rounded-full border-t-brand-yellow"
                />

                {/* Central Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      y: [0, -15, 0],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    <CupIcon className="text-brand-yellow w-24 h-24 drop-shadow-[0_0_15px_rgba(255,223,0,0.5)]" />
                  </motion.div>
                </div>
              </div>

              <div className="space-y-4">
                <motion.h2 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-4xl font-black text-brand-green tracking-tighter italic"
                >
                  ANALISANDO O VAR...
                </motion.h2>
                <p className="text-brand-dark-green font-bold max-w-[200px] mx-auto leading-tight uppercase text-xs tracking-widest">
                  Verificando sua jogada premiada!
                </p>
              </div>

              <div className="w-full max-w-[200px] bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                  className="bg-brand-green h-full"
                />
              </div>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center min-h-[400px] flex flex-col justify-center"
            >
              {isWinner ? (
                <div className="space-y-8">
                  {/* The Golden Ticket Card */}
                  <motion.div
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 100 }}
                    className="golden-gradient p-1 rounded-3xl shadow-[0_20px_60px_rgba(0,151,57,0.3)] relative"
                  >
                    <div className="bg-white/10 backdrop-blur-md border border-white/40 rounded-2xl p-8 flex flex-col items-center gap-4">
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl">
                        <motion.div 
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                        />
                      </div>
                      
                      <Trophy className="text-brand-green w-20 h-20 drop-shadow-lg" />
                      <div>
                        <h2 className="text-5xl font-black text-brand-green italic tracking-tighter leading-none">CUPOM</h2>
                        <h2 className="text-5xl font-black text-brand-green italic tracking-tighter leading-none">DOURADO</h2>
                      </div>
                      <div className="w-full border-t-2 border-brand-green/20 my-2" />
                      <p className="text-brand-green font-black text-sm uppercase tracking-[0.3em]">BILHETE CAMPEÃO</p>
                      <div className="text-[10px] font-mono text-brand-green/60 mt-2 bg-brand-yellow/30 px-2 py-1 rounded">
                        HEXA-ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4"
                  >
                    <h3 className="text-3xl font-black text-brand-green italic">GOOOOOL! VOCÊ GANHOU!</h3>
                    <p className="text-brand-dark-green font-medium text-sm">
                      Parabéns, <strong>{formData.name.split(' ')[0]}</strong>! Você é o novo campeão da Operação Hexa. Instruções enviadas para seu e-mail.
                    </p>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                    className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-brand-green/20 border-4 border-gray-100"
                  >
                    <XCircle size={80} />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-brand-green tracking-tighter italic">BATEU NA TRAVE!</h2>
                    <p className="text-brand-dark-green font-medium max-w-[250px] mx-auto">
                      Não foi dessa vez, torcedor! Mas o jogo continua. Cadastre outra nota e tente o gol novamente!
                    </p>
                  </div>
                </div>
              )}

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={reset}
                className="mt-12 w-full bg-brand-yellow text-brand-green font-black py-4 rounded-2xl shadow-lg border-b-4 border-brand-green/20 hover:brightness-105 transition-all active:scale-95 text-lg italic"
              >
                JOGAR NOVAMENTE
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="mt-12 text-center text-[10px] text-brand-green/60 max-w-xs z-10 font-bold uppercase tracking-widest flex flex-col items-center gap-2">
        <p>© 2026 OPERAÇÃO HEXA - FRANCAL DISTRIBUIDORA</p>
        <p className="mt-1">Promoção autorizada. Rumo ao Hexa com você!</p>
        <button 
          onClick={() => setShowAdmin(true)}
          className="mt-4 flex items-center gap-1 text-[10px] opacity-60 hover:opacity-100 transition-opacity bg-brand-green/10 px-2 py-1 rounded"
        >
          <Settings size={12} /> ÁREA ADMIN
        </button>
      </footer>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark-green/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-brand-green p-6 flex items-center justify-between text-brand-yellow">
                <div className="flex items-center gap-3">
                  <CupIcon size={24} />
                  <h2 className="text-xl font-black italic tracking-tighter">REGULAMENTO OFICIAL</h2>
                </div>
                <button 
                  onClick={() => setShowRules(false)}
                  className="hover:bg-white/10 p-2 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 text-brand-dark-green">
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-green font-black italic">
                    <Gift size={20} />
                    <h3>PREMIAÇÃO</h3>
                  </div>
                  <p className="text-sm leading-relaxed font-medium">
                    Os participantes sorteados receberão um <span className="text-brand-green font-bold">VOUCHER DE R$ 200,00</span> em produtos na loja selecionada no momento do cadastro do cupom premiado.
                  </p>
                  <div className="bg-brand-green/5 p-3 rounded-xl border-l-4 border-brand-green">
                    <p className="text-xs font-bold text-brand-dark-green italic">
                      * O prêmio ficará disponível em até 72 horas após análise. Enviaremos um WhatsApp confirmando a liberação.
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-green font-black italic">
                    <Calendar size={20} />
                    <h3>DURAÇÃO DA PROMOÇÃO</h3>
                  </div>
                  <p className="text-sm leading-relaxed font-medium">
                    A promoção é válida de <span className="font-bold">01/04/2026</span> até <span className="font-bold">31/07/2026</span>. O sorteio é instantâneo no momento do cadastro da nota fiscal.
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-green font-black italic">
                    <MousePointerClick size={20} />
                    <h3>COMO PARTICIPAR E RESGATAR</h3>
                  </div>
                  <ul className="text-sm space-y-2 font-medium list-disc pl-5">
                    <li>Realize uma compra em qualquer loja participante.</li>
                    <li>Cadastre seus dados, o número do cupom e a foto legível do cupom fiscal neste site.</li>
                    <li><span className="text-brand-green font-bold">Importante:</span> Não é permitido repetir o número do cupom na mesma loja. Cada cupom é apenas uma chance.</li>
                    <li>O CPF pode cadastrar quantos cupons possuir, desde que sejam cupons diferentes.</li>
                    <li>Em caso de contemplação, o cupom passará por uma análise técnica.</li>
                    <li>Após aprovação (até 72h), você receberá uma confirmação via WhatsApp para retirada do prêmio.</li>
                  </ul>
                </section>

                <div className="bg-brand-yellow/10 p-4 rounded-2xl border border-brand-yellow/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-center">
                    Certificado de Autorização SECAP nº 00.0000/2026. Imagens meramente ilustrativas.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => setShowRules(false)}
                  className="w-full bg-brand-green text-brand-yellow font-black py-4 rounded-2xl shadow-lg hover:brightness-105 transition-all text-lg italic"
                >
                  ENTENDI, VAMOS PRO JOGO!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Participating Stores Modal */}
        {showStores && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark-green/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-brand-green p-6 flex items-center justify-between text-brand-yellow">
                <div className="flex items-center gap-3">
                  <MapPinned size={24} />
                  <h2 className="text-xl font-black italic tracking-tighter uppercase">Lojas Participantes</h2>
                </div>
                <button 
                  onClick={() => {
                    setShowStores(false);
                    setCityFilter('');
                  }}
                  className="hover:bg-white/10 p-2 rounded-full transition-all"
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
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand-green outline-none text-sm"
                  />
                </div>

                {stores.filter(s => s.city.toLowerCase().includes(cityFilter.toLowerCase())).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma loja encontrada para esta cidade.</p>
                ) : (
                  stores
                    .filter(s => s.city.toLowerCase().includes(cityFilter.toLowerCase()))
                    .map(store => (
                    <div key={store.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                      <h3 className="font-black text-brand-green italic uppercase">{store.fantasia}</h3>
                      <p className="text-xs font-bold text-brand-dark-green">{store.razao_social}</p>
                      <div className="flex items-start gap-2 text-xs text-gray-600 mt-2">
                        <MapPin size={14} className="text-brand-yellow shrink-0 mt-0.5" />
                        <span>{store.endereco} - {store.city}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Winners Modal */}
        {showWinners && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark-green/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-brand-green p-6 flex items-center justify-between text-brand-yellow">
                <div className="flex items-center gap-3">
                  <Trophy size={24} />
                  <h2 className="text-xl font-black italic tracking-tighter uppercase">Galeria de Ganhadores</h2>
                </div>
                <button 
                  onClick={() => {
                    setShowWinners(false);
                    setCpfFilter('');
                  }}
                  className="hover:bg-white/10 p-2 rounded-full transition-all"
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
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand-green outline-none text-sm"
                  />
                </div>

                {winners.filter(w => w.cpf.includes(cpfFilter)).length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <Search size={48} className="mx-auto text-gray-200" />
                    <p className="text-gray-500 font-medium italic">Nenhum ganhador encontrado com este CPF.</p>
                  </div>
                ) : (
                  winners
                    .filter(w => w.cpf.includes(cpfFilter))
                    .map((winner, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-brand-yellow/5 p-4 rounded-2xl border border-brand-yellow/20">
                      <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center text-brand-green">
                        <Trophy size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-brand-green uppercase italic">{winner.name}</h3>
                        <p className="text-xs font-bold text-brand-dark-green uppercase tracking-wider">Premiado na {winner.store}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">
                          CPF: {winner.cpf.replace(/^(\d{3})\.(\d{3})\.(\d{3})-(\d{2})$/, '$1.***.***-$4')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Admin Modal */}
        {showAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark-green/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-brand-dark-green p-6 flex items-center justify-between text-brand-yellow">
                <div className="flex items-center gap-3">
                  <Settings size={24} />
                  <h2 className="text-xl font-black italic tracking-tighter uppercase">Painel Administrativo</h2>
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
                      <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto text-brand-green">
                        <Settings size={32} />
                      </div>
                      <h3 className="font-black text-brand-dark-green uppercase italic">Acesso Restrito</h3>
                      <p className="text-xs text-gray-500 font-medium">Insira suas credenciais para gerenciar as lojas.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-brand-green uppercase">Usuário</label>
                        <input
                          required
                          type="text"
                          value={adminCredentials.username}
                          onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-brand-green outline-none font-medium"
                          placeholder="Digite seu usuário"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-brand-green uppercase">Senha</label>
                        <input
                          required
                          type="password"
                          value={adminCredentials.password}
                          onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-brand-green outline-none font-medium"
                          placeholder="••••••••"
                        />
                      </div>
                      <button
                        disabled={isLoading}
                        type="submit"
                        className="w-full bg-brand-green text-brand-yellow font-black py-4 rounded-xl shadow-lg hover:brightness-105 transition-all text-lg italic uppercase"
                      >
                        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : "ENTRAR NO PAINEL"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="bg-brand-yellow/10 p-4 rounded-2xl border border-brand-yellow/30">
                      <h3 className="text-sm font-black text-brand-dark-green uppercase italic flex items-center gap-2 mb-4">
                        <Building2 size={18} /> Cadastrar Nova Loja
                      </h3>
                      <form onSubmit={handleAddStore} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-green uppercase">CNPJ</label>
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
                            <label className="text-[10px] font-bold text-brand-green uppercase">Cidade</label>
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
                          <label className="text-[10px] font-bold text-brand-green uppercase">Razão Social</label>
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
                          <label className="text-[10px] font-bold text-brand-green uppercase">Nome Fantasia</label>
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
                          <label className="text-[10px] font-bold text-brand-green uppercase">Endereço Completo</label>
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
                          className="w-full bg-brand-green text-brand-yellow font-black py-3 rounded-xl shadow-lg hover:brightness-105 transition-all text-sm italic uppercase"
                        >
                          {isLoading ? "CADASTRANDO..." : "SALVAR LOJA PARTICIPANTE"}
                        </button>
                      </form>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-brand-dark-green uppercase italic flex items-center gap-2">
                        <MapPinned size={18} /> Lojas Cadastradas ({stores.length})
                      </h3>
                      <div className="space-y-2">
                        {stores.map(store => (
                          <div key={store.id} className="text-[10px] p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                            <div>
                              <p className="font-black text-brand-green uppercase">{store.fantasia}</p>
                              <p className="text-gray-500">{store.cnpj}</p>
                            </div>
                            <p className="font-bold text-brand-dark-green">{store.city}</p>
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
