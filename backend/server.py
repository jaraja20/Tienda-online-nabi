"""
NABI MEN - FastAPI backend
- Admin auth (JWT bearer in Authorization header)
- Products, Categories, Tag Groups, Tags
- Orders with status machine
- File manager (folder tree on disk)
- Settings (manual USD->PYG exchange rate, WhatsApp number, policies)
- Dashboard stats
"""
from dotenv import load_dotenv
load_dotenv()

import os
import re
import io
import uuid
import json
import shutil
import zipfile
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List, Any

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("nabimen")

# ---------------- Config ----------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin")
WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "595986616939")
DEFAULT_USD_RATE = float(os.environ.get("DEFAULT_USD_RATE", "7800"))
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/backend/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ---------------- DB ----------------
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ---------------- App ----------------
app = FastAPI(title="NABI MEN API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files at /api/uploads/<path>
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# ---------------- Helpers ----------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def require_admin(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Acceso denegado")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


def doc(d: dict) -> dict:
    """Serialize Mongo doc: drop _id, ensure id present."""
    if not d:
        return d
    d = dict(d)
    d.pop("_id", None)
    return d


def slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "item"


def safe_join(base: Path, *paths) -> Path:
    """Prevent path traversal."""
    full = (base / Path(*paths)).resolve()
    base = base.resolve()
    if not str(full).startswith(str(base)):
        raise HTTPException(status_code=400, detail="Ruta inválida")
    return full


# ---------------- Models ----------------
class LoginReq(BaseModel):
    username: str
    password: str


class CategoryIn(BaseModel):
    name: str
    icon: Optional[str] = None
    order: int = 0


class TagGroupIn(BaseModel):
    name: str
    display_type: str = "button"  # "button" | "tag"


class TagIn(BaseModel):
    group_id: str
    value: str
    color_hex: Optional[str] = None


class ProductVariant(BaseModel):
    id: Optional[str] = None
    tag_ids: List[str] = []
    photos: List[str] = []  # urls (uploads or external)
    label: Optional[str] = None


class ProductIn(BaseModel):
    name: str
    description: str = ""
    code: Optional[str] = None
    category_id: Optional[str] = None
    brand: Optional[str] = None
    cost_usd: float = 0
    profit_pct: float = 40
    photos: List[str] = []
    tag_ids: List[str] = []
    variants: List[ProductVariant] = []
    featured: bool = False
    active: bool = True


class OrderItem(BaseModel):
    product_id: str
    name: str
    code: Optional[str] = None
    variant_label: Optional[str] = None
    qty: int = 1
    unit_price_pyg: float = 0
    photo: Optional[str] = None


class OrderIn(BaseModel):
    items: List[OrderItem]
    customer_name: str
    customer_phone: Optional[str] = None
    location: str = "Ciudad del Este"
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str
    shipping_cost_pyg: Optional[float] = None
    note: Optional[str] = None


class SettingsIn(BaseModel):
    exchange_rate: Optional[float] = None
    whatsapp_number: Optional[str] = None
    business_name: Optional[str] = None
    policies_text: Optional[str] = None


ORDER_STATES = [
    "en_proceso",
    "pagado_parcialmente",
    "en_envio",
    "arribado",
    "completado",
    "cancelado",
]


# ---------------- Startup: seed ----------------
@app.on_event("startup")
async def startup():
    # Indexes
    await db.products.create_index("category_id")
    await db.products.create_index("active")
    await db.tags.create_index("group_id")

    # Admin user
    existing = await db.users.find_one({"username": ADMIN_USERNAME})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "username": ADMIN_USERNAME,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "created_at": now_iso(),
        })
        log.info("Admin user seeded")
    else:
        # Ensure password matches env (idempotent)
        if not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
            await db.users.update_one(
                {"username": ADMIN_USERNAME},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
            )
            log.info("Admin password updated to match env")

    # Settings
    s = await db.settings.find_one({"id": "app"})
    if s is None:
        await db.settings.insert_one({
            "id": "app",
            "exchange_rate": DEFAULT_USD_RATE,
            "whatsapp_number": WHATSAPP_NUMBER,
            "business_name": "NABI MEN",
            "policies_text": (
                "POLÍTICAS DE COMPRA:\n"
                "• Se requiere el 50% de seña para confirmar el pedido.\n"
                "• Los pedidos tardan entre 2 y 3 semanas en llegar desde el exterior.\n"
                "• Una vez arriba el pedido se calcula el costo extra de flete según peso.\n"
                "• Coordinamos la entrega o envío en Ciudad del Este o resto del país.\n"
                "• El pago final del producto + flete se realiza al recibir el pedido."
            ),
            "updated_at": now_iso(),
        })

    # Seed categories if empty
    if await db.categories.count_documents({}) == 0:
        seed_cats = [
            ("Championes", "Footprints", 1),
            ("Remeras", "Shirt", 2),
            ("Camisas", "Shirt", 3),
            ("Pantalones", "Bot", 4),
            ("Shorts", "Bot", 5),
            ("Relojes", "Watch", 6),
            ("Accesorios", "Sparkles", 7),
        ]
        for n, ic, o in seed_cats:
            await db.categories.insert_one({
                "id": str(uuid.uuid4()),
                "name": n,
                "slug": slugify(n),
                "icon": ic,
                "order": o,
                "created_at": now_iso(),
            })

    # Seed tag groups + tags
    if await db.tag_groups.count_documents({}) == 0:
        size_gid = str(uuid.uuid4())
        color_gid = str(uuid.uuid4())
        style_gid = str(uuid.uuid4())
        await db.tag_groups.insert_many([
            {"id": size_gid, "name": "Talle", "display_type": "button", "order": 1},
            {"id": color_gid, "name": "Color", "display_type": "tag", "order": 2},
            {"id": style_gid, "name": "Estilo", "display_type": "tag", "order": 3},
        ])
        tags_seed = [
            (size_gid, "S", None),
            (size_gid, "M", None),
            (size_gid, "L", None),
            (size_gid, "XL", None),
            (size_gid, "38", None),
            (size_gid, "40", None),
            (size_gid, "42", None),
            (size_gid, "44", None),
            (color_gid, "Negro", "#0A0A0A"),
            (color_gid, "Blanco", "#FFFFFF"),
            (color_gid, "Azul", "#1D4ED8"),
            (color_gid, "Rojo", "#DC2626"),
            (color_gid, "Verde", "#16A34A"),
            (color_gid, "Marrón", "#7C2D12"),
            (style_gid, "Casual", None),
            (style_gid, "Urbano", None),
            (style_gid, "Deportivo", None),
            (style_gid, "Premium", None),
        ]
        for gid, val, hx in tags_seed:
            await db.tags.insert_one({
                "id": str(uuid.uuid4()),
                "group_id": gid,
                "value": val,
                "color_hex": hx,
                "created_at": now_iso(),
            })

    # Seed sample products if empty
    if await db.products.count_documents({}) == 0:
        cats = {c["slug"]: c["id"] async for c in db.categories.find({})}
        samples = [
            {
                "name": "Championes Urban Runner",
                "description": "Championes deportivos estilo urbano, suela amortiguada. Importados desde SHEIN bajo encargo.",
                "code": "NM-CH-001",
                "category_id": cats.get("championes"),
                "brand": "Urban",
                "cost_usd": 28,
                "profit_pct": 45,
                "photos": [
                    "https://images.unsplash.com/photo-1556906781-9a412961c28c?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
                    "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
                ],
                "featured": True,
            },
            {
                "name": "Reloj Cronógrafo Steel",
                "description": "Reloj de acero inoxidable, cronógrafo funcional, resistente al agua 30m.",
                "code": "NM-RL-001",
                "category_id": cats.get("relojes"),
                "brand": "Steel",
                "cost_usd": 22,
                "profit_pct": 50,
                "photos": [
                    "https://images.unsplash.com/photo-1525740664269-1bb17f251737?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
                ],
                "featured": True,
            },
            {
                "name": "Remera Oversize Street",
                "description": "Remera oversize de algodón, gráfica streetwear minimalista.",
                "code": "NM-RM-001",
                "category_id": cats.get("remeras"),
                "brand": "NM Basics",
                "cost_usd": 9,
                "profit_pct": 55,
                "photos": [
                    "https://images.unsplash.com/photo-1571945153237-4929e783af4a?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
                ],
            },
            {
                "name": "Pantalón Cargo Tactical",
                "description": "Pantalón cargo con múltiples bolsillos, corte regular.",
                "code": "NM-PT-001",
                "category_id": cats.get("pantalones"),
                "brand": "Tactical",
                "cost_usd": 18,
                "profit_pct": 45,
                "photos": [
                    "https://images.unsplash.com/photo-1623596305214-19f21cbf48ee?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
                ],
            },
            {
                "name": "Camisa Lino Verano",
                "description": "Camisa de lino fresca para verano, corte slim.",
                "code": "NM-CM-001",
                "category_id": cats.get("camisas"),
                "brand": "Linen",
                "cost_usd": 14,
                "profit_pct": 50,
                "photos": [
                    "https://images.pexels.com/photos/29548609/pexels-photo-29548609.jpeg?auto=compress&cs=tinysrgb&w=900",
                ],
            },
            {
                "name": "Short Deportivo Mesh",
                "description": "Short deportivo de malla, secado rápido.",
                "code": "NM-SH-001",
                "category_id": cats.get("shorts"),
                "brand": "Sport",
                "cost_usd": 11,
                "profit_pct": 50,
                "photos": [
                    "https://images.unsplash.com/photo-1576775068668-c147f14c36f7?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
                ],
            },
            {
                "name": "Cadena Acero Premium",
                "description": "Cadena de acero quirúrgico, no se oxida, diseño cuban link.",
                "code": "NM-AC-001",
                "category_id": cats.get("accesorios"),
                "brand": "Premium",
                "cost_usd": 12,
                "profit_pct": 60,
                "photos": [
                    "https://images.pexels.com/photos/16039231/pexels-photo-16039231.jpeg?auto=compress&cs=tinysrgb&w=900",
                ],
                "featured": True,
            },
        ]
        for p in samples:
            await db.products.insert_one({
                "id": str(uuid.uuid4()),
                "name": p["name"],
                "description": p["description"],
                "code": p["code"],
                "category_id": p.get("category_id"),
                "brand": p.get("brand"),
                "cost_usd": p["cost_usd"],
                "profit_pct": p["profit_pct"],
                "photos": p["photos"],
                "tag_ids": [],
                "variants": [],
                "featured": p.get("featured", False),
                "active": True,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            })


