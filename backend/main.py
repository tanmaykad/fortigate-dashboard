from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import summary, traffic, threats, dns, geo

app = FastAPI(
    title="FortiGate Analytics Dashboard API",
    description="REST API for FortiGate log analytics dashboard",
    version="1.0.0",
)

# Allow React dev server (Vite runs on 5173, CRA on 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://educators-amy-request-beaver.trycloudflare.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(summary.router,  prefix="/api/summary",  tags=["Summary"])
app.include_router(traffic.router,  prefix="/api/traffic",  tags=["Traffic"])
app.include_router(threats.router,  prefix="/api/threats",  tags=["Threats"])
app.include_router(dns.router,      prefix="/api/dns",      tags=["DNS"])
app.include_router(geo.router,      prefix="/api/geo",      tags=["Geographic"])


@app.get("/")
def root():
    return {"status": "ok", "message": "FortiGate Dashboard API is running"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
