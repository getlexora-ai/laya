# laya-serve plus a playground page at /. Same origin, so the page can call the API
# (laya-serve sends no CORS headers).
import os

import uvicorn
from fastapi.responses import FileResponse
from laya.serve import create_app

HERE = os.path.dirname(__file__)
app = create_app()


@app.get("/", include_in_schema=False)
def page():
    return FileResponse(os.path.join(HERE, "index.html"))


@app.get("/cases.json", include_in_schema=False)
def cases():
    return FileResponse(os.path.join(HERE, "cases.json"))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
