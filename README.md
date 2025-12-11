# BrandForge Pro

AI poslovni copilot koji u nekoliko sekundi generise identitet brenda, logo, finansijski plan i vizuelne prikaze proizvoda/usluga. Aplikacija koristi Google Gemini 2.5 (tekst + image) i fokusira se na realne troskove, validaciju lokacije i sjajan UI sa animacijama.

## Karakteristike
- **AI core**: Gemini 2.5 flash za strategiju brenda i finansije; automatska validacija lokacije (normalize naziva grada/drzave).
- **Logo i vizuali**: Instant logo iz stilskog opisa, regeneracija na klik, photorealistic renders za proizvode ili evolucija logotipa za servisne pakete.
- **Finansijski cockpit**: Podela na One-time/Monthly/Yearly troskove, real-world search query za svaki stavku, projekcija prihoda, break-even i feasibility check prema zadatom budzetu.
- **UX i animacije**: 3D Cube loader, fade-in sekvence, hover scale na karticama, sticky tabovi, glassmorphism kartice i mikrotransicije kroz Tailwind utility klase.
- **Fallback i kvote**: Graceful messaging kada je image kvota potrosena; retry logika za preopterecenje modela.

## Tech stack
- React 19 + Vite 6
- Tailwind CSS za layout + custom animacije (CubeLoader, fade-in, hover transforms)
- @google/genai (Gemini 2.5 flash + flash-image)
- lucide-react ikonice

## Brzi start
1) Instalacija
```bash
npm install
```
2) Postavi API kljuc u `.env.local` (primer):
```bash
VITE_API_KEY=ovde_upisi_gemini_kljuc
```
3) Pokreni dev server
```bash
npm run dev
```
4) Build za produkciju
```bash
npm run build
```

## Kako radi
1. InputPanel prikuplja opis biznisa, lokaciju, budzet i opcione smernice (ime, slogan, paleta). Lokacija se proverava preko `validateLocation` i normalizuje ako je validna.  
2. Klik na **Generate Plan** poziva `generateBrandIdentity` koji vraca: naziv i slogan, opis, logo style, paletu boja, listu proizvoda/usluga sa vizuelnim promptovima, budzet plan sa realnim search query stringovima i finansijskim projekcijama.  
3. Logo se zatim generise sa `generateImage` (1:1, white background).  
4. Product/Service kartice automatski renderuju vizual: za servise se transformise logo u napredniji 3D motiv; za proizvode se dobija photorealistic shot sa logom na pakovanju.  
5. BudgetBreakdown gradi tabelu i sumare, oznacava feasibility prema user budzetu i daje savete.  
6. UI koristi tabove (Identity & Logo / Financial Plan / Services & Products) sa sticky headerom i animacijama za glatku navigaciju.

## Struktura
- `App.tsx` – glavna logika, tabovi i orkestracija poziva.
- `components/InputPanel.tsx` – forma, validacija lokacije, izbor valute i budzeta.
- `components/LogoDisplay.tsx` – prikaz/regeneracija logotipa i state za kvote.
- `components/ProductCard.tsx` – auto-render vizuala proizvoda/servisa sa referentnim logom.
- `components/BudgetBreakdown.tsx` – podela troskova, projekcije i search query helperi.
- `services/geminiService.ts` – svi AI pozivi, retry logika i obrada kvota.
- `types.ts` – tipovi za brand identity, budzet, proizvode i slike.

## Napomene o kvotama
- Kada Gemini image API vrati RESOURCE_EXHAUSTED/limit, UI prikazuje upozorenje i pauzira dalje rendere da bi izbegao blokade. Tekstualne generacije nastavljaju da rade.

## Demo tok za korisnika
1. Unesi ideju (npr. "premium pet grooming studio"), lokaciju i budzet.  
2. Klikni **Generate Plan**. Gleda se validnost lokacije, gradi se strategija, logo i finansijski plan.  
3. Pregledaj logo i paletu, proveri budzet i break-even, pa skroluj kroz usluge/proizvode i njihove animirane rendere.  
4. Regenerisi logo ili pojedinacne vizuale dok ne dobijes najbolji rezultat.