# ---------------- Auth ----------------
@api.post("/auth/login")
async def login(body: LoginReq):
    user = await db.users.find_one({"username": body.username})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = create_token(user["username"])
    return {"token": token, "user": {"username": user["username"], "role": user.get("role", "admin")}}


@api.get("/auth/me")
async def me(user=Depends(require_admin)):
    return {"username": user["sub"], "role": user.get("role", "admin")}


# ---------------- Settings ----------------
@api.get("/settings")
async def get_settings():
    s = await db.settings.find_one({"id": "app"})
    if not s:
        return {}
    return doc(s)


@api.put("/settings")
async def update_settings(body: SettingsIn, user=Depends(require_admin)):
    upd = {k: v for k, v in body.model_dump().items() if v is not None}
    upd["updated_at"] = now_iso()
    await db.settings.update_one({"id": "app"}, {"$set": upd}, upsert=True)
    s = await db.settings.find_one({"id": "app"})
    return doc(s)


# ---------------- Categories ----------------
@api.get("/categories")
async def list_categories():
    cats = await db.categories.find({}).sort("order", 1).to_list(500)
    return [doc(c) for c in cats]


@api.post("/categories")
async def create_category(body: CategoryIn, user=Depends(require_admin)):
    c = {"id": str(uuid.uuid4()), "name": body.name, "slug": slugify(body.name),
         "icon": body.icon, "order": body.order, "created_at": now_iso()}
    await db.categories.insert_one(c)
    return doc(c)


