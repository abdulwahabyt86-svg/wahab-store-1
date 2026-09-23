from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
from datetime import datetime
import os
import json
import pymysql
from pymysql.cursors import DictCursor

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

# ---------------------------------------------------------------------------
# RAILWAY MYSQL
# The app supports Railway's MYSQL* variables and MYSQL_URL.
# Create a MySQL service in Railway and attach it to this web service.
# ---------------------------------------------------------------------------

def db_connection():
    url = os.environ.get("MYSQL_URL") or os.environ.get("MYSQL_PUBLIC_URL")
    if url:
        # pymysql accepts mysql:// and mysql+pymysql:// URLs only after parsing;
        # use urllib for reliable parsing.
        from urllib.parse import urlparse, unquote
        parsed = urlparse(url)
        return pymysql.connect(
            host=parsed.hostname,
            port=parsed.port or 3306,
            user=unquote(parsed.username or ""),
            password=unquote(parsed.password or ""),
            database=(parsed.path or "/").lstrip("/"),
            charset="utf8mb4",
            cursorclass=DictCursor,
            autocommit=True,
            connect_timeout=10,
        )

    return pymysql.connect(
        host=os.environ.get("MYSQLHOST") or os.environ.get("MYSQL_HOST") or "127.0.0.1",
        port=int(os.environ.get("MYSQLPORT") or os.environ.get("MYSQL_PORT") or 3306),
        user=os.environ.get("MYSQLUSER") or os.environ.get("MYSQL_USER") or "root",
        password=os.environ.get("MYSQLPASSWORD") or os.environ.get("MYSQL_PASSWORD") or "",
        database=os.environ.get("MYSQLDATABASE") or os.environ.get("MYSQL_DATABASE") or "railway",
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=True,
        connect_timeout=10,
    )


def init_db():
    """Create the shared tables automatically on first deployment."""
    conn = db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id VARCHAR(100) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    price DECIMAL(12,2) NOT NULL DEFAULT 0,
                    category VARCHAR(100) NOT NULL,
                    image LONGTEXT,
                    rating DECIMAL(3,2) NOT NULL DEFAULT 5,
                    reviews INT NOT NULL DEFAULT 0,
                    discount VARCHAR(50) DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS orders (
                    id VARCHAR(100) PRIMARY KEY,
                    customer VARCHAR(255) NOT NULL,
                    phone VARCHAR(100) NOT NULL,
                    address TEXT NOT NULL,
                    city VARCHAR(150) NOT NULL,
                    items LONGTEXT NOT NULL,
                    total DECIMAL(12,2) DEFAULT 0,
                    order_date VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS customers (
                    phone VARCHAR(100) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    orders_count INT NOT NULL DEFAULT 0,
                    joined VARCHAR(50)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
    finally:
        conn.close()


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
# PRODUCTS - SHARED PERMANENT MYSQL STORAGE
# ---------------------------------------------------------------------------

def product_from_row(row):
    if not row:
        return None
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "price": float(row["price"] or 0),
        "category": row["category"],
        "image": row.get("image") or "",
        "rating": float(row.get("rating") or 5),
        "reviews": int(row.get("reviews") or 0),
        "discount": row.get("discount") or "",
    }


@app.get("/api/products")
def api_products_get():
    try:
        conn = db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM products ORDER BY created_at DESC")
            rows = cur.fetchall()
        conn.close()
        return jsonify([product_from_row(row) for row in rows])
    except Exception as exc:
        app.logger.exception("Product database read failed")
        return jsonify({"success": False, "message": "Database error: " + str(exc)}), 500


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

    product_id = str(product.get("id") or int(datetime.now().timestamp() * 1000))
    new_product = {
        "id": product_id,
        "name": name,
        "price": price,
        "category": category,
        "image": str(product.get("image") or ""),
        "rating": float(product.get("rating") or 5),
        "reviews": int(product.get("reviews") or 0),
        "discount": str(product.get("discount") or ""),
    }

    try:
        conn = db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO products
                (id, name, price, category, image, rating, reviews, discount)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                new_product["id"], new_product["name"], new_product["price"],
                new_product["category"], new_product["image"],
                new_product["rating"], new_product["reviews"],
                new_product["discount"]
            ))
        conn.close()
        return jsonify({"success": True, "product": new_product}), 201
    except Exception as exc:
        app.logger.exception("Product create failed")
        return jsonify({"success": False, "message": "Database error: " + str(exc)}), 500


