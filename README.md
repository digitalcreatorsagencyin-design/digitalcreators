# Digital Creators website (v3 redesign)

Static site served by a Cloudflare Worker (`worker.js`) with assets in `public/`.

## Deploy
```bash
npx wrangler deploy
```

## Make the contact form deliver (required)
The form posts to `/api/enquiry`. The Worker forwards each enquiry to the URL in the
`ENQUIRY_WEBHOOK` variable (a Formspree, Make, Zapier or Google Apps Script webhook URL):
```bash
npx wrangler secret put ENQUIRY_WEBHOOK
```
Until it is set, the endpoint answers 503 and the page opens WhatsApp with the enquiry
pre-filled, so no lead is lost silently.

## Files
- `public/index.html`, `css/site.css`, `js/site.js`: the home page
- `public/privacy.html`, `terms.html`: policy pages (have them reviewed before heavy ad spend)
- `public/demo-*.html`: the four demo sites (unchanged); `public/img/`: portfolio screenshots and share image
- Edit the real-estate numbers in `index.html` (search for "~144" and "50+").
