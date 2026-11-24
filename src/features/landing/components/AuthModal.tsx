import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  lang: 'en' | 'si';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode, onClose, lang }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<'SUPER_ADMIN' | 'STAFF' | 'MEMBER'>('SUPER_ADMIN');
  const navigate = useNavigate();
  const { setLocalSession } = useAuth();

  // Login Form
  const [loginEmail, setLoginEmail] = useState('admin@library.lk');
  const [loginPassword, setLoginPassword] = useState('Admin1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Register Form
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDistrict, setRegDistrict] = useState('Colombo');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMembershipType, setRegMembershipType] = useState<'STUDENT' | 'GENERAL' | 'TEACHER'>('STUDENT');

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleRoleSelect = (role: 'SUPER_ADMIN' | 'STAFF' | 'MEMBER') => {
    setSelectedRole(role);
    if (role === 'SUPER_ADMIN') {
      setLoginEmail('admin@library.lk');
      setLoginPassword('Admin1234');
    } else if (role === 'STAFF') {
      setLoginEmail('librarian@library.lk');
      setLoginPassword('Staff1234');
    } else {
      setLoginEmail('member1@library.lk');
      setLoginPassword('Member1234');
    }
  };

  const handleExecuteLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await LocalAuthService.login(loginEmail, loginPassword);
      if (user) {
        setLocalSession(user);
        toast.success(`Welcome back, ${user.profile.fullName}!`);
        onClose();
        if (user.role === 'MEMBER') {
          navigate('/portal/profile');
        } else {
          navigate('/staff');
        }
      } else {
        toast.error('Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const registered = await LocalAuthService.register({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        phone: regPhone || '+94 77 000 0000',
        district: regDistrict,
        address: regAddress || `${regDistrict}, Sri Lanka`,
        dob: '2005-01-01',
        membershipType: regMembershipType,
        homeBranchId: 'branch-colombo-hq',
        preferredLanguage: lang,
        borrowingHistoryOptIn: true,
      });

      const memberProfile = registered.user?.profile;
      toast.success(
        `Registration Submitted! Welcome ${memberProfile?.fullName || regFullName}. Member Card ID: ${registered.memberIdNumber}`
      );
      onClose();
      navigate('/catalog');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-gradient-to-b from-[#1E0FA8]/40 via-[#0B0630] to-[#0B0630] border-2 border-[#4F35E8]/60 shadow-2xl rounded-3xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4F35E8] flex items-center justify-center text-white shadow">
              <BookOpen className="w-4 h-4 text-[#A99BFF]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                {mode === 'login'
                  ? lang === 'en'
                    ? 'Login to Smart Library'
                    : 'පුස්තකාල පද්ධතියට පිවිසෙන්න'
                  : lang === 'en'
                  ? 'New Member Registration'
                  : 'නව සාමාජික ලියාපදිංචිය'}
              </h3>
              <p className="text-[11px] text-[#A99BFF]">Enivac Smart Library Operating System</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A99BFF] hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 m-4 mb-0 bg-black/50 border border-white/10 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#1E0FA8] to-[#4F35E8] text-white shadow'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            {lang === 'en' ? 'Login' : 'පිවිසෙන්න'}
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-gradient-to-r from-[#1E0FA8] to-[#4F35E8] text-white shadow'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            {lang === 'en' ? 'Registration' : 'ලියාපදිංචි වන්න'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {mode === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleExecuteLogin} className="space-y-4 text-left">
              {/* Quick Role Badges */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/30 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('SUPER_ADMIN')}
                  className={`py-1.5 rounded-lg font-semibold transition-all ${
                    selectedRole === 'SUPER_ADMIN'
                      ? 'bg-[#4F35E8] text-white font-bold'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('STAFF')}
                  className={`py-1.5 rounded-lg font-semibold transition-all ${
                    selectedRole === 'STAFF'
                      ? 'bg-[#4F35E8] text-white font-bold'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('MEMBER')}
                  className={`py-1.5 rounded-lg font-semibold transition-all ${
                    selectedRole === 'MEMBER'
                      ? 'bg-[#4F35E8] text-white font-bold'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  Student
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A99BFF] block mb-1">
                  {lang === 'en' ? 'Email / Member ID' : 'විද්‍යුත් තැපෑල හෝ සාමාජික අංකය'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-[#A99BFF]" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs outline-none focus:border-[#4F35E8]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A99BFF] block mb-1">
                  {lang === 'en' ? 'Password' : 'මුරපදය'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#A99BFF]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs outline-none focus:border-[#4F35E8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#A99BFF] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1E0FA8] via-[#4F35E8] to-[#1E0FA8] text-white font-bold text-xs shadow-lg shadow-[#4F35E8]/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {loading
                    ? 'Authenticating...'
                    : lang === 'en'
                    ? 'Login to Portal'
                    : 'පද්ධතියට පිවිසෙන්න'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleExecuteRegister} className="space-y-3.5 text-left">
              <div>
                <label className="text-xs font-semibold text-[#A99BFF] block mb-1">
                  {lang === 'en' ? 'Full Name' : 'සම්පූර්ණ නම'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-[#A99BFF]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kasun Perera"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs outline-none focus:border-[#4F35E8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#A99BFF] block mb-1">
                    {lang === 'en' ? 'Email' : 'විද්‍යුත් තැපෑල'}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@school.lk"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs outline-none focus:border-[#4F35E8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#A99BFF] block mb-1">
                    {lang === 'en' ? 'Phone Number' : 'දුරකථන අංකය'}
                  </label>
                  <input
                    type="tel"
                    placeholder="0771234567"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs outline-none focus:border-[#4F35E8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#A99BFF] block mb-1">
                    {lang === 'en' ? 'Category' : 'සාමාජික වර්ගය'}
                  </label>
                  <select
                    value={regMembershipType}
                    onChange={(e: any) => setRegMembershipType(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs outline-none focus:border-[#4F35E8]"
                  >
                    <option value="STUDENT">Student (ශිෂ්‍ය)</option>
                    <option value="TEACHER">Teacher (ගුරු)</option>
                    <option value="GENERAL">General (සාමාන්‍ය)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#A99BFF] block mb-1">
                    {lang === 'en' ? 'District' : 'දිස්ත්‍රික්කය'}
                  </label>
                  <input
                    type="text"
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs outline-none focus:border-[#4F35E8]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A99BFF] block mb-1">
                  {lang === 'en' ? 'Choose Password' : 'මුරපදයක් සකසන්න'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#A99BFF]" />
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs outline-none focus:border-[#4F35E8]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#16A34A] to-[#1E0FA8] text-white font-bold text-xs shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>
                  {loading
                    ? 'Registering...'
                    : lang === 'en'
                    ? 'Register & Get Member ID'
                    : 'ලියාපදිංචි වී හැඳුනුම්පත් අංකය ලබාගන්න'}
                </span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
