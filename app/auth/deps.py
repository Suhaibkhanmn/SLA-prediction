from fastapi import Depends, Header, HTTPException

from app.auth.security import decode_token


def get_user(authorization: str = Header(...)):
  """
  Extract and validate user from Authorization header.
  Header format: "Bearer <token>"
  """
  try:
    scheme, token = authorization.split()
  except ValueError:
    raise HTTPException(status_code=401, detail="Invalid authorization header")

  if scheme.lower() != "bearer":
    raise HTTPException(status_code=401, detail="Invalid auth scheme")

  payload = decode_token(token)
  if not payload:
    raise HTTPException(status_code=401, detail="Invalid or expired token")

  return payload


def require_role(*allowed_roles: str):
  """
  Guard dependency: require any of the given roles.
  Usage: Depends(require_role("admin")), etc.
  """

  def guard(user=Depends(get_user)):
    role = user.get("role")
    if role not in allowed_roles:
      raise HTTPException(status_code=403, detail="Forbidden")
    return user

  return guard


