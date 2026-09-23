WAHAB STORE - Railway + MySQL

This version stores the product catalog, orders, and customers in MySQL.
Products are NOT stored as the main database in browser localStorage.

RAILWAY SETUP
1. Deploy this project as a Railway service.
2. Add a Railway MySQL service to the same project.
3. Make sure the MySQL service variables are available to the web service.
   Railway normally provides MYSQLHOST, MYSQLPORT, MYSQLUSER,
   MYSQLPASSWORD and MYSQLDATABASE. This app also accepts MYSQL_URL.
4. Set these optional web-service variables:
   WAHAB_SECRET_KEY = a long random secret
   WAHAB_ADMIN_USERNAME = your admin username
   WAHAB_ADMIN_PASSWORD = your admin password
5. Redeploy.
6. Open /api/health. It should report database: mysql and status: ok.
7. Log in to the Admin Panel and add a product.
8. Open the store from another phone/computer. The same product will appear.

IMPORTANT
- MySQL is the permanent shared source of truth for products.
- localStorage is used only as a browser cache/cart/wishlist.
- Store pages refresh the product catalog every 15 seconds, so newly added
  products appear on already-open pages without manually editing localStorage.
- Product images are stored in MySQL as LONGTEXT data URLs. For a very large
  catalog, move images to object storage later and keep only image URLs in DB.
