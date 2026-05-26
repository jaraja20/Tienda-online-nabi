"""NABI MEN backend integration tests."""
import os
import io
import time
import uuid
import zipfile
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://design-sandbox-11.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_USER = "admin"
ADMIN_PASS = "Eljaraja20%"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and data["user"]["username"] == ADMIN_USER
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# --- Health ---
def test_health():
    r = requests.get(f"{API}/health", timeout=10)
    assert r.status_code == 200
    assert r.json().get("ok") is True


# --- Auth ---
def test_login_bad_credentials():
    r = requests.post(f"{API}/auth/login", json={"username": "admin", "password": "wrong"}, timeout=10)
    assert r.status_code == 401


def test_auth_me(auth_headers):
    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data["username"] == ADMIN_USER and data["role"] == "admin"


def test_auth_me_no_token():
    r = requests.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401


# --- Categories ---
def test_categories_seeded():
    r = requests.get(f"{API}/categories", timeout=10)
    assert r.status_code == 200
    cats = r.json()
    names = {c["name"] for c in cats}
    # 7 seeded categories
    assert {"Championes", "Remeras", "Camisas", "Pantalones", "Shorts", "Relojes", "Accesorios"}.issubset(names)


# --- Tags ---
def test_tag_groups_and_tags():
    r = requests.get(f"{API}/tag-groups", timeout=10)
    assert r.status_code == 200
    groups = r.json()
    assert len(groups) >= 3
    gnames = {g["name"] for g in groups}
    assert {"Talle", "Color", "Estilo"}.issubset(gnames)

    rt = requests.get(f"{API}/tags", timeout=10)
    assert rt.status_code == 200
    tags = rt.json()
    assert len(tags) >= 18


# --- Products ---
def test_products_sort_and_calc():
    r = requests.get(f"{API}/products?sort=price_asc", timeout=10)
    assert r.status_code == 200
    data = r.json()
    items = data["items"]
    assert len(items) >= 1
    prices = [it["price_pyg"] for it in items]
    assert prices == sorted(prices)
    # Validate formula: cost_usd * (1+profit_pct/100) * rate rounded to nearest 1000
    rate = data["rate"]
    for it in items:
        expected = round(it["cost_usd"] * (1 + it["profit_pct"] / 100.0) * rate / 1000.0) * 1000
        assert it["price_pyg"] == expected, f"Price mismatch on {it['name']}: {it['price_pyg']} vs {expected}"


def test_products_filter_by_category():
    cats = requests.get(f"{API}/categories", timeout=10).json()
    champ = next(c for c in cats if c["slug"] == "championes")
    r = requests.get(f"{API}/products?category={champ['id']}", timeout=10)
    assert r.status_code == 200
    items = r.json()["items"]
    for it in items:
        assert it["category_id"] == champ["id"]


# --- Settings ---
def test_settings_defaults():
    r = requests.get(f"{API}/settings", timeout=10)
    assert r.status_code == 200
    s = r.json()
    assert s["whatsapp_number"] == "595986616939"
    assert s["business_name"] == "NABI MEN"
    assert "policies_text" in s
    assert s["exchange_rate"] >= 1


def test_settings_update_reflects_in_products(auth_headers):
    orig = requests.get(f"{API}/settings", timeout=10).json()
    new_rate = 8000.0 if orig["exchange_rate"] != 8000.0 else 7800.0
    r = requests.put(f"{API}/settings", json={"exchange_rate": new_rate}, headers=auth_headers, timeout=10)
    assert r.status_code == 200
    assert r.json()["exchange_rate"] == new_rate

    rp = requests.get(f"{API}/products?sort=price_asc", timeout=10)
    assert rp.status_code == 200
    assert rp.json()["rate"] == new_rate

    # Restore
    requests.put(f"{API}/settings", json={"exchange_rate": orig["exchange_rate"]}, headers=auth_headers, timeout=10)


def test_settings_update_requires_auth():
    r = requests.put(f"{API}/settings", json={"exchange_rate": 9000}, timeout=10)
    assert r.status_code == 401


