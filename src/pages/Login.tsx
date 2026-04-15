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
import { Shirt, ArrowRight, Eye, EyeOff, Check, X, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PhoneVerificationStep from "@/components/auth/PhoneVerificationStep";

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

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupStep, setSignupStep] = useState<"phone" | "details">("phone");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const { signIn, user, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const pwScore = useMemo(() => getPasswordScore(password), [password]);
  const pwStrength = strengthLabel(pwScore);

  useEffect(() => {
    if (loading || !user) return;
    navigate(isStaff ? "/admin" : "/", { replace: true });
  }, [loading, user, isStaff, navigate]);

  // Reset signup step when toggling
  useEffect(() => {
    if (!isSignUp) {
      setSignupStep("phone");
      setVerifiedPhone("");
    }
  }, [isSignUp]);

  const handleGoogleLogin = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: "Error", description: String(result.error), variant: "destructive" });
      return;
    }
    if (result.redirected) return;
  };

  const handlePhoneVerified = (phone: string) => {
    setVerifiedPhone(phone);
    setSignupStep("details");
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
        toast({ title: "Account created!", description: "Check your email to confirm your account (optional)." });
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
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-primary items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M20 20h20v20H20zM0 0h20v20H0z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 max-w-md text-center space-y-10">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-foreground/20 border border-primary-foreground/30 backdrop-blur-sm shadow-2xl">
            <Shirt className="h-12 w-12 text-primary-foreground" />
          </div>
          <div className="space-y-4">
            <h1 className="font-heading text-5xl font-bold text-primary-foreground tracking-tight">
              T-Shirt Kella
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed max-w-sm mx-auto">
              Discover the latest trends and shop your favorite styles at the best prices.
            </p>
          </div>
          <div className="flex items-center justify-center gap-8 text-primary-foreground/70 text-sm">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Secure shopping
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Free delivery
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Easy returns
            </span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-start justify-center px-4 sm:px-8 py-8 lg:py-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden text-center space-y-2 mb-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Shirt className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">T-Shirt Kella</h1>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">
                {isSignUp
                  ? signupStep === "phone"
                    ? "Verify Your Phone"
                    : "Create your Account"
                  : "Welcome back"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {isSignUp
                  ? signupStep === "phone"
                    ? "Enter your phone number to get started"
                    : "Complete your registration"
                  : "Sign in to your account"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {isSignUp ? "Login" : "Sign Up"}
            </button>
          </div>

          {/* Sign Up - Phone Verification Step */}
          {isSignUp && signupStep === "phone" && (
            <>
              <PhoneVerificationStep onVerified={handlePhoneVerified} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Google login */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 gap-3 text-sm font-medium border-border hover:bg-muted"
                onClick={handleGoogleLogin}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          {/* Sign Up - Details Step (after phone verified) */}
          {isSignUp && signupStep === "details" && (
            <>
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-accent flex-shrink-0" />
                <span>Phone verified: <strong>{verifiedPhone}</strong></span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="fullName" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                    />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <Label className="text-sm font-medium">Birthday <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <div className="flex gap-2">
                      <Select value={birthMonth} onValueChange={setBirthMonth}>
                        <SelectTrigger className="h-10 flex-1 text-xs"><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={birthDay} onValueChange={setBirthDay}>
                        <SelectTrigger className="h-10 w-16 text-xs"><SelectValue placeholder="Day" /></SelectTrigger>
                        <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={birthYear} onValueChange={setBirthYear}>
                        <SelectTrigger className="h-10 w-20 text-xs"><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <Label className="text-sm font-medium">Gender <span className="text-muted-foreground text-xs">(optional)</span></Label>
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
                    <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>,
                    including receiving offers and promotions.
                  </Label>
                </div>

                <Button type="submit" className="w-full h-12 gap-2 text-sm font-semibold" disabled={submitting || !agreedTerms}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Processing...
                    </span>
                  ) : (
                    <>SIGN UP<ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Login form */}
          {!isSignUp && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 gap-3 text-sm font-medium border-border hover:bg-muted"
                onClick={handleGoogleLogin}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground">or login with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 gap-2 text-sm font-semibold" disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Processing...
                    </span>
                  ) : (
                    <>LOGIN<ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Toggle */}
          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>Already have an account?{" "}<button type="button" onClick={() => setIsSignUp(false)} className="text-primary font-medium hover:underline">Login here</button></>
            ) : (
              <>New to T-Shirt Kella?{" "}<button type="button" onClick={() => setIsSignUp(true)} className="text-primary font-medium hover:underline">Sign up now</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
