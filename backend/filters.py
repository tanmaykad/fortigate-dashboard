from fastapi import Query
from typing import Optional


class FilterParams:
    """
    Common query filters accepted by every dashboard endpoint.
    Use as a FastAPI dependency:  filters: FilterParams = Depends()
    """
    def __init__(
        self,
        start_date: Optional[str] = Query(None, description="Start date  YYYY-MM-DD"),
        end_date:   Optional[str] = Query(None, description="End date    YYYY-MM-DD"),
        event_type: Optional[str] = Query(None, description="e.g. traffic, utm, event"),
        severity:   Optional[str] = Query(None, description="notice | information | warning"),
        src_ip:     Optional[str] = Query(None, description="Partial or full source IP"),
        dst_ip:     Optional[str] = Query(None, description="Partial or full dest IP"),
        protocol:   Optional[int] = Query(None, description="Protocol number: 1=ICMP 6=TCP 17=UDP"),
    ):
        self.start_date = start_date
        self.end_date   = end_date
        self.event_type = event_type
        self.severity   = severity
        self.src_ip     = src_ip
        self.dst_ip     = dst_ip
        self.protocol   = protocol


def apply_filters(query, model, f: FilterParams):
    """Apply whichever FilterParams are set onto a SQLAlchemy query."""
    if f.start_date:
        query = query.filter(model.itime >= f"{f.start_date} 00:00:00")
    if f.end_date:
        query = query.filter(model.itime <= f"{f.end_date} 23:59:59")
    if f.event_type:
        query = query.filter(model.event_type == f.event_type)
    if f.severity:
        query = query.filter(model.event_severity == f.severity)
    if f.src_ip:
        query = query.filter(model.src_ip.like(f"%{f.src_ip}%"))
    if f.dst_ip:
        query = query.filter(model.dst_ip.like(f"%{f.dst_ip}%"))
    if f.protocol is not None:
        query = query.filter(model.net_proto == f.protocol)
    return query