@api.put("/categories/{cat_id}")
async def update_category(cat_id: str, body: CategoryIn, user=Depends(require_admin)):
    upd = body.model_dump()
    upd["slug"] = slugify(body.name)
    await db.categories.update_one({"id": cat_id}, {"$set": upd})
    c = await db.categories.find_one({"id": cat_id})
    if not c:
        raise HTTPException(404, "No encontrado")
    return doc(c)


@api.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, user=Depends(require_admin)):
    await db.categories.delete_one({"id": cat_id})
    return {"ok": True}


# ---------------- Tag Groups & Tags ----------------
@api.get("/tag-groups")
async def list_tag_groups():
    g = await db.tag_groups.find({}).sort("order", 1).to_list(200)
    return [doc(x) for x in g]


@api.post("/tag-groups")
async def create_tag_group(body: TagGroupIn, user=Depends(require_admin)):
    g = {"id": str(uuid.uuid4()), "name": body.name,
         "display_type": body.display_type, "order": 99, "created_at": now_iso()}
    await db.tag_groups.insert_one(g)
    return doc(g)


@api.put("/tag-groups/{gid}")
async def update_tag_group(gid: str, body: TagGroupIn, user=Depends(require_admin)):
    await db.tag_groups.update_one({"id": gid}, {"$set": body.model_dump()})
    g = await db.tag_groups.find_one({"id": gid})
    if not g:
        raise HTTPException(404, "No encontrado")
    return doc(g)


