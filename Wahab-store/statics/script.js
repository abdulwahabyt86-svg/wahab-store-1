/* =========================================================
   WAHAB STORE - MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   PRODUCTS
   ========================================================= */

function initializeProducts() {

    if (!localStorage.getItem("wahabProducts")) {

        // Start with an empty product list.
        // Products are added from the Admin Panel.
        localStorage.setItem(
            "wahabProducts",
            JSON.stringify([])
        );

    }

}


function getProducts() {

    initializeProducts();

    try {

        const data =
            JSON.parse(
                localStorage.getItem("wahabProducts")
            );

        return Array.isArray(data) ? data : [];

    } catch (error) {

        console.error("Product data error:", error);

        localStorage.setItem(
            "wahabProducts",
            JSON.stringify([])
        );

        return [];

    }

}


function saveProducts(products) {

    localStorage.setItem(
        "wahabProducts",
        JSON.stringify(products)
    );

}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHTML(text) {

    if (text === undefined || text === null) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   CATEGORY ICON
   ========================================================= */

function getCategoryIcon(category) {

    const categoryName =
        String(category || "").toLowerCase();

    if (categoryName.includes("electronic")) {
        return "fa-mobile-screen-button";
    }

    if (categoryName.includes("fashion")) {
        return "fa-shirt";
    }

    if (categoryName.includes("gaming")) {
        return "fa-gamepad";
    }

    if (categoryName.includes("home")) {
        return "fa-house";
    }

    if (categoryName.includes("beauty")) {
        return "fa-spray-can-sparkles";
    }

    return "fa-box-open";

}


/* =========================================================
   DISPLAY PRODUCTS
   ========================================================= */

function displayStoreProducts(productsToShow = null) {

    const container =
        document.getElementById("productContainer");

    if (!container) {
        return;
    }


    const products =
        productsToShow !== null
            ? productsToShow
            : getProducts();


    container.innerHTML = "";


    if (!products || products.length === 0) {

        container.innerHTML = `

            <div class="no-products">

                <div class="no-products-icon">

                    <i class="fa-solid fa-box-open"></i>

                </div>

                <h2>No Products Available</h2>

                <p>
                    Products will appear here when you
                    add them from the Admin Panel.
                </p>

                <button
                    class="no-products-btn"
                    onclick="window.location.href='admin-login.html'"
                >

                    <i class="fa-solid fa-plus"></i>

                    Add Your First Product

                </button>

            </div>

        `;

        return;

    }


    products.forEach(function(product) {

        if (!product) {
            return;
        }


        const card =
            document.createElement("div");


        card.className =
            "product-card dynamic-product-card";


        const productId =
            String(
                product.id ||
                product.name ||
                Date.now()
            );


        card.setAttribute(
            "data-id",
            productId
        );


        const category =
            String(
                product.category ||
                product.catagory ||
                "Other"
            );


        const name =
            String(
                product.name ||
                product.productName ||
                "Unnamed Product"
            );


        const price =
            Number(
                product.price ||
                product.productPrice ||
                0
            );


        const image =
            String(
                product.image ||
                product.imageUrl ||
                product.img ||
                ""
            );


        const rating =
            Number(
                product.rating || 5
            );


        const reviewCount =
            product.reviews ||
            product.reviewCount ||
            0;


        const discount =
            product.discount ||
            "";


        card.setAttribute(
            "data-category",
            category
        );


        card.setAttribute(
            "data-name",
            name
        );


        card.setAttribute(
            "data-price",
            price
        );


        const icon =
            getCategoryIcon(category);


        /* =================================================
           FAVOURITE
           ================================================= */

        const wishlist =
            getWishlist();


        const isFavourite =
            wishlist.some(function(item) {

                return String(
                    item.id ||
                    item.name
                ) === productId;

            });


        /* =================================================
           IMAGE
           ================================================= */

        let imageHTML = "";


        if (image.trim() !== "") {

            imageHTML = `

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(name)}"
                    class="dynamic-product-img"

                    onerror="
                        this.style.display='none';
                        if(this.nextElementSibling){
                            this.nextElementSibling.style.display='flex';
                        }
                    "
                >

                <div
                    class="product-image-fallback"
                    style="display:none;"
                >

                    <i class="fa-solid ${icon}"></i>

                </div>

            `;

        } else {

            imageHTML = `

                <div class="product-image-fallback">

                    <i class="fa-solid ${icon}"></i>

                </div>

            `;

        }


        /* =================================================
           RATING
           ================================================= */

        let ratingStars = "";


        for (
            let star = 1;
            star <= 5;
            star++
        ) {

            if (star <= rating) {

                ratingStars +=
                    `<i class="fa-solid fa-star"></i>`;

            } else {

                ratingStars +=
                    `<i class="fa-regular fa-star"></i>`;

            }

        }


        /* =================================================
           DISCOUNT
           ================================================= */

        const discountHTML =
            discount
                ? `

                    <div class="discount">
                        -${escapeHTML(discount)}%
                    </div>

                  `
                : "";


        /* =================================================
           HEART
           ================================================= */

        const heartClass =
            isFavourite
                ? "fa-solid"
                : "fa-regular";


        const activeClass =
            isFavourite
                ? "active"
                : "";


        /* =================================================
           PRODUCT CARD
           ================================================= */

        card.innerHTML = `

            ${discountHTML}


            <button
                class="heart product-heart ${activeClass}"

                onclick="addWishlistById('${escapeHTML(productId)}', this)"

                title="Add to favourites"
            >

                <i class="${heartClass} fa-heart"></i>

            </button>


            <div class="product-image dynamic-product-image">

                ${imageHTML}

            </div>


            <div class="product-info">

                <p class="category-name">

                    <i class="fa-solid ${icon}"></i>

                    ${escapeHTML(category)}

                </p>


                <h3>
                    ${escapeHTML(name)}
                </h3>


                <div class="rating">

                    ${ratingStars}

                    <span>
                        (${escapeHTML(reviewCount)})
                    </span>

                </div>


                <div class="price">

                    <strong>
                        Rs. ${price.toLocaleString()}
                    </strong>

                </div>


                <!-- BUTTONS -->

                <div class="product-buttons">

                    <button
                        class="add-cart"
                        onclick="addToCartById('${escapeHTML(productId)}')"
                    >

                        <i class="fa-solid fa-cart-plus"></i>

                        Add to Cart

                    </button>


                    <button
                        class="order-now-btn"
                        onclick="openOrderForm('${escapeHTML(productId)}')"
                    >

                        <i class="fa-solid fa-bolt"></i>

                        Order Now

                    </button>

                </div>

            </div>

        `;


        container.appendChild(card);

    });

}


/* =========================================================
   PRODUCT FUNCTIONS
   ========================================================= */

function showFirstProducts() {

    displayStoreProducts(getProducts());

}


function showMoreProducts() {

    displayStoreProducts(getProducts());

}


function showAllProducts() {

    displayStoreProducts(getProducts());

}


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function filterCategory(category) {

    const products =
        getProducts();


    if (
        !category ||
        String(category).toLowerCase() === "all"
    ) {

        displayStoreProducts(products);

        return;

    }


    const filteredProducts =
        products.filter(function(product) {

            const productCategory =
                String(
                    product.category ||
                    product.catagory ||
                    ""
                ).toLowerCase();


            return productCategory ===
                String(category).toLowerCase();

        });


    displayStoreProducts(
        filteredProducts
    );

}


/* =========================================================
   SEARCH
   ========================================================= */

function searchProducts() {

    const input =
        document.getElementById("searchInput");


    const container =
        document.getElementById("productContainer");


    if (!input || !container) {
        return;
    }


    const searchText =
        input.value
            .toLowerCase()
            .trim();


    const allProducts =
        getProducts();


    if (searchText === "") {

        displayStoreProducts(
            allProducts
        );

        return;

    }


    const matchingProducts =
        allProducts.filter(function(product) {

            if (!product) {
                return false;
            }


            const name =
                String(
                    product.name ||
                    product.productName ||
                    ""
                ).toLowerCase();


            const category =
                String(
                    product.category ||
                    product.catagory ||
                    ""
                ).toLowerCase();


            const price =
                String(
                    product.price ||
                    product.productPrice ||
                    ""
                ).toLowerCase();


            return (
                name.includes(searchText) ||
                category.includes(searchText) ||
                price.includes(searchText)
            );

        });


    if (matchingProducts.length > 0) {

        displayStoreProducts(
            matchingProducts
        );

    } else {

        container.innerHTML = `

            <div class="no-products">

                <div class="no-products-icon">

                    <i class="fa-solid fa-magnifying-glass"></i>

                </div>

                <h2>No Product Found</h2>

                <p>
                    No product matches
                    "<strong>${escapeHTML(input.value)}</strong>"
                </p>

                <button
                    class="no-products-btn"
                    onclick="clearSearch()"
                >

                    Show All Products

                </button>

            </div>

        `;

    }


    container.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


/* =========================================================
   CLEAR SEARCH
   ========================================================= */

function clearSearch() {

    const input =
        document.getElementById("searchInput");


    if (input) {
        input.value = "";
    }


    displayStoreProducts(
        getProducts()
    );

}


/* =========================================================
   CART
   ========================================================= */

function getCart() {

    try {

        const cart =
            JSON.parse(
                localStorage.getItem("wahabCart")
            );

        return Array.isArray(cart)
            ? cart
            : [];

    } catch (error) {

        localStorage.setItem(
            "wahabCart",
            JSON.stringify([])
        );

        return [];

    }

}


function saveCart(cart) {

    localStorage.setItem(
        "wahabCart",
        JSON.stringify(cart)
    );

}


/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCartById(id) {

    const products =
        getProducts();


    const product =
        products.find(function(item) {

            return String(
                item.id ||
                item.name
            ) === String(id);

        });


    if (!product) {

        showNotification(
            "Product not found!",
            "error"
        );

        return;

    }


    addProductToCart(product);

}


function addToCart(productName, price) {

    const products =
        getProducts();


    const product =
        products.find(function(item) {

            return String(
                item.name
            ).toLowerCase() ===
            String(
                productName
            ).toLowerCase();

        });


    if (!product) {

        showNotification(
            "Product not found!",
            "error"
        );

        return;

    }


    addProductToCart(product);

}


function addProductToCart(product) {

    const cart =
        getCart();


    const productId =
        String(
            product.id ||
            product.name
        );


    const existing =
        cart.find(function(item) {

            return String(
                item.id ||
                item.name
            ) === productId;

        });


    if (existing) {

        existing.quantity =
            Number(
                existing.quantity || 1
            ) + 1;

    } else {

        cart.push({

            id:
                productId,

            name:
                product.name || "",

            price:
                Number(product.price) || 0,

            category:
                product.category || "",

            image:
                product.image || "",

            quantity:
                1

        });

    }


    saveCart(cart);

    updateCartCount();

    showNotification(
        "Product added to cart successfully!",
        "success"
    );

}


/* =========================================================
   CART COUNT
   ========================================================= */

function updateCartCount() {

    const cartCount =
        document.getElementById(
            "cartCount"
        );


    if (!cartCount) {
        return;
    }


    const cart =
        getCart();


    let totalQuantity = 0;


    cart.forEach(function(item) {

        totalQuantity +=
            Number(
                item.quantity || 1
            );

    });


    cartCount.textContent =
        totalQuantity;

}


/* =========================================================
   GO TO CART
   ========================================================= */

function goToCart() {

    window.location.href =
        "cart.html";

}


/* =========================================================
   CART PANEL
   ========================================================= */

function openCart() {

    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    const panel =
        document.getElementById(
            "cartPanel"
        );


    if (overlay) {
        overlay.style.display = "block";
    }


    if (panel) {
        panel.style.display = "block";
    }


    displayCartItems();

}


function closeCart() {

    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    const panel =
        document.getElementById(
            "cartPanel"
        );


    if (overlay) {
        overlay.style.display = "none";
    }


    if (panel) {
        panel.style.display = "none";
    }

}


/* =========================================================
   DISPLAY CART
   ========================================================= */

function displayCartItems() {

    const cartItems =
        document.getElementById("cartItems");

    const cartTotal =
        document.getElementById("cartTotal");

    if (!cartItems) {
        return;
    }

    const cart = getCart();

    cartItems.innerHTML = "";

    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div style="
                text-align:center;
                padding:30px;
            ">

                <i
                    class="fa-solid fa-cart-shopping"
                    style="font-size:45px;"
                ></i>

                <p>
                    Your cart is empty.
                </p>

            </div>

        `;

        if (cartTotal) {
            cartTotal.textContent = "Rs. 0";
        }

        return;
    }

    let total = 0;

    cart.forEach(function(item, index) {

        const price =
            Number(item.price) || 0;

        const quantity =
            Number(item.quantity) || 1;

        total += price * quantity;

        const productId =
            String(
                item.id ||
                item.name
            );

        const itemDiv =
            document.createElement("div");

        itemDiv.className = "cart-item";

        itemDiv.innerHTML = `

            <div class="cart-product-info">

                <strong>
                    ${escapeHTML(item.name)}
                </strong>

                <p>
                    Rs. ${price.toLocaleString()}
                </p>

                <p>
                    Quantity: ${quantity}
                </p>

            </div>


            <!-- CART BUTTONS -->

            <div
                class="cart-item-buttons"
                style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                    margin-top:15px;
                    flex-wrap:wrap;
                "
            >

                <!-- ORDER NOW BUTTON -->

                <button
                    type="button"
                    class="order-now-btn"
                    onclick="orderCartProduct('${escapeHTML(productId)}')"
                    style="
                        display:inline-flex;
                        align-items:center;
                        justify-content:center;
                        gap:7px;
                        padding:10px 16px;
                        cursor:pointer;
                        border:none;
                    "
                >

                    <i class="fa-solid fa-bolt"></i>

                    Order Now

                </button>


                <!-- REMOVE BUTTON -->

                <button
                    type="button"
                    onclick="removeFromCart(${index})"
                    title="Remove from cart"
                    style="
                        display:inline-flex;
                        align-items:center;
                        justify-content:center;
                        gap:5px;
                        padding:10px 14px;
                        cursor:pointer;
                    "
                >

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>

        `;

        cartItems.appendChild(itemDiv);

    });


    if (cartTotal) {

        cartTotal.textContent =
            "Rs. " +
            total.toLocaleString();

    }

}


/* =========================================================
   ORDER PRODUCT FROM CART
   ========================================================= */

function orderCartProduct(productId) {

    const cart =
        getCart();


    const cartItem =
        cart.find(function(item) {

            return String(
                item.id ||
                item.name
            ) === String(productId);

        });


    if (!cartItem) {

        showNotification(
            "Product not found in cart!",
            "error"
        );

        return;

    }


    /*
       Use the existing Order Now system.
    */

    openOrderForm(
        cartItem.id ||
        cartItem.name
    );

}


/* =========================================================
   REMOVE CART ITEM
   ========================================================= */

function removeFromCart(index) {

    const cart =
        getCart();


    if (
        index < 0 ||
        index >= cart.length
    ) {

        return;

    }


    cart.splice(
        index,
        1
    );


    saveCart(
        cart
    );


    updateCartCount();


    displayCartItems();


    showNotification(
        "Product removed from cart.",
        "success"
    );

}


/* =========================================================
   CLEAR CART
   ========================================================= */

function clearCart() {

    saveCart([]);


    updateCartCount();


    displayCartItems();


    showNotification(
        "Cart cleared.",
        "success"
    );

}


/* =========================================================
   WISHLIST
   ========================================================= */

function getWishlist() {

    try {

        const wishlist =
            JSON.parse(
                localStorage.getItem(
                    "wahabWishlist"
                )
            );

        return Array.isArray(wishlist)
            ? wishlist
            : [];

    } catch (error) {

        localStorage.setItem(
            "wahabWishlist",
            JSON.stringify([])
        );

        return [];

    }

}


function saveWishlist(wishlist) {

    localStorage.setItem(
        "wahabWishlist",
        JSON.stringify(wishlist)
    );

}


/* =========================================================
   ADD / REMOVE WISHLIST
   ========================================================= */

function addWishlistById(
    id,
    button = null
) {

    const products =
        getProducts();


    const product =
        products.find(function(item) {

            return String(
                item.id ||
                item.name
            ) === String(id);

        });


    if (!product) {

        showNotification(
            "Product not found!",
            "error"
        );

        return;

    }


    let wishlist =
        getWishlist();


    const productId =
        String(
            product.id ||
            product.name
        );


    const existingIndex =
        wishlist.findIndex(function(item) {

            return String(
                item.id ||
                item.name
            ) === productId;

        });


    if (existingIndex !== -1) {

        wishlist.splice(
            existingIndex,
            1
        );


        saveWishlist(wishlist);

        updateFavoriteCount();

        updateHeartButton(
            button,
            false
        );


        showNotification(
            "Removed from favourites.",
            "success"
        );

        return;

    }


    wishlist.push({

        id:
            productId,

        name:
            product.name || "",

        price:
            Number(product.price) || 0,

        category:
            product.category || "",

        image:
            product.image || "",

        rating:
            product.rating || 5,

        reviews:
            product.reviews ||
            product.reviewCount ||
            0

    });


    saveWishlist(wishlist);

    updateFavoriteCount();

    updateHeartButton(
        button,
        true
    );


    showNotification(
        "❤️ Product added to favourites!",
        "success"
    );

}


/* =========================================================
   HEART
   ========================================================= */

function updateHeartButton(
    button,
    active
) {

    if (!button) {
        return;
    }


    button.classList.toggle(
        "active",
        active
    );


    const icon =
        button.querySelector("i");


    if (!icon) {
        return;
    }


    icon.className =
        active
            ? "fa-solid fa-heart"
            : "fa-regular fa-heart";

}


/* =========================================================
   OLD WISHLIST FUNCTIONS
   ========================================================= */

function addToWishlist(index) {

    const products =
        getProducts();


    const product =
        products[index];


    if (!product) {

        showNotification(
            "Product not found!",
            "error"
        );

        return;

    }


    addWishlistById(
        product.id ||
        product.name
    );

}


function addProductToWishlist(product) {

    if (!product) {
        return;
    }


    addWishlistById(
        product.id ||
        product.name
    );

}


function addWishlist(button) {

    if (!button) {
        return;
    }


    const card =
        button.closest(
            ".product-card"
        );


    if (!card) {
        return;
    }


    const id =
        card.getAttribute(
            "data-id"
        );


    if (id) {

        addWishlistById(
            id,
            button
        );

    }

}


/* =========================================================
   FAVOURITE COUNT
   ========================================================= */

function updateFavoriteCount() {

    const favoriteCount =
        document.getElementById(
            "favoriteCount"
        );


    if (favoriteCount) {

        favoriteCount.textContent =
            getWishlist().length;

    }

}


/* =========================================================
   FAVOURITES PAGE
   ========================================================= */

function goToFavorites() {

    window.location.href =
        "favourites.html";

}


/* =========================================================
   NOTIFICATION
   ========================================================= */

function showNotification(
    message,
    type = "success"
) {

    const oldNotification =
        document.querySelector(
            ".store-notification"
        );


    if (oldNotification) {
        oldNotification.remove();
    }


    const notification =
        document.createElement("div");


    notification.className =
        "store-notification " + type;


    notification.innerHTML = `

        <i class="fa-solid ${
            type === "success"
                ? "fa-circle-check"
                : "fa-circle-exclamation"
        }"></i>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    document.body.appendChild(
        notification
    );


    setTimeout(function() {

        if (notification) {
            notification.remove();
        }

    }, 2500);

}


