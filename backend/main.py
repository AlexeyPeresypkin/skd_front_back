import asyncio
import decimal
import os
from datetime import date, datetime, time

import pymssql
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, Response, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware


def default(obj):
    if isinstance(obj, decimal.Decimal):
        return str(obj)
    elif isinstance(obj, bytes):
        return obj.decode("utf-8")
    if isinstance(obj, (datetime, date, time)):
        return obj.isoformat()
    if isinstance(obj, (str, int, float, type(None))):
        return obj
    raise TypeError


app = FastAPI()
origins = ["*"]
# app.add_middleware(HTTPSRedirectMiddleware)
app.add_middleware(CORSMiddleware,
                   allow_origins=origins,
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"])

sql_username = os.environ.get('POSTGRES_USER')
sql_password = os.environ.get('POSTGRES_PASSWORD')
sql_host = os.environ.get('POSTGRES_HOST')
sql_db = os.environ.get('POSTGRES_DB')
conn = pymssql.connect(sql_host, sql_username, sql_password, sql_db, charset='cp1251', as_dict=True)

stageid = -1
init = dict()


class CheckBarcode(BaseModel):
    actionid1: int | None = 0
    actionid2: int | None = 0
    actionid3: int | None = 0
    actionid4: int | None = 0
    actionid5: int | None = 0
    barcode: str
    deviceid: int
    ischecktickettype: bool = False
    ischeckenterrelease: bool = False
    stageid: int | None = None


class Settings(BaseModel):
    settings: str
    deviceid: int


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


@app.get("/")
async def root():
    return {"message": "Система контроля доступа Profticket."}


@app.get("/getrepertoire")
async def get_repertoire(st: int | None = None):
    global stageid, init
    if st:
        stageid = st
    if conn:
        with conn.cursor() as cursor:
            try:
                cursor.execute("exec psRepertoireOnDate;")
                records = cursor.fetchall()
                return jsonable_encoder(records)
            except:
                HTTPException(status_code=500, detail='Ошибка во время выполнения запроса.')
    else:
        HTTPException(status_code=500, detail='Подключение к базе данных отсутствует.')


@app.get("/settings")
async def get_settings(deviceid: int | None = None):
    if conn:
        with conn.cursor() as cursor:
            if deviceid is None:
                try:
                    cursor.execute("insert into skud_settings(settings) values('');"
                                   "SELECT max(id) as deviceid, '' as settings FROM skud_settings ss; ")
                    records = cursor.fetchone()
                    conn.commit()
                    response = JSONResponse(records)
                    return response
                except:
                    HTTPException(status_code=500, detail='Ошибка во время выполнения запроса.')
            else:
                try:
                    cursor.execute('if exists(select id from skud_settings where id=' + str(
                        deviceid) + ') select 1 as res else select 2 as res;')
                    if cursor.fetchone()["res"] == 2:
                        cursor.execute("insert into skud_settings(settings) values('');"
                                       "SELECT max(id) as deviceid, '' as settings FROM skud_settings ss; ")
                        records = cursor.fetchone()
                        conn.commit()
                        response = JSONResponse(records)
                        return response
                    else:
                        cursor.execute('select id as deviceid, settings from skud_settings where id=' + str(deviceid))
                        records = cursor.fetchone()
                        response = JSONResponse(records)
                        return response
                except:
                    HTTPException(status_code=500, detail='Ошибка во время выполнения запроса.')
    else:
        HTTPException(status_code=500, detail='Подключение к базе данных отсутствует.')


@app.post("/settings")
async def set_settings(st: Settings):
    if conn:
        with conn.cursor() as cursor:
            try:
                cursor.execute(
                    "update skud_settings set settings = '" + st.settings + "' where id = " + str(st.deviceid) + ";")
                conn.commit()
                return Response(status_code=200)
            except:
                HTTPException(status_code=500, detail='Ошибка во время выполнения запроса.')
    else:
        HTTPException(status_code=500, detail='Подключение к базе данных отсутствует.')


@app.get("/stages")
async def get_stages(deviceid: int | None = None):
    if conn:
        with conn.cursor() as cursor:
            try:
                cursor.execute("select * from stages;")
                records = cursor.fetchall()
                return jsonable_encoder(records)
            except:
                HTTPException(status_code=500, detail='Ошибка во время выполнения запроса.')
    else:
        HTTPException(status_code=500, detail='Подключение к базе данных отсутствует.')


@app.post("/barcode")
def get_barcode_data(cb: CheckBarcode):
    print(cb)
    if cb.ischecktickettype:
        ischecktickettype = 1
    else:
        ischecktickettype = 0
    if cb.ischeckenterrelease:
        ischeckenterrelease = 1
    else:
        ischeckenterrelease = 0
    if conn:
        try:
            if cb.stageid:
                sqlstr = "exec psTicketCheckWeb '" + cb.barcode + "','" + cb.barcode.lstrip('0') + "'," + str(
                    cb.deviceid) + "," + str(cb.actionid1) + "," + str(cb.actionid2) + "," + str(
                    cb.actionid3) + "," + str(
                    cb.actionid4) + "," + str(cb.actionid5) + "," + str(ischecktickettype) + "," \
                         + str(ischeckenterrelease) + ", " + str(cb.stageid)
            else:
                sqlstr = "exec psTicketCheckWeb '" + cb.barcode + "','" + cb.barcode.lstrip('0') + "'," + str(
                    cb.deviceid) + "," + str(cb.actionid1) + "," + str(cb.actionid2) + "," + str(
                    cb.actionid3) + "," + str(
                    cb.actionid4) + "," + str(cb.actionid5) + "," + str(ischecktickettype) + "," \
                         + str(ischeckenterrelease)
            with conn.cursor() as cursor:
                cursor.execute(sqlstr)
                a = cursor.fetchone()
                conn.commit()
                return JSONResponse(jsonable_encoder(a))
        except Exception as e:
            print(e)
            HTTPException(status_code=500, detail='Ошибка во время выполнения запроса.')


@app.websocket("/repertoire")
async def getreperoire(websocket: WebSocket):
    repertoire_old = dict()
    await manager.connect(websocket)
    a = await websocket.receive_json()
    if a["action"] == 'init':
        try:
            while True:
                connws = pymssql.connect(sql_host, sql_username, sql_password, sql_db, charset='cp1251', as_dict=True)
                try:
                    if connws:
                        with connws.cursor() as cursor:
                            cursor.execute("exec psRepertoireOnDate;")
                            records = cursor.fetchall()
                            if repertoire_old != records:
                                await websocket.send_json(jsonable_encoder(records))
                                repertoire_old = records
                except Exception as e:
                    print(e)
                connws.close()
                await asyncio.sleep(20)
        except WebSocketDisconnect:
            manager.disconnect(websocket)


if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8443)
