from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_admin
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.token import Token

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Security User",
)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> User:
    """Register a new analyst or administrator in the NetGuard AI system."""
    # Check if user with this email already exists
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address is already registered.",
        )

    # Hash password using bcrypt
    hashed_password = get_password_hash(user_in.password)

    new_user = User(
        name=user_in.name.strip(),
        email=user_in.email.lower(),
        password_hash=hashed_password,
        role=user_in.role or "analyst",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate User and Generate JWT Token",
)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db),
) -> Token:
    """Authenticate with email and password to receive a signed JWT access token."""
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id, role=user.role)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/logout",
    summary="Sign Out Current Session",
)
def logout(current_user: User = Depends(get_current_user)) -> dict:
    """Acknowledge user logout and instruct client to invalidate stored tokens."""
    return {
        "status": "ok",
        "message": f"Successfully signed out session for {current_user.email}",
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current Authenticated User",
)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    """Return the profile and role details of the currently authenticated user."""
    return current_user


@router.get(
    "/admin-only",
    summary="Admin Authorization Verification Probe",
)
def admin_only_probe(admin_user: User = Depends(require_admin)) -> dict:
    """Restricted endpoint demonstrating role-based access control (Admin only)."""
    return {
        "status": "ok",
        "message": f"Welcome, Administrator {admin_user.name}.",
        "access": "granted",
    }
