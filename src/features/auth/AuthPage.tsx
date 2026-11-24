import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginSchema,
  LoginInput,
  registerMemberSchema,
  RegisterMemberInput,
} from '@libraryos/shared';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '@/services/firebase/config';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [step, setStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setLocalSession } = useAuth();

  // Sign In Form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
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
      console.warn(
        'Firebase online sign-in note:',
        firebaseErr.code || firebaseErr.message
      );
      try {
        const localUser = await LocalAuthService.login(
          data.email,
          data.password
        );
        setLocalSession(localUser);
        toast.success(`Welcome back, ${localUser.email}!`);
        if (localUser.role !== 'MEMBER') {
          navigate('/staff');
        } else {
          navigate('/account');
        }
      } catch (localErr: any) {
        toast.error(
          localErr.message ||
            'Authentication failed. Please verify credentials.'
        );
      }
    }
  };

  const nextRegisterStep = async () => {
    let fieldsToValidate: (keyof RegisterMemberInput)[] = [];
    if (step === 1)
      fieldsToValidate = ['fullName', 'email', 'password', 'confirmPassword'];
    if (step === 2)
      fieldsToValidate = ['dob', 'phone', 'address', 'district'];
    if (step === 3) fieldsToValidate = ['homeBranchId', 'membershipType'];

    const isValid = await regTrigger(fieldsToValidate);
    if (isValid) setStep((s) => s + 1);
  };

  const onRegister = async (data: RegisterMemberInput) => {
    // 1. Try live Firebase Auth + Cloud Functions
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const registerMemberFn = httpsCallable<
        RegisterMemberInput,
        { success: boolean; memberIdNumber: string; status: string }
      >(functions, 'registerMember');
      const res = await registerMemberFn(data);

      toast.success(
        `Registration submitted! Member Card ${res.data.memberIdNumber} created with status ${res.data.status}.`
      );
      navigate('/account');
      return;
    } catch (firebaseErr: any) {
      console.warn(
        'Firebase registration fallback engaged:',
        firebaseErr.code || firebaseErr.message
      );
      try {
        const { user: registeredUser, memberIdNumber } =
          await LocalAuthService.register(data);
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
    <Card className="shadow-elevated border-border overflow-hidden">
      <CardContent className="p-6 sm:p-8">
        {/* Tab Toggle */}
        <div className="flex p-1 bg-muted rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all min-h-[36px] ${
              mode === 'signin'
                ? 'bg-card shadow-subtle text-foreground'
                : 'text-muted-foreground hover:text-foreground'
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
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all min-h-[36px] ${
              mode === 'register'
                ? 'bg-card shadow-subtle text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create Account
          </button>
        </div>

        {mode === 'signin' ? (
          /* Sign In Form */
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <FormField
              label="Email Address"
              htmlFor="login-email"
              error={loginErrors.email?.message}
              required
            >
              <Input
                id="login-email"
                type="email"
                placeholder="patron@library.lk"
                hasError={!!loginErrors.email}
                {...loginRegister('email')}
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="login-password"
              error={loginErrors.password?.message}
              required
            >
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  hasError={!!loginErrors.password}
                  {...loginRegister('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </FormField>

            <Button
              type="submit"
              disabled={isLoggingIn}
              isLoading={isLoggingIn}
              className="w-full mt-2 font-semibold"
            >
              Sign In
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-3 border-t border-border">
              Staff demo preset:{' '}
              <button
                type="button"
                className="font-mono text-primary hover:underline font-semibold"
                onClick={() => {
                  setLoginValue('email', 'admin@library.lk');
                  setLoginValue('password', 'Admin1234');
                }}
              >
                admin@library.lk / Admin1234
              </button>
            </div>
          </form>
        ) : (
          /* Multi-Step Registration Form */
          <form onSubmit={handleRegSubmit(onRegister)} className="space-y-4">
            {/* Accessible Stepper */}
            <div className="space-y-2 mb-4" aria-label="Registration progress">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Step {step} of 4</span>
                <span className="text-foreground">
                  {step === 1
                    ? 'Credentials'
                    : step === 2
                    ? 'Personal Details'
                    : step === 3
                    ? 'Membership Branch'
                    : 'Privacy Consent'}
                </span>
              </div>
              <Progress value={(step / 4) * 100} />
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <FormField
                  label="Full Legal Name"
                  htmlFor="reg-fullName"
                  error={regErrors.fullName?.message}
                  required
                >
                  <Input
                    id="reg-fullName"
                    placeholder="Kasun Perera"
                    hasError={!!regErrors.fullName}
                    {...regRegister('fullName')}
                  />
                </FormField>

                <FormField
                  label="Email Address"
                  htmlFor="reg-email"
                  error={regErrors.email?.message}
                  required
                >
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="kasun@example.com"
                    hasError={!!regErrors.email}
                    {...regRegister('email')}
                  />
                </FormField>

                <FormField
                  label="Password"
                  htmlFor="reg-password"
                  hint="Minimum 8 characters, at least 1 uppercase and 1 number"
                  error={regErrors.password?.message}
                  required
                >
                  <Input
                    id="reg-password"
                    type="password"
                    hasError={!!regErrors.password}
                    {...regRegister('password')}
                  />
                </FormField>

                <FormField
                  label="Confirm Password"
                  htmlFor="reg-confirmPassword"
                  error={regErrors.confirmPassword?.message}
                  required
                >
                  <Input
                    id="reg-confirmPassword"
                    type="password"
                    hasError={!!regErrors.confirmPassword}
                    {...regRegister('confirmPassword')}
                  />
                </FormField>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <FormField
                  label="Date of Birth"
                  htmlFor="reg-dob"
                  error={regErrors.dob?.message}
                  required
                >
                  <Input
                    id="reg-dob"
                    type="date"
                    hasError={!!regErrors.dob}
                    {...regRegister('dob')}
                  />
                </FormField>

                <FormField
                  label="Phone Number (+94)"
                  htmlFor="reg-phone"
                  error={regErrors.phone?.message}
                  required
                >
                  <Input
                    id="reg-phone"
                    placeholder="+94 77 123 4567"
                    hasError={!!regErrors.phone}
                    {...regRegister('phone')}
                  />
                </FormField>

                <FormField
                  label="Residential Address"
                  htmlFor="reg-address"
                  error={regErrors.address?.message}
                  required
                >
                  <Input
                    id="reg-address"
                    placeholder="123 Galle Road"
                    hasError={!!regErrors.address}
                    {...regRegister('address')}
                  />
                </FormField>

                <FormField
                  label="District"
                  htmlFor="reg-district"
                  error={regErrors.district?.message}
                  required
                >
                  <Input
                    id="reg-district"
                    placeholder="Colombo"
                    hasError={!!regErrors.district}
                    {...regRegister('district')}
                  />
                </FormField>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <FormField
                  label="Home / Preferred Branch"
                  htmlFor="reg-branch"
                  error={regErrors.homeBranchId?.message}
                  required
                >
                  <select
                    id="reg-branch"
                    {...regRegister('homeBranchId')}
                    className="w-full h-10 px-3 rounded-[10px] border border-input bg-card text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Select Branch</option>
                    <option value="branch-colombo-hq">Colombo Central Library (HQ)</option>
                    <option value="branch-kandy">Kandy Public Branch</option>
                    <option value="branch-galle">Galle Heritage Branch</option>
                  </select>
                </FormField>

                <FormField
                  label="Membership Category"
                  htmlFor="reg-type"
                  required
                >
                  <select
                    id="reg-type"
                    {...regRegister('membershipType')}
                    className="w-full h-10 px-3 rounded-[10px] border border-input bg-card text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="GENERAL">General Public</option>
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher / Educator</option>
                    <option value="SENIOR">Senior Citizen</option>
                    <option value="JUNIOR">Junior (Under 16)</option>
                  </select>
                </FormField>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/60 text-xs space-y-2 border border-border">
                  <p className="font-semibold text-foreground">
                    Privacy Commitment (National & ALA Standards)
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Your reading history is private and opt-in only. The library does not retain records of items you read once returned unless explicitly chosen.
                  </p>
                </div>

                <label className="flex items-start gap-3 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                  <input
                    type="checkbox"
                    {...regRegister('borrowingHistoryOptIn')}
                    className="rounded mt-0.5"
                  />
                  <span>
                    Opt-in to retain my personal borrowing history for reading recommendations
                  </span>
                </label>

                <label className="flex items-start gap-3 text-xs cursor-pointer text-foreground font-medium">
                  <input
                    type="checkbox"
                    {...regRegister('acceptTerms')}
                    className="rounded mt-0.5"
                  />
                  <span>
                    I agree to the Public Library Terms of Service and Privacy Policy *
                  </span>
                </label>
                {regErrors.acceptTerms && (
                  <span className="text-xs text-danger block font-medium">
                    {regErrors.acceptTerms.message}
                  </span>
                )}
              </div>
            )}

            {/* Stepper controls */}
            <div className="flex justify-between pt-3 border-t border-border">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button
                  type="button"
                  className="ml-auto"
                  onClick={nextRegisterStep}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isRegistering}
                  isLoading={isRegistering}
                  className="ml-auto font-semibold"
                >
                  Complete Registration
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
