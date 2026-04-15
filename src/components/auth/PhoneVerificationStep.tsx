import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PhoneVerificationStepProps {
  onVerified: (phone: string) => void;
}

const PhoneVerificationStep = ({ onVerified }: PhoneVerificationStepProps) => {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({ title: "Invalid phone", description: "Please enter a valid phone number with country code.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone: phone.startsWith("+") ? phone : `+${phone}` },
      });

      if (error) throw error;
      if (!data.success) throw new Error("Failed to send OTP");

      // In dev mode (no Twilio), show the OTP
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }

      setStep("otp");
      setCountdown(60);
      toast({
        title: data.smsSent ? "OTP Sent!" : "OTP Generated (Dev Mode)",
        description: data.smsSent
          ? "Check your phone for the verification code."
          : "Twilio not configured. OTP shown below for testing.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone: phone.startsWith("+") ? phone : `+${phone}`, otp },
      });

      if (error) throw error;
      if (!data.verified) throw new Error(data.error || "Verification failed");

      toast({ title: "Phone verified!", description: "Now complete your registration." });
      onVerified(phone.startsWith("+") ? phone : `+${phone}`);
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
      setOtp("");
    } finally {
      setVerifying(false);
    }
  };

  if (step === "phone") {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+880 1XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
              className="h-11 pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter your phone number with country code (e.g., +880)
          </p>
        </div>

        <Button
          onClick={handleSendOtp}
          className="w-full h-12 gap-2 text-sm font-semibold"
          disabled={sending || phone.length < 10}
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending OTP...
            </span>
          ) : (
            <>
              Send Verification Code
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Enter verification code
        </Label>
        <p className="text-xs text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{phone}</span>
        </p>

        {devOtp && (
          <div className="bg-accent/10 border border-accent/30 rounded-md p-2 text-xs text-accent">
            <strong>Dev Mode:</strong> Your OTP is <span className="font-mono font-bold">{devOtp}</span>
            <br />
            <span className="text-muted-foreground">(Twilio not configured — connect it in settings to send real SMS)</span>
          </div>
        )}

        <div className="flex justify-center py-2">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>

      <Button
        onClick={handleVerifyOtp}
        className="w-full h-12 gap-2 text-sm font-semibold"
        disabled={verifying || otp.length !== 6}
      >
        {verifying ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </span>
        ) : (
          "Verify & Continue"
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => { setStep("phone"); setOtp(""); setDevOtp(null); }}
          className="text-primary hover:underline"
        >
          Change number
        </button>
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={countdown > 0 || sending}
          className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
};

export default PhoneVerificationStep;
