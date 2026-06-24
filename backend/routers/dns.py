from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from database import get_db
from models import FortigateEvent
from filters import FilterParams, apply_filters

router = APIRouter()


@router.get("/top-domains")
def top_domains(
    limit: int = Query(20, ge=1, le=100),
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    """Most queried domain names — ranked table."""
    q = db.query(FortigateEvent).filter(
        FortigateEvent.event_subtype == "dns",
        FortigateEvent.dns_query.isnot(None),
    )
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.dns_query.label("domain"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.dns_query)
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )

    return [{"domain": r.domain, "count": r.count} for r in rows]


@router.get("/query-types")
def query_types(filters: FilterParams = Depends(), db: Session = Depends(get_db)):
    """A / AAAA / PTR / HTTPS breakdown — bar chart."""
    q = db.query(FortigateEvent).filter(
        FortigateEvent.event_subtype == "dns",
        FortigateEvent.dns_querytype.isnot(None),
    )
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.dns_querytype.label("query_type"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.dns_querytype)
        .order_by(func.count().desc())
        .all()
    )

    return [{"query_type": r.query_type, "count": r.count} for r in rows]


@router.get("/by-source-ip")
def dns_by_source(
    limit: int = Query(10, ge=1, le=50),
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    """Which source IP is making the most DNS requests."""
    q = db.query(FortigateEvent).filter(
        FortigateEvent.event_subtype == "dns",
        FortigateEvent.src_ip.isnot(None),
    )
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.src_ip.label("src_ip"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.src_ip)
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )

    return [{"src_ip": r.src_ip, "count": r.count} for r in rows]


@router.get("/over-time")
def dns_over_time(
    granularity: Optional[str] = "hour",
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    """DNS event volume over time."""
    q = db.query(FortigateEvent).filter(
        FortigateEvent.event_subtype == "dns",
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
