from fastapi import FastAPI

app = FastAPI(
    title="NetworkIQ Backend",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "NetworkIQ Backend Running"
    }

@app.get("/health")
def health():
    return {
        "status": "ok"
    }