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
loadItems().then(data => thriftItems = data);

// To prevent picking the same item consecutively
let lastItemId = null;

/* ==========================
   2. Spin the Rack Feature - Random Item Selector
   ========================== */

// Function to select and display a random thrift item
async function spinTheRack() {
    if (!thriftItems || thriftItems.length === 0) {
        console.log("Thrift items not loaded yet. Please wait.");
        return;
    }

    // Filter for items added in the last 7 days
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);

    const recentItems = thriftItems.filter(item => {
        const itemDate = new Date(item.dateAdded);
        return itemDate >= oneWeekAgo;
    });

    if (recentItems.length === 0) {
        console.log("No new items in the last 7 days. Using all items instead.");
    }

    // Use recent items if available, otherwise use full list
    const availableItems = recentItems.length > 0 ? recentItems : thriftItems;

    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * availableItems.length);
    } while (availableItems[randomIndex].id === lastItemId);

    const selectedItem = availableItems[randomIndex];
    lastItemId = selectedItem.id; // Store last picked item

    console.log(`Spin the Rack selected: ${selectedItem.name}`);

    // Update popup with item details
    popupTitle.textContent = selectedItem.name;
    popupDescription.textContent = selectedItem.description;
    
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
let comboDiscount = 0;
let itemsInBasket = 0;
const comboPopup = document.getElementById("comboPopup");
const comboText = document.getElementById("comboText");

// Function to manage adding items to basket and handling combo discounts
function addToBasket() {
    itemsInBasket++;

    if (comboTimer) {
        comboDiscount = Math.min(comboDiscount + 5, 15); // Max discount 15%
        console.log(`Item added—combo discount increased to ${comboDiscount}%`);
        clearTimeout(comboTimer);
    } else {
        comboDiscount = 5; // Start with 5% discount
        console.log(`Combo discount started at ${comboDiscount}%`);
    }

    console.log(`Item added to cart. Total items: ${itemsInBasket}`);

    // Update and show combo popup
    comboText.textContent = `Combo x${itemsInBasket} - ${comboDiscount}% OFF`;
    comboPopup.classList.add("visible");

    console.log("Combo Popup is now visible!");

    // Set a timer to lock the discount after 5 minutes
    comboTimer = setTimeout(() => {
        console.log(`Combo discount locked in at ${comboDiscount}%`);
        console.log("Combo timer expired—no further discounts.");
        comboPopup.classList.remove("visible");
        comboTimer = null; // Reset timer
    }, 300000); // 5 minutes
};

/* ==========================
   4. Basket and Popup Interactions
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
    let popupBasketClicked = false;

    // Opens item popup when a product slide is clicked
    slides.forEach(slide => {
        slide.addEventListener("click", function (event) {
            // Ignore clicks on add-to-basket elements
            if (event.target.closest(".shopping-bag-btn, .add-to-basket-label")) return;
            console.log("Loading item details...");
            
            // Display placeholder content
            popupTitle.textContent = "Sample Item";
            popupDescription.textContent = "This is a placeholder description for the selected item.";
            
            // Show item popup
            itemPopup.classList.remove("hidden");
            itemPopup.classList.add("visible");
            console.log("Item Popup now visible!");
        });
    });

    // Closes the popup when the close button is clicked
    closePopup.addEventListener("click", function () {
        itemPopup.classList.remove("visible");
        itemPopup.classList.add("hidden");
        popupBasketClicked = false;
        console.log("Popup closed.");
    });

    // Handles add-to-basket clicks in panel (excluding popup)
    document.querySelectorAll(".add-to-basket-label:not(.popup-basket-label)").forEach(label => {
        label.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            console.log("Panel Add to Basket clicked");
            addToBasket();
        });
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
            addToBasket();
        });
    }

    // Ensures popup ADD TO BASKET text does not trigger twice
    if (popupAddToBasketLabel) {
        popupAddToBasketLabel.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            if (!popupBasketClicked) {
                console.log("Popup Add to Basket clicked");
                addToBasket();
                popupBasketClicked = true;
                setTimeout(() => popupBasketClicked = false, 100);
            }
        });
    }
});

/* ==========================
   5. Parallax Effect for Product Grid
   ========================== */

// Handles the scrolling effect where the product grid takes over the Just In section
function detectParallaxTakeover() {
    let takeoverTriggered = false; // Tracks if takeover has occurred
    let restoreTriggered = false; // Tracks if layout has been restored
    let lastScrollY = window.scrollY; // Stores last scroll position

    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;

        // Detect scrolling DOWN to trigger product grid takeover
        if (currentScrollY > 150 && !takeoverTriggered) {
            console.log("Product Grid would now come up and overtake the Just In section");
            takeoverTriggered = true;
            restoreTriggered = false; // Reset restore trigger
        }

        // Detect scrolling UP to restore the default layout
        if (currentScrollY < lastScrollY && currentScrollY < 100 && !restoreTriggered) {
            console.log("Just In would now reclaim its space - resetting the layout");
            restoreTriggered = true;
            takeoverTriggered = false; // Reset takeover trigger
        }

        lastScrollY = currentScrollY; // Update last scroll position
    });
}

// Run when the page loads
document.addEventListener("DOMContentLoaded", detectParallaxTakeover);