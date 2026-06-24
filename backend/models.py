from sqlalchemy import Column, Integer, BigInteger, String, Text, DateTime, SmallInteger
from database import Base


class FortigateEvent(Base):
    __tablename__ = "fortigate_events"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # ── Time ──────────────────────────────────────────────────────────────────
    itime               = Column(DateTime)
    data_timestamp      = Column(DateTime)
    event_creation_time = Column(DateTime)

    # ── Event Metadata ────────────────────────────────────────────────────────
    event_type      = Column(String(50))
    event_subtype   = Column(String(50))
    event_action    = Column(String(50))
    event_severity  = Column(String(20))
    event_id        = Column(String(50))
    event_uuid      = Column(String(50))
    event_policy    = Column(String(50))
    event_policyid  = Column(Integer)
    event_policytype= Column(String(50))
    event_cat       = Column(String(50))
    event_message   = Column(Text)
    event_outcome   = Column(String(50))
    event_ref       = Column(String(200))

    # ── Network & Traffic ─────────────────────────────────────────────────────
    net_proto           = Column(SmallInteger)
    net_sentbytes       = Column(BigInteger)
    net_recvbytes       = Column(BigInteger)
    net_sentpkts        = Column(Integer)
    net_rcvdpkts        = Column(Integer)
    net_sessionduration = Column(Integer)
    net_sessionid       = Column(BigInteger)
    net_direction       = Column(String(20))
    net_sentdelta       = Column(BigInteger)
    net_recvdelta       = Column(BigInteger)
    net_sdwan           = Column(String(100))
    net_sdwan_vwlid     = Column(Integer)

    # ── Source ────────────────────────────────────────────────────────────────
    src_ip          = Column(String(45))
    src_port        = Column(Integer)
    src_geo         = Column(String(20))
    src_geo_city    = Column(String(100))
    src_geo_country = Column(String(100))
    src_intf        = Column(String(100))
    src_intf_role   = Column(String(50))
    src_natip       = Column(String(45))
    src_natport     = Column(Integer)

    # ── Destination ───────────────────────────────────────────────────────────
    dst_ip          = Column(String(45))
    dst_port        = Column(Integer)
    dst_geo         = Column(String(20))
    dst_geo_city    = Column(String(100))
    dst_geo_country = Column(String(100))
    dst_intf        = Column(String(100))
    dst_intf_role   = Column(String(50))
    dst_mac         = Column(String(17))

    # ── Application ───────────────────────────────────────────────────────────
    app_name      = Column(String(100))
    app_cat       = Column(String(100))
    app_id        = Column(Integer)
    app_service   = Column(String(100))
    app_risk_name = Column(String(50))

    # ── Threat & Security ─────────────────────────────────────────────────────
    threat_name      = Column(String(200))
    threat_type      = Column(String(100))
    threat_severity  = Column(String(50))
    threat_action    = Column(String(50))
    threat_score     = Column(Integer)
    threat_count     = Column(Integer)
    threat_direction = Column(String(20))
    threat_pattern   = Column(String(500))

    # ── DNS ───────────────────────────────────────────────────────────────────
    dns_query     = Column(String(500))
    dns_querytype = Column(String(20))
    dns_response  = Column(String(500))

    # ── HTTP ──────────────────────────────────────────────────────────────────
    http_method    = Column(String(10))
    http_url       = Column(Text)
    http_useragent = Column(Text)

    # ── Device & Identity ─────────────────────────────────────────────────────
    data_sourceid   = Column(String(50))
    data_sourcename = Column(String(100))
    data_sourcetype = Column(String(50))
    data_sourcevdom = Column(String(50))
    data_parsername = Column(String(100))
    host_location   = Column(String(100))
    user_name       = Column(String(100))
    loguid          = Column(String(50))
    logflag         = Column(SmallInteger)
    epid            = Column(Integer)
    euid            = Column(Integer)
    dstepid         = Column(Integer)
    dsteuid         = Column(Integer)
