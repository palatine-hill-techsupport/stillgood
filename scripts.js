/* ==========================
   1. Data Handling - Load Thrift Items
   ========================== */

// Fetch thrift items from an external JSON file and store them globally
async function loadItems() {
    try {
        const response = await fetch("items.json");
        const items = await response.json();
        console.log("Loaded thrift items:", items);
        return items; // Return the data for use elsewhere
    } catch (error) {
        console.error("Error loading items:", error);
    }
}

// Global variable to store loaded thrift items
let thriftItems = [];

loadItems().then(data => {
    thriftItems = data;

    const slider = document.querySelector(".slider");

    // Show the 10 most recently added items, sorted by date 
    const sortedItems = [...thriftItems].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    const recentItems = sortedItems.slice(0, 10); 
    const gridItems = sortedItems.slice(10); // everything else

    // Inject Just In slides
    recentItems.forEach(item => {
        const slide = document.createElement("div");
        slide.className = "slide item-slide";
        slide.innerHTML = `
            <h3 class="slide-title">${item.name}</h3>
            <img src="${item.image}" alt="${item.name}" class="slide-img">
            <p class="slide-price">$${item.price.toFixed(2)}</p>
            <div class="basket-action slide-basket-action" data-id="${item.id}">
                <p class="add-to-basket-label">ADD TO BASKET:</p>
                <img src="images/shopping-bag.png" class="shopping-bag-btn">
            </div>
        `;
        slider.appendChild(slide);
    });

    // Handle Add to Basket from slider
    slider.addEventListener("click", e => {
        const basket = e.target.closest(".slide-basket-action");
        if (basket) {
            const itemId = parseInt(basket.dataset.id);
            const item = thriftItems.find(i => i.id === itemId);
            if (item) addToBasket(item);
        }
    });

    // Inject grid items (everything not in Just In)
    const productGrid = document.querySelector(".product-grid");

    gridItems.forEach(item => {
        const gridItem = document.createElement("div");
        gridItem.className = "product-grid-item";
        gridItem.dataset.id = item.id;

        gridItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="product-tile-img">
            <div class="price-overlay">$${item.price.toFixed(2)}</div>
        `;

        productGrid.appendChild(gridItem);
    });

    // Handle clicks on grid items (open popup)
    productGrid.addEventListener("click", e => {
        const clicked = e.target.closest(".product-grid-item");
        if (!clicked) return;

        const itemId = parseInt(clicked.dataset.id);
        const item = thriftItems.find(i => i.id === itemId);
        if (!item) return;

        // Populate popup
        popupTitle.textContent = item.name;
        popupDescription.textContent = item.description;
        const popupImage = document.getElementById("popupImage");
        popupImage.src = item.image;
        popupImage.alt = item.name;
        itemPopup.dataset.itemId = item.id;

        itemPopup.classList.remove("hidden");
        itemPopup.classList.add("visible");
    });
});

// Global cart array to store added items
let shoppingCart = [];

// To prevent picking the same item consecutively
let lastItemId = null;

/* ==========================
   2. Spin the Rack Feature
   ========================== */

// Function to select and display a random thrift item
async function spinTheRack() {
    if (!thriftItems || thriftItems.length === 0) {
        console.log("Thrift items not loaded yet. Please wait.");
        return;
    }

    const availableItems = thriftItems;

    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * availableItems.length);
    } while (availableItems[randomIndex].id === lastItemId);

    const selectedItem = availableItems[randomIndex];
    lastItemId = selectedItem.id;

    console.log(`Spin the Rack selected: ${selectedItem.name}`);

    // Update popup with item details
    popupTitle.textContent = selectedItem.name;
    popupDescription.textContent = selectedItem.description;
    const popupImage = document.getElementById("popupImage");
    popupImage.src = `images/items/${selectedItem.id}.png`;
    popupImage.alt = selectedItem.name;

    // Store the item's ID in the popup for later use
    itemPopup.dataset.itemId = selectedItem.id;

    // Show popup
    itemPopup.classList.remove("hidden");
    itemPopup.classList.add("visible");
    console.log("Popup now visible with selected item.");
}

/* ==========================
   3. Combo Discount System
   ========================== */

// Variables to manage combo discounts
let comboTimer = null;
let comboInterval = null;
let comboDiscount = 0;
let itemsInBasket = 0;
let comboTimeLeft = 300
let comboClockInterval = null;
const comboPopup = document.getElementById("comboPopup");
const comboText = document.getElementById("comboText");

function addToBasket(item = null) {
    // Fallback if no item is passed
    if (!item) {
        console.warn("No item data passed to addToBasket.");
        return;
    }

    // Add to cart
    shoppingCart.push(item);
    console.log(`🛍️ ${item.name} added to basket!`);
    console.log("Current cart:", shoppingCart);

    // Update combo discount
    itemsInBasket++;
    if (comboTimer) {
        comboDiscount = Math.min(comboDiscount + 5, 15);
        clearTimeout(comboTimer);
    } else {
        comboDiscount = 5;
    }

    comboText.textContent = `Combo x${itemsInBasket} - ${comboDiscount}% OFF`;
    comboPopup.classList.remove("hidden");
    comboPopup.classList.add("visible");
    comboPopup.classList.remove("bounce");
    void comboPopup.offsetWidth;
    comboPopup.classList.add("bounce");
    
    if (comboClockInterval) clearInterval(comboClockInterval);

    comboTimeLeft = 300; // Reset time each time item is added
    
    comboClockInterval = setInterval(() => {
      const minutes = Math.floor(comboTimeLeft / 60).toString().padStart(2, '0');
      const seconds = (comboTimeLeft % 60).toString().padStart(2, '0');
    
      const clock = document.getElementById("comboTimerClock");
      if (clock) {
        clock.textContent = ` (${minutes}:${seconds} remaining)`;
      }
    
      comboTimeLeft--;
    
      if (comboTimeLeft < 0) {
        clearInterval(comboClockInterval);
        comboClockInterval = null;
      }
    }, 1000);
    
    // Clear any existing interval so it doesn’t stack
    clearInterval(comboInterval);

    // Start ticking countdown
    comboTimeLeft = 300;
    comboInterval = setInterval(() => {
        comboTimeLeft--;

        const minutes = Math.floor(comboTimeLeft / 60).toString().padStart(2, '0');
        const seconds = (comboTimeLeft % 60).toString().padStart(2, '0');
        comboInlineTimer.textContent = `⏳ ${minutes}:${seconds} remaining`;

        if (comboTimeLeft <= 10) {
            comboPopup.classList.add("final-seconds");
        }

        if (comboTimeLeft <= 0) {
            clearInterval(comboInterval);
            comboPopup.classList.remove("visible");
            comboPopup.classList.add("hidden");
            comboPopup.classList.remove("final-seconds");
            comboTimer = null;
        }
    }, 1000);

    // Still run comboTimer as a backup timeout (in case needed)
    comboTimer = setTimeout(() => {
        console.log("Combo expired.");
    
        // Hide popup
        comboPopup.classList.remove("visible", "final-seconds");
        comboPopup.classList.add("hidden");
    
        // Reset combo state
        comboDiscount = 0;
        itemsInBasket = 0;
        comboTimeLeft = 0;
    
        // Clear inline timers
        comboText.textContent = "";
        comboInlineTimer.textContent = "";
    
        // If checkout is open, re-render totals
        if (!checkoutPopup.classList.contains("hidden")) {
            const subtotal = shoppingCart.reduce((sum, item) => sum + item.price, 0);
            cartTotal.innerHTML = `
                <p>Subtotal: $${subtotal.toFixed(2)}</p>
                <p><strong>Total: $${subtotal.toFixed(2)}</strong></p>
            `;
        }
    
        comboTimer = null;
    }, 300000);    
}

/* ==========================
   4. Core-Logic, Basket and Popup Interactions
   ========================== */

    document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements for product interaction
    const slides = document.querySelectorAll(".slide");
    const itemPopup = document.getElementById("itemPopup");
    const popupTitle = document.getElementById("popupTitle");
    const popupDescription = document.getElementById("popupDescription");
    const closePopup = document.getElementById("closePopup");
    const addToBasketBtn = document.getElementById("addToBasket");
    const popupAddToBasketBtn = document.getElementById("popupAddToBasket");
    const popupAddToBasketLabel = document.querySelector(".popup-basket-label");
    const checkoutPopup = document.getElementById("checkoutPopup");
    const closeCheckout = document.getElementById("closeCheckout");
    const cartList = document.getElementById("cartList");
    const cartTotal = document.getElementById("cartTotal");
    const spinButton = document.getElementById("spinButton");
    const comboInlineTimer = document.getElementById("comboInlineTimer");
    const clearBasketBtn = document.getElementById("clearBasketBtn");
    let popupBasketClicked = false;

    // Opens item popup when a product slide is clicked
    document.querySelector(".slider").addEventListener("click", function (event) {
        const slide = event.target.closest(".slide");
    
        // Skip if not clicking on a slide or it's the fixed one
        if (!slide || slide.classList.contains("fixed-slide")) return;
    
        // Ignore clicks on basket elements
        if (
            event.target.closest(".shopping-bag-btn") ||
            event.target.closest(".add-to-basket-label")
        ) return;
    
        const itemName = slide.querySelector(".slide-title")?.textContent;
        const item = thriftItems.find(i => i.name === itemName);
    
        if (!item) {
            console.warn("No matching item found for popup.");
            return;
        }
    
        // Show popup with item data
        popupTitle.textContent = item.name;
        popupDescription.textContent = item.description;
        popupImage.src = item.image;
        popupImage.alt = item.name;
        itemPopup.dataset.itemId = item.id;
    
        itemPopup.classList.remove("hidden");
        itemPopup.classList.add("visible");
        console.log("Popup now visible with selected item.");
    });    

    // Closes the popup when the close button is clicked
    closePopup.addEventListener("click", function () {
        itemPopup.classList.remove("visible");
        itemPopup.classList.add("hidden");
        popupBasketClicked = false;
        console.log("Popup closed.");
    });

    // Handles add-to-basket click from main shopping bag button
    if (addToBasketBtn) {
        addToBasketBtn.addEventListener("click", event => {
            event.preventDefault();
            console.log("Main Add to Basket button clicked");
            addToBasket();
        });
    }

    // Handles add-to-basket click from popup shopping bag button
    if (popupAddToBasketBtn) {
        popupAddToBasketBtn.addEventListener("click", event => {
            event.preventDefault();
            console.log("Popup Add to Basket button clicked");
    
            // Grab item from popup dataset and find it in the thriftItems list
            const itemId = parseInt(itemPopup.dataset.itemId);
            const item = thriftItems.find(i => i.id === itemId);
    
            if (item) addToBasket(item);
        });
    }

    if (popupAddToBasketLabel) {
        popupAddToBasketLabel.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            if (!popupBasketClicked) {
                const itemId = parseInt(itemPopup.dataset.itemId);
                const item = thriftItems.find(i => i.id === itemId);
                if (item) addToBasket(item);
                popupBasketClicked = true;
                setTimeout(() => popupBasketClicked = false, 100);
            }
        });
    }    

    // Checkout button logic (supports both static and floating buttons)
    document.querySelectorAll(".checkout-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault();

            if (shoppingCart.length === 0) {
                cartList.innerHTML = "<li>Your basket is empty!</li>";
                cartTotal.textContent = "";
            } else {
                cartList.innerHTML = shoppingCart.map(item => `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                        <div class="cart-item-info">
                            <p class="cart-item-name">${item.name}</p>
                            <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                `).join("");

                // Combo Info Display
                let comboMessage = "";
                if (comboDiscount > 0) {
                    comboMessage = `<p class="combo-summary bounce">
                        🎉 Combo Discount Active: ${comboDiscount}% OFF for buying ${itemsInBasket} item${itemsInBasket > 1 ? "s" : ""}! 
                        <span id="comboTimerClock"></span>
                        </p>`;
                }

                // Re-trigger bounce after combo-summary is inserted
                const summaryEl = document.querySelector(".combo-summary");
                if (summaryEl) {
                summaryEl.classList.remove("bounce");
                void summaryEl.offsetWidth; // 🔁 force reflow
                summaryEl.classList.add("bounce");
                }

                // Calculate totals
                const subtotal = shoppingCart.reduce((sum, item) => sum + item.price, 0);
                const discountAmount = (comboDiscount / 100) * subtotal;
                const total = subtotal - discountAmount;

                // Update total section with message
                cartTotal.innerHTML = `
                    ${comboMessage}
                        <p>Subtotal: $${subtotal.toFixed(2)}</p>
                        <p class="checkout-discount">Discount: -$${discountAmount.toFixed(2)}</p>
                        <p><strong>Total: $${total.toFixed(2)}</strong></p>
                `;
            }

            checkoutPopup.classList.remove("hidden");
            checkoutPopup.classList.add("visible");
            console.log("Checkout popup opened!");
        });
    });

    // Close checkout popup
    closeCheckout.addEventListener("click", function () {
        checkoutPopup.classList.remove("visible");
        checkoutPopup.classList.add("hidden");
        console.log("Checkout popup closed.");
    });

    // Spin the rack logic
    if (spinButton) {
        spinButton.addEventListener("click", event => {
            event.preventDefault();
            console.log("Spin button clicked!");
            spinTheRack();
        });
    }

    const floatingCheckout = document.querySelector(".floating-checkout-btn");

    floatingCheckout.addEventListener("mouseenter", () => {
      floatingCheckout.src = "images/checkout-hover.png";
    });
    
    floatingCheckout.addEventListener("mouseleave", () => {
      floatingCheckout.src = "images/checkout.png";
    });

    // Reveal floating checkout once user scrolls 20% down
    const floatingWrapper = document.querySelector(".floating-checkout-wrapper");

    function toggleFloatingCheckout() {
    const scrollY = window.scrollY;
    const pageHeight = document.body.scrollHeight;
    const threshold = pageHeight * 0.20;

    if (scrollY > threshold) {
        floatingWrapper.classList.remove("hidden");
    } else {
        floatingWrapper.classList.add("hidden");
    }
    }

    window.addEventListener("scroll", toggleFloatingCheckout);

    // Clear basket
    clearBasketBtn.addEventListener("click", () => {
        shoppingCart = [];
        comboDiscount = 0;
        itemsInBasket = 0;
        clearInterval(comboInterval);
        clearInterval(comboClockInterval);
        clearTimeout(comboTimer);
    
        // Reset all displays
        cartList.innerHTML = "<li>Your basket is empty!</li>";
        cartTotal.innerHTML = "";
    
        comboText.textContent = "";
        comboInlineTimer.textContent = "";
    
        console.log("Cart cleared.");
    });    
    
});