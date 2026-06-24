from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import FortigateEvent
from filters import FilterParams, apply_filters

router = APIRouter()


@router.get("/src-countries")
def src_countries(
    limit: int = Query(20, ge=1, le=100),
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    """Source country distribution — Taiwan dominates at ~96%."""
    q = db.query(FortigateEvent).filter(FortigateEvent.src_geo_country.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.src_geo_country.label("country"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.src_geo_country)
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )

    return [{"country": r.country, "count": r.count} for r in rows]


@router.get("/dst-countries")
def dst_countries(
    limit: int = Query(20, ge=1, le=100),
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    """Destination country distribution — USA at ~87%."""
    q = db.query(FortigateEvent).filter(FortigateEvent.dst_geo_country.isnot(None))
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.dst_geo_country.label("country"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.dst_geo_country)
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )

    return [{"country": r.country, "count": r.count} for r in rows]


@router.get("/flows")
def geo_flows(
    limit: int = Query(30, ge=1, le=100),
    filters: FilterParams = Depends(),
    db: Session = Depends(get_db),
):
    """
    Src country → Dst country pairs with session count.
    Used to draw the arc map — thick line = high volume.
    """
    q = db.query(FortigateEvent).filter(
        FortigateEvent.src_geo_country.isnot(None),
        FortigateEvent.dst_geo_country.isnot(None),
    )
    q = apply_filters(q, FortigateEvent, filters)

    rows = (
        q.with_entities(
            FortigateEvent.src_geo_country.label("src_country"),
            FortigateEvent.dst_geo_country.label("dst_country"),
            func.count().label("count"),
        )
        .group_by(FortigateEvent.src_geo_country, FortigateEvent.dst_geo_country)
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )

    return [
        {"src_country": r.src_country, "dst_country": r.dst_country, "count": r.count}
        for r in rows
    ]