# --- Product CRUD ---
@pytest.fixture(scope="module")
def created_product(auth_headers):
    payload = {
        "name": f"TEST_Producto_{uuid.uuid4().hex[:6]}",
        "description": "test",
        "code": "TEST-001",
        "cost_usd": 10,
        "profit_pct": 50,
        "photos": [],
        "tag_ids": [],
        "variants": [],
        "featured": False,
        "active": True,
    }
    r = requests.post(f"{API}/products", json=payload, headers=auth_headers, timeout=10)
    assert r.status_code == 200, r.text
    p = r.json()
    assert p["name"] == payload["name"] and "id" in p
    yield p
    requests.delete(f"{API}/products/{p['id']}", headers=auth_headers, timeout=10)


def test_product_appears_in_list(created_product):
    r = requests.get(f"{API}/products", timeout=10)
    ids = [x["id"] for x in r.json()["items"]]
    assert created_product["id"] in ids


def test_product_update_and_delete(auth_headers):
    payload = {"name": "TEST_X", "description": "", "cost_usd": 5, "profit_pct": 20,
               "photos": [], "tag_ids": [], "variants": [], "active": True, "featured": False}
    r = requests.post(f"{API}/products", json=payload, headers=auth_headers, timeout=10).json()
    pid = r["id"]
    payload["name"] = "TEST_X_updated"
    payload["cost_usd"] = 20
    ru = requests.put(f"{API}/products/{pid}", json=payload, headers=auth_headers, timeout=10)
    assert ru.status_code == 200
    assert ru.json()["name"] == "TEST_X_updated"
    g = requests.get(f"{API}/products/{pid}", timeout=10).json()
    assert g["cost_usd"] == 20
    rd = requests.delete(f"{API}/products/{pid}", headers=auth_headers, timeout=10)
    assert rd.status_code == 200
    g404 = requests.get(f"{API}/products/{pid}", timeout=10)
    assert g404.status_code == 404


def test_products_admin_unauth():
    r = requests.post(f"{API}/products", json={"name": "x"}, timeout=10)
    assert r.status_code in (401, 422)  # may 422 since required fields
    r2 = requests.post(f"{API}/products", json={"name": "x", "cost_usd": 1, "profit_pct": 10,
                                                "description": "", "photos": [], "tag_ids": [],
                                                "variants": [], "active": True, "featured": False}, timeout=10)
    assert r2.status_code == 401


# --- Categories CRUD ---
def test_category_create_and_delete(auth_headers):
    name = f"TEST_Cat_{uuid.uuid4().hex[:6]}"
    r = requests.post(f"{API}/categories", json={"name": name, "icon": "Box", "order": 99},
                      headers=auth_headers, timeout=10)
    assert r.status_code == 200
    cid = r.json()["id"]
    cats = requests.get(f"{API}/categories", timeout=10).json()
    assert any(c["id"] == cid for c in cats)
    requests.delete(f"{API}/categories/{cid}", headers=auth_headers, timeout=10)


# --- Tag groups + tags ---
def test_tag_group_and_tag_create(auth_headers):
    gr = requests.post(f"{API}/tag-groups", json={"name": f"TEST_G_{uuid.uuid4().hex[:4]}", "display_type": "tag"},
                       headers=auth_headers, timeout=10)
    assert gr.status_code == 200
    gid = gr.json()["id"]
    tr = requests.post(f"{API}/tags", json={"group_id": gid, "value": "TEST_val", "color_hex": "#123456"},
                       headers=auth_headers, timeout=10)
    assert tr.status_code == 200
    assert tr.json()["group_id"] == gid
    requests.delete(f"{API}/tag-groups/{gid}", headers=auth_headers, timeout=10)


# --- Orders ---
@pytest.fixture(scope="module")
def created_order():
    # Get a real product
    products = requests.get(f"{API}/products", timeout=10).json()["items"]
    assert products
    p = products[0]
    payload = {
        "items": [{"product_id": p["id"], "name": p["name"], "qty": 2, "unit_price_pyg": p["price_pyg"],
                   "code": p.get("code"), "photo": None, "variant_label": None}],
        "customer_name": "TEST_Cliente",
        "customer_phone": "0986111111",
        "location": "Ciudad del Este",
        "notes": "test",
    }
    r = requests.post(f"{API}/orders", json=payload, timeout=10)
    assert r.status_code == 200, r.text
    order = r.json()
    assert order["status"] == "en_proceso"
    assert order["total_pyg"] == 2 * p["price_pyg"]
    assert order["cost_pyg_snapshot"] > 0
    assert order["profit_pyg_snapshot"] > 0
    assert len(order["status_history"]) == 1
    yield order, p


