# PetalBid

<img src="client-app/public/images/petalbid-banner.avif" alt="PetalBid Banner">

![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?style=flat&logo=dotnet)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![Build Status](https://img.shields.io/github/actions/workflow/status/alex24106429/DigitaleVeilingklok/generate-docs.yml)
![License](https://img.shields.io/badge/license-MIT-green)

**PetalBid** is een geavanceerd, realtime digitaal veilingplatform ontwikkeld in opdracht van **jem-id** voor **Royal FloraHolland**. Dit systeem moderniseert de traditionele bloemenveiling door fysieke en digitale processen te combineren in een webapplicatie.

<img src="screenshots/auctionclockdiagram.avif" alt="Architectuurdiagram Realtime Veilingklok" width="500">

---

## Kernfunctionaliteiten

### 1. Realtime Digitale Veilingklok
Kopers ervaren een visuele, aflopende klok die milliseconde-nauwkeurig is gesynchroniseerd via WebSockets.
*   **Live Bieden:** Prijzen dalen automatisch; de eerste die drukt, wint de kavel.
*   **Visuele Feedback:** Duidelijke weergave van huidige prijs, voorraad en productfoto's.
*   **Directe Resultaten:** Zodra een koop gesloten is, wordt de voorraad realtime bijgewerkt voor alle deelnemers.


<img src="screenshots/veilingklok.avif" alt="De Veilingklok" width="500">

### 2. Dashboard voor Veilingmeesters
Veilingmeesters hebben volledige controle over het proces via een uitgebreid dashboard.
*   **Flow Control:** Starten, pauzeren en stoppen van veilingen en individuele kavels.
*   **Live Monitoring:** Een realtime logboek van alle transacties terwijl ze plaatsvinden.
*   **Veiling Setup:** Plannen van nieuwe veilingen op diverse locaties (Naaldwijk, Aalsmeer, etc.).
*   **Kavelbeheer:** Flexibel producten koppelen aan specifieke veilingen en startprijzen instellen.

<img src="screenshots/veilingdashboard.avif" alt="Veiling Dashboard" width="500">

<img src="screenshots/veilingtoevoegen.avif" alt="Nieuwe Veiling" width="500">

<img src="screenshots/productenbeherenvoorveiling.avif" alt="Kavels Koppelen" width="500">

### 3. Productbeheer voor Kwekers (Leveranciers)
Leveranciers kunnen hun aanbod eenvoudig beheren en klaarzetten voor de veiling.
*   **CRUD Functionaliteit:** Toevoegen, bewerken en verwijderen van producten.
*   **Media Upload:** Direct uploaden en verwerken van productfoto's.
*   **Specificaties:** Gedetailleerde eigenschappen zoals potmaat, steellengte en minimumprijs.

<img src="screenshots/productbeheer.avif" alt="Productoverzicht" width="500">
<img src="screenshots/nieuweproducttoevoegen.avif" alt="Nieuw Product" width="500">

### 4. Data-Gedreven Inzichten
*   **Prijshistorie:** Tabellen die de prijsontwikkeling van specifieke bloemensoorten tonen (zowel eigen data als marktgemiddelden).
*   **Verkoopgeschiedenis:** Een duidelijk overzicht van alle transacties voor administratieve doeleinden.

<img src="screenshots/prijshistorie.avif" alt="Prijshistorie" width="500">
<img src="screenshots/verkoopgeschiedenis.avif" alt="Verkoopgeschiedenis" width="500">

### 5. Beveiliging & Identiteit
*   **Tweestapsverificatie (2FA):** Ondersteuning voor TOTP-apps (2FAs, Ente Auth, BitWarden, Microsoft Authenticator) met QR-code setup.
*   **Pwned Passwords:** Integratie met *Have I Been Pwned* om het gebruik van uitgelekte wachtwoorden te voorkomen.
*   **Rol-gebaseerde Toegang:** Strikte scheiding tussen Kopers, Leveranciers, Veilingmeesters en Beheerders.

<img src="screenshots/2faqrcode.avif" alt="2FA Setup" width="500">
<img src="screenshots/inloggen2fa.avif" alt="Inloggen met 2FA" width="500">

### 6. Uitgebreid Beheer (Admin)
Beheerders hebben tools om het platform soepel te laten draaien.
*   **Gebruikersbeheer:** Aanmaken en beheren van alle accounts en rollen.

<img src="screenshots/gebruikersbeheer.avif" alt="Gebruikersbeheer" width="500">
<img src="screenshots/gebruikerbewerken.avif" alt="Gebruiker bewerken" width="500">
<img src="screenshots/nieuwegebruikertoevoegen.avif" alt="Nieuwe gebruiker toevoegen" width="500">

---

## Technische Stack

De applicatie maakt gebruik van een moderne N-tier architectuur.

### Backend (.NET 9)
*   **Framework:** ASP.NET Core Web API
*   **Realtime:** SignalR (WebSockets)
*   **Data:** Entity Framework Core met TPT (Table-per-Type) inheritance.
*   **Auth:** ASP.NET Core Identity, JWT (HttpOnly Cookies), TOTP 2FA.
*   **Media:** Magick.NET voor geavanceerde afbeeldingsoptimalisatie.
*   **Testing:** xUnit, Moq, EF Core InMemory.

### Frontend (React)
*   **Core:** React 19, TypeScript, Vite.
*   **UI Framework:** Material UI (MUI) met ondersteuning voor Dark/Light mode.
*   **Realtime:** `@microsoft/signalr` client.
*   **Testing:** Vitest, React Testing Library.

---

## Documentatie

De technische documentatie wordt automatisch gegenereerd via GitHub Actions en gedeployed op: https://alex24106429.github.io/DigitaleVeilingklok/.

*   **Backend Docs:** Gegenereerd met DocFX.
*   **Frontend Docs:** Gegenereerd met TypeDoc.

## Deployment

GitHub Actions wordt gebruikt voor automatische testing, linting en deployment naar Render/Cloudflare bij elke push naar main.

De frontend wordt via Cloudflare Pages gedeployed op: https://petalbid.bid/

De backend wordt via een [Docker container](https://github.com/alex24106429/DigitaleVeilingklok/blob/main/PetalBid.Api/Dockerfile) en [Render](https://render.com/) gedeployed op: https://api.petalbid.bid/

---

## Aan de slag

### Vereisten
*   [.NET 9.0 SDK](https://dotnet.microsoft.com/download)
*   [Node.js (LTS v20+ aanbevolen)](https://nodejs.org/)

### Installatie

1.  **Clone de repository:**
    ```bash
    git clone https://github.com/alex24106429/DigitaleVeilingklok
    cd DigitaleVeilingklok
    ```

2.  **Start de Backend:**
    ```bash
    cd PetalBid.Api
    dotnet restore
    dotnet ef database update
    dotnet run
    ```
    De backend is bereikbaar op http://localhost:5048/

	Swagger UI is beschikbaar op http://localhost:5048/swagger/index.html

	In de ontwikkeling-environment wordt SQLite gebruikt, geen configuratie nodig.

	Voor de productie-environment: configureer de `DATABASE_URL` environment variable.

3.  **Start de Frontend:**
    *(In een nieuwe terminal)*
    ```bash
    cd client-app
    npm install
    npm run dev
    ```
    De applicatie is beschikbaar op http://localhost:5173/.

### Inloggegevens (Demo Seed Data)
In de ontwikkeling-environment wordt de database automatisch gevuld met testgebruikers (Wachtwoord: `PetalBid1!`):
*   **Admin:** `administrator@petalbid.bid`
*   **Veilingmeester:** `veilingmeester@petalbid.bid`
*   **Kweker (Leverancier):** `leverancier@petalbid.bid`
*   **Koper:** `koper@petalbid.bid`

---

## Tests Uitvoeren

Het project bevat uitgebreide unit tests voor zowel de backend (Business Logic & Controllers) als de frontend (Componenten & Services).

*   **Backend:** `dotnet test` in de `PetalBid.Api.Tests` map.
*   **Frontend:** `npm run test` in de `client-app` map.
