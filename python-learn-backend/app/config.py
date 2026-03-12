from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:2705@localhost:5432/pylearn"
    SECRET_KEY: str = "2705Arman"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175"
    ADMIN_EMAIL: str = "admin@pylearn.com"
    ADMIN_PASSWORD: str = "admin123"
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"

    def get_cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()
