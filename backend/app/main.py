from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import health, investigations, cases, graph, entities

app = FastAPI(title="TRACE Backend API", version="1.0.0")

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(investigations.router, prefix="/api", tags=["Investigations"])
app.include_router(cases.router, prefix="/api", tags=["Cases"])
app.include_router(graph.router, prefix="/api", tags=["Graph"])
app.include_router(entities.router, prefix="/api", tags=["Entities"])

@app.get("/")
def root():
    return {"message": "TRACE Backend is running. Access /docs for API documentation."}
