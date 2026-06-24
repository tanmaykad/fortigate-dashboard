"""
FortiGate Log Import Script
============================
Reads the FortiGate Excel export (sparse key="value" format),
cleans and transforms the data, then bulk-inserts into MySQL.

Usage:
    1. Set EXCEL_PATH and DB_CONFIG below
    2. Run:  python import_data.py
"""

import pandas as pd
import mysql.connector
import re
import json
from datetime import datetime
from tqdm import tqdm


# ── CONFIG — edit these before running ─────────────────────────────────────────

EXCEL_PATH = r"C:\Users\tanma\OneDrive\Desktop\fortigate-dashboard\scripts\Practice Sheet.xlsx"   # ← change this

DB_CONFIG = {
    "host":     "localhost",
    "user":     "root",
    "password": "root",   # ← change this
    "database": "fortigate_db",
}

BATCH_SIZE = 500   # rows sent to MySQL per round-trip
# ───────────────────────────────────────────────────────────────────────────────


# ── Field map: raw key name → MySQL column name ────────────────────────────────
# Keys with dots (app_risk.name, net_sdwan.vwlid) are renamed to underscores.
FIELD_MAP = {
    "itime":               "itime",
    "data_timestamp":      "data_timestamp",
    "event_creation_time": "event_creation_time",
    "event_type":          "event_type",
    "event_subtype":       "event_subtype",
    "event_action":        "event_action",
    "event_severity":      "event_severity",
    "event_id":            "event_id",
    "event_uuid":          "event_uuid",
    "event_policy":        "event_policy",
    "event_policyid":      "event_policyid",
    "event_policytype":    "event_policytype",
    "event_cat":           "event_cat",
    "event_message":       "event_message",
    "event_outcome":       "event_outcome",
    "event_ref":           "event_ref",
    "net_proto":           "net_proto",
    "net_sentbytes":       "net_sentbytes",
    "net_recvbytes":       "net_recvbytes",
    "net_sentpkts":        "net_sentpkts",
    "net_rcvdpkts":        "net_rcvdpkts",
    "net_sessionduration": "net_sessionduration",
    "net_sessionid":       "net_sessionid",
    "net_direction":       "net_direction",
    "net_sentdelta":       "net_sentdelta",
    "net_recvdelta":       "net_recvdelta",
    "net_sdwan":           "net_sdwan",
    "net_sdwan.vwlid":     "net_sdwan_vwlid",
    "src_ip":              "src_ip",
    "src_port":            "src_port",
    "src_geo":             "src_geo",
    "src_geo_city":        "src_geo_city",
    "src_geo_country":     "src_geo_country",
    "src_intf":            "src_intf",
    "src_intf_role":       "src_intf_role",
    "src_natip":           "src_natip",
    "src_natport":         "src_natport",
    "dst_ip":              "dst_ip",
    "dst_port":            "dst_port",
    "dst_geo":             "dst_geo",
    "dst_geo_city":        "dst_geo_city",
    "dst_geo_country":     "dst_geo_country",
    "dst_intf":            "dst_intf",
    "dst_intf_role":       "dst_intf_role",
    "dst_mac":             "dst_mac",
    "app_name":            "app_name",
    "app_cat":             "app_cat",
    "app_id":              "app_id",
    "app_service":         "app_service",
    "app_risk.name":       "app_risk_name",
    "threat_name":         "threat_name",
    "threat_type":         "threat_type",
    "threat_severity":     "threat_severity",
    "threat_action":       "threat_action",
    "threat_score":        "threat_score",
    "threat_count":        "threat_count",
    "threat_direction":    "threat_direction",
    "threat_pattern":      "threat_pattern",
    "dns_query":           "dns_query",
    "dns_querytype":       "dns_querytype",
    "dns_response":        "dns_response",
    "http_method":         "http_method",
    "http_url":            "http_url",
    "http_useragent":      "http_useragent",
    "data_sourceid":       "data_sourceid",
    "data_sourcename":     "data_sourcename",
    "data_sourcetype":     "data_sourcetype",
    "data_sourcevdom":     "data_sourcevdom",
    "data_parsername":     "data_parsername",
    "host_location":       "host_location",
    "user_name":           "user_name",
    "loguid":              "loguid",
    "logflag":             "logflag",
    "epid":                "epid",
    "euid":                "euid",
    "dstepid":             "dstepid",
    "dsteuid":             "dsteuid",
}

# Unix epoch integers → convert to DATETIME
EPOCH_FIELDS = {"itime", "data_timestamp", "event_creation_time"}

# DB columns that must be stored as integers
INT_FIELDS = {
    "net_proto", "net_sentbytes", "net_recvbytes", "net_sentpkts",
    "net_rcvdpkts", "net_sessionduration", "net_sessionid",
    "net_sentdelta", "net_recvdelta", "net_sdwan_vwlid",
    "src_port", "src_natport", "dst_port", "app_id",
    "threat_score", "threat_count", "logflag",
    "epid", "euid", "dstepid", "dsteuid", "event_policyid",
}

# Sorted column list — keeps INSERT column order consistent
ALL_COLUMNS = sorted(set(FIELD_MAP.values()))


# ── Helper functions ────────────────────────────────────────────────────────────

