FROM python:3.11-slim

# Системные зависимости (psycopg2 требует libpq)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Ставим зависимости отдельным слоем — кэшируется при неизменном requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходники
COPY . .

# Создаём папку для статики (аватары и т.д.)
RUN mkdir -p /app/static/avatars

# entrypoint: ждёт postgres, запускает миграции, потом uvicorn
# sed -i 's/\r//' убирает Windows CRLF переводы строк
COPY entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]