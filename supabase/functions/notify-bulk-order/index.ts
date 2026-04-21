// Sends an email notification to the store admin when a new bulk order request is submitted.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { bulkOrderId, email } = body ?? {};

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let order: any = null;
    if (bulkOrderId && typeof bulkOrderId === "string") {
      const { data } = await supabase.from("bulk_orders").select("*").eq("id", bulkOrderId).maybeSingle();
      order = data;
    } else if (email && typeof email === "string") {
      // Fallback: fetch most recent order for this email (anon clients can't read inserted IDs under RLS)
      const { data } = await supabase
        .from("bulk_orders").select("*").eq("email", email)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      order = data;
    } else {
      return new Response(JSON.stringify({ error: "bulkOrderId or email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to fetch admin notification email from store_settings, fallback to default admin
    const { data: setting } = await supabase
      .from("store_settings").select("value").eq("key", "admin_email").maybeSingle();
    const adminEmail = setting?.value || "tshirtkella@gmail.com";

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // If Resend is configured, send email; otherwise just log (graceful)
    if (RESEND_API_KEY) {
      const html = `
        <h2>📦 New Bulk Order Request</h2>
        <p><strong>Name:</strong> ${escape(order.full_name)}</p>
        <p><strong>Email:</strong> ${escape(order.email)}</p>
        <p><strong>Phone:</strong> ${escape(order.contact_number)}</p>
        ${order.product_name ? `<p><strong>Inquired Product:</strong> ${escape(order.product_name)}</p>` : ""}
        <p><strong>Quantity:</strong> ${escape(order.quantity_range)}</p>
        <p><strong>Categories:</strong> ${escape((order.product_categories || []).join(", "))}</p>
        <p><strong>Custom Print:</strong> ${order.custom_print ? "Yes" : "No"} ${order.custom_print_details ? `— ${escape(order.custom_print_details)}` : ""}</p>
        <p><strong>Custom Tag:</strong> ${order.custom_tag ? "Yes" : "No"} ${order.custom_tag_details ? `— ${escape(order.custom_tag_details)}` : ""}</p>
        <p><strong>Purpose:</strong> ${escape(order.order_purpose)} ${order.order_purpose_other ? `— ${escape(order.order_purpose_other)}` : ""}</p>
        ${order.additional_notes ? `<p><strong>Notes:</strong> ${escape(order.additional_notes)}</p>` : ""}
        <hr/>
        <p>View in admin panel under <strong>Bulk Orders</strong>.</p>
      `;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Bulk Orders <onboarding@resend.dev>",
          to: [adminEmail],
          subject: `🛒 New Bulk Order Request from ${order.full_name}`,
          html,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        console.error("Resend send failed:", t);
      }
    } else {
      console.log("New bulk order received (no email provider configured):", order.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-bulk-order error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escape(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
