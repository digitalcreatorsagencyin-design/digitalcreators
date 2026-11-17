// Digital Creators: static assets plus the enquiry endpoint.
// Enquiries are forwarded to ENQUIRY_WEBHOOK (a secret/variable you set in Cloudflare),
// for example a Formspree, Zapier, Make or Google Apps Script URL.
// If it is not set, the endpoint answers 503 so the page falls back to WhatsApp
// and no enquiry is silently lost.

const JSON_HEADERS = { "Content-Type": "application/json" };
const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
const clip = (v, n) => String(v ?? "").slice(0, n);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/enquiry") {
      if (request.method !== "POST") return reply(405, { success: false, error: "method_not_allowed" });

      // Same-site requests only
      const origin = request.headers.get("Origin");
      if (origin && new URL(origin).host !== url.host) return reply(403, { success: false, error: "forbidden" });

      let data;
      try { data = await request.json(); } catch { return reply(400, { success: false, error: "invalid_json" }); }

      if (data.company) return reply(200, { success: true }); // honeypot: pretend success to bots

      const enquiry = {
        fullName: clip(data.fullName, 120),
        businessName: clip(data.businessName, 160),
        mobileNumber: clip(data.mobileNumber, 30),
        emailAddress: clip(data.emailAddress, 160),
        serviceRequired: clip(data.serviceRequired, 120),
        budgetRange: clip(data.budgetRange, 60),
        message: clip(data.message, 2000),
        submittedAt: new Date().toISOString(),
        source: "digitalcreatorsagency.in"
      };
      if (!enquiry.fullName || enquiry.mobileNumber.replace(/\D/g, "").length < 10) {
        return reply(422, { success: false, error: "missing_fields" });
      }

      if (!env.ENQUIRY_WEBHOOK) return reply(503, { success: false, error: "not_configured" });

      try {
        const r = await fetch(env.ENQUIRY_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(enquiry)
        });
        if (!r.ok) return reply(502, { success: false, error: "delivery_failed" });
        return reply(200, { success: true });
      } catch {
        return reply(502, { success: false, error: "delivery_failed" });
      }
    }

    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /\nSitemap: https://digitalcreatorsagency.in/sitemap.xml\n", { headers: { "Content-Type": "text/plain" } });
    }

    return env.ASSETS.fetch(request);
  }
};
