# Private Event Planner

Private Event Planner to aplikacja webowa służąca do organizacji prywatnych wydarzeń w stylu wydarzeń platformy Facebook. Aplikacja umożliwia tworzenie i zarządzanie prywatnymi wydarzeniami poprzez bezpieczne linki dostępne tylko dla zaproszonych osób.

## Instrukcja użytkowania

### Wymagania systemowe

Upewnij się, że masz zainstalowane:
- Docker
- Docker Compose
- Make

### Przygotowanie środowiska

1. Sklonuj repozytorium
2. Utwórz plik `.env` w katalogu głównym z następującymi zmiennymi środowiskowymi:
   ```env
   DJANGO_SECRET_KEY=your_secret_key
   POSTGRES_NAME=event_planner_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password
   POSTGRES_HOST=db
   POSTGRES_PORT=5432
   RABBITMQ_DEFAULT_USER=admin
   RABBITMQ_DEFAULT_PASS=your_password
   RABBITMQ_URL=amqp://admin:your_password@rabbitmq:5672/
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_USE_SSL=False
   EMAIL_HOST_USER=your_email@gmail.com
   EMAIL_HOST_PASSWORD=your_email_password
   DEFAULT_FROM_EMAIL=your_email@gmail.com
   ```

### Uruchamianie aplikacji

```bash
# Budowanie obrazów Docker
make build

# Uruchomienie aplikacji
make up

# Zatrzymanie aplikacji
make down
```

### Dostęp do aplikacji

Po uruchomieniu aplikacja będzie dostępna pod adresami:
- **Aplikacja**: http://localhost
- **API Documentation (Swagger)**: http://localhost/api/schema/swagger-ui/
- **RabbitMQ Management**: http://localhost:15672

### Komponenty aplikacji

Aplikacja składa się z następujących serwisów:

| Serwis | Opis |
|--------|------|
| **reverse-proxy** | Nginx - routing ruchu |
| **frontend** | Next.js |
| **backend** | Gunicorn + Django REST Framework |
| **worker** | Celery z Dramatiq |
| **db** | PostgreSQL |
| **rabbitmq** | Message Broker + Management UI |

### Konfiguracja Nginx

Reverse proxy kieruje ruch zgodnie z następującymi regułami:
- `/api/*` → backend Django (port 8000)
- `/static/*` → statyczne pliki backendowe
- `/media/*` → pliki mediów backendu
- `/*` → frontend

## Testowanie

### Uruchamianie testów

```bash
# Pełny cykl testowy (build + setup + testy + cleanup)
make test

# Tylko czyszczenie środowiska
make clean
```

### Pokrycie testami

#### Testy API endpoints
- **EventAdminViewSet**: tworzenie, edycja, usuwanie, pobieranie wydarzeń
- **InvitationViewSet**: tworzenie, akceptacja, usuwanie zaproszeń
- **PersonalizedInvitationViewSet**: zarządzanie zaproszeniami spersonalizowanymi
- **EventViewSet**: pobieranie szczegółów, export ICS, opuszczanie wydarzenia
- **CommentViewSet**: dodawanie, pobieranie, usuwanie komentarzy

#### Testy funkcjonalności email
- Wysyłanie zaproszeń
- Powiadomienia o zmianach
- Walidacja szablonów HTML i tekstowych

#### Testy bezpieczeństwa
- Walidacja UUID edycji
- Kontrola dostępu do zasobów
- Walidacja uprawnień administratora wydarzenia

## Funkcjonalności

### Zarządzanie wydarzeniami
- **Tworzenie wydarzenia** z obowiązkowymi polami (nazwa, lokalizacja, daty, email) i opcjonalnymi (opis, link, zdjęcie, organizator, limit uczestników)
- **Edycja wydarzenia** przez administratora z automatycznym powiadamianiem uczestników o zmianach
- **Usuwanie wydarzenia** z powiadomieniem uczestników o anulowaniu
- **Generowanie haseł** administratora i uczestników

### System zaproszeń
- **Tworzenie zaproszeń spersonalizowanych** (jednorazowe, z predefiniowanym imieniem)
- **Tworzenie zaproszeń niespersonalizowanych** (wielokrotnego użytku)
- **Akceptacja zaproszeń** z automatyczną walidacją unikalności emaili
- **Usuwanie zaproszeń** przez administratora

### Uczestnictwo w wydarzeniu
- **Dołączanie do wydarzenia** poprzez link zaproszenia
- **Opuszczanie wydarzenia** przez uczestników
- **Usuwanie uczestników** przez administratora
- **Walidacja limitów** uczestników

### System komentarzy
- **Dodawanie komentarzy** przez uczestników
- **Usuwanie komentarzy** przez autora lub administratora wydarzenia
- **Wyświetlanie komentarzy**

### Powiadomienia email
- **Wysyłanie linku administratora** po utworzeniu wydarzenia
- **Powiadomienia o zmianach** w wydarzeniu
- **Powiadomienia o anulowaniu** wydarzenia

### Integracja z kalendarzami
- **Export do formatu ICS** z możliwością pobrania pliku
- **Integracja z kalendarzem Google**

### Internacjonalizacja
- **Obsługa języków**: polski i angielski
- **Dynamiczna zmiana języka** w interfejsie

## Stack technologiczny

### Backend
- **Django 5.0.0**
- **Django REST Framework 3.15.0**
- **Dramatiq 1.14.0**
- **RabbitMQ**
- **PostgreSQL**
- **Gunicorn**

### Frontend
- **Next.js**
- **Next i18next**

### DevOps
- **Docker & Docker Compose** - konteneryzacja
- **Nginx** - reverse proxy
- **Ruff** - linter i formatter
- **Make** - automatyzacja zadań deweloperskich

## Monitorowanie i logowanie
- **Logi Django**:
  - Logi są przechowywane w pliku django.log w docker volume `zprp_django_logs`
- **Logi Gunicorn**:
  - Logi są przechowywane w plikach access.log i error.log w docker volume `zprp_django_logs`
- **Logi serwisów**: `docker-compose logs [service_name]`
- **Status serwisów**: `docker-compose ps`
- **RabbitMQ Management**: http://localhost:15672

## Dokumentacja API

API jest w pełni udokumentowane przy użyciu OpenAPI (Swagger):
- **Swagger UI**: http://localhost/api/schema/swagger-ui/
- **OpenAPI Schema**: http://localhost/api/schema/
