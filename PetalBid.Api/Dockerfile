# Build Stage - Uses .NET 9 SDK
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["PetalBid.Api.csproj", "./"]
RUN dotnet restore "PetalBid.Api.csproj"
COPY . .
RUN dotnet publish "PetalBid.Api.csproj" -c Release -o /app/publish

# Serve Stage - Uses .NET 9 Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "PetalBid.Api.dll"]