def test_orders_list_requires_auth():
    r = requests.get(f"{API}/orders", timeout=10)
    assert r.status_code == 401


def test_orders_list(auth_headers, created_order):
    r = requests.get(f"{API}/orders", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    ids = [o["id"] for o in r.json()]
    assert created_order[0]["id"] in ids


def test_order_status_update(auth_headers, created_order):
    oid = created_order[0]["id"]
    r = requests.put(f"{API}/orders/{oid}", json={"status": "pagado_parcialmente", "note": "seña"},
                     headers=auth_headers, timeout=10)
    assert r.status_code == 200
    assert r.json()["status"] == "pagado_parcialmente"
    assert len(r.json()["status_history"]) >= 2


def test_order_arribado_with_shipping(auth_headers, created_order):
    order, p = created_order
    oid = order["id"]
    r = requests.put(f"{API}/orders/{oid}", json={"status": "arribado", "shipping_cost_pyg": 50000},
                     headers=auth_headers, timeout=10)
    assert r.status_code == 200
    o = r.json()
    assert o["status"] == "arribado"
    assert o["shipping_cost_pyg"] == 50000
    # total should be original 2*price + 50000
    assert o["total_pyg"] == 2 * p["price_pyg"] + 50000


def test_order_invalid_status(auth_headers, created_order):
    oid = created_order[0]["id"]
    r = requests.put(f"{API}/orders/{oid}", json={"status": "no_existe"}, headers=auth_headers, timeout=10)
    assert r.status_code == 400


def test_order_delete(auth_headers, created_order):
    oid = created_order[0]["id"]
    r = requests.delete(f"{API}/orders/{oid}", headers=auth_headers, timeout=10)
    assert r.status_code == 200


# --- Dashboard ---
def test_dashboard_stats(auth_headers):
    r = requests.get(f"{API}/dashboard/stats", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    s = r.json()
    for k in ("orders", "money", "products", "chart_months"):
        assert k in s
    assert "total" in s["orders"]
    assert "revenue" in s["money"]


def test_dashboard_stats_unauth():
    r = requests.get(f"{API}/dashboard/stats", timeout=10)
    assert r.status_code == 401


# --- Files ---
def test_files_full_flow(auth_headers):
    folder_name = f"TEST_{uuid.uuid4().hex[:6]}"
    # mkdir
    r = requests.post(f"{API}/files/mkdir", data={"path": "/", "name": folder_name},
                      headers=auth_headers, timeout=10)
    assert r.status_code == 200

    # upload simple file
    files = {"files": ("hello.txt", b"hello world", "text/plain")}
    r2 = requests.post(f"{API}/files/upload", data={"path": f"/{folder_name}"}, files=files,
                       headers=auth_headers, timeout=15)
    assert r2.status_code == 200
    saved = r2.json()["saved"]
    assert saved and "url" in saved[0]

    # list
    r3 = requests.get(f"{API}/files/list?path=/{folder_name}", headers=auth_headers, timeout=10)
    assert r3.status_code == 200
    names = [x["name"] for x in r3.json()["items"]]
    assert "hello.txt" in names

    # upload zip with subfolder structure
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("sub/a.txt", b"A")
        z.writestr("sub/b.txt", b"B")
    buf.seek(0)
    files = {"files": ("pack.zip", buf.getvalue(), "application/zip")}
    rz = requests.post(f"{API}/files/upload", data={"path": f"/{folder_name}"}, files=files,
                       headers=auth_headers, timeout=15)
    assert rz.status_code == 200
    assert rz.json()["saved"][0].get("extracted") is True

    rl = requests.get(f"{API}/files/list?path=/{folder_name}/sub", headers=auth_headers, timeout=10)
    sub_names = [x["name"] for x in rl.json()["items"]]
    assert "a.txt" in sub_names and "b.txt" in sub_names

    # delete folder
    rd = requests.delete(f"{API}/files/delete?path=/{folder_name}", headers=auth_headers, timeout=10)
    assert rd.status_code == 200


def test_files_path_traversal_blocked(auth_headers):
    r = requests.post(f"{API}/files/mkdir", data={"path": "/", "name": "../etc"},
                      headers=auth_headers, timeout=10)
    assert r.status_code == 400


def test_files_list_unauth():
    r = requests.get(f"{API}/files/list", timeout=10)
    assert r.status_code == 401
