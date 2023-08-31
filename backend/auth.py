import os
from datetime import (
    datetime,
    timedelta,
)

from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import OAuth2PasswordBearer
from jose import (
    JWTError,
    jwt,
)
from pydantic import BaseModel


USERNAME = os.environ.get("USER_NAME")
USER_PASSWORD = os.environ.get("USER_PASSWORD")
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_EXPIRES_H = os.environ.get("JWT_EXPIRES_H")


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/sign-in/")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SigIn(BaseModel):
    username: str
    password: str


def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    return AuthService.verify_token(token)


class AuthService:
    @classmethod
    def verify_token(cls, token: str) -> str:
        exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=["HS256"],
            )
        except JWTError:
            raise exception from None
        username = payload.get("user")
        dt_obj = datetime.fromtimestamp(payload.get("exp"))
        if dt_obj < datetime.utcnow():
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "token expired", headers={"WWW-Authenticate": "Bearer"})
        return username

    @classmethod
    def create_token(cls, username: str) -> Token:
        now = datetime.utcnow()
        payload = {
            "iat": now,
            "nbf": now,
            "exp": now + timedelta(hours=int(JWT_EXPIRES_H)),
            "sub": username,
            "user": username,
        }
        token = jwt.encode(
            payload,
            JWT_SECRET,
            algorithm="HS256",
        )
        return Token(access_token=token)

    def authenticate_user(
        self,
        username: str,
        password: str,
    ) -> Token:
        exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        if username != USERNAME or password != USER_PASSWORD:
            raise exception
        return self.create_token(username)
