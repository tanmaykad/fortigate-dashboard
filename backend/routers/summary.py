from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import Optional

from database import get_db
from models import FortigateEvent
from filters import FilterParams, apply_filters

router = APIRouter()


@router.get("/kpis")
def get_kpis(filters: FilterParams = Depends(), db: Session = Depends(get_db)):
    """Four headline numbers shown on the summary dashboard."""
    q = db.query(FortigateEvent)
    q = apply_filters(q, FortigateEvent, filters)

    total        = q.count()
    sessions     = q.filter(FortigateEvent.event_type == "traffic").count()
    threat_count = q.filter(FortigateEvent.threat_name.isnot(None)).count()
    unique_ips   = q.with_entities(
                       func.count(distinct(FortigateEvent.src_ip))
                   ).scalar() or 0
    warnings     = q.filter(FortigateEvent.event_severity == "warning").count()

    return {
        "total_events":   total,
        "total_sessions": sessions,
        "threat_events":  threat_count,
        "unique_src_ips": unique_ips,
        "warning_events": warnings,
    }


@router.get("/events-over-time")
def events_over_time(
    granularity: Optional[str] = "day",
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    """Event count grouped by hour or day — used for the time-series line chart."""
    q = db.query(FortigateEvent).filter(FortigateEvent.itime.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    if granularity == "minute":
     fmt = "%Y-%m-%d %H:%i"

    elif granularity == "hour":
     fmt = "%Y-%m-%d %H:00:00"

    elif granularity == "month":
     fmt = "%Y-%m"

    else:
     fmt = "%Y-%m-%d"

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
def severity_breakdown(filters: FilterParams = Depends(), db: Session = Depends(get_db)):
    """Count of events per severity level — used for the donut chart."""
    q = db.query(FortigateEvent).filter(FortigateEvent.event_severity.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.event_severity.label("severity"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.event_severity)
        .order_by(func.count().desc())
        .all()
    )

    return [{"severity": r.severity, "count": r.count} for r in rows]


@router.get("/event-type-breakdown")
def event_type_breakdown(filters: FilterParams = Depends(), db: Session = Depends(get_db)):
    """Event count per type+subtype combination."""
    q = db.query(FortigateEvent).filter(FortigateEvent.event_type.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.event_type.label("event_type"),
            FortigateEvent.event_subtype.label("event_subtype"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.event_type, FortigateEvent.event_subtype)
        .order_by(func.count().desc())
        .all()
    )

    return [
        {"event_type": r.event_type, "event_subtype": r.event_subtype, "count": r.count}
        for r in rows
    ]
