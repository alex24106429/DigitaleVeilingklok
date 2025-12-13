![PetalBid Header](/client-app/public/images/petalbid-header.avif)

# PetalBid

Dit project is de ontwikkeling van een realtime, web-gebaseerde digitale veilingklok. De applicatie wordt gebouwd in opdracht van **jem-id** voor de klant **Royal FloraHolland**. Het doel is om een modern, zelfstandig en gebruiksvriendelijk veilingsysteem te realiseren dat losstaat van de bestaande systemen.

## Technische Stack

De applicatie wordt gebouwd met een moderne N-tier architectuur, bestaande uit een frontend, een backend API en een database.

### Backend
*   **Taal:** C#
*   **Framework:** ASP.NET Core Web API
*   **Data Access:** Entity Framework Core met LINQ
*   **Testen:** xUnit (Unit Testing)

### Frontend
*   **Bibliotheek:** React
*   **Taal:** TypeScript
*   **Testen:** Vitest
*   **Package Manager:** NPM

### Database
*   **Type:** Relationeel Database Management Systeem (RDBMS)

---

## Getting Started

Volg deze stappen om de ontwikkelomgeving lokaal op te zetten en het project te draaien.

### Vereisten

Zorg ervoor dat de volgende software op je systeem is geïnstalleerd:
*   [.NET SDK](https://dotnet.microsoft.com/download) (versie 9.0 of hoger)
*   [Node.js](https://nodejs.org/) (inclusief npm)
*   [VS Code](https://code.visualstudio.com/)

### Installatie & Opstarten

1.  **Clone de repository:**
    ```bash
    git clone https://github.com/alex24106429/DigitaleVeilingklok
    cd DigitaleVeilingklok
    ```

2.  **Start de Backend API:**
    ```bash
    # Ga naar de API-map
    cd PetalBid.Api

    # Installeer de NuGet-packages
    dotnet restore

    # Update de database
    dotnet ef database update

    # Start de applicatie
    dotnet run
    ```
    De API is nu bereikbaar op `https://localhost:5048` (of de poort wordt in de terminal getoond). Je kunt de endpoints testen via de Swagger UI op `https://localhost:5048/swagger`.

3.  **Start de Frontend Applicatie:**
    *Open een nieuwe terminal in de hoofdmap van het project.*
    ```bash
    # Ga naar de frontend-map
    cd client-app

    # Installeer de npm-packages
    npm install

    # Start de ontwikkelserver
    npm run dev
    ```
    De React-applicatie wordt nu geopend in je browser.

### Tests Uitvoeren

Het project bevat unit tests voor de backend om de bedrijfslogica en API-controllers te verifiëren.

1.  **Backend Unit Tests:**
    ```bash
	# Ga naar de tests-map
	cd PetalBid.Api.Tests

	# Installeer de dependencies
	dotnet add package Moq
	dotnet add package Microsoft.EntityFrameworkCore.InMemory --version 9.0.0

    # Voer alle tests uit in de solution
    dotnet test
    ```
