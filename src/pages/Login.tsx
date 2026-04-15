import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Eye, EyeOff, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PhoneVerificationStep from "@/components/auth/PhoneVerificationStep";
import { usePageSection } from "@/hooks/usePageTemplates";
import loginHero from "@/assets/login-hero.jpg";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

const strengthLabel = (score: number) => {
  if (score <= 1) return { text: "Weak", color: "bg-destructive" };
  if (score === 2) return { text: "Fair", color: "bg-warning" };
  if (score === 3) return { text: "Good", color: "bg-accent" };
  return { text: "Strong", color: "bg-accent" };
};

const getPasswordScore = (pw: string) => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const AppleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
    <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
  </svg>
);

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupStep, setSignupStep] = useState<"phone" | "details">("phone");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const heroContent = usePageSection("login", "hero");
  const { signIn, user, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const pwScore = useMemo(() => getPasswordScore(password), [password]);
  const pwStrength = strengthLabel(pwScore);

  useEffect(() => {
    if (loading || !user) return;
    navigate(isStaff ? "/admin" : "/", { replace: true });
  }, [loading, user, isStaff, navigate]);

  useEffect(() => {
    if (!isSignUp) {
      setSignupStep("phone");
      setVerifiedPhone("");
      setForgotMode(false);
    }
  }, [isSignUp]);

  const handleGoogleLogin = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: "Error", description: String(result.error), variant: "destructive" });
    }
  };

  const handlePhoneVerified = (phone: string) => {
    setVerifiedPhone(phone);
    setSignupStep("details");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Reset link sent!", description: "Check your email for the password reset link." });
      setForgotMode(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !agreedTerms) {
      toast({ title: "Terms required", description: "Please agree to the Terms of Use and Privacy Policy.", variant: "destructive" });
      return;
    }
    if (isSignUp && password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (isSignUp && !email) {
      toast({ title: "Email required", description: "Please enter your email address for verification.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        const names = fullName.trim().split(/\s+/);
        const firstName = names[0] || "";
        const lastName = names.slice(1).join(" ") || "";

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              first_name: firstName,
              last_name: lastName,
              phone: verifiedPhone,
              gender: gender || undefined,
              birth_month: birthMonth || undefined,
              birth_day: birthDay || undefined,
              birth_year: birthYear || undefined,
            },
          },
        });
        if (error) throw error;
        toast({ title: "Account created!", description: "Please check your email and click the verification link to activate your account." });
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const pwChecks = [
    { label: "At least 6 characters", pass: password.length >= 6 },
    { label: "Upper & lowercase", pass: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "A number", pass: /\d/.test(password) },
    { label: "A special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="flex min-h-screen bg-card">
      {/* Left panel — hero image */}
      <div className="hidden lg:block lg:w-[50%] relative">
        <div className="absolute inset-4 rounded-2xl overflow-hidden">
          <img
            src={heroContent?.hero_image || loginHero}
            alt="Fashion editorial"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient overlay for text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Text on image */}
          <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
            <p className="text-sm font-medium tracking-widest uppercase text-white/80 mb-2">{heroContent?.heading || "Step into Style"}</p>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
              {heroContent?.subheading || "From everyday essentials to luxury brands, find fashion that fits your world."}
            </h2>
            {/* Dots indicator */}
            <div className="flex gap-2 mt-6">
              <span className="w-6 h-1.5 rounded-full bg-white" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-start lg:items-center justify-center px-6 sm:px-10 py-8 lg:py-12 overflow-y-auto">
        <div className="w-full max-w-[420px] space-y-6">
          {/* Welcome heading */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to <span className="text-primary">T-Shirt Kella</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              {forgotMode
                ? "Enter your email to receive a reset link"
                : isSignUp
                  ? signupStep === "phone" ? "Verify your phone to get started" : "Complete your registration"
                  : "Your Gateway to Effortless Style."}
            </p>
          </div>

          {/* Tab switcher */}
          {!forgotMode && (
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  !isSignUp
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  isSignUp
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Sign Up - Phone Verification Step */}
          {isSignUp && signupStep === "phone" && (
            <>
              <PhoneVerificationStep onVerified={handlePhoneVerified} />
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground">or</span></div>
              </div>
              <Button type="button" variant="outline" className="w-full h-11 gap-3 text-sm font-medium border-border hover:bg-muted" onClick={handleGoogleLogin}>
                <GoogleIcon />
                Continue with Google
              </Button>
            </>
          )}

          {/* Sign Up - Details Step */}
          {isSignUp && signupStep === "details" && (
            <>
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-accent flex-shrink-0" />
                <span>Phone verified: <strong>{verifiedPhone}</strong></span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
                  <Input id="fullName" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                  <Input id="email" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                  <p className="text-xs text-muted-foreground">You'll need to verify your email to activate your account</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= pwScore ? pwStrength.color : "bg-muted"}`} />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{pwStrength.text}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {pwChecks.map((c) => (
                          <div key={c.label} className="flex items-center gap-1.5 text-xs">
                            {c.pass ? <Check className="h-3 w-3 text-accent" /> : <X className="h-3 w-3 text-muted-foreground/50" />}
                            <span className={c.pass ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <Label className="text-sm font-semibold">Birthday <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                    <div className="flex gap-1.5">
                      <Select value={birthMonth} onValueChange={setBirthMonth}>
                        <SelectTrigger className="h-10 flex-1 text-xs"><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={birthDay} onValueChange={setBirthDay}>
                        <SelectTrigger className="h-10 w-14 text-xs"><SelectValue placeholder="Day" /></SelectTrigger>
                        <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={birthYear} onValueChange={setBirthYear}>
                        <SelectTrigger className="h-10 w-[72px] text-xs"><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <Label className="text-sm font-semibold">Gender <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(v) => setAgreedTerms(v === true)} className="mt-0.5" />
                  <Label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground cursor-pointer">
                    I agree to the{" "}
                    <span className="text-primary hover:underline cursor-pointer">Terms of Use</span> and{" "}
                    <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>.
                  </Label>
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={submitting || !agreedTerms}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Processing...
                    </span>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Login / Forgot Password form */}
          {!isSignUp && (
            <>
              <form onSubmit={forgotMode ? handleForgotPassword : handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="loginEmail" className="text-sm font-semibold">Email Address</Label>
                  <Input id="loginEmail" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>

                {!forgotMode && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="loginPassword" className="text-sm font-semibold">Password</Label>
                    </div>
                    <div className="relative">
                      <Input id="loginPassword" type={showPassword ? "text" : "password"} placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="text-right">
                      <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline font-medium">Forgot Password?</button>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Processing...
                    </span>
                  ) : forgotMode ? (
                    "Send Reset Link"
                  ) : (
                    "Log In"
                  )}
                </Button>

                {forgotMode && (
                  <p className="text-center text-sm">
                    <button type="button" onClick={() => setForgotMode(false)} className="text-primary font-medium hover:underline">Back to Login</button>
                  </p>
                )}
              </form>

              {!forgotMode && (
                <>
                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground">OR</span>
                    </div>
                  </div>

                  {/* Social login buttons */}
                  <div className="flex justify-center gap-4">
                    <Button type="button" variant="outline" className="h-12 w-20 border-border hover:bg-muted" onClick={handleGoogleLogin}>
                      <GoogleIcon />
                    </Button>
                    <Button type="button" variant="outline" className="h-12 w-20 border-border hover:bg-muted" onClick={() => toast({ title: "Coming soon", description: "Apple sign-in will be available soon." })}>
                      <AppleIcon />
                    </Button>
                    <Button type="button" variant="outline" className="h-12 w-20 border-border hover:bg-muted" onClick={() => toast({ title: "Coming soon", description: "Microsoft sign-in will be available soon." })}>
                      <MicrosoftIcon />
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Footer text */}
          <p className="text-center text-xs text-muted-foreground pt-2">
            By signing up or create an account Company's{" "}
            <span className="text-primary hover:underline cursor-pointer">Terms of use</span> &{" "}
            <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
