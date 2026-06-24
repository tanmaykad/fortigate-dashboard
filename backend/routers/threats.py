from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import FortigateEvent
from filters import FilterParams, apply_filters

router = APIRouter()


@router.get("/events")
def threat_events(
    page:      int = Query(1,  ge=1),
    page_size: int = Query(20, ge=1, le=100),
    filters:   FilterParams = Depends(),
    db:        Session = Depends(get_db),
):
    """
    Paginated list of all warning-severity events.
    AnyDesk / Remote.Access detections appear here.
    """
    q = (
        db.query(FortigateEvent)
        .filter(FortigateEvent.event_severity == "warning")
        .order_by(FortigateEvent.itime.desc())
    )
    q = apply_filters(q, FortigateEvent, filters)

    total = q.count()
    rows  = q.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total":     total,
        "page":      page,
        "page_size": page_size,
        "data": [
            {
                "id":             r.id,
                "itime":          str(r.itime) if r.itime else None,
                "src_ip":         r.src_ip,
                "dst_ip":         r.dst_ip,
                "app_name":       r.app_name,
                "app_risk_name":  r.app_risk_name,
                "threat_name":    r.threat_name,
                "threat_type":    r.threat_type,
                "threat_severity":r.threat_severity,
                "threat_action":  r.threat_action,
                "event_severity": r.event_severity,
                "event_type":     r.event_type,
                "event_subtype":  r.event_subtype,
            }
            for r in rows
        ],
    }


@router.get("/by-app")
def threats_by_app(filters: FilterParams = Depends(), db: Session = Depends(get_db)):
    """Threat events grouped by application — shows AnyDesk as the flagged app."""
    q = db.query(FortigateEvent).filter(FortigateEvent.threat_name.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.app_name.label("app"),
            FortigateEvent.threat_type.label("threat_type"),
            FortigateEvent.threat_severity.label("severity"),
            func.count().label("count"),
        )
        .group_by(
            FortigateEvent.app_name,
            FortigateEvent.threat_type,
            FortigateEvent.threat_severity,
        )
        .order_by(func.count().desc())
        .all()
    )

    return [
        {"app": r.app, "threat_type": r.threat_type, "severity": r.severity, "count": r.count}
        for r in rows
    ]


@router.get("/timeline")
def threats_timeline(
    granularity: str = "day",
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    """Warning events over time — useful even when threats are sparse."""
    q = db.query(FortigateEvent).filter(
        FortigateEvent.event_severity == "warning",
        FortigateEvent.itime.isnot(None),
    )
    q = apply_filters(q, FortigateEvent, filters)

    fmt = "%Y-%m-%d %H:00:00" if granularity == "hour" else "%Y-%m-%d"

    rows = (
        q.with_entities(
            func.date_format(FortigateEvent.itime, fmt).label("bucket"),
            func.count().label("count"),
        )
        .group_by("bucket")
        .order_by("bucket")
        .all()
    )

    return [{"time_bucket": r.bucket, "count": r.count} for r in rows]


@router.get("/severity-breakdown")
def threat_severity_breakdown(filters: FilterParams = Depends(), db: Session = Depends(get_db)):
    """Breakdown of threat_severity field (medium / high / critical)."""
    q = db.query(FortigateEvent).filter(FortigateEvent.threat_severity.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.threat_severity.label("severity"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.threat_severity)
        .order_by(func.count().desc())
        .all()
    )

    return [{"severity": r.severity, "count": r.count} for r in rows]
