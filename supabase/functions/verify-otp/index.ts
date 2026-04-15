import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: "Phone and OTP required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find latest unverified OTP for this phone
    const { data: record, error: fetchErr } = await supabase
      .from("phone_verifications")
      .select("*")
      .eq("phone", phone)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchErr || !record) {
      return new Response(JSON.stringify({ error: "No pending verification found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "OTP has expired. Please request a new one." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check attempts (max 5)
    if (record.attempts >= 5) {
      return new Response(JSON.stringify({ error: "Too many attempts. Please request a new OTP." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment attempts
    await supabase
      .from("phone_verifications")
      .update({ attempts: (record.attempts || 0) + 1 })
      .eq("id", record.id);

    // Verify
    if (record.otp_code !== otp) {
      return new Response(JSON.stringify({ error: "Invalid OTP code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark verified
    await supabase
      .from("phone_verifications")
      .update({ verified: true })
      .eq("id", record.id);

    return new Response(JSON.stringify({ success: true, verified: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
