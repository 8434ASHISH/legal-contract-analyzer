# Main FastAPI server

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Legal Contract Analyzer Backend Running"}