@app.put("/api/products/<product_id>")
@admin_required
def api_products_update(product_id):
    payload = request.get_json(silent=True) or {}

    allowed = ["name", "price", "category", "image", "rating", "reviews", "discount"]
    updates = {key: payload[key] for key in allowed if key in payload}

    if not updates:
        return jsonify({"success": False, "message": "Nothing to update"}), 400

    if "name" in updates:
        updates["name"] = str(updates["name"]).strip()
    if "category" in updates:
        updates["category"] = str(updates["category"]).strip()
    if "price" in updates:
        try:
            updates["price"] = float(updates["price"])
        except (TypeError, ValueError):
            return jsonify({"success": False, "message": "Price must be a number"}), 400

    try:
        conn = db_connection()
        with conn.cursor() as cur:
            set_clause = ", ".join(f"{key}=%s" for key in updates)
            values = list(updates.values()) + [str(product_id)]
            cur.execute(f"UPDATE products SET {set_clause} WHERE id=%s", values)

            if cur.rowcount == 0:
                conn.close()
                return jsonify({"success": False, "message": "Product not found"}), 404

            cur.execute("SELECT * FROM products WHERE id=%s", (str(product_id),))
            row = cur.fetchone()
        conn.close()
        return jsonify({"success": True, "product": product_from_row(row)})
    except Exception as exc:
        app.logger.exception("Product update failed")
        return jsonify({"success": False, "message": "Database error: " + str(exc)}), 500


@app.delete("/api/products/<product_id>")
@admin_required
def api_products_delete(product_id):
    try:
        conn = db_connection()
        with conn.cursor() as cur:
            cur.execute("DELETE FROM products WHERE id=%s", (str(product_id),))
            if cur.rowcount == 0:
                conn.close()
                return jsonify({"success": False, "message": "Product not found"}), 404
        conn.close()
        return jsonify({"success": True})
    except Exception as exc:
        app.logger.exception("Product delete failed")
        return jsonify({"success": False, "message": "Database error: " + str(exc)}), 500


# ---------------------------------------------------------------------------
# ORDERS + CUSTOMERS - ALSO STORED IN MYSQL SO RAILWAY REDEPLOYS DO NOT
# WIPE THEM OUT.
# ---------------------------------------------------------------------------

@app.get("/api/orders")
@admin_required
def api_orders_get():
    conn = db_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM orders ORDER BY created_at DESC")
        rows = cur.fetchall()
    conn.close()

    result = []
    for row in rows:
        item = dict(row)
        item["items"] = json.loads(item["items"]) if item.get("items") else []
        item["total"] = float(item["total"] or 0)
        item["date"] = item.get("order_date") or ""
        item.pop("order_date", None)
        item.pop("created_at", None)
        result.append(item)
    return jsonify(result)


@app.post("/api/orders")
def api_orders_create():
    order = request.get_json(silent=True) or {}
    required = ["customer", "phone", "address", "city", "items"]
    missing = [key for key in required if not order.get(key)]
    if missing:
        return jsonify({"success": False, "message": "Missing: " + ", ".join(missing)}), 400

    order_id = str(order.get("id") or "WS-" + str(int(datetime.now().timestamp() * 1000)))
    order_date = str(order.get("date") or datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    total = float(order.get("total") or 0)
    items_json = json.dumps(order.get("items"), ensure_ascii=False)

    conn = db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO orders
                (id, customer, phone, address, city, items, total, order_date)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                order_id, str(order["customer"]), str(order["phone"]),
                str(order["address"]), str(order["city"]),
                items_json, total, order_date
            ))

            phone = str(order["phone"])
            cur.execute("SELECT phone FROM customers WHERE phone=%s", (phone,))
            exists = cur.fetchone()
            if exists:
                cur.execute("""
                    UPDATE customers
                    SET name=%s, orders_count=orders_count+1
                    WHERE phone=%s
                """, (str(order["customer"]), phone))
            else:
                cur.execute("""
                    INSERT INTO customers (phone, name, orders_count, joined)
                    VALUES (%s,%s,%s,%s)
                """, (phone, str(order["customer"]), 1, order_date))
    finally:
        conn.close()

    saved_order = dict(order)
    saved_order["id"] = order_id
    saved_order["date"] = order_date
    saved_order["total"] = total
    return jsonify({"success": True, "order": saved_order}), 201


@app.get("/api/customers")
@admin_required
def api_customers_get():
    conn = db_connection()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT name, phone, orders_count AS orders, joined
            FROM customers
            ORDER BY joined DESC
        """)
        rows = cur.fetchall()
    conn.close()
    return jsonify(rows)


@app.get("/api/health")
def health():
    try:
        init_db()
        conn = db_connection()
        conn.close()
        return jsonify({"status": "ok", "database": "mysql", "app": "Wahab Store"})
    except Exception as exc:
        return jsonify({"status": "error", "database": str(exc), "app": "Wahab Store"}), 500


# Initialize database when the web process starts.
try:
    init_db()
except Exception:
    # Railway may briefly start the web service before the DB variables are
    # available. The health endpoint and the next request will retry.
    app.logger.exception("Initial MySQL connection failed; will retry on request.")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
