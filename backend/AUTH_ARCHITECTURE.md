# Authentication Architecture in Clean Architecture

This document explains how authentication is implemented following Clean Architecture principles.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (FastAPI)                     │
│  - Routes (HTTP endpoints)                                  │
│  - Dependencies (get_current_user, get_admin_user)         │
│  - Exception Handlers (map domain → HTTP)                  │
└──────────────────────┬──────────────────────────────────────┘
                      │
┌──────────────────────▼──────────────────────────────────────┐
│              Application Layer (Use Cases)                   │
│  - AuthLoginUseCase                                          │
│  - AuthRefreshUseCase                                        │
│  - AuthVerifyUseCase                                         │
└──────────────────────┬──────────────────────────────────────┘
                      │
┌──────────────────────▼──────────────────────────────────────┐
│                  Domain Layer                                │
│  - User entity                                               │
│  - Auth exceptions (InvalidCredentialsError, etc.)          │
└──────────────────────┬──────────────────────────────────────┘
                      │
┌──────────────────────▼──────────────────────────────────────┐
│            Infrastructure Layer                              │
│  - UserRepository (MongoDB implementation)                  │
│  - JWTService (token creation/validation)                   │
│  - PasswordService (hashing/verification)                   │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Domain Layer (`domain/`)

**Exceptions** (`domain/exceptions/auth_exceptions.py`):
- `AuthenticationError` - Base exception for auth errors
- `InvalidCredentialsError` - Invalid email/password
- `TokenInvalidError` - Invalid token
- `TokenExpiredError` - Expired token
- `AuthorizationError` - Insufficient permissions

**Entities** (`domain/entities/user.py`):
- `User` - Pure domain entity (no infrastructure dependencies)

### 2. Application Layer (`application/`)

**Use Cases** (`application/use_cases/`):
- `AuthLoginUseCase` - Handles login logic
- `AuthRefreshUseCase` - Handles token refresh
- `AuthVerifyUseCase` - Verifies token and returns user

**Repository Interface** (`application/repositories/user_repository.py`):
- `UserRepository` Protocol - Defines user operations

### 3. Infrastructure Layer (`infrastructure/`)

**Services** (`infrastructure/services/`):
- `JWTService` - Creates and validates JWT tokens
- `PasswordService` - Hashes and verifies passwords

**Repositories** (`infrastructure/repositories/`):
- `UserRepositoryImpl` - MongoDB implementation

### 4. API Layer (`api/`)

**Dependencies** (`api/dependencies/auth.py`):
- `get_current_user` - Requires authentication, returns User
- `get_optional_current_user` - Optional auth, returns User | None
- `get_admin_user` - Requires admin role, returns User

**Exception Handlers** (`api/middleware/exception_handler.py`):
- Maps domain exceptions to HTTP responses
- `auth_exception_handler` - Maps auth errors to 401
- `authorization_exception_handler` - Maps authz errors to 403

**Dependency Container** (`api/dependencies/container.py`):
- Provides instances of services and use cases
- Uses FastAPI's dependency injection

## How It Works

### Authentication Flow

1. **User sends request with Bearer token**
   ```
   Authorization: Bearer <access_token>
   ```

2. **FastAPI dependency extracts token**
   - `get_current_user` dependency extracts token from header
   - Passes token to `AuthVerifyUseCase`

3. **Use case validates token**
   - `AuthVerifyUseCase.execute(token)` is called
   - Uses `JWTService` to decode and validate token
   - Uses `UserRepository` to fetch user
   - Checks if user is active
   - Returns `User` entity or raises domain exception

4. **Exception handling**
   - If domain exception is raised, exception handler middleware catches it
   - Converts to appropriate HTTP response (401, 403, etc.)

5. **Route receives User entity**
   - Route handler gets authenticated `User` entity
   - Can access `user.id`, `user.email`, `user.is_admin`, etc.

### Authorization Flow

1. **Route requires admin**
   ```python
   @router.get("/admin-only")
   async def admin_endpoint(admin_user: User = Depends(get_admin_user)):
       ...
   ```

2. **Dependency chain**
   - `get_admin_user` depends on `get_current_user`
   - First authenticates (401 if invalid)
   - Then checks `user.is_admin` (403 if not admin)

3. **Result**
   - Route receives authenticated admin user
   - Or HTTP 401/403 is returned automatically

## Usage Examples

### Protected Endpoint

```python
from fastapi import APIRouter, Depends
from backend.api.dependencies.auth import get_current_user
from backend.domain.entities.user import User

router = APIRouter()

@router.get("/protected")
async def protected_endpoint(
    current_user: User = Depends(get_current_user)
):
    """This endpoint requires authentication."""
    return {"message": f"Hello, {current_user.name}!"}
```

### Admin-Only Endpoint

```python
from backend.api.dependencies.auth import get_admin_user

@router.delete("/admin/delete-pet/{pet_id}")
async def delete_pet(
    pet_id: str,
    admin_user: User = Depends(get_admin_user)
):
    """This endpoint requires admin role."""
    # Only admins can reach here
    ...
```

### Optional Authentication

```python
from backend.api.dependencies.auth import get_optional_current_user

@router.get("/public-content")
async def public_content(
    user: Optional[User] = Depends(get_optional_current_user)
):
    """This endpoint works for both authenticated and anonymous users."""
    if user:
        return {"content": "Personalized content", "user": user.name}
    return {"content": "Public content"}
```

### Using Use Cases in Routes

```python
from backend.api.dependencies.container import get_auth_login_use_case
from backend.application.use_cases.auth_login import AuthLoginUseCase

@router.post("/login")
async def login(
    email: str,
    password: str,
    login_use_case: AuthLoginUseCase = Depends(get_auth_login_use_case)
):
    """Login endpoint using use case."""
    try:
        result = await login_use_case.execute(email, password)
        return {
            "access_token": result.access_token,
            "refresh_token": result.refresh_token,
            "user": result.user
        }
    except InvalidCredentialsError:
        # Exception handler will convert to HTTP 401
        raise
```

## Benefits of This Architecture

1. **Separation of Concerns**
   - Business logic in use cases
   - HTTP concerns in API layer
   - Infrastructure details isolated

2. **Testability**
   - Use cases can be tested without FastAPI
   - Dependencies can be mocked easily
   - Domain logic is independent

3. **Flexibility**
   - Can switch JWT library without changing use cases
   - Can change database without changing domain
   - Can add new auth methods easily

4. **Type Safety**
   - Full type hints throughout
   - Protocol-based interfaces
   - Domain entities are strongly typed

5. **Error Handling**
   - Domain exceptions are clear and meaningful
   - HTTP mapping is centralized
   - Consistent error responses

## Exception Mapping

| Domain Exception | HTTP Status | Response |
|-----------------|-------------|----------|
| `TokenExpiredError` | 401 | `{"detail": "Token has expired"}` |
| `TokenInvalidError` | 401 | `{"detail": "Could not validate credentials"}` |
| `InvalidCredentialsError` | 401 | `{"detail": "Invalid credentials"}` |
| `AuthorizationError` | 403 | `{"detail": "Not enough permissions"}` |

All auth exceptions include `WWW-Authenticate: Bearer` header.

## Next Steps

1. Create `UserRepositoryImpl` if not exists
2. Initialize Beanie database connection
3. Register exception handlers in FastAPI app
4. Create auth routes using the examples
5. Test authentication flow