/* =========================================================
   ORDER NOW SYSTEM
   ========================================================= */

let currentOrderProduct = null;


/* OPEN ORDER FORM */

function openOrderForm(productId) {

    const products =
        getProducts();


    const product =
        products.find(function(item) {

            return String(
                item.id ||
                item.name
            ) === String(productId);

        });


    if (!product) {

        showNotification(
            "Product not found!",
            "error"
        );

        return;

    }


    currentOrderProduct =
        product;


    const popup =
        document.getElementById(
            "orderPopup"
        );


    const productInfo =
        document.getElementById(
            "orderProductInfo"
        );


    if (!popup || !productInfo) {

        showNotification(
            "Order form is not added to index.html yet.",
            "error"
        );

        return;

    }


    const name =
        product.name ||
        product.productName ||
        "Product";


    const price =
        Number(
            product.price ||
            product.productPrice ||
            0
        );


    productInfo.innerHTML = `

        <strong>
            ${escapeHTML(name)}
        </strong>

        <br>

        <span>
            Price:
            Rs. ${price.toLocaleString()}
        </span>

    `;


    const quantity =
        document.getElementById(
            "orderQuantity"
        );


    if (quantity) {
        quantity.value = "1";
    }


    popup.classList.add("active");

}


/* CLOSE ORDER FORM */

