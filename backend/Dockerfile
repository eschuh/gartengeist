FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Gartengeist.Api/Gartengeist.Api.csproj Gartengeist.Api/
RUN dotnet restore Gartengeist.Api/Gartengeist.Api.csproj
COPY Gartengeist.Api/ Gartengeist.Api/
RUN dotnet publish Gartengeist.Api/Gartengeist.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
# tzdata: Zeitzone für „heute“ (Aufgaben, Gießprotokoll, Datumsvorgaben)
# libgssapi-krb5-2: vom Postgres-Treiber (Npgsql) erwartet, sonst Warnung im Log
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*
# Das Basis-Image lauscht bereits auf Port 8080 (ASPNETCORE_HTTP_PORTS)
ENV TZ=Europe/Zurich \
    Uploads__Path=/app/uploads
WORKDIR /app
COPY --from=build /app .
RUN mkdir -p /app/uploads && chown -R $APP_UID /app/uploads
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Gartengeist.Api.dll"]
