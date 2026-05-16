# ExaAnim

Interactive physics demonstrations and simulations.

## Who generates the site map?

**GitHub Actions** runs `GenerateSiteIndex.cs` on every push to `main`, then deploys. You do not commit `site-index.json`.

For local preview only:

```bash
dotnet run GenerateSiteIndex.cs
python3 -m http.server 8080
```

## How it works

[`GenerateSiteIndex.cs`](GenerateSiteIndex.cs) scans folders that contain `index.html` and reads **content from each file**:

- `<title>` → lesson title
- `<meta name="description">` → subtitle (optional)
- first `<h2>` → fallback description

The JSON stores only `path`, `title`, and `description`. No `href`, `basePath`, or build timestamps — links are relative (`path + '/'`) so the same JSON works locally and on GitHub Pages.

## GitHub Pages

1. Push to `main`
2. **Settings → Pages → Source: GitHub Actions**

## Add a lesson

Create e.g. `Physics/NewTopic/index.html` with a proper `<title>` (and optional `<meta name="description">`). Push to `main` — CI picks it up automatically.
