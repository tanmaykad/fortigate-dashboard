-- ============================================================
--  FortiGate Analytics Dashboard — MySQL Schema
--  Run this once to create the database and table.
-- ============================================================

CREATE DATABASE IF NOT EXISTS fortigate_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fortigate_db;

DROP TABLE IF EXISTS fortigate_events;

CREATE TABLE fortigate_events (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- ── Time ──────────────────────────────────────────────────────────
    itime                DATETIME,
    data_timestamp       DATETIME,
    event_creation_time  DATETIME,

    -- ── Event Metadata ────────────────────────────────────────────────
    event_type           VARCHAR(50),
    event_subtype        VARCHAR(50),
    event_action         VARCHAR(50),
    event_severity       VARCHAR(20),
    event_id             VARCHAR(50),
    event_uuid           VARCHAR(50),
    event_policy         VARCHAR(50),
    event_policyid       INT,
    event_policytype     VARCHAR(50),
    event_cat            VARCHAR(50),
    event_message        TEXT,
    event_outcome        VARCHAR(50),
    event_ref            VARCHAR(200),

    -- ── Network & Traffic ─────────────────────────────────────────────
    net_proto            TINYINT UNSIGNED,     -- 1=ICMP, 6=TCP, 17=UDP
    net_sentbytes        BIGINT,
    net_recvbytes        BIGINT,
    net_sentpkts         INT,
    net_rcvdpkts         INT,
    net_sessionduration  INT,                  -- in seconds
    net_sessionid        BIGINT,
    net_direction        VARCHAR(20),
    net_sentdelta        BIGINT,
    net_recvdelta        BIGINT,
    net_sdwan            VARCHAR(100),
    net_sdwan_vwlid      INT,

    -- ── Source ────────────────────────────────────────────────────────
    src_ip               VARCHAR(45),          -- supports IPv6
    src_port             SMALLINT UNSIGNED,
    src_geo              VARCHAR(20),
    src_geo_city         VARCHAR(100),
    src_geo_country      VARCHAR(100),
    src_intf             VARCHAR(100),
    src_intf_role        VARCHAR(50),
    src_natip            VARCHAR(45),
    src_natport          SMALLINT UNSIGNED,

    -- ── Destination ───────────────────────────────────────────────────
    dst_ip               VARCHAR(45),
    dst_port             SMALLINT UNSIGNED,
    dst_geo              VARCHAR(20),
    dst_geo_city         VARCHAR(100),
    dst_geo_country      VARCHAR(100),
    dst_intf             VARCHAR(100),
    dst_intf_role        VARCHAR(50),
    dst_mac              VARCHAR(17),

    -- ── Application ───────────────────────────────────────────────────
    app_name             VARCHAR(100),
    app_cat              VARCHAR(100),
    app_id               INT,
    app_service          VARCHAR(100),
    app_risk_name        VARCHAR(50),

    -- ── Threat & Security ─────────────────────────────────────────────
    threat_name          VARCHAR(200),
    threat_type          VARCHAR(100),
    threat_severity      VARCHAR(50),
    threat_action        VARCHAR(50),
    threat_score         INT,
    threat_count         INT,
    threat_direction     VARCHAR(20),
    threat_pattern       VARCHAR(500),

    -- ── DNS ───────────────────────────────────────────────────────────
    dns_query            VARCHAR(500),
    dns_querytype        VARCHAR(20),          -- stored as clean type name e.g. A, PTR, AAAA
    dns_response         VARCHAR(500),

    -- ── HTTP ──────────────────────────────────────────────────────────
    http_method          VARCHAR(10),
    http_url             TEXT,
    http_useragent       TEXT,

    -- ── Device & Identity ─────────────────────────────────────────────
    data_sourceid        VARCHAR(50),
    data_sourcename      VARCHAR(100),
    data_sourcetype      VARCHAR(50),
    data_sourcevdom      VARCHAR(50),
    data_parsername      VARCHAR(100),
    host_location        VARCHAR(100),
    user_name            VARCHAR(100),
    loguid               VARCHAR(50),
    logflag              TINYINT,
    epid                 INT,
    euid                 INT,
    dstepid              INT,
    dsteuid              INT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Indexes ───────────────────────────────────────────────────────────────────
-- These make dashboard filters fast even on 100k rows.

-- Individual field indexes (for single-field filters)
CREATE INDEX idx_itime           ON fortigate_events (itime);
CREATE INDEX idx_event_type      ON fortigate_events (event_type);
CREATE INDEX idx_event_subtype   ON fortigate_events (event_subtype);
CREATE INDEX idx_event_severity  ON fortigate_events (event_severity);
CREATE INDEX idx_event_action    ON fortigate_events (event_action);
CREATE INDEX idx_src_ip          ON fortigate_events (src_ip);
CREATE INDEX idx_dst_ip          ON fortigate_events (dst_ip);
CREATE INDEX idx_app_name        ON fortigate_events (app_name);
CREATE INDEX idx_app_risk_name   ON fortigate_events (app_risk_name);
CREATE INDEX idx_threat_name     ON fortigate_events (threat_name);
CREATE INDEX idx_threat_severity ON fortigate_events (threat_severity);
CREATE INDEX idx_src_geo_country ON fortigate_events (src_geo_country);
CREATE INDEX idx_dst_geo_country ON fortigate_events (dst_geo_country);
CREATE INDEX idx_net_proto       ON fortigate_events (net_proto);
CREATE INDEX idx_dns_querytype   ON fortigate_events (dns_querytype);

-- Composite indexes (for multi-field filter combinations used by the dashboard)
CREATE INDEX idx_type_severity  ON fortigate_events (event_type, event_severity);
CREATE INDEX idx_type_subtype   ON fortigate_events (event_type, event_subtype);
CREATE INDEX idx_time_severity  ON fortigate_events (itime, event_severity);
CREATE INDEX idx_time_type      ON fortigate_events (itime, event_type);


-- ── Quick sanity check — run after import to confirm row count ────────────────
-- SELECT COUNT(*) FROM fortigate_events;
-- SELECT event_type, event_subtype, COUNT(*) as cnt
--   FROM fortigate_events GROUP BY event_type, event_subtype ORDER BY cnt DESC;
