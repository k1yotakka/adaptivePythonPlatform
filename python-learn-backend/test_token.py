from jose import jwt
from app.config import settings

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImV4cCI6MTc3MjIxNDg1OH0._x2hs6R6UxPkt_BgpcOHZcV2fK5x0EzZoY4VD0y2I-0"

try:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    print("✅ Token decoded successfully!")
    print(f"User ID: {payload.get('sub')}")
    print(f"Expires: {payload.get('exp')}")
except Exception as e:
    print(f"❌ Token decode failed: {e}")