@api.delete("/tag-groups/{gid}")
async def delete_tag_group(gid: str, user=Depends(require_admin)):
    await db.tag_groups.delete_one({"id": gid})
    await db.tags.delete_many({"group_id": gid})
    return {"ok": True}


@api.get("/tags")
async def list_tags():
    t = await db.tags.find({}).to_list(2000)
    return [doc(x) for x in t]


@api.post("/tags")
async def create_tag(body: TagIn, user=Depends(require_admin)):
    t = {"id": str(uuid.uuid4()), "group_id": body.group_id,
         "value": body.value, "color_hex": body.color_hex, "created_at": now_iso()}
    await db.tags.insert_one(t)
    return doc(t)


@api.put("/tags/{tid}")
async def update_tag(tid: str, body: TagIn, user=Depends(require_admin)):
    await db.tags.update_one({"id": tid}, {"$set": body.model_dump()})
    t = await db.tags.find_one({"id": tid})
    if not t:
        raise HTTPException(404, "No encontrado")
    return doc(t)


@api.delete("/tags/{tid}")
async def delete_tag(tid: str, user=Depends(require_admin)):
    await db.tags.delete_one({"id": tid})
    return {"ok": True}


# ---------------- Products ----------------
def compute_price(p: dict, rate: float) -> dict:
    cost_usd = float(p.get("cost_usd", 0))
    pct = float(p.get("profit_pct", 0))
    price_usd = cost_usd * (1 + pct / 100.0)
    price_pyg = round(price_usd * rate / 1000.0) * 1000  # round to nearest 1000 PYG
    p["price_pyg"] = price_pyg
    p["price_usd"] = round(price_usd, 2)
    return p


@api.get("/products")
async def list_products(
    category: Optional[str] = None,
    q: Optional[str] = None,
    sort: Optional[str] = None,  # "price_asc"|"price_desc"|"newest"
    only_active: bool = True,
    admin: bool = False,
    request: Request = None,
):
    settings_doc = await db.settings.find_one({"id": "app"}) or {}
    rate = float(settings_doc.get("exchange_rate", DEFAULT_USD_RATE))

    # If admin=true, require auth and return everything
    if admin:
        auth = request.headers.get("Authorization", "") if request else ""
        if not auth.startswith("Bearer "):
            raise HTTPException(401, "Auth requerido")
        try:
            jwt.decode(auth[7:], JWT_SECRET, algorithms=[JWT_ALG])
        except Exception:
            raise HTTPException(401, "Token inválido")
        only_active = False

    f: dict = {}
    if only_active:
        f["active"] = True
    if category:
        f["category_id"] = category
    if q:
        f["name"] = {"$regex": re.escape(q), "$options": "i"}

    items = await db.products.find(f).to_list(2000)
    items = [doc(it) for it in items]
    for p in items:
        compute_price(p, rate)

    if sort == "price_asc":
        items.sort(key=lambda x: x["price_pyg"])
    elif sort == "price_desc":
        items.sort(key=lambda x: -x["price_pyg"])
    else:
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return {"items": items, "rate": rate}


@api.get("/products/{pid}")
async def get_product(pid: str):
    p = await db.products.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "No encontrado")
    settings_doc = await db.settings.find_one({"id": "app"}) or {}
    rate = float(settings_doc.get("exchange_rate", DEFAULT_USD_RATE))
    p = doc(p)
    compute_price(p, rate)
    return p


@api.post("/products")
async def create_product(body: ProductIn, user=Depends(require_admin)):
    p = body.model_dump()
    p["id"] = str(uuid.uuid4())
    # Assign id to variants
    for v in p.get("variants", []):
        if not v.get("id"):
            v["id"] = str(uuid.uuid4())
    p["created_at"] = now_iso()
    p["updated_at"] = now_iso()
    await db.products.insert_one(p)
    return doc(p)


@api.put("/products/{pid}")
async def update_product(pid: str, body: ProductIn, user=Depends(require_admin)):
    upd = body.model_dump()
    for v in upd.get("variants", []):
        if not v.get("id"):
            v["id"] = str(uuid.uuid4())
    upd["updated_at"] = now_iso()
    await db.products.update_one({"id": pid}, {"$set": upd})
    p = await db.products.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "No encontrado")
    return doc(p)


