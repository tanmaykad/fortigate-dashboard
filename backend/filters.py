from fastapi import Query
from typing import Optional


class FilterParams:
    """
    Common query filters accepted by every dashboard endpoint.
    Use as a FastAPI dependency:
        filters: FilterParams = Depends()
    """

    def __init__(
        self,
        start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
        start_time: Optional[str] = Query(None, description="Start time (HH:MM)"),
        end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
        end_time: Optional[str] = Query(None, description="End time (HH:MM)"),
        event_type: Optional[str] = Query(None, description="traffic | utm | event"),
        severity: Optional[str] = Query(None, description="notice | information | warning"),
        src_ip: Optional[str] = Query(None, description="Partial or full source IP"),
        dst_ip: Optional[str] = Query(None, description="Partial or full destination IP"),
        protocol: Optional[int] = Query(None, description="1=ICMP 6=TCP 17=UDP"),
    ):
        self.start_date = start_date
        self.start_time = start_time
        self.end_date = end_date
        self.end_time = end_time
        self.event_type = event_type
        self.severity = severity
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.protocol = protocol


def apply_filters(query, model, f: FilterParams):
    """Apply whichever FilterParams are set onto a SQLAlchemy query."""

    # Start datetime
    if f.start_date:
        start = f.start_date

        if f.start_time:
            start += f" {f.start_time}:00"
        else:
            start += " 00:00:00"

        query = query.filter(model.itime >= start)

    # End datetime
    if f.end_date:
        end = f.end_date

        if f.end_time:
            end += f" {f.end_time}:59"
        else:
            end += " 23:59:59"

        query = query.filter(model.itime <= end)

    # Event Type
    if f.event_type:
        query = query.filter(model.event_type == f.event_type)

    # Severity
    if f.severity:
        query = query.filter(model.event_severity == f.severity)

    # Source IP
    if f.src_ip:
        query = query.filter(model.src_ip.like(f"%{f.src_ip}%"))

    # Destination IP
    if f.dst_ip:
        query = query.filter(model.dst_ip.like(f"%{f.dst_ip}%"))

    # Protocol
    if f.protocol is not None:
        query = query.filter(model.net_proto == f.protocol)

    return query