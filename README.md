# Owais Alam — Certificate Portfolio

A lightweight, responsive, public certificate portfolio built with plain HTML, CSS, and JavaScript. It is designed for Vercel static hosting and requires no build step, database, login, or framework installation.

## Project structure

- `index.html` — page content, SEO metadata, and accessible certificate viewer dialog.
- `styles.css` — responsive design, card layouts, animations, and reduced-motion support.
- `app.js` — certificate rendering, search, category filters, sorting, document viewer, and contact links.
- `certificates.js` — central data file for your real certificates.
- `site-config.js` — public contact links and site copy.
- `certificates/` — place original certificate PDFs here.
- `images/certificates/` — place certificate preview images here.
- `favicon.svg` — monogram favicon.
- `vercel.json` — static-site deployment configuration.

## Add a certificate

1. Create the `certificates` folder for original PDF files and `images/certificates` for preview images.
2. Upload your own certificate file, for example `certificates/data-course.pdf`. Optionally add a preview image such as `images/certificates/data-course.jpg`.
3. Open `certificates.js` and add a record to the `window.CERTIFICATES` array. Use real details only:

```js
{
  id: "data-course-2026",
  title: "Exact certificate title",
  issuer: "Issuing organization",
  category: "Data Analytics",
  issueDate: "2026-01-15", // optional, YYYY-MM-DD
  credentialId: "", // optional
  description: "A short description of the course.", // optional
  skills: ["Data analysis", "Python"], // optional
  image: "/images/certificates/data-course.jpg", // optional
  file: "/certificates/data-course.pdf", // optional
  verificationUrl: "" // optional public verification URL
}
```

Use a unique `id` for every record. Missing optional fields are supported. If you have only a PDF, set `file` and leave `image` empty. If you have no files ready yet, leave the list empty; the website will show a friendly empty state instead of fabricated credentials.

## Update contact links

Edit `site-config.js`:
- GitHub is configured as `https://github.com/Owaisalam786`.
- Add your LinkedIn profile URL to `linkedin`.
- Add your public contact email to `email`.

Leave unknown contact details empty; empty links are not displayed. Do not place secrets, access tokens, or private information in these public files.

## Run locally

No package installation is needed. Open `index.html` in a browser, or run a local static server from the repository folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to Vercel

1. Sign in at [Vercel](https://vercel.com/) and choose **Add New → Project**.
2. Import the GitHub repository **Owaisalam786/certificates** and authorize access if asked.
3. Keep the Framework Preset as **Other**.
4. Leave the Build Command and Output Directory empty/default; this is a static site and has no build step.
5. Click **Deploy**. Vercel will provide the public URL after deployment.
6. Open the deployment URL and check the page, navigation, filters, and any uploaded PDF/image certificates.

The `vercel.json` file provides static hosting headers and a root rewrite to `index.html`. After pushing changes to the connected GitHub branch, Vercel can create a new deployment automatically.

## Before sharing publicly

- Add your real certificates and check each preview and original file.
- Add or remove public contact links in `site-config.js`.
- Confirm that you have permission to share every certificate publicly.
- Test the deployed URL on desktop and mobile.
- The website does not verify credentials itself; use `verificationUrl` only when the issuer provides a real verification page.

## Privacy

Everything in this repository is public if the repository is public. Only upload certificates and contact details you are comfortable sharing publicly.