@api.delete("/products/{pid}")
async def delete_product(pid: str, user=Depends(require_admin)):
    await db.products.delete_one({"id": pid})
    return {"ok": True}


# ---------------- Orders ----------------
@api.get("/orders")
async def list_orders(status: Optional[str] = None, user=Depends(require_admin)):
    f = {}
    if status:
        f["status"] = status
    orders = await db.orders.find(f).sort("created_at", -1).to_list(1000)
    return [doc(o) for o in orders]


@api.post("/orders")
async def create_order(body: OrderIn):
    items_dump = [i.model_dump() for i in body.items]
    total = sum(i["qty"] * i["unit_price_pyg"] for i in items_dump)
    cost_total = 0.0
    profit_total = 0.0
    settings_doc = await db.settings.find_one({"id": "app"}) or {}
    rate = float(settings_doc.get("exchange_rate", DEFAULT_USD_RATE))
    # Compute cost vs profit per item using product data
    for it in items_dump:
        prod = await db.products.find_one({"id": it["product_id"]})
        if prod:
            c_usd = float(prod.get("cost_usd", 0))
            pct = float(prod.get("profit_pct", 0))
            unit_cost_pyg = c_usd * rate
            unit_profit_pyg = c_usd * (pct / 100.0) * rate
            cost_total += unit_cost_pyg * it["qty"]
            profit_total += unit_profit_pyg * it["qty"]

    order = {
        "id": str(uuid.uuid4()),
        "items": items_dump,
        "customer_name": body.customer_name,
        "customer_phone": body.customer_phone,
        "location": body.location,
        "notes": body.notes,
        "total_pyg": total,
        "shipping_cost_pyg": 0,
        "cost_pyg_snapshot": round(cost_total),
        "profit_pyg_snapshot": round(profit_total),
        "exchange_rate_snapshot": rate,
        "status": "en_proceso",
        "status_history": [{"status": "en_proceso", "at": now_iso(), "note": "Pedido creado"}],
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.orders.insert_one(order)
    return doc(order)


@api.put("/orders/{oid}")
async def update_order_status(oid: str, body: OrderStatusUpdate, user=Depends(require_admin)):
    if body.status not in ORDER_STATES:
        raise HTTPException(400, f"Estado inválido. Permitidos: {ORDER_STATES}")
    order = await db.orders.find_one({"id": oid})
    if not order:
        raise HTTPException(404, "Pedido no encontrado")
    upd = {"status": body.status, "updated_at": now_iso()}
    if body.shipping_cost_pyg is not None:
        upd["shipping_cost_pyg"] = body.shipping_cost_pyg
        upd["total_pyg"] = order["total_pyg"] + body.shipping_cost_pyg - order.get("shipping_cost_pyg", 0)
    history = order.get("status_history", [])
    history.append({"status": body.status, "at": now_iso(), "note": body.note})
    upd["status_history"] = history
    await db.orders.update_one({"id": oid}, {"$set": upd})
    o = await db.orders.find_one({"id": oid})
    return doc(o)


@api.delete("/orders/{oid}")
async def delete_order(oid: str, user=Depends(require_admin)):
    await db.orders.delete_one({"id": oid})
    return {"ok": True}


# ---------------- Files Manager ----------------
def list_dir(rel_path: str) -> List[dict]:
    target = safe_join(UPLOAD_DIR, rel_path.lstrip("/"))
    if not target.exists():
        return []
    items = []
    for entry in sorted(target.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
        rel = entry.relative_to(UPLOAD_DIR).as_posix()
        items.append({
            "name": entry.name,
            "path": "/" + rel,
            "type": "folder" if entry.is_dir() else "file",
            "size": entry.stat().st_size if entry.is_file() else 0,
            "modified": datetime.fromtimestamp(entry.stat().st_mtime, tz=timezone.utc).isoformat(),
            "url": (f"/api/uploads/{rel}" if entry.is_file() else None),
        })
    return items


@api.get("/files/list")
async def files_list(path: str = "/", user=Depends(require_admin)):
    return {"path": path if path.startswith("/") else "/" + path, "items": list_dir(path)}


@api.post("/files/mkdir")
async def files_mkdir(path: str = Form(...), name: str = Form(...), user=Depends(require_admin)):
    target = safe_join(UPLOAD_DIR, path.lstrip("/"), name)
    if target.exists():
        raise HTTPException(400, "La carpeta ya existe")
    target.mkdir(parents=True, exist_ok=False)
    return {"ok": True}


@api.post("/files/upload")
async def files_upload(
    files: List[UploadFile] = File(...),
    path: str = Form("/"),
    user=Depends(require_admin),
):
    folder = safe_join(UPLOAD_DIR, path.lstrip("/"))
    folder.mkdir(parents=True, exist_ok=True)
    saved = []
    for f in files:
        # Preserve "webkitRelativePath"-like structure if filename contains "/"
        fname = f.filename or "file"
        # Some browsers include relative paths via name like "folder/sub/file.png"
        dest = safe_join(folder, fname)
        dest.parent.mkdir(parents=True, exist_ok=True)
        content = await f.read()
        # If it's a zip, extract it
        if fname.lower().endswith(".zip"):
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as z:
                    for name in z.namelist():
                        if name.endswith("/"):
                            (folder / name).mkdir(parents=True, exist_ok=True)
                            continue
                        out = safe_join(folder, name)
                        out.parent.mkdir(parents=True, exist_ok=True)
                        with open(out, "wb") as fp:
                            fp.write(z.read(name))
                saved.append({"name": fname, "extracted": True})
                continue
            except zipfile.BadZipFile:
                pass
        with open(dest, "wb") as fp:
            fp.write(content)
        rel = dest.relative_to(UPLOAD_DIR).as_posix()
        saved.append({"name": fname, "url": f"/api/uploads/{rel}"})
    return {"saved": saved}


@api.delete("/files/delete")
async def files_delete(path: str = Query(...), user=Depends(require_admin)):
    target = safe_join(UPLOAD_DIR, path.lstrip("/"))
    if not target.exists():
        raise HTTPException(404, "No existe")
    if target == UPLOAD_DIR:
        raise HTTPException(400, "No se puede borrar la raíz")
    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()
    return {"ok": True}


@api.post("/files/rename")
async def files_rename(old_path: str = Form(...), new_name: str = Form(...), user=Depends(require_admin)):
    src = safe_join(UPLOAD_DIR, old_path.lstrip("/"))
    dst = src.parent / new_name
    src.rename(dst)
    rel = dst.relative_to(UPLOAD_DIR).as_posix()
    return {"ok": True, "path": "/" + rel}


# ---------------- Dashboard ----------------
@api.get("/dashboard/stats")
async def dashboard_stats(user=Depends(require_admin)):
    orders = await db.orders.find({}).to_list(5000)
    completed = [o for o in orders if o.get("status") == "completado"]
    en_proceso = [o for o in orders if o.get("status") == "en_proceso"]
    en_envio = [o for o in orders if o.get("status") in ("pagado_parcialmente", "en_envio", "arribado")]
    cancelados = [o for o in orders if o.get("status") == "cancelado"]

    revenue = sum(o.get("total_pyg", 0) for o in completed)
    cost = sum(o.get("cost_pyg_snapshot", 0) for o in completed)
    profit = sum(o.get("profit_pyg_snapshot", 0) for o in completed)
    shipping = sum(o.get("shipping_cost_pyg", 0) for o in completed)

    # By month chart
    by_month: dict = {}
    for o in completed:
        ts = o.get("created_at", "")[:7]
        if not ts:
            continue
        agg = by_month.setdefault(ts, {"month": ts, "revenue": 0, "cost": 0, "profit": 0})
        agg["revenue"] += o.get("total_pyg", 0)
        agg["cost"] += o.get("cost_pyg_snapshot", 0)
        agg["profit"] += o.get("profit_pyg_snapshot", 0)
    months = sorted(by_month.values(), key=lambda x: x["month"])

    products_count = await db.products.count_documents({})
    active_products = await db.products.count_documents({"active": True})

    return {
        "orders": {
            "total": len(orders),
            "en_proceso": len(en_proceso),
            "en_envio": len(en_envio),
            "completados": len(completed),
            "cancelados": len(cancelados),
        },
        "money": {
            "revenue": revenue,
            "cost": cost,
            "profit": profit,
            "shipping": shipping,
        },
        "products": {
            "total": products_count,
            "active": active_products,
        },
        "chart_months": months,
    }


# ---------------- Health ----------------
@api.get("/health")
async def health():
    return {"ok": True, "service": "nabimen-api", "time": now_iso()}


app.include_router(api)
