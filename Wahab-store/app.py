from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from pathlib import Path
from functools import wraps
from datetime import datetime
import json
import os

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="statics",
    static_url_path="/statics",
)

app.secret_key = os.environ.get("WAHAB_SECRET_KEY", "change-this-secret-key")

ADMIN_USERNAME = os.environ.get("WAHAB_ADMIN_USERNAME", "wahab")
ADMIN_PASSWORD = os.environ.get("WAHAB_ADMIN_PASSWORD", "khan804")

PAGE_FILES = {
    "admin-login.html": "admin-login.html",
    "admin.html": "admin.html",
    "cart.html": "cart.html",
    "customers.html": "customers.html",
    "explor.html": "explor.html",
    "favourites.html": "favourites.html",
    "favorites.html": "favourites.html",
    "index.html": "index.html",
    "orders.html": "orders.html",
    "products.html": "products.html",
}


def json_path(name: str) -> Path:
    return DATA_DIR / name


def read_json(name: str, default):
    path = json_path(name)
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as fh:
            value = json.load(fh)
        return value
    except (OSError, json.JSONDecodeError):
        return default


def write_json(name: str, value) -> None:
    path = json_path(name)
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", encoding="utf-8") as fh:
        json.dump(value, fh, ensure_ascii=False, indent=2)
    temp.replace(path)


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return redirect(url_for("page", filename="admin-login.html"))
        return view(*args, **kwargs)
    return wrapped


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/admin-login")
def admin_login_page():
    return redirect(url_for("page", filename="admin-login.html"))


@app.get("/admin")
def admin_page_alias():
    return redirect(url_for("page", filename="admin.html"))


@app.get("/cart")
def cart_page_alias():
    return redirect(url_for("page", filename="cart.html"))


@app.get("/customers")
def customers_page_alias():
    return redirect(url_for("page", filename="customers.html"))


@app.get("/explore")
def explore_page_alias():
    return redirect(url_for("page", filename="explor.html"))


@app.get("/favorites")
def favorites_page_alias():
    return redirect(url_for("page", filename="favourites.html"))


@app.get("/orders")
def orders_page_alias():
    return redirect(url_for("page", filename="orders.html"))


@app.get("/products")
def products_page_alias():
    return redirect(url_for("page", filename="products.html"))


@app.get("/templates/<filename>")
def old_templates_path(filename):
    if filename in PAGE_FILES:
        return redirect(url_for("page", filename=filename))
    return "Page not found", 404


@app.get("/<filename>")
def page(filename):
    # Keep the existing .html links working while Flask serves the files
    # from templates instead of the browser opening them through Live Server.
    template = PAGE_FILES.get(filename)
    if not template:
        return "Page not found", 404

    protected = {"admin.html", "orders.html", "customers.html", "products.html"}
    if filename in protected and not session.get("admin_logged_in"):
        return redirect(url_for("page", filename="admin-login.html"))

    return render_template(template)


@app.post("/api/admin/login")
def admin_login():
    payload = request.get_json(silent=True) or request.form
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session["admin_logged_in"] = True
        session["admin_username"] = username
        return jsonify({"success": True, "message": "Login successful"})

    return jsonify({"success": False, "message": "Invalid username or password"}), 401


@app.post("/api/admin/logout")
def admin_logout():
    session.clear()
    return jsonify({"success": True})


@app.get("/api/admin/status")
def admin_status():
    return jsonify({
        "logged_in": bool(session.get("admin_logged_in")),
        "username": session.get("admin_username"),
    })


# ---------------------------------------------------------------------------
# Server-side product API. The current frontend can continue using its
# localStorage workflow, while these routes are available for migration to
# server-side persistence without changing the page URLs.
# ---------------------------------------------------------------------------

@app.get("/api/products")
def api_products_get():
    products = read_json("products.json", [])
    return jsonify(products if isinstance(products, list) else [])


@app.post("/api/products")
@admin_required
def api_products_create():
    product = request.get_json(silent=True) or {}
    name = str(product.get("name", "")).strip()
    category = str(product.get("category", "")).strip()
    price = product.get("price", 0)

    if not name or not category:
        return jsonify({"success": False, "message": "Name and category are required"}), 400

    try:
        price = float(price)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Price must be a number"}), 400

    products = read_json("products.json", [])
    if not isinstance(products, list):
        products = []

    new_product = {
        "id": str(product.get("id") or int(datetime.now().timestamp() * 1000)),
        "name": name,
        "price": price,
        "category": category,
        "image": product.get("image", ""),
        "rating": product.get("rating", 5),
        "reviews": product.get("reviews", 0),
    }
    products.append(new_product)
    write_json("products.json", products)
    return jsonify({"success": True, "product": new_product}), 201


@app.put("/api/products/<product_id>")
@admin_required
def api_products_update(product_id):
    payload = request.get_json(silent=True) or {}
    products = read_json("products.json", [])
    if not isinstance(products, list):
        products = []

    for product in products:
        if str(product.get("id")) == str(product_id):
            product.update(payload)
            product["id"] = product_id
            write_json("products.json", products)
            return jsonify({"success": True, "product": product})

    return jsonify({"success": False, "message": "Product not found"}), 404


@app.delete("/api/products/<product_id>")
@admin_required
def api_products_delete(product_id):
    products = read_json("products.json", [])
    if not isinstance(products, list):
        products = []

    filtered = [p for p in products if str(p.get("id")) != str(product_id)]
    if len(filtered) == len(products):
        return jsonify({"success": False, "message": "Product not found"}), 404

    write_json("products.json", filtered)
    return jsonify({"success": True})


@app.get("/api/orders")
@admin_required
def api_orders_get():
    orders = read_json("orders.json", [])
    return jsonify(orders if isinstance(orders, list) else [])


@app.post("/api/orders")
def api_orders_create():
    order = request.get_json(silent=True) or {}
    required = ["customer", "phone", "address", "city", "items"]
    missing = [key for key in required if not order.get(key)]
    if missing:
        return jsonify({"success": False, "message": "Missing: " + ", ".join(missing)}), 400

    orders = read_json("orders.json", [])
    if not isinstance(orders, list):
        orders = []

    order.setdefault("id", "WS-" + str(int(datetime.now().timestamp() * 1000)))
    order.setdefault("date", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    order.setdefault("total", 0)
    orders.append(order)
    write_json("orders.json", orders)

    # Maintain a simple customer record automatically.
    customers = read_json("customers.json", [])
    if not isinstance(customers, list):
        customers = []
    phone = str(order.get("phone"))
    existing = next((c for c in customers if str(c.get("phone")) == phone), None)
    if existing:
        existing["name"] = order.get("customer", existing.get("name", ""))
        existing["orders"] = int(existing.get("orders", 0)) + 1
    else:
        customers.append({
            "name": order.get("customer", ""),
            "phone": phone,
            "orders": 1,
            "joined": order.get("date"),
        })
    write_json("customers.json", customers)

    return jsonify({"success": True, "order": order}), 201


@app.get("/api/customers")
@admin_required
def api_customers_get():
    customers = read_json("customers.json", [])
    return jsonify(customers if isinstance(customers, list) else [])


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "app": "Wahab Store"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