def parse_cell(raw):
    """
    Parse one cell like  src_ip="114.143.6.90"
    Returns (key, value) tuple or None if the cell isn't a valid key=value pair.
    """
    if pd.isna(raw):
        return None
    s = str(raw).strip()
    m = re.match(r'^([a-zA-Z_][a-zA-Z0-9_.]*)\s*=\s*"?(.*?)"?\s*$', s)
    if not m:
        return None
    return m.group(1), m.group(2).strip('"')


def epoch_to_dt(value):
    """Convert a Unix timestamp (int or float string) to a MySQL DATETIME string."""
    try:
        return datetime.utcfromtimestamp(float(value)).strftime("%Y-%m-%d %H:%M:%S")
    except (ValueError, OSError, OverflowError, TypeError):
        return None


def clean_dns_querytype(value):
    """
    DNS quirk: querytype arrives as  A=1  or  PTR=12  or  AAAA=28
    We only want the record type name, not the numeric ID.
    """
    return value.split("=")[0].strip() if "=" in value else value.strip()


def parse_row(row):
    """
    Convert one Excel row (a Series of key="value" cells)
    into a clean dict ready for MySQL insertion.
    """
    record = {}

    for raw in row:
        parsed = parse_cell(raw)
        if parsed is None:
            continue
        key, value = parsed

        # ── Special case: app_risk JSON blob ──────────────────────────────────
        # Some rows store  app_risk={"name":"elevated"}  as a JSON blob.
        # We pull the name out and save it under app_risk_name.
        if key == "app_risk":
            try:
                blob = json.loads(value)
                if isinstance(blob, dict) and "name" in blob:
                    record.setdefault("app_risk_name", blob["name"])
            except (json.JSONDecodeError, TypeError):
                pass
            continue

        if key not in FIELD_MAP:
            continue   # unknown field — ignore

        if not value:
            continue   # blank value — skip

        db_col = FIELD_MAP[key]

        # ── Timestamp conversion ──────────────────────────────────────────────
        if key in EPOCH_FIELDS:
            value = epoch_to_dt(value)

        # ── DNS querytype quirk ───────────────────────────────────────────────
        elif key == "dns_querytype":
            value = clean_dns_querytype(value)

        # ── Integer casting ───────────────────────────────────────────────────
        elif db_col in INT_FIELDS:
            try:
                value = int(float(value))
            except (ValueError, TypeError):
                value = None

        if value is not None:
            record[db_col] = value

    return record


def build_insert_sql():
    """Build a parameterised INSERT statement covering every column."""
    cols   = ", ".join(f"`{c}`" for c in ALL_COLUMNS)
    params = ", ".join(["%s"] * len(ALL_COLUMNS))
    return f"INSERT INTO fortigate_events ({cols}) VALUES ({params})"


# ── Main import function ────────────────────────────────────────────────────────

def import_data():
    print("=" * 60)
    print("  FortiGate Log Import Script")
    print("=" * 60)

    # Step 1 — Connect to MySQL
    print("\n[1/4] Connecting to MySQL...")
    try:
        conn   = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("      Connected ✓")
    except mysql.connector.Error as e:
        print(f"      ✗ Connection failed: {e}")
        print("      → Check your DB_CONFIG settings and make sure MySQL is running.")
        return

    # Step 2 — Read the Excel file
    print(f"\n[2/4] Reading Excel file...")
    print(f"      Path : {EXCEL_PATH}")
    print("      Please wait — reading 100k rows takes 1–3 minutes...")
    try:
        df = pd.read_excel(EXCEL_PATH, header=None, dtype=str, engine="openpyxl")
        print(f"      Loaded {len(df):,} rows × {len(df.columns)} columns ✓")
    except FileNotFoundError:
        print("      ✗ File not found.")
        print("      → Update EXCEL_PATH at the top of this script.")
        return
    except Exception as e:
        print(f"      ✗ Error reading file: {e}")
        return

    # Step 3 — Parse every row into a clean dict
    print(f"\n[3/4] Parsing rows...")
    records = []
    skipped = 0
    for _, row in df.iterrows():
        rec = parse_row(row)
        if rec:
            records.append(rec)
        else:
            skipped += 1
    print(f"      Parsed  {len(records):,} valid rows")
    print(f"      Skipped {skipped:,} fully empty rows")

    # Step 4 — Bulk insert into MySQL
    print(f"\n[4/4] Inserting into MySQL (batch size = {BATCH_SIZE})...")
    sql      = build_insert_sql()
    inserted = 0
    errors   = 0

    for i in tqdm(range(0, len(records), BATCH_SIZE), desc="      Inserting"):
        batch_dicts = records[i : i + BATCH_SIZE]
        batch_rows  = [
            tuple(rec.get(col) for col in ALL_COLUMNS)
            for rec in batch_dicts
        ]
        try:
            cursor.executemany(sql, batch_rows)
            conn.commit()
            inserted += len(batch_rows)
        except mysql.connector.Error as e:
            errors += len(batch_rows)
            print(f"\n      ✗ Batch error at row {i}: {e}")

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print(f"  ✅  Done!")
    print(f"      Rows inserted : {inserted:,}")
    print(f"      Rows with error: {errors:,}")
    print("=" * 60)
    print("\n  Run this in MySQL Workbench to verify:")
    print("  SELECT COUNT(*) FROM fortigate_events;")


if __name__ == "__main__":
    import_data()
