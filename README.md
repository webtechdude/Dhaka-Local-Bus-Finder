# Dhaka Local Bus Finder

This project shows Dhaka bus routes and provides a search UI with autocomplete.

Development
-----------

1. Install dependencies (requires Node.js >=16):

```powershell
npm install
```

2. Build Tailwind CSS once for production:

```powershell
npm run build:css
```

3. Or run the dev watcher during development:

```powershell
npm run dev:css
```

Serve the project (simple):

```powershell
python -m http.server 8000
# then open http://localhost:8000
```

Notes
-----
- The project now uses a built Tailwind CSS file at `public/styles.css`.
- If you prefer not to install Node, you can continue using the CDN during development, but it's not recommended for production.