function closeOrderForm() {

    const popup =
        document.getElementById(
            "orderPopup"
        );


    if (popup) {

        popup.classList.remove(
            "active"
        );

    }


    currentOrderProduct = null;

}


/* PLACE ORDER */

function placeOrder(event) {

    event.preventDefault();


    if (!currentOrderProduct) {

        showNotification(
            "Please select a product first.",
            "error"
        );

        return;

    }


    const nameInput =
        document.getElementById(
            "customerName"
        );


    const phoneInput =
        document.getElementById(
            "customerPhone"
        );


    const addressInput =
        document.getElementById(
            "customerAddress"
        );


    const cityInput =
        document.getElementById(
            "customerCity"
        );


    const quantityInput =
        document.getElementById(
            "orderQuantity"
        );


    if (
        !nameInput ||
        !phoneInput ||
        !addressInput ||
        !cityInput ||
        !quantityInput
    ) {

        showNotification(
            "Order form is incomplete.",
            "error"
        );

        return;

    }


    const customerName =
        nameInput.value.trim();


    const customerPhone =
        phoneInput.value.trim();


    const customerAddress =
        addressInput.value.trim();


    const customerCity =
        cityInput.value.trim();


    const quantity =
        Number(
            quantityInput.value
        );


    if (
        !customerName ||
        !customerPhone ||
        !customerAddress ||
        !customerCity ||
        quantity < 1
    ) {

        showNotification(
            "Please fill all order details.",
            "error"
        );

        return;

    }


    const product =
        currentOrderProduct;


    const productName =
        product.name ||
        product.productName ||
        "Product";


    const price =
        Number(
            product.price ||
            product.productPrice ||
            0
        );


    const total =
        price * quantity;


    /* =================================================
       ORDER ID
       ================================================= */

    const orderId =
        "WS-" +
        Date.now();


    /* =================================================
       DATE
       ================================================= */

    const orderDate =
        new Date().toLocaleString();


    /* =================================================
       CREATE ORDER
       ================================================= */

    const newOrder = {

        id:
            orderId,

        customer:
            customerName,

        phone:
            customerPhone,

        address:
            customerAddress,

        city:
            customerCity,

        items: [

            {

                id:
                    product.id ||
                    product.name,

                name:
                    productName,

                price:
                    price,

                quantity:
                    quantity

            }

        ],

        total:
            total,

        date:
            orderDate

    };


    /* =================================================
       GET OLD ORDERS
       ================================================= */

    let orders = [];


    try {

        orders =
            JSON.parse(
                localStorage.getItem(
                    "wahabOrders"
                )
            ) || [];

    } catch(error) {

        orders = [];

    }


    if (!Array.isArray(orders)) {
        orders = [];
    }


    /* ADD NEW ORDER */

    orders.push(
        newOrder
    );


    /* SAVE ORDERS */

    localStorage.setItem(
        "wahabOrders",
        JSON.stringify(orders)
    );


    /* =================================================
       CUSTOMERS
       ================================================= */

    let customers = [];


    try {

        customers =
            JSON.parse(
                localStorage.getItem(
                    "wahabCustomers"
                )
            ) || [];

    } catch(error) {

        customers = [];

    }


    if (!Array.isArray(customers)) {
        customers = [];
    }


    /* FIND CUSTOMER BY PHONE */

    const existingCustomer =
        customers.find(function(customer) {

            return String(
                customer.phone
            ) === String(
                customerPhone
            );

        });


    if (existingCustomer) {

        existingCustomer.name =
            customerName;

        existingCustomer.orders =
            Number(
                existingCustomer.orders || 0
            ) + 1;

    } else {

        customers.push({

            name:
                customerName,

            phone:
                customerPhone,

            orders:
                1,

            joined:
                orderDate

        });

    }


    /* SAVE CUSTOMERS */

    localStorage.setItem(
        "wahabCustomers",
        JSON.stringify(customers)
    );


    /* =================================================
       CLOSE FORM
       ================================================= */

    const form =
        document.getElementById(
            "orderForm"
        );


    if (form) {
        form.reset();
    }


    closeOrderForm();


    /* =================================================
       SUCCESS MESSAGE
       ================================================= */

    showNotification(
        "✅ Order placed successfully! Order ID: " +
        orderId,
        "success"
    );

}


