# Ember

**Tagline**: Write your own story

## Run

```bash
npm install
npm run dev
```

## AI (OpenRouter)

This app reads the OpenRouter key from an env var (never hardcoded).

1. Copy `.env.example` → `.env`
2. Set:
   - `VITE_OPENROUTER_API_KEY=...`
3. Restart `npm run dev`

## Demo logins

All demo accounts share:
- Password: `Ember@123`

Emails:
- `aashi@ember.demo`
- `devon@ember.demo`
- `mia@ember.demo`
- `zara@ember.demo`

## 3D animal avatars (Mesh2Motion-ready)

The UI includes a live 3D pet widget (fallback stylized fox).  
To use **real animated animals** exported from Mesh2Motion:

1. Export a GLB from Mesh2Motion (with animations).
2. Put it in: `public/models/pet.glb`
3. Replace the fallback pet with a GLB loader component (next step).

