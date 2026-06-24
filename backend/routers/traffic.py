from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from database import get_db
from models import FortigateEvent
from filters import FilterParams, apply_filters

router = APIRouter()

PROTOCOL_MAP = {1: "ICMP", 6: "TCP", 17: "UDP", 58: "ICMPv6"}


@router.get("/protocols")
def protocol_breakdown(filters: FilterParams = Depends(), db: Session = Depends(get_db)):
    """UDP / TCP / ICMP breakdown — pie chart."""
    q = db.query(FortigateEvent).filter(FortigateEvent.net_proto.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.net_proto.label("proto"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.net_proto)
        .order_by(func.count().desc())
        .all()
    )

    return [
        {
            "protocol": PROTOCOL_MAP.get(r.proto, f"Proto {r.proto}"),
            "proto_number": r.proto,
            "count": r.count,
        }
        for r in rows
    ]


@router.get("/top-apps")
def top_apps(
    limit: int = Query(10, ge=1, le=50),
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    """Top N applications by session count — horizontal bar chart."""
    q = db.query(FortigateEvent).filter(FortigateEvent.app_name.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.app_name.label("app_name"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.app_name)
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )

    return [{"app_name": r.app_name, "count": r.count} for r in rows]


@router.get("/bytes-over-time")
def bytes_over_time(
    granularity: Optional[str] = "day",
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    """Sent vs received bytes over time — dual-line chart."""
    q = db.query(FortigateEvent).filter(FortigateEvent.itime.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    fmt = "%Y-%m-%d %H:00:00" if granularity == "hour" else "%Y-%m-%d"

    rows = (
        q.with_entities(
            func.date_format(FortigateEvent.itime, fmt).label("bucket"),
            func.sum(FortigateEvent.net_sentbytes).label("sent"),
            func.sum(FortigateEvent.net_recvbytes).label("recv"),
        )
        .group_by("bucket")
        .order_by("bucket")
        .all()
    )

    return [
        {
            "time_bucket": r.bucket,
            "sent_bytes":  int(r.sent or 0),
            "recv_bytes":  int(r.recv or 0),
        }
        for r in rows
    ]


@router.get("/top-sessions")
def top_sessions(
    sort_by: str = Query("duration", description="duration | sent | received"),
    limit:   int = Query(10, ge=1, le=50),
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    """Longest or biggest sessions — sortable table. The 22-hour session shows up here."""
    q = db.query(FortigateEvent).filter(
        FortigateEvent.event_type == "traffic",
        FortigateEvent.net_sessionduration.isnot(None),
    )
    q = apply_filters(q, FortigateEvent, filters)

    if sort_by == "sent":
        q = q.order_by(FortigateEvent.net_sentbytes.desc())
    elif sort_by == "received":
        q = q.order_by(FortigateEvent.net_recvbytes.desc())
    else:
        q = q.order_by(FortigateEvent.net_sessionduration.desc())

    rows = q.limit(limit).all()

    return [
        {
            "id":                   r.id,
            "itime":                str(r.itime) if r.itime else None,
            "src_ip":               r.src_ip,
            "dst_ip":               r.dst_ip,
            "app_name":             r.app_name,
            "protocol":             PROTOCOL_MAP.get(r.net_proto, str(r.net_proto)) if r.net_proto else None,
            "session_duration_sec": r.net_sessionduration,
            "sent_bytes":           r.net_sentbytes,
            "recv_bytes":           r.net_recvbytes,
        }
        for r in rows
    ]


@router.get("/top-source-ips")
def top_source_ips(
    limit: int = Query(10, ge=1, le=50),
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    q = db.query(FortigateEvent).filter(FortigateEvent.src_ip.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.src_ip.label("ip"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.src_ip)
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )

    return [{"ip": r.ip, "count": r.count} for r in rows]


@router.get("/top-dest-ips")
def top_dest_ips(
    limit: int = Query(10, ge=1, le=50),
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    q = db.query(FortigateEvent).filter(FortigateEvent.dst_ip.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.dst_ip.label("ip"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.dst_ip)
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )

    return [{"ip": r.ip, "count": r.count} for r in rows]