/* =========================================================
   ORDER POPUP OUTSIDE CLICK
   ========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const popup =
            document.getElementById(
                "orderPopup"
            );


        if (
            popup &&
            event.target === popup
        ) {

            closeOrderForm();

        }

    }
);


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {

            closeContact();

            closeOrderForm();

        }

    }
);


/* =========================================================
   ADMIN
   ========================================================= */

function openAdmin() {

    window.location.href =
        "admin-login.html";

}


/* =========================================================
   CONTACT
   ========================================================= */

function showContact() {

    const popup =
        document.getElementById(
            "contactPopup"
        );


    if (!popup) {

        showNotification(
            "Contact: 03147302804",
            "success"
        );

        return;

    }


    popup.classList.add("active");

    document.body.classList.add(
        "contact-open"
    );

}


function openContact() {

    showContact();

}


function closeContact() {

    const popup =
        document.getElementById(
            "contactPopup"
        );


    if (popup) {

        popup.classList.remove(
            "active"
        );

    }


    document.body.classList.remove(
        "contact-open"
    );

}


/* =========================================================
   CONTACT OUTSIDE CLICK
   ========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const popup =
            document.getElementById(
                "contactPopup"
            );


        if (!popup) {
            return;
        }


        if (event.target === popup) {

            closeContact();

        }

    }
);


/* =========================================================
   PRODUCTS NAVIGATION
   ========================================================= */

