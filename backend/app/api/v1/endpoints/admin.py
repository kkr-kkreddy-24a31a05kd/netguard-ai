from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import require_admin, get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.services.alert_service import log_audit_action

router = APIRouter()


class RoleUpdateRequest(BaseModel):
    role: str


class SystemConfig(BaseModel):
    anomaly_threshold: float = 0.35
    critical_confidence_threshold: float = 0.80
    high_confidence_threshold: float = 0.60
    auto_alert_enabled: bool = True


# In-memory config for dynamic thresholds
_CONFIG = SystemConfig()


@router.get("/users")
def list_system_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin-only: List all system accounts."""
    total = db.query(User).count()
    users = (
        db.query(User)
        .order_by(desc(User.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
    }


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    req: RoleUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin-only: Change user privileges between admin and analyst."""
    if req.role not in ["admin", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'admin' or 'analyst'."
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User #{user_id} not found."
        )

    old_role = target_user.role
    target_user.role = req.role
    db.commit()
    db.refresh(target_user)

    log_audit_action(
        db=db,
        user=admin_user,
        action="ROLE_UPDATED",
        target=f"User #{target_user.id} ({target_user.email})",
        details=f"Privilege changed from '{old_role}' to '{req.role}' by {admin_user.email}",
    )

    return {
        "status": "success",
        "message": f"User {target_user.email} updated to role '{req.role}'.",
        "user": {
            "id": target_user.id,
            "email": target_user.email,
            "role": target_user.role,
        },
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin-only: Deactivate or remove user account."""
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own administrator account."
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User #{user_id} not found."
        )

    email = target_user.email
    db.delete(target_user)
    db.commit()

    log_audit_action(
        db=db,
        user=admin_user,
        action="USER_DELETED",
        target=f"User #{user_id} ({email})",
        details=f"Account deleted by administrator {admin_user.email}",
    )

    return {"status": "success", "message": f"User {email} has been deleted."}


@router.get("/audit-logs")
def list_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin-only: Comprehensive audit trail of security and administrative operations."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    total = query.count()
    logs = (
        query.order_by(desc(AuditLog.timestamp), desc(AuditLog.id))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "logs": [l.to_dict() for l in logs],
    }


@router.get("/system-config")
def get_system_configuration(admin_user: User = Depends(require_admin)):
    """Admin-only: Retrieve active threat threshold configurations."""
    return _CONFIG.model_dump()


@router.post("/system-config")
def update_system_configuration(
    new_config: SystemConfig,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin-only: Dynamically update detection thresholds."""
    global _CONFIG
    _CONFIG = new_config

    log_audit_action(
        db=db,
        user=admin_user,
        action="CONFIG_UPDATED",
        target="System Threat Configuration",
        details=f"Updated thresholds: Anomaly={new_config.anomaly_threshold}, AutoAlert={new_config.auto_alert_enabled}",
    )
    return {"status": "success", "config": _CONFIG.model_dump()}
