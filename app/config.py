from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ALERT_THRESHOLD: float = 0.80

    # Email alert configuration (must be provided via environment for production)
    EMAIL_FROM: str = ""
    EMAIL_TO: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    # Optional signup guard used by /auth/register
    SIGNUP_KEY: str | None = None
    
    # JWT signing secret (must be provided via environment for production)
    SECRET_KEY: str = ""
    
    vite_api_url: str | None = None
    class Config:
        env_file = ".env"


settings = Settings()
