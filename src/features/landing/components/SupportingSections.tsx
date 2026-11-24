import React, { useState } from 'react';
import { motion } from 'framer-motion';
import workflowsBgImage from '/images/enivac-workflows-bg.jpg?url';
import {
  CreditCard,
  QrCode,
  ScanLine,
  Coins,
  Users,
  Building,
  GraduationCap,
  Laptop,
  CheckCircle2,
  Printer,
  Camera,
  Tv,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Phone,
  MapPin,
  Clock,
  Send,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { brandConfig } from '@/config/brand';
import { landingEn } from '@/i18n/landing/en';
import { landingSi } from '@/i18n/landing/si';
import { useNavigate } from 'react-router-dom';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { useAuth } from '@/contexts/AuthContext';

interface SupportingSectionsProps {
  lang: 'en' | 'si';
}

export const SupportingSections: React.FC<SupportingSectionsProps> = ({ lang }) => {
  const navigate = useNavigate();
  const { setLocalSession } = useAuth();
  const t = lang === 'en' ? landingEn : landingSi;

  // Login form state
  const [selectedRole, setSelectedRole] = useState<'SUPER_ADMIN' | 'STAFF' | 'MEMBER'>('SUPER_ADMIN');
  const [loginEmail, setLoginEmail] = useState('admin@library.lk');
  const [loginPassword, setLoginPassword] = useState('Admin1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Demo Contact Form State
  const [demoName, setDemoName] = useState('');
  const [demoInstitution, setDemoInstitution] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [demoSubmitted, setDemoSubmitted] = useState(false);

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
    setLoginLoading(true);
    try {
      const authenticatedUser = await LocalAuthService.login(loginEmail, loginPassword);
      if (authenticatedUser) {
        setLocalSession(authenticatedUser);
        toast.success('Login Successful! Redirecting to workspace...');
        if (authenticatedUser.role === 'MEMBER') {
          navigate('/portal/profile');
        } else {
          navigate('/staff');
        }
      } else {
        toast.error('Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName || !demoPhone || !demoEmail) {
      toast.error('Please fill in your name, contact phone and email.');
      return;
    }
    setDemoSubmitted(true);
    toast.success('Demo request received! Our engineering team will contact you within 24 hours.');
  };

  return (
    <div className="space-y-32">
      {/* SECTIONS 6 & 7: UNIFIED WORKFLOWS + STAKEHOLDERS WITH PANORAMIC SMART LIBRARY BACKGROUND */}
      <div
        className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat overflow-hidden rounded-[2.5rem] max-w-[96rem] mx-auto shadow-2xl border border-slate-200/80"
        style={{
          backgroundImage: `url(${workflowsBgImage})`,
        }}
      >
        <div className="max-w-7xl mx-auto space-y-28 relative z-10">
          {/* SECTION 6: HOW IT WORKS (Timeline) */}
          <section id="how-it-works">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 p-6 sm:p-8 rounded-3xl bg-white/85 backdrop-blur-md border border-white/70 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E0FA8] px-3.5 py-1 rounded-full bg-violet-50 border border-violet-200">
                Workflows
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-heading">
                {t.howItWorks.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">{t.howItWorks.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left relative">
                <span className="w-9 h-9 rounded-full bg-[#1E0FA8] text-white font-black flex items-center justify-center text-xs mb-4 shadow-md">
                  1
                </span>
                <h4 className="font-bold text-slate-900 text-base mb-2">{t.howItWorks.step1}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{t.howItWorks.step1Desc}</p>
              </div>

              <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left relative">
                <span className="w-9 h-9 rounded-full bg-[#4F35E8] text-white font-black flex items-center justify-center text-xs mb-4 shadow-md">
                  2
                </span>
                <h4 className="font-bold text-slate-900 text-base mb-2">{t.howItWorks.step2}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{t.howItWorks.step2Desc}</p>
              </div>

              <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left relative">
                <span className="w-9 h-9 rounded-full bg-[#16A34A] text-white font-black flex items-center justify-center text-xs mb-4 shadow-md">
                  3
                </span>
                <h4 className="font-bold text-slate-900 text-base mb-2">{t.howItWorks.step3}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{t.howItWorks.step3Desc}</p>
              </div>

              <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left relative">
                <span className="w-9 h-9 rounded-full bg-[#C69A35] text-white font-black flex items-center justify-center text-xs mb-4 shadow-md">
                  4
                </span>
                <h4 className="font-bold text-slate-900 text-base mb-2">{t.howItWorks.step4}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{t.howItWorks.step4Desc}</p>
              </div>
            </div>
          </section>

          {/* SECTION 7: WHO IS IT FOR */}
          <section id="who-its-for">
            <div className="text-center max-w-3xl mx-auto mb-16 p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/70 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4F35E8] px-3.5 py-1 rounded-full bg-violet-50 border border-violet-200">
                Institutional Roles
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-heading mt-3">
                {t.whoItsFor.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left space-y-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-[#1E0FA8] flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{t.whoItsFor.librarians}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{t.whoItsFor.librariansDesc}</p>
              </div>

              <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shadow-xs">
                  <Building className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{t.whoItsFor.management}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{t.whoItsFor.managementDesc}</p>
              </div>

              <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#C69A35] flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{t.whoItsFor.members}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{t.whoItsFor.membersDesc}</p>
              </div>

              <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs">
                  <Laptop className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{t.whoItsFor.itAdmin}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{t.whoItsFor.itAdminDesc}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* SECTION 8: SUPPORTED HARDWARE */}
      <section id="hardware" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-violet-50/80 via-indigo-50/70 to-purple-50/80 border border-violet-200/70 shadow-sm text-center space-y-8">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {t.hardware.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1">{t.hardware.subtitle}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col items-center gap-2 text-center">
              <ScanLine className="w-6 h-6 text-[#1E0FA8]" />
              <span className="text-xs font-bold text-slate-900">{t.hardware.h1}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col items-center gap-2 text-center">
              <Printer className="w-6 h-6 text-[#1E0FA8]" />
              <span className="text-xs font-bold text-slate-900">{t.hardware.h2}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col items-center gap-2 text-center">
              <CreditCard className="w-6 h-6 text-[#1E0FA8]" />
              <span className="text-xs font-bold text-slate-900">{t.hardware.h3}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col items-center gap-2 text-center">
              <Camera className="w-6 h-6 text-[#1E0FA8]" />
              <span className="text-xs font-bold text-slate-900">{t.hardware.h4}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col items-center gap-2 text-center col-span-2 sm:col-span-1">
              <Tv className="w-6 h-6 text-[#1E0FA8]" />
              <span className="text-xs font-bold text-slate-900">{t.hardware.h5}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: LOGIN SECTION */}
      <section id="login" className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-xl text-left space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#1E0FA8] text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-heading">{t.login.title}</h3>
            <p className="text-xs text-slate-600">{t.login.subtitle}</p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => handleRoleSelect('SUPER_ADMIN')}
              className={`py-2 rounded-lg font-bold transition-all ${
                selectedRole === 'SUPER_ADMIN'
                  ? 'bg-[#1E0FA8] text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('STAFF')}
              className={`py-2 rounded-lg font-bold transition-all ${
                selectedRole === 'STAFF'
                  ? 'bg-[#1E0FA8] text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('MEMBER')}
              className={`py-2 rounded-lg font-bold transition-all ${
                selectedRole === 'MEMBER'
                  ? 'bg-[#1E0FA8] text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Member
            </button>
          </div>

          <form onSubmit={handleExecuteLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {t.login.usernameLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-[#4F35E8] focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {t.login.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-[#4F35E8] focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1E0FA8] via-[#4F35E8] to-[#1E0FA8] text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              <span>{loginLoading ? 'Authenticating...' : t.login.submit}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* SECTION 10: DEMO REQUEST / CONTACT */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form */}
          <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-left space-y-6">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                {t.demo.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1">{t.demo.subtitle}</p>
            </div>

            {demoSubmitted ? (
              <div className="p-8 text-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
                <h4 className="font-bold text-base">Request Submitted Successfully</h4>
                <p className="text-xs">{t.demo.promise}</p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-700 font-semibold block mb-1">
                      {t.demo.name}
                    </label>
                    <input
                      type="text"
                      required
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-[#4F35E8] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-700 font-semibold block mb-1">
                      {t.demo.institution}
                    </label>
                    <input
                      type="text"
                      required
                      value={demoInstitution}
                      onChange={(e) => setDemoInstitution(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-[#4F35E8] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-700 font-semibold block mb-1">
                      {t.demo.phone}
                    </label>
                    <input
                      type="tel"
                      required
                      value={demoPhone}
                      onChange={(e) => setDemoPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-[#4F35E8] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-700 font-semibold block mb-1">
                      {t.demo.email}
                    </label>
                    <input
                      type="email"
                      required
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-[#4F35E8] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    {t.demo.message}
                  </label>
                  <textarea
                    rows={4}
                    value={demoMessage}
                    onChange={(e) => setDemoMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-[#4F35E8] focus:bg-white"
                    placeholder="Tell us about your library, book count, or student headcount..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1E0FA8] via-[#4F35E8] to-[#1E0FA8] text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.demo.submit}</span>
                </button>
              </form>
            )}
          </div>

          {/* Contact Details Card */}
          <div className="lg:col-span-5 p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-left space-y-6">
            <h4 className="text-xl font-bold text-slate-900 font-heading">Enivac International</h4>
            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#1E0FA8] shrink-0 mt-0.5" />
                <span>{brandConfig.address}</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#1E0FA8] shrink-0 mt-0.5" />
                <div>
                  {brandConfig.phones.map((p) => (
                    <div key={p}>{p}</div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#1E0FA8] shrink-0" />
                <span>{brandConfig.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#1E0FA8] shrink-0" />
                <span>{brandConfig.hours}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-500">
              Company Registration: Sri Lanka. Enterprise software architectures designed for schools and libraries nationwide.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11: FINAL CTA BAND */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-12 sm:p-16 rounded-3xl bg-gradient-to-r from-[#1E0FA8] via-[#4F35E8] to-[#1E0FA8] text-center space-y-6 shadow-xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-5xl font-black text-white font-heading">
            {t.cta.headline}
          </h2>
          <p className="text-sm sm:text-base text-violet-100 max-w-2xl mx-auto font-normal">
            {t.cta.sub}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#login"
              className="px-8 py-3.5 rounded-2xl bg-white text-[#1E0FA8] font-extrabold text-sm hover:scale-105 transition-all shadow-md"
            >
              {t.cta.loginBtn}
            </a>
            <a
              href="#contact"
              className="px-8 py-3.5 rounded-2xl bg-white/10 border border-white/30 text-white font-bold text-sm hover:bg-white/20 transition-all"
            >
              {t.cta.demoBtn}
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-12 text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1E0FA8] text-white flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-bold text-slate-900 block">{brandConfig.name}</span>
              <span className="text-[10px] text-slate-500">{t.footer.poweredBy}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it Works</a>
            <a href="#hardware" className="hover:text-slate-900 transition-colors">Hardware</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
            <a href="https://enivac.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
              enivac.com
            </a>
          </div>

          <div>
            © {new Date().getFullYear()} {brandConfig.companyName}. {t.footer.rights}
          </div>
        </div>
      </footer>
    </div>
  );
};
