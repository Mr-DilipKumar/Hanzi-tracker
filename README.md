It's first build was completed on 9th auguest 2026

# Hanzi Tracker — GitHub Pages

## Publish on GitHub Pages

1. Create a **new GitHub repository** (for example `hanzi-tracker`).
2. Upload `index.html` and `.nojekyll` from this folder to the **root of the repository**.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select your main branch and **/(root)**, then click **Save**.
6. Wait a minute or two for the Pages deployment to finish.
7. Open the Pages URL shown by GitHub.

The app is a static HTML/CSS/JavaScript site, so it does not need Node.js, npm, a server, or a build step. It stores study progress in browser localStorage when the ChatGPT-specific storage API is unavailable.

### If the page opens but Radical data fails

The app currently fetches Unicode radical data from `unicode.org` and has a `r.jina.ai` fallback. If your browser blocks either request, the main tracker still loads, but the Radical character index may show an error. The cleanest permanent fix is to bundle those Unicode data files into the repository and point the two data URL arrays in `index.html` at local files.
