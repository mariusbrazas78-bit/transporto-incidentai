# Transporto incidentų registravimas

Naudotojai gali registruotis, prisijungti, kurti pervežimus ir su jais susietus incidentus. Kiekvienas naudotojas mato tik savo įrašus.

Vieša programa: [https://transporto-incidentai.vercel.app/](https://transporto-incidentai.vercel.app/)

## Technologijos

- React
- Vite
- Supabase
- Vercel
- Zapier
- Gmail

## Paleidimas vietoje

```bash
npm install
```

Sukurkite `.env.local` failą projekto šaknyje ir įrašykite aplinkos kintamuosius (žr. žemiau). Tada paleiskite kūrimo serverį:

```bash
npm run dev
```

Windows PowerShell galima naudoti `npm.cmd run dev`.

## Aplinkos kintamieji

Nukopijuokite šį pavyzdį į .env.local ir užpildykite reikšmes savo „Supabase“ projekto adresu bei viešuoju („Publishable“) raktu.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Tikrų raktų, webhook adresų ir asmeninių el. pašto adresų į šį failą nedėkite.

## Pranešimai

Naujas incidentas Supabase paleidžia Zapier automatizaciją. Skubiam incidentui Gmail išsiunčia laišką. Įprasto incidento kelią sustabdo filtras. Siuntimo klaidos atveju apie ją informuojamas automatizacijos prižiūrėtojas.
