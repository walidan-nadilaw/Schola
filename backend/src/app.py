from fastapi import FastAPI

app = FastAPI(
    title="Schola API",
    description="API documentation for Schola",
    version="1.0.0",
)


@app.get("/")
async def root():
    return {"message": "Welcome to the Schola API"}
