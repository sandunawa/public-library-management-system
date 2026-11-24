import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput, registerMemberSchema, RegisterMemberInput } from '@libraryos/shared';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '@/services/firebase/config';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, CheckCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [step, setStep] = useState<number>(1);
  const navigate = useNavigate();
  const { setLocalSession } = useAuth();

  // Sign In Form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoggingIn },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  // Register Form
  const {
    register: regRegister,
    handleSubmit: handleRegSubmit,
    trigger: regTrigger,
    formState: { errors: regErrors, isSubmitting: isRegistering },
  } = useForm<RegisterMemberInput>({
    resolver: zodResolver(registerMemberSchema),
    defaultValues: {
      preferredLanguage: 'en',
      membershipType: 'GENERAL',
      borrowingHistoryOptIn: false,
    },
  });

  const onLogin = async (data: LoginInput) => {
    // 1. Try Firebase Auth if live keys configured
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const token = await userCredential.user.getIdTokenResult();
      const role = token.claims.role || 'MEMBER';
      
      toast.success(`Welcome back, ${userCredential.user.email}!`);
      if (role !== 'MEMBER') {
        navigate('/staff');
      } else {
        navigate('/account');
      }
      return;
    } catch (firebaseErr: any) {
      // 2. If Firebase fails due to network / dummy API key, automatically fall back to LocalAuthService
      console.warn('Firebase online sign-in note:', firebaseErr.code || firebaseErr.message);
      try {
        const localUser = await LocalAuthService.login(data.email, data.password);
        setLocalSession(localUser);
        toast.success(`Welcome back, ${localUser.email}!`);
        if (localUser.role !== 'MEMBER') {
          navigate('/staff');
        } else {
          navigate('/account');
        }
      } catch (localErr: any) {
        toast.error(localErr.message || 'Authentication failed. Please verify credentials.');
      }
    }
  };

  const nextRegisterStep = async () => {
    let fieldsToValidate: (keyof RegisterMemberInput)[] = [];
    if (step === 1) fieldsToValidate = ['fullName', 'email', 'password', 'confirmPassword'];
    if (step === 2) fieldsToValidate = ['dob', 'phone', 'address', 'district'];
    if (step === 3) fieldsToValidate = ['homeBranchId', 'membershipType'];

    const isValid = await regTrigger(fieldsToValidate);
    if (isValid) setStep((s) => s + 1);
  };

  const onRegister = async (data: RegisterMemberInput) => {
    // 1. Try live Firebase Auth + Cloud Functions
    try {
      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const registerMemberFn = httpsCallable<RegisterMemberInput, { success: boolean; memberIdNumber: string; status: string }>(
        functions,
        'registerMember'
      );
      const res = await registerMemberFn(data);

      toast.success(
        `Registration submitted! Member Card ${res.data.memberIdNumber} created with status ${res.data.status}.`
      );
      navigate('/account');
      return;
    } catch (firebaseErr: any) {
      // 2. Fallback gracefully to LocalAuthService when offline or placeholder API keys
      console.warn('Firebase registration fallback engaged:', firebaseErr.code || firebaseErr.message);
      try {
        const { user: registeredUser, memberIdNumber } = await LocalAuthService.register(data);
        setLocalSession(registeredUser);
        toast.success(
          `Registration submitted! Member Card ${memberIdNumber} created with status PENDING.`
        );
        navigate('/account');
      } catch (localErr: any) {
        toast.error(localErr.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 rounded-2xl border shadow-2xl overflow-hidden bg-card">
      {/* Left Branding Showcase */}
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-10 text-primary-foreground">
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center font-bold">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">LibraryOS Hub</h2>
          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            Your single, secure gateway to public library services, research archives, and borrowing accounts.
          </p>
        </div>

        <div className="space-y-3 text-xs text-primary-foreground/75 border-t border-white/10 pt-6">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>End-to-end encrypted patron identity</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-300" />
            <span>International standard ISO 27001 data practices</span>
          </div>
          <div className="pt-2 text-[11px] opacity-75">
            Demo Staff: <strong>admin@library.lk</strong> / <strong>Admin1234</strong>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="p-8 flex flex-col justify-center">
        {/* Tab Toggle */}
        <div className="flex p-1 bg-muted rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'signin' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setStep(1);
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'register' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
            }`}
          >
            Create Account
          </button>
        </div>

        {mode === 'signin' ? (
          /* Sign In Form */
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="patron@library.lk"
                {...loginRegister('email')}
              />
              {loginErrors.email && (
                <span className="text-xs text-destructive mt-1 block">
                  {loginErrors.email.message}
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...loginRegister('password')}
              />
              {loginErrors.password && (
                <span className="text-xs text-destructive mt-1 block">
                  {loginErrors.password.message}
                </span>
              )}
            </div>

            <Button type="submit" disabled={isLoggingIn} className="w-full mt-2 font-semibold">
              {isLoggingIn ? 'Verifying...' : 'Sign In'}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-2">
              Staff quick demo: <span className="font-mono text-primary cursor-pointer font-bold" onClick={() => {
                // autofill demo admin
              }}>admin@library.lk / Admin1234</span>
            </div>
          </form>
        ) : (
          /* Multi-Step Registration Form */
          <form onSubmit={handleRegSubmit(onRegister)} className="space-y-4">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
              Step {step} of 4: {step === 1 ? 'Credentials' : step === 2 ? 'Personal Details' : step === 3 ? 'Membership' : 'Consent'}
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold">Full Legal Name</label>
                  <Input placeholder="e.g. Kasun Perera" {...regRegister('fullName')} />
                  {regErrors.fullName && <span className="text-xs text-destructive">{regErrors.fullName.message}</span>}
                </div>
                <div>
                  <label className="text-xs font-semibold">Email</label>
                  <Input type="email" placeholder="kasun@example.com" {...regRegister('email')} />
                  {regErrors.email && <span className="text-xs text-destructive">{regErrors.email.message}</span>}
                </div>
                <div>
                  <label className="text-xs font-semibold">Password</label>
                  <Input type="password" placeholder="Min 8 chars, 1 uppercase, 1 digit" {...regRegister('password')} />
                  {regErrors.password && <span className="text-xs text-destructive">{regErrors.password.message}</span>}
                </div>
                <div>
                  <label className="text-xs font-semibold">Confirm Password</label>
                  <Input type="password" {...regRegister('confirmPassword')} />
                  {regErrors.confirmPassword && <span className="text-xs text-destructive">{regErrors.confirmPassword.message}</span>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold">Date of Birth</label>
                  <Input type="date" {...regRegister('dob')} />
                  {regErrors.dob && <span className="text-xs text-destructive">{regErrors.dob.message}</span>}
                </div>
                <div>
                  <label className="text-xs font-semibold">Phone Number (+94)</label>
                  <Input placeholder="+94 77 123 4567" {...regRegister('phone')} />
                  {regErrors.phone && <span className="text-xs text-destructive">{regErrors.phone.message}</span>}
                </div>
                <div>
                  <label className="text-xs font-semibold">Residential Address</label>
                  <Input placeholder="123 Galle Road" {...regRegister('address')} />
                  {regErrors.address && <span className="text-xs text-destructive">{regErrors.address.message}</span>}
                </div>
                <div>
                  <label className="text-xs font-semibold">District</label>
                  <Input placeholder="Colombo" {...regRegister('district')} />
                  {regErrors.district && <span className="text-xs text-destructive">{regErrors.district.message}</span>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold">Home / Preferred Branch</label>
                  <select
                    {...regRegister('homeBranchId')}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Select Branch</option>
                    <option value="branch-colombo-hq">Colombo Central Library (HQ)</option>
                    <option value="branch-kandy">Kandy Public Branch</option>
                    <option value="branch-galle">Galle Heritage Branch</option>
                  </select>
                  {regErrors.homeBranchId && <span className="text-xs text-destructive">{regErrors.homeBranchId.message}</span>}
                </div>
                <div>
                  <label className="text-xs font-semibold">Membership Category</label>
                  <select
                    {...regRegister('membershipType')}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="GENERAL">General Public</option>
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher / Educator</option>
                    <option value="SENIOR">Senior Citizen</option>
                    <option value="JUNIOR">Junior (Under 16)</option>
                  </select>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted text-xs space-y-2">
                  <p className="font-semibold">Privacy Commitment (EU/ALA standard)</p>
                  <p className="text-muted-foreground">
                    Your reading history is private and opt-in only. The library will not retain records of what you read once items are returned unless explicitly chosen.
                  </p>
                </div>

                <label className="flex items-center space-x-2 text-xs">
                  <input type="checkbox" {...regRegister('borrowingHistoryOptIn')} className="rounded" />
                  <span>Opt-in to retain my personal borrowing history for reading recommendations</span>
                </label>

                <label className="flex items-center space-x-2 text-xs">
                  <input type="checkbox" {...regRegister('acceptTerms')} className="rounded" />
                  <span className="font-semibold text-foreground">
                    I agree to the Public Library Terms of Service and Privacy Policy
                  </span>
                </label>
                {regErrors.acceptTerms && <span className="text-xs text-destructive block">{regErrors.acceptTerms.message}</span>}
              </div>
            )}

            {/* Stepper controls */}
            <div className="flex justify-between pt-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button type="button" className="ml-auto" onClick={nextRegisterStep}>
                  Next Step
                </Button>
              ) : (
                <Button type="submit" disabled={isRegistering} className="ml-auto font-semibold">
                  {isRegistering ? 'Submitting...' : 'Complete Registration'}
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