function goToProducts() {

    const products =
        document.getElementById(
            "productContainer"
        );


    if (products) {

        products.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


function openProductsPage() {

    window.location.href =
        "./explor.html";

}


function exploreProducts() {

    window.location.href =
        "./explor.html";

}


/* =========================================================
   CHECKOUT
   ========================================================= */

function checkout() {

    const cart =
        getCart();


    if (cart.length === 0) {

        showNotification(
            "Your cart is empty!",
            "error"
        );

        return;

    }


    /*
       IMPORTANT:
       Checkout now opens the same Order Now
       form using the first cart product.
    */

    const firstProduct =
        getProducts().find(function(product) {

            return String(
                product.id ||
                product.name
            ) === String(
                cart[0].id ||
                cart[0].name
            );

        });


    if (firstProduct) {

        openOrderForm(
            firstProduct.id ||
            firstProduct.name
        );

    } else {

        showNotification(
            "Unable to find cart product.",
            "error"
        );

    }

}


/* =========================================================
   SEARCH EVENTS
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const searchInput =
            document.getElementById(
                "searchInput"
            );


        const searchButton =
            document.getElementById(
                "searchButton"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                searchProducts
            );


            searchInput.addEventListener(
                "keydown",
                function(event) {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        searchProducts();

                    }

                }
            );

        }


        if (searchButton) {

            searchButton.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    searchProducts();

                }

            );

        }

    }
);


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeProducts();

        displayStoreProducts();

        updateCartCount();

        updateFavoriteCount();

    }
);