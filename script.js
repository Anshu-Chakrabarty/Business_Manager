document.addEventListener("DOMContentLoaded", async function() {
            // ---------------------------------------------------------
            // 1. FIREBASE CONFIGURATION
            // ---------------------------------------------------------
            const firebaseConfig = {
                apiKey: "AIzaSyDpfGoS2qPEGIS7e7DNra__oBmAy9avIq8",
                authDomain: "business-manager-63452.firebaseapp.com",
                projectId: "business-manager-63452",
                storageBucket: "business-manager-63452.firebasestorage.app",
                messagingSenderId: "726610808178",
                appId: "1:726610808178:web:612a4b5ff431e2809d21eb"
            };

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            const db = firebase.firestore();

            // ---------------------------------------------------------
            // 2. DATA STATE (Starts empty, loads from Cloud)
            // ---------------------------------------------------------
            let stores = [];
            let products = [];
            let orders = [];
            let payments = [];
            let returns = [];
            let agents = [];
            let transportation = [];
            let pendingCommissions = [];
            let paidCommissions = [];
            let ownerPassword = null;
            let duePayments = [];

            // ---------------------------------------------------------
            // 3. CLOUD FUNCTIONS (Load & Save)
            // ---------------------------------------------------------

            const loadDataFromCloud = async() => {
                console.log("Loading data from Firebase...");
                try {
                    const doc = await db.collection("business_data").doc("main_data").get();
                    if (doc.exists) {
                        const data = doc.data();
                        stores = data.stores || [];
                        products = data.products || [];
                        orders = data.orders || [];
                        payments = data.payments || [];
                        returns = data.returns || [];
                        agents = data.agents || [];
                        transportation = data.transportation || [];
                        pendingCommissions = data.pendingCommissions || [];
                        paidCommissions = data.paidCommissions || [];
                        ownerPassword = data.ownerPassword || null;
                        duePayments = data.duePayments || [];

                        console.log("Data loaded successfully.");
                        // Re-render the current page
                        const activeLink = document.querySelector('.sidebar-link.active');
                        if (activeLink) {
                            const currentPage = activeLink.id.split('-')[1];
                            renderPage(currentPage);
                        } else {
                            renderPage('dashboard');
                        }
                        updateDashboard();
                    } else {
                        console.log("No data found in cloud. Starting fresh.");
                    }
                } catch (error) {
                    console.error("Error loading data:", error);
                }
            };

            const saveData = async() => {
                console.log("Saving data to Firebase...");
                try {
                    await db.collection("business_data").doc("main_data").set({
                        stores,
                        products,
                        orders,
                        payments,
                        returns,
                        agents,
                        transportation,
                        pendingCommissions,
                        paidCommissions,
                        ownerPassword,
                        duePayments
                    });
                    console.log("Data saved successfully.");
                } catch (error) {
                    console.error("Error saving data:", error);
                    alert("Failed to save data! Check your internet connection.");
                }
            };

            // ---------------------------------------------------------
            // 4. DOM ELEMENTS & MODALS
            // ---------------------------------------------------------
            const sidebar = document.getElementById("sidebar");
            const mobileMenuButton = document.getElementById("mobile-menu-button");
            const sidebarLinks = document.querySelectorAll(".sidebar-link");
            const pageContents = document.querySelectorAll(".page-content");

            // Modals
            const editStoreModal = document.getElementById("edit-store-modal");
            const editStoreForm = document.getElementById("edit-store-form");
            const cancelEditStoreBtn = document.getElementById("cancel-edit-store");
            const editProductModal = document.getElementById("edit-product-modal");
            const editProductForm = document.getElementById("edit-product-form");
            const cancelEditProductBtn = document.getElementById("cancel-edit-product");
            const passwordModal = document.getElementById("password-modal");
            const passwordForm = document.getElementById("password-form");
            const cancelPasswordBtn = document.getElementById("cancel-password");
            const passwordError = document.getElementById("password-error");
            const forgotPasswordLink = document.getElementById("forgot-password-link");
            const editTransportationModal = document.getElementById("edit-transportation-modal");
            const editTransportationForm = document.getElementById("edit-transportation-form");
            const cancelEditTransportationBtn = document.getElementById("cancel-edit-transportation");
            const resetPasswordModal = document.getElementById("reset-password-modal");
            const resetPasswordForm = document.getElementById("reset-password-form");
            const cancelResetPasswordBtn = document.getElementById("cancel-reset-password");
            const resetPasswordError = document.getElementById("reset-password-error");
            const editPaymentModal = document.getElementById("edit-payment-modal");
            const editPaymentForm = document.getElementById("edit-payment-form");
            const cancelEditPaymentBtn = document.getElementById("cancel-edit-payment");

            // Local State
            let cart = [];
            let returnCart = [];
            let passwordCallback = null;
            let currentEditingOrderId = null;
            let currentEditingReturnId = null;

            // ---------------------------------------------------------
            // 5. PAGE TEMPLATES
            // ---------------------------------------------------------
            const templates = {
                    dashboard: () => `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div id="dashboard-stores-card" data-target="store" class="dashboard-card bg-white p-6 rounded-xl shadow-md flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Total Stores</p><p id="dashboard-total-stores" class="text-3xl font-bold text-gray-800">0</p></div><div class="bg-blue-100 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div></div>
            <div id="dashboard-products-card" data-target="product" class="dashboard-card bg-white p-6 rounded-xl shadow-md flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Total Products</p><p id="dashboard-total-products" class="text-3xl font-bold text-gray-800">0</p></div><div class="bg-green-100 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7l8 4" /></svg></div></div>
            <div id="dashboard-orders-card" data-target="order" class="dashboard-card bg-white p-6 rounded-xl shadow-md flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Today's Orders</p><p id="dashboard-todays-orders" class="text-3xl font-bold text-gray-800">0</p></div><div class="bg-yellow-100 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></div></div>
            <div id="dashboard-agents-card" data-target="agent" class="dashboard-card bg-white p-6 rounded-xl shadow-md flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Total Agents</p><p id="dashboard-total-agents" class="text-3xl font-bold text-gray-800">0</p></div><div class="bg-purple-100 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg></div></div>
        </div>`,
                    store: () => `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Store Management</h2>
        <div class="bg-white p-6 rounded-xl shadow-md"><h3 class="text-xl font-semibold mb-4">Add New Store</h3><form id="add-store-form" class="space-y-4"><input type="text" name="storeName" placeholder="Store Name" aria-label="Store Name" class="w-full p-3 border border-gray-300 rounded-lg" required><input type="text" name="customerName" placeholder="Customer Name" aria-label="Customer Name" class="w-full p-3 border border-gray-300 rounded-lg" required><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="number" step="0.01" name="transport" placeholder="Transportation Charge (₹) (Optional)" aria-label="Transportation Charge" class="w-full p-3 border border-gray-300 rounded-lg"><input type="number" step="0.01" name="storeCommission" placeholder="Store Comm (%)" aria-label="Store Commission Percentage" class="w-full p-3 border border-gray-300 rounded-lg" required></div><input type="text" name="phoneNumber" placeholder="Shop Phone Number" aria-label="Shop Phone Number" class="w-full p-3 border border-gray-300 rounded-lg"><textarea name="details" placeholder="Basic Details" aria-label="Basic Details" rows="2" class="w-full p-3 border border-gray-300 rounded-lg"></textarea><button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Add Store</button></form></div>
        <div class="mt-8 mb-4">
          <input type="text" id="search-store-input" placeholder="Search by Store or Customer Name..." aria-label="Search Store" class="w-full p-3 border border-gray-300 rounded-lg">
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mt-8 mb-4">All Stores</h3><div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">#</th><th class="p-4 font-semibold text-sm">Name</th><th class="p-4 font-semibold text-sm">Customer</th><th class="p-4 font-semibold text-sm">Transport (₹)</th><th class="p-4 font-semibold text-sm">Store Comm (%)</th><th class="p-4 font-semibold text-sm">Phone Number</th><th class="p-4 font-semibold text-sm">Details</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="stores-table-body" class="divide-y divide-gray-200"></tbody></table></div>`,
                    product: () => `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Product Management</h2>
        <div class="bg-white p-6 rounded-xl shadow-md"><h3 class="text-xl font-semibold mb-4">Add New Product</h3><form id="add-product-form" class="space-y-4"><input type="text" name="productName" placeholder="Product Name" aria-label="Product Name" class="w-full p-3 border border-gray-300 rounded-lg" required><input type="number" step="0.01" name="price" placeholder="Price" aria-label="Price" class="w-full p-3 border border-gray-300 rounded-lg" required><button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Add Product</button></form></div>
        <h3 class="text-2xl font-bold text-gray-800 mt-8 mb-4">All Products</h3><div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">#</th><th class="p-4 font-semibold text-sm">Name</th><th class="p-4 font-semibold text-sm">Price ₹</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="products-table-body" class="divide-y divide-gray-200"></tbody></table></div>`,
                    order: () => `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Order Management</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <div class="bg-white p-6 rounded-xl shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Place a New Order</h3>
                    <form id="place-order-form" class="space-y-4">
                        <select id="order-store-select" aria-label="Select Store" class="w-full p-3 border border-gray-300 rounded-lg" required><option value="">Select Store</option></select>
                    </form>
                </div>
                <div id="cart-section" class="bg-white p-6 rounded-xl shadow-md mt-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>Cart</h3>
                    <div id="cart-items" class="space-y-2 min-h-[80px]"></div>
                    <div class="mt-4 text-right border-t pt-4">
                        <p class="font-bold text-lg">Total: <span id="cart-total">₹0.00</span></p>
                        <div id="order-submit-buttons" class="mt-4">
                            <button id="place-order-btn" class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Place Order</button>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Products</h3>
                <div id="order-product-list" class="bg-white p-4 rounded-xl shadow-md space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto"></div>
            </div>
        </div>
        <div class="mt-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 class="text-2xl font-bold text-gray-800">Order Reports</h3>
                  <div class="flex flex-col sm:flex-row items-start sm:items-end gap-2 w-full sm:w-auto">
                      <div class="w-full sm:w-auto">
                          <label for="order-download-date" class="block text-sm font-medium text-gray-700">Select Date</label>
                          <input type="date" id="order-download-date" class="p-2 border border-gray-300 rounded-lg w-full">
                      </div>
                      <button id="download-orders-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                          <span class="hidden sm:inline">Download Report</span>
                      </button>
                      <button id="download-momo-sheet-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                          <span class="hidden sm:inline">Download Momo Sheet</span>
                      </button>
                  </div>
            </div>
            <div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">Date</th><th class="p-4 font-semibold text-sm">Store</th><th class="p-4 font-semibold text-sm">Customer</th><th class="p-4 font-semibold text-sm">Items</th><th class="p-4 font-semibold text-sm">Store Commission</th><th class="p-4 font-semibold text-sm">Order Total</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="todays-orders-table-body" class="divide-y divide-gray-200"></tbody></table></div>
            <div class="mt-8 flex flex-col sm:flex-row justify-end items-start sm:items-center mb-4 gap-4">
                <div class="w-full sm:w-auto">
                    <label for="store-download-select" class="block text-sm font-medium text-gray-700">Select Store for Report</label>
                    <select id="store-download-select" class="p-2 border border-gray-300 rounded-lg w-full">
                        <option value="">Select a Store</option>
                    </select>
                </div>
                <div class="w-full sm:w-auto">
                    <label for="order-store-report-date" class="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" id="order-store-report-date" class="p-2 border border-gray-300 rounded-lg w-full">
                </div>
                <button id="download-store-orders-img-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M15.414 10.586a2 2 0 00-2.828-2.828L7 13.172V17h3.828l5.586-5.586a2 2 0 000-2.828zM14 6a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                    <span class="hidden sm:inline">Download Image</span>
                </button>
                <button id="print-store-report-btn" class="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    <span class="hidden sm:inline">Print Report</span>
                </button>
                <div class="w-full sm:w-auto">
                    <label for="momo-sticker-store-select" class="block text-sm font-medium text-gray-700">Momo Sticker</label>
                    <select id="momo-sticker-store-select" class="p-2 border border-gray-300 rounded-lg w-full">
                        <option value="">Select Store</option>
                    </select>
                </div>
                <button id="download-momo-sticker-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                    <span class="hidden sm:inline">Download Sticker</span>
                </button>
            </div>
        </div>`,
                    return: () => `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Return Management</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <div class="bg-white p-6 rounded-xl shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Record a New Return</h3>
                    <form id="record-return-form" class="space-y-4">
                        <select id="return-store-select" aria-label="Select Store for Return" class="w-full p-3 border border-gray-300 rounded-lg" required><option value="">Select Store for Return</option></select>
                    </form>
                </div>
                <div id="return-cart-section" class="bg-white p-6 rounded-xl shadow-md mt-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l-3 3m3-3l3 3m0 0v-2a4 4 0 014-4h2" /></svg>Return Cart</h3>
                    <div id="return-cart-items" class="space-y-2 min-h-[80px]"></div>
                    <div class="mt-4 text-right border-t pt-4">
                        <p class="font-bold text-lg">Total Return Value: <span id="return-cart-total">₹0.00</span></p>
                        <div id="return-submit-buttons" class="mt-4">
                            <button id="record-return-btn" class="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold">Record Return</button>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Products to Return</h3>
                <div id="return-product-list" class="bg-white p-4 rounded-xl shadow-md space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto"></div>
            </div>
        </div>
            <div class="mt-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 class="text-2xl font-bold text-gray-800">Return Reports</h3>
                  <div class="flex flex-col sm:flex-row items-start sm:items-end gap-2 w-full sm:w-auto">
                       <div class="w-full sm:w-auto">
                          <label for="return-filter-date" class="block text-sm font-medium text-gray-700">Filter by Date</label>
                          <input type="date" id="return-filter-date" class="p-2 border border-gray-300 rounded-lg w-full">
                       </div>
                  </div>
            </div>
            <div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">Date</th><th class="p-4 font-semibold text-sm">Store</th><th class="p-4 font-semibold text-sm">Returned Items</th><th class="p-4 font-semibold text-sm">Total Value</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="returns-table-body" class="divide-y divide-gray-200"></tbody></table></div>
        </div>`,
                   billing: () => `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Billing</h2>
        <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="text-xl font-semibold mb-4">Generate Documents</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div class="flex-grow">
                    <label for="billing-store-select" class="block text-sm font-medium text-gray-700">Store</label>
                    <select id="billing-store-select" class="mt-1 w-full p-3 border border-gray-300 rounded-lg" required><option value="">Select a Store</option></select>
                </div>
                <div class="flex-grow">
                    <label for="billing-date" class="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" id="billing-date" class="mt-1 w-full p-3 border border-gray-300 rounded-lg">
                </div>
                <div class="md:col-span-2 flex flex-col sm:flex-row gap-4 mt-2">
                    <button id="generate-bill-btn" class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold text-center">
                        Generate Bill (Orders)
                    </button>
                    <button id="generate-receipt-btn" class="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold text-center">
                        Generate Payment Receipt
                    </button>
                </div>
            </div>
        </div>
        <div id="bill-output-container" class="mt-8 hidden">
            <div id="bill-output" class="relative bg-white p-8 rounded-xl shadow-lg">
            </div>
            <div class="mt-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                        <button id="share-bill-btn" class="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                            Share
                        </button>
                        <button id="download-bill-btn" class="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold">Download</button>
            </div>
        </div>`,
                    agent: () => {
                            if (!ownerPassword) {
                                return `
        <div class="bg-white p-6 rounded-xl shadow-md text-center">
            <h3 class="text-xl font-semibold mb-4">Welcome!</h3>
            <p class="text-gray-600 mb-6">Please set up an owner password to secure your application and manage agents.</p>
            <form id="initial-owner-signup-form" class="space-y-4 max-w-sm mx-auto">
                <input type="password" id="new-owner-password" placeholder="Enter New Password" aria-label="New Password" class="w-full p-3 border border-gray-300 rounded-lg" required>
                <input type="password" id="confirm-owner-password" placeholder="Confirm New Password" aria-label="Confirm New Password" class="w-full p-3 border border-gray-300 rounded-lg" required>
                <button type="submit" class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Set Password</button>
            </form>
        </div>
    `;
                            }
                            return `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Agent Management</h2>
        <div id="agent-content">
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center space-x-4 w-full">
                    <h3 class="text-2xl font-bold text-gray-800">Agent Dashboard</h3>
                    <div class="w-full max-w-xs">
                        <label for="agent-select-name" class="block text-sm font-medium text-gray-700">Select Agent</label>
                        <select id="agent-select-name" class="p-2 border border-gray-300 rounded-lg w-full">
                            <option value="">Select an Agent</option>
                            ${agents
                              .map(
                                (a) =>
                                  `<option value="${a.agentName}">${a.agentName}</option>`
                              )
                              .join("")}
                        </select>
                    </div>
                </div>
            </div>
            <div id="agent-details-view" class="hidden">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="bg-white p-6 rounded-xl shadow-md">
                        <h3 class="text-xl font-semibold mb-4">Pending Commissions</h3>
                        <div class="overflow-x-auto max-h-96">
                            <table class="w-full text-left"><thead class="bg-gray-50 sticky top-0"><tr><th class="p-4 font-semibold text-sm">Date</th><th class="p-4 font-semibold text-sm">Store</th><th class="p-4 font-semibold text-sm">Commission (%)</th><th class="p-4 font-semibold text-sm">Amount (₹)</th><th class="p-4 font-semibold text-sm">Action</th></tr></thead><tbody id="pending-commissions-table-body" class="divide-y divide-gray-200"></tbody></table>
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-xl shadow-md">
                        <h3 class="text-xl font-semibold mb-4">Paid Commissions History</h3>
                        <div class="overflow-x-auto max-h-96">
                            <table class="w-full text-left"><thead class="bg-gray-50 sticky top-0"><tr><th class="p-4 font-semibold text-sm">Paid Date</th><th class="p-4 font-semibold text-sm">Order Date</th><th class="p-4 font-semibold text-sm">Store</th><th class="p-4 font-semibold text-sm">Commission (%)</th><th class="p-4 font-semibold text-sm">Amount (₹)</th></tr></thead><tbody id="paid-commissions-table-body" class="divide-y divide-gray-200"></tbody></table>
                        </div>
                    </div>
                </div>
                <div class="mt-8 flex flex-col sm:flex-row justify-end items-end gap-4">
                    <div class="flex-grow w-full md:w-auto">
                        <label for="agent-report-month" class="block text-sm font-medium text-gray-700">Month</label>
                        <input type="month" id="agent-report-month" class="p-2 border border-gray-300 rounded-lg w-full">
                    </div>
                    <button id="download-agent-statement-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        <span class="hidden sm:inline">Download Monthly Statement</span>
                    </button>
                </div>
            </div>
            
            <div class="mt-8">
                <div class="bg-white p-6 rounded-xl shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Add New Agent</h3>
                    <form id="add-agent-form" class="space-y-4">
                        <input type="text" name="agentName" placeholder="Agent Name" aria-label="Agent Name" class="w-full p-3 border border-gray-300 rounded-lg" required>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Select Stores & Set Commission</label>
                            <div id="agent-store-list" class="space-y-2 max-h-60 overflow-y-auto border p-4 rounded-lg">
                                ${
                                  stores
                                    .map(
                                      (store) =>
                                        `<div class="flex items-center justify-between"><label class="flex items-center"><input type="checkbox" name="selected_stores" value="${store.storeName}" class="h-4 w-4 text-indigo-600 border-gray-300 rounded"><span class="ml-3 text-gray-700">${store.storeName}</span></label><input type="number" step="0.01" name="commission_${store.storeName}" placeholder="Comm %" aria-label="Commission for ${store.storeName}" class="w-24 p-1 border border-gray-300 rounded-lg text-sm" disabled></div>`
                                    )
                                    .join("") ||
                                  '<p class="text-gray-500">No stores available.</p>'
                                }
                            </div>
                        </div>
                        <button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Save Agent</button>
                    </form>
                </div>
                <div class="mt-8 bg-white rounded-xl shadow-md overflow-x-auto">
                    <h3 class="text-2xl font-bold text-gray-800 mb-4 p-4">All Agents</h3>
                    <table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">#</th><th class="p-4 font-semibold text-sm">Agent Name</th><th class="p-4 font-semibold text-sm">Stores & Commissions</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="agents-table-body" class="divide-y divide-gray-200"></tbody></table>
                </div>
            </div>
        </div>`;
    },
    payment: () => `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Payment Handling</h2>
        <div class="bg-white p-6 rounded-xl shadow-md mb-8">
            <h3 class="text-xl font-semibold mb-4">Record a Due Payment</h3>
            <form id="add-due-payment-form" class="space-y-4">
                <select id="due-payment-store-select" aria-label="Select Store for Due Payment" class="w-full p-3 border border-gray-300 rounded-lg" required>
                    <option value="">Select Store</option>
                </select>
                <div>
                    <label for="dueAmount" class="block text-sm font-medium text-gray-700">Due Amount (₹)</label>
                    <input type="number" step="0.01" name="dueAmount" id="dueAmount" placeholder="Due Amount" class="w-full p-3 border border-gray-300 rounded-lg" required>
                </div>
                <button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Add Due Payment</button>
            </form>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="text-xl font-semibold mb-4">Record a Payment</h3>
            <form id="add-payment-form" class="space-y-4">
                <select id="payment-store-select" aria-label="Select Store for Payment" class="w-full p-3 border border-gray-300 rounded-lg" required>
                    <option value="">Select Store</option>
                </select>
                <div id="store-due-info" class="p-3 bg-yellow-100 text-yellow-800 rounded-lg hidden"></div>
                <div id="store-order-total-info" class="p-3 bg-blue-100 text-blue-800 rounded-lg hidden"></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="cashAmount" class="block text-sm font-medium text-gray-700">Cash Amount (₹)</label>
                        <input type="number" step="0.01" name="cashAmount" id="cashAmount" placeholder="Cash Amount" class="w-full p-3 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label for="onlineAmount" class="block text-sm font-medium text-gray-700">Online Amount (₹)</label>
                        <input type="number" step="0.01" name="onlineAmount" id="onlineAmount" placeholder="Online Amount" class="w-full p-3 border border-gray-300 rounded-lg">
                    </div>
                </div>
                <button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Record Payment</button>
            </form>
        </div>
        <div class="mt-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 class="text-2xl font-bold text-gray-800">Ledger Report</h3>
                <div class="flex flex-col sm:flex-row items-start sm:items-end gap-2 w-full sm:w-auto">
                    <div class="w-full sm:w-auto">
                        <label for="payment-download-store-select" class="block text-sm font-medium text-gray-700">Store</label>
                        <select id="payment-download-store-select" class="p-2 border border-gray-300 rounded-lg w-full">
                            <option value="all">All Stores</option>
                        </select>
                    </div>
                    <div class="w-full sm:w-auto">
                        <label for="payment-download-start-date" class="block text-sm font-medium text-gray-700">From</label>
                        <input type="date" id="payment-download-start-date" class="p-2 border border-gray-300 rounded-lg w-full">
                    </div>
                    <div class="w-full sm:w-auto">
                       <label for="payment-download-end-date" class="block text-sm font-medium text-gray-700">To</label>
                       <input type="date" id="payment-download-end-date" class="p-2 border border-gray-300 rounded-lg w-full">
                    </div>
                    <button id="download-payments-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        <span class="hidden sm:inline">Download Ledger</span>
                    </button>
                    <button id="download-today-sheet-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm2 4a1 1 0 100 2h4a1 1 0 100-2H8zm0 3a1 1 0 100 2h4a1 1 0 100-2H8zm0 3a1 1 0 100 2h2a1 1 0 100-2H8z" clip-rule="evenodd" /></svg>
                        <span class="hidden sm:inline">Today's Payment Sheet</span>
                    </button>
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">Date</th><th class="p-4 font-semibold text-sm">Store</th><th class="p-4 font-semibold text-sm">Cash Amount (₹)</th><th class="p-4 font-semibold text-sm">Online Amount (₹)</th><th class="p-4 font-semibold text-sm">Total Amount (₹)</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="payments-table-body" class="divide-y divide-gray-200"></tbody></table></div>
        </div>`,
    transportation: () => `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Transportation Management</h2>
        <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="text-xl font-semibold mb-4">Assign Transportation</h3>
            <form id="add-transportation-form" class="space-y-4">
                <input type="text" name="transportationName" placeholder="Car/Person Name" aria-label="Car or Person Name" class="w-full p-3 border border-gray-300 rounded-lg" required>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Select Stores</label>
                    <div id="transportation-store-list" class="space-y-2 max-h-60 overflow-y-auto border p-4 rounded-lg">
                        ${
                          stores
                            .map(
                              (store) =>
                                `<label class="flex items-center"><input type="checkbox" name="transport_stores" value="${store.storeName}" class="h-4 w-4 text-indigo-600 border-gray-300 rounded"><span class="ml-3 text-gray-700">${store.storeName}</span></label>`
                            )
                            .join("") ||
                          '<p class="text-gray-500">No stores available.</p>'
                        }
                    </div>
                </div>
                <input type="text" id="edit-deliveryShopCode" placeholder="Delivery Shop Code" aria-label="Delivery Shop Code" class="w-full p-3 border border-gray-300 rounded-lg">
                <div class="flex justify-end space-x-4">
                    <button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Assign</button>
                </div>
            </form>
        </div>
        <div class="mt-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 class="text-2xl font-bold text-gray-800">Transportation Assignments</h3>
                <div class="flex flex-col sm:flex-row items-start sm:items-end gap-2 w-full sm:w-auto">
                    <div class="w-full sm:w-auto">
                        <label for="transport-select-name" class="block text-sm font-medium text-gray-700">Select Transporter</label>
                        <select id="transport-select-name" class="p-2 border border-gray-300 rounded-lg w-full">
                            <option value="all">All Transporters</option>
                        </select>
                    </div>
                    <div class="w-full sm:w-auto">
                        <label for="transport-download-date" class="block text-sm font-medium text-gray-700">Select Date</label>
                        <input type="date" id="transport-download-date" class="p-2 border border-gray-300 rounded-lg w-full">
                    </div>
                    <button id="download-transport-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        <span class="hidden sm:inline">Download Delivery Challan</span>
                    </button>
                    <button id="download-store-details-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        <span class="hidden sm:inline">Download Store Challan</span>
                    </button>
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">Date</th><th class="p-4 font-semibold text-sm">Name</th><th class="p-4 font-semibold text-sm">Assigned Stores</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="transportation-table-body" class="divide-y divide-gray-200"></tbody></table></div>
        </div>`,
  };

  // ---------------------------------------------------------
  // 6. INITIALIZATION & DATA SYNCING
  // ---------------------------------------------------------
  const init = () => {
    loadDataFromCloud();
    renderPage("dashboard");
    editPaymentForm.addEventListener("submit", handleEditPayment);
    cancelEditPaymentBtn.addEventListener("click", () =>
      editPaymentModal.classList.add("hidden")
    );
  };

  // ---------------------------------------------------------
  // 7. CORE FUNCTIONS
  // ---------------------------------------------------------
  const renderPage = (pageName) => {
    const contentDiv = document.getElementById(`content-${pageName}`);
    if (!contentDiv) return;
    if (templates[pageName]) {
      contentDiv.innerHTML = templates[pageName]();
    }
    switch (pageName) {
      case "dashboard":
        bindDashboardListeners();
        break;
      case "store":
        bindStoreListeners();
        renderStores();
        break;
      case "product":
        bindProductListeners();
        renderProducts();
        break;
      case "order":
        bindOrderListeners();
        renderTodaysOrders();
        break;
      case "return":
        bindReturnListeners();
        renderReturnsPage();
        break;
      case "billing":
        bindBillingListeners();
        break;
      case "agent":
        bindAgentListeners();
        break;
      case "payment":
        bindPaymentListeners();
        renderPaymentsPage();
        break;
      case "transportation":
        bindTransportationListeners();
        break;
    }
  };

  const navigateTo = (targetId) => {
    document.getElementById(`nav-${targetId}`).click();
    if (window.innerWidth < 767) {
      sidebar.classList.add("-translate-x-full");
    }
  };

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const pageName = link.id.split("-")[1];
      const performNavigation = () => {
        sidebarLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        pageContents.forEach((content) => {
          content.id === `content-${pageName}`
            ? content.classList.remove("hidden")
            : content.classList.add("hidden");
        });
        renderPage(pageName);
        if (window.innerWidth < 767) {
          sidebar.classList.add("-translate-x-full");
        }
      };
      if (pageName === "agent" && ownerPassword) {
        promptForPassword(() => {
          performNavigation();
        }, "Please enter the owner password to access Agent Management.");
      } else {
        performNavigation();
      }
    });
  });

  mobileMenuButton.addEventListener("click", () => {
    sidebar.classList.toggle("-translate-x-full");
  });

  function bindDashboardListeners() {
    document.querySelectorAll(".dashboard-card").forEach((card) => {
      card.addEventListener("click", () => navigateTo(card.dataset.target));
    });
    updateDashboard();
  }

  function bindStoreListeners() {
    document
      .getElementById("add-store-form")
      .addEventListener("submit", handleAddStore);
    document
      .getElementById("search-store-input")
      .addEventListener("input", (e) => renderStores(e.target.value));
  }

  function bindProductListeners() {
    document
      .getElementById("add-product-form")
      .addEventListener("submit", handleAddProduct);
  }

function bindOrderListeners() {
    // 1. Button Listeners
    document
      .getElementById("place-order-btn")
      .addEventListener("click", handleSubmitOrder);
    document
      .getElementById("download-orders-btn")
      .addEventListener("click", handleDownloadOrdersExcel);
    document
      .getElementById("download-momo-sheet-btn")
      .addEventListener("click", handleDownloadMomoSheet);
    
    // 2. Render Dropdowns and Lists
    renderStoreOptionsForOrder(); 
    renderProductsForOrder();
    
    // 3. Date Picker Listener (THIS IS THE FIX)
    const dateInput = document.getElementById("order-download-date");
    if (dateInput) {
        // Set the input to today's date by default if empty
        if (!dateInput.value) {
            dateInput.value = new Date().toISOString().slice(0, 10);
        }
        // When the user changes the date, update the table
        dateInput.addEventListener("change", (e) => {
            renderTodaysOrders(e.target.value);
        });
    }

    // 4. Keyboard Navigation
    const productList = document.getElementById("order-product-list");
    if (productList) {
        productList.addEventListener("keydown", (e) => {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName === "INPUT" && activeElement.type === "number") {
              const productInputs = document.querySelectorAll('#order-product-list input[type="number"]');
              const currentIndex = Array.from(productInputs).indexOf(activeElement);
              if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault();
                if (currentIndex < productInputs.length - 1) productInputs[currentIndex + 1].focus();
              } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault();
                if (currentIndex > 0) productInputs[currentIndex - 1].focus();
              }
            }
        });
    }

    // 5. Report & Print Listeners
    document
      .getElementById("download-store-orders-img-btn")
      .addEventListener("click", handleDownloadStoreReportImage);

    document
      .getElementById("print-store-report-btn")
      .addEventListener("click", handlePrintStoreReport);

    document
      .getElementById("download-momo-sticker-btn")
      .addEventListener("click", handleDownloadMomoSticker);
  }

  function bindReturnListeners() {
    renderStoreOptionsForReturn();
    renderProductsForReturn();
    document
      .getElementById("record-return-btn")
      .addEventListener("click", handleSubmitReturn);
    document
      .getElementById("return-filter-date")
      .addEventListener("change", (e) => renderReturnsList(e.target.value));
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("return-filter-date").value = today;
    renderReturnsList(today);
    document.getElementById("return-product-list").addEventListener("keydown", (e) => {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === "INPUT" && activeElement.type === "number") {
          const productInputs = document.querySelectorAll('#return-product-list input[type="number"]');
          const parentDivs = Array.from(productInputs).map((input) => input.closest("div"));
          const activeParent = activeElement.closest("div");
          const currentIndex = parentDivs.indexOf(activeParent);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (currentIndex < parentDivs.length - 1) parentDivs[currentIndex + 1].querySelector('input[type="number"]').focus();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (currentIndex > 0) parentDivs[currentIndex - 1].querySelector('input[type="number"]').focus();
          }
        }
      });
  }

function bindBillingListeners() {
    // Listener for the Order Bill
    document
      .getElementById("generate-bill-btn")
      .addEventListener("click", handleGenerateBill);
    
    // Listener for the new Payment Receipt
    document
      .getElementById("generate-receipt-btn")
      .addEventListener("click", handleGeneratePaymentReceipt);

    // Populate Store Dropdown
    const storeSelect = document.getElementById("billing-store-select");
    storeSelect.innerHTML = "<option value=''>Select a Store</option>" + stores
      .map((s) => `<option value="${s.storeName}">${s.storeName}</option>`)
      .join("");
  }

function bindAgentListeners() {
    // 1. Check for Owner Password
    if (!ownerPassword) {
      const signupForm = document.getElementById("initial-owner-signup-form");
      if (signupForm) {
        signupForm.addEventListener("submit", handleOwnerSignup);
      }
      return;
    }

    // 2. Select Elements
    const agentSelect = document.getElementById("agent-select-name");
    const agentDetailsView = document.getElementById("agent-details-view");
    const addAgentForm = document.getElementById("add-agent-form");
    const downloadStatementBtn = document.getElementById("download-agent-statement-btn");

    // 3. Populate Agent Dropdown
    agentSelect.innerHTML =
      `<option value="">Select an Agent</option>` +
      agents
        .map((a) => `<option value="${a.agentName}">${a.agentName}</option>`)
        .join("");

    // 4. Handle Dropdown Change
    agentSelect.addEventListener("change", (e) => {
      const selectedAgentName = e.target.value;
      if (selectedAgentName) {
        agentDetailsView.classList.remove("hidden");
        renderAgentCommissions(selectedAgentName);
      } else {
        agentDetailsView.classList.add("hidden");
      }
    });

    // 5. Handle Download Button
    downloadStatementBtn.addEventListener("click", () => {
      const selectedAgentName = agentSelect.value;
      const monthYear = document.getElementById("agent-report-month").value;
      if (selectedAgentName && monthYear) {
        handleDownloadAgentStatement(selectedAgentName, monthYear);
      } else {
        alert("Please select an agent and a month to download the statement.");
      }
    });

    // 6. Handle Add Agent Form & Checkbox Logic (THE FIX IS HERE)
    if (addAgentForm) {
      addAgentForm.addEventListener("submit", handleAddAgent);
      
      const agentStoreList = document.getElementById("agent-store-list");
      
      // Remove old listener to avoid duplicates if any, then add new one
      const newAgentStoreList = agentStoreList.cloneNode(true);
      agentStoreList.parentNode.replaceChild(newAgentStoreList, agentStoreList);

      newAgentStoreList.addEventListener("change", (e) => {
        if (e.target.type === "checkbox") {
          // FIX: Use DOM traversal to find the sibling input reliably
          // Find the parent container (the flex row)
          const parentRow = e.target.closest('div.flex'); 
          // Find the number input inside that specific row
          const commInput = parentRow.querySelector('input[type="number"]');

          if (commInput) {
            commInput.disabled = !e.target.checked;
            if (!e.target.checked) {
              commInput.value = ""; // Clear value if unchecked
            } else {
              commInput.focus(); // Focus user cursor there immediately
            }
          }
        }
      });
    }

    renderAgents();
  }

function bindPaymentListeners() {
    // 1. Form Listeners
    const addDuePaymentForm = document.getElementById("add-due-payment-form");
    if (addDuePaymentForm) {
      addDuePaymentForm.addEventListener("submit", handleAddDuePayment);
    }
    
    document
      .getElementById("add-payment-form")
      .addEventListener("submit", handleAddPayment);
    
    document
      .getElementById("payment-store-select")
      .addEventListener("change", handlePaymentStoreSelect);

    // 2. Download Button Listeners
    document
      .getElementById("download-payments-btn")
      .addEventListener("click", handleDownloadPaymentsReport);
      
    document
      .getElementById("download-today-sheet-btn")
      .addEventListener("click", handleDownloadTodaySheet);

    // 3. LIVE FILTERING LISTENERS (The Fix)
    // This connects the dropdowns to the table refreshing logic
    const filterStoreSelect = document.getElementById("payment-download-store-select");
    const filterStartDate = document.getElementById("payment-download-start-date");
    const filterEndDate = document.getElementById("payment-download-end-date");

    if (filterStoreSelect) filterStoreSelect.addEventListener("change", renderPaymentHistory);
    if (filterStartDate) filterStartDate.addEventListener("change", renderPaymentHistory);
    if (filterEndDate) filterEndDate.addEventListener("change", renderPaymentHistory);
  }

  function bindTransportationListeners() {
    document
      .getElementById("add-transportation-form")
      .addEventListener("submit", handleAddTransportation);
    const transportSelectName = document.getElementById(
      "transport-select-name"
    );
    transportSelectName.addEventListener("change", () => {
      const downloadButton = document.getElementById("download-transport-btn");
      if (transportSelectName.value === "all") {
        downloadButton.textContent = "Download Delivery Challan";
      } else {
        downloadButton.textContent = "Download Delivery Challan";
      }
      const storeDetailsButton = document.getElementById(
        "download-store-details-btn"
      );
      if (transportSelectName.value === "all") {
        storeDetailsButton.textContent = "Download All Store Challan";
      } else {
        storeDetailsButton.textContent = "Download Store Challan";
      }
    });
    document
      .getElementById("download-transport-btn")
      .addEventListener("click", handleDownloadTransportationExcel);
    document
      .getElementById("download-store-details-btn")
      .addEventListener("click", handleDownloadTransportStoreDetails);
    renderTransportationPage();
  }

  const promptForPassword = (callback, message) => {
    if (!ownerPassword) {
      console.error("Attempted to prompt for password when none is set.");
      document.getElementById("nav-agent").click();
      return;
    }
    passwordCallback = callback;
    document.getElementById("password-prompt-message").textContent =
      message || "Please enter the owner password to proceed.";
    forgotPasswordLink.classList.remove("hidden");
    passwordModal.classList.remove("hidden");
    document.getElementById("password-input").focus();
  };

  passwordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.getElementById("password-input").value;
    if (password === ownerPassword) {
      passwordModal.classList.add("hidden");
      passwordError.classList.add("hidden");
      document.getElementById("password-input").value = "";
      if (passwordCallback) {
        passwordCallback();
        passwordCallback = null;
      }
    } else {
      passwordError.classList.remove("hidden");
    }
  });

  cancelPasswordBtn.addEventListener("click", () => {
    passwordModal.classList.add("hidden");
    passwordError.classList.add("hidden");
    document.getElementById("password-input").value = "";
    passwordCallback = null;
  });

  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    passwordModal.classList.add("hidden");
    resetPasswordModal.classList.remove("hidden");
    document.getElementById("new-owner-password-reset").focus();
  });

  resetPasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newPassword = document.getElementById(
      "new-owner-password-reset"
    ).value;
    const confirmPassword = document.getElementById(
      "confirm-owner-password-reset"
    ).value;
    if (newPassword.length < 4) {
      resetPasswordError.textContent =
        "Password must be at least 4 characters long.";
      resetPasswordError.classList.remove("hidden");
      return;
    }
    if (newPassword !== confirmPassword) {
      resetPasswordError.textContent = "Passwords do not match.";
      resetPasswordError.classList.remove("hidden");
    } else {
      ownerPassword = newPassword;
      saveData();
      resetPasswordError.classList.add("hidden");
      resetPasswordModal.classList.add("hidden");
      alert("Password has been reset successfully!");
      resetPasswordForm.reset();
      passwordCallback = null;
    }
  });

  cancelResetPasswordBtn.addEventListener("click", () => {
    resetPasswordModal.classList.add("hidden");
    resetPasswordError.classList.add("hidden");
    resetPasswordForm.reset();
  });

  const updateDashboard = () => {
    const totalStoresEl = document.getElementById("dashboard-total-stores");
    const totalProductsEl = document.getElementById("dashboard-total-products");
    const todaysOrdersEl = document.getElementById("dashboard-todays-orders");
    const totalAgentsEl = document.getElementById("dashboard-total-agents");
    if (!totalStoresEl) return;
    totalStoresEl.textContent = stores.length;
    totalProductsEl.textContent = products.length;
    totalAgentsEl.textContent = agents.length;
    const today = new Date().toISOString().slice(0, 10);
    todaysOrdersEl.textContent = orders.filter((o) =>
      o.date.startsWith(today)
    ).length;
  };

  const renderStores = (searchTerm = "") => {
    const storesTableBody = document.getElementById("stores-table-body");
    if (!storesTableBody) return;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filteredStores = stores
      .map((store, index) => ({
        ...store,
        originalIndex: index,
      }))
      .filter(
        (store) =>
          store.storeName.toLowerCase().includes(lowerCaseSearchTerm) ||
          store.customerName.toLowerCase().includes(lowerCaseSearchTerm)
      );
    if (filteredStores.length === 0) {
      const message = searchTerm ? "No stores found." : "No stores added yet.";
      storesTableBody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-gray-500">${message}</td></tr>`;
      return;
    }
    storesTableBody.innerHTML = filteredStores
      .map(
        (store, displayIndex) => `
        <tr class="hover:bg-gray-50">
            <td class="p-4">${displayIndex + 1}</td>
            <td class="p-4 font-medium">${store.storeName}</td>
            <td class="p-4">${store.customerName}</td>
            <td class="p-4">₹${store.transport || 0}</td>
            <td class="p-4">${store.storeCommission}%</td>
            <td class="p-4">${store.phoneNumber || ""}</td>
            <td class="p-4">${store.details}</td>
            <td class="p-4 space-x-2"><button class="text-blue-600 hover:text-blue-800 font-semibold" onclick="openEditStoreModal(${
              store.originalIndex
            })">Edit</button><button class="text-red-500 hover:text-red-700 font-semibold" onclick="removeStore(${
          store.originalIndex
        })">Delete</button></td>
        </tr>`
      )
      .join("");
  };

  const renderProducts = () => {
    const productsTableBody = document.getElementById("products-table-body");
    if (!productsTableBody) return;
    productsTableBody.innerHTML =
      products
        .map(
          (product, index) => `
        <tr class="hover:bg-gray-50">
            <td class="p-4">${index + 1}</td>
            <td class="p-4 font-medium">${product.productName}</td>
            <td class="p-4">₹${product.price}</td>
            <td class="p-4 space-x-2"><button class="text-blue-600 hover:text-blue-800 font-semibold" onclick="openEditProductModal(${index})">Edit</button><button class="text-red-500 hover:text-red-700 font-semibold" onclick="removeProduct(${index})">Delete</button></td>
        </tr>`
        )
        .join("") ||
      `<tr><td colspan="4" class="text-center p-4 text-gray-500">No products added yet.</td></tr>`;
  };

const renderStoreOptionsForOrder = () => {
    const orderStoreSelect = document.getElementById("order-store-select");
    const storeDownloadSelect = document.getElementById("store-download-select");
    const momoStickerStoreSelect = document.getElementById("momo-sticker-store-select");

    if (!orderStoreSelect) return;

    const allStoresInvolved = [
      ...new Set(stores.map((s) => s.storeName)),
    ].sort();

    const storeOptions =
      "<option value=''>Select Store</option>" +
      allStoresInvolved
        .map((store) => `<option value="${store}">${store}</option>`)
        .join("");

    orderStoreSelect.innerHTML = storeOptions;

    if (storeDownloadSelect) {
      storeDownloadSelect.innerHTML = storeOptions;
    }

    // This part adds the "All Stores" option
    if (momoStickerStoreSelect) {
      momoStickerStoreSelect.innerHTML =
        "<option value=''>Select Store</option><option value='all'>All Stores</option>" +
        allStoresInvolved
          .map((store) => `<option value="${store}">${store}</option>`)
          .join("");
    }
  };

  // Simplified Product List for Order (No +/- buttons)
  const renderProductsForOrder = () => {
    const orderProductList = document.getElementById("order-product-list");
    if (!orderProductList) return;
    orderProductList.innerHTML = products.length
      ? products
          .map(
            (product, index) => `
          <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
              <div><p class="font-semibold">${product.productName}</p><p class="text-sm text-gray-600">₹${product.price}</p></div>
              <div class="flex items-center space-x-2">
                  <input type="number" step="0.01" value="0" min="0" aria-label="Quantity for ${product.productName}" class="w-20 text-center border rounded-md p-2" onchange="setCartQuantity(${index}, this.value)">
              </div>
          </div>`
          )
          .join("")
      : `<p class="text-gray-500 p-4">Add products to see them here.</p>`;
  };

  const renderCart = () => {
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalEl = document.getElementById("cart-total");
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = cart.length
      ? cart
          .map(
            (item, index) => `
        <div class="flex justify-between items-center">
            <div><span class="font-medium">${item.productName}</span> x ${
              item.quantity
            }</div>
            <div class="flex items-center space-x-2"><span>₹${(
              item.price * item.quantity
            ).toFixed(
              2
            )}</span><button class="text-red-500 text-xs font-bold" onclick="removeFromCart(${index})">X</button></div>
        </div>`
          )
          .join("")
      : `<p class="text-gray-500 p-4">No items in cart</p>`;
    cartTotalEl.textContent = `₹${cart
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2)}`;
    const productInputs = document.querySelectorAll(
      '#order-product-list input[type="number"]'
    );
    productInputs.forEach((input, index) => {
      const product = products[index];
      const cartItem = cart.find(
        (item) => item.productName === product.productName
      );
      input.value = cartItem ? cartItem.quantity : 0;
    });
  };

            function handleGeneratePaymentReceipt() {
    const storeName = document.getElementById("billing-store-select").value;
    const billDate = document.getElementById("billing-date").value;

    if (!storeName || !billDate) {
      alert("Please select a store and a date.");
      return;
    }

    // 1. Fetch Payments for that specific date
    const relevantPayments = payments.filter((p) => {
      const paymentDate = new Date(p.date).toISOString().slice(0, 10);
      return p.storeName === storeName && paymentDate === billDate;
    });

    if (relevantPayments.length === 0) {
      alert(`No payments found for ${storeName} on ${new Date(billDate).toLocaleDateString("en-GB")}.`);
      return;
    }

    // 2. Calculate Totals
    const cashPaid = relevantPayments.reduce((sum, p) => sum + (p.cashAmount || 0), 0);
    const onlinePaid = relevantPayments.reduce((sum, p) => sum + (p.onlineAmount || 0), 0);
    const totalPaid = cashPaid + onlinePaid;

    // 3. Calculate Dues
    // "Previous Due" is the balance BEFORE this date's transactions
    const previousDue = calculateDue(storeName, billDate, false);
    
    // "Current Due" is the balance AFTER this date's transactions (inclusive)
    const currentDueAmount = calculateDue(storeName, billDate, true);

    const billOutput = document.getElementById("bill-output");

    // 4. Generate HTML
    billOutput.innerHTML = `
        <div class="relative min-h-[300px]">
            <img src="image_6a1dd8.png" alt="CastleMOMO Logo" class="bill-watermark">
            
            <div class="flex items-center space-x-4 mb-6 border-b pb-4">
                <img src="image_6a1dd8.png" alt="CastleMOMO Logo" class="h-16 w-16">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">PAYMENT RECEIPT</h2>
                    <p class="text-gray-600 font-semibold">${storeName}</p>
                    <p class="text-sm text-gray-500">Date: ${new Date(billDate).toLocaleDateString("en-GB")}</p>
                </div>
            </div>

            <div class="mb-8">
                <p class="text-lg text-gray-700 mb-4">Received with thanks from <strong>${storeName}</strong>:</p>
                
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div class="flex justify-between mb-2">
                        <span class="text-gray-600">Cash Payment:</span>
                        <span class="font-semibold">₹${cashPaid.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span class="text-gray-600">Online Payment:</span>
                        <span class="font-semibold">₹${onlinePaid.toFixed(2)}</span>
                    </div>
                    <div class="border-t border-gray-300 my-2"></div>
                    <div class="flex justify-between text-lg text-green-700">
                        <span class="font-bold">Total Received:</span>
                        <span class="font-bold">₹${totalPaid.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div class="text-right space-y-2">
                <p class="text-gray-600">Previous Balance: <span class="font-medium text-gray-800">₹${previousDue.toFixed(2)}</span></p>
                <p class="text-gray-600">Less: Paid Amount: <span class="font-medium text-gray-800">₹${totalPaid.toFixed(2)}</span></p>
                <div class="border-t border-gray-300 w-1/2 ml-auto my-2"></div>
                <p class="text-xl font-bold text-gray-900">Current Balance Due: ₹${currentDueAmount.toFixed(2)}</p>
            </div>
            
            <div class="mt-12 text-center text-xs text-gray-400">
                <p>This is a computer-generated receipt.</p>
            </div>
        </div>
    `;

    document.getElementById("bill-output-container").classList.remove("hidden");

    // Set up buttons for Sharing/Downloading
    document.getElementById("share-bill-btn").onclick = () => shareBillAsImage(storeName + "_Receipt", billOutput);
    document.getElementById("download-bill-btn").onclick = () => downloadBillAsImage(storeName + "_Receipt", billOutput);
  }

const renderTodaysOrders = (dateString = null) => {
    const todaysOrdersTableBody = document.getElementById("todays-orders-table-body");
    if (!todaysOrdersTableBody) return;

    // Use the provided date, or default to today if none is provided
    const targetDate = dateString || new Date().toISOString().slice(0, 10);

    // Filter orders by the target date
    const filteredOrders = orders.filter((o) => o.date.startsWith(targetDate));

    todaysOrdersTableBody.innerHTML = filteredOrders.length
      ? filteredOrders
          .map(
            (order) => `
        <tr class="hover:bg-gray-50">
            <td class="p-4">${new Date(order.date).toLocaleString()}</td>
            <td class="p-4 font-medium">${order.storeName}</td>
            <td class="p-4">${order.customerName}</td>
            <td class="p-4 text-sm">${order.items
              .map(
                (item) => `<div>${item.productName} x ${item.quantity}</div>`
              )
              .join("")}</td>
            <td class="p-4 text-sm">₹${(
              order.itemsTotal *
              (order.storeCommission / 100)
            ).toFixed(2)}</td>
            <td class="p-4 font-semibold">₹${order.total.toFixed(2)}</td>
            <td class="p-4 space-x-2">
                <button class="text-blue-600 hover:text-blue-800 font-semibold text-sm" onclick="editOrder('${
                  order.orderId
                }')">Edit</button>
                <button class="text-red-500 hover:text-red-700 font-semibold text-sm" onclick="deleteOrder('${
                  order.orderId
                }')">Delete</button>
            </td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="7" class="text-center p-4 text-gray-500">No orders found for ${targetDate}.</td></tr>`;
  };

  const renderAgents = () => {
    const agentsTableBody = document.getElementById("agents-table-body");
    if (!agentsTableBody) return;
    agentsTableBody.innerHTML =
      agents
        .map(
          (agent, index) => `
        <tr class="hover:bg-gray-50">
            <td class="p-4">${index + 1}</td>
            <td class="p-4 font-medium">${agent.agentName}</td>
            <td class="p-4 text-sm">${Object.entries(agent.commissions)
              .map(
                ([store, comm]) =>
                  `<div><strong>${store}:</strong> ${comm}%</div>`
              )
              .join("")}</td>
            <td class="p-4 space-x-2"><button class="text-red-500 hover:text-red-700 font-semibold" onclick="removeAgent(${index})">Delete</button></td>
        </tr>`
        )
        .join("") ||
      `<tr><td colspan="4" class="text-center p-4 text-gray-500">No agents added yet.</td></tr>`;
  };

  const renderAgentCommissions = (agentName) => {
    const pendingTableBody = document.getElementById("pending-commissions-table-body");
    const paidTableBody = document.getElementById("paid-commissions-table-body");
    const agent = agents.find((a) => a.agentName === agentName);
    if (!agent) {
      pendingTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">Agent not found.</td></tr>`;
      paidTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">Agent not found.</td></tr>`;
      return;
    }
    const agentPendingCommissions = pendingCommissions.filter(
      (c) => c.agentName === agentName
    );
    const agentPaidCommissions = paidCommissions.filter(
      (c) => c.agentName === agentName
    );
    pendingTableBody.innerHTML = agentPendingCommissions.length
      ? agentPendingCommissions
          .map((c) => {
            const commissionRate = agent?.commissions[c.storeName] || 0;
            const amountText =
              c.commissionAmount >= 0
                ? `₹${c.commissionAmount.toFixed(2)}`
                : `-₹${(-c.commissionAmount).toFixed(2)}`;
            const actionButton =
              c.commissionAmount >= 0
                ? `<button class="text-green-600 hover:text-green-800 font-semibold" onclick="payCommission('${
                    c.orderId || c.returnId
                  }')">Pay</button>`
                : "";

            return `
                      <tr class="hover:bg-gray-50">
                          <td class="p-4">${new Date(
                            c.date
                          ).toLocaleDateString()}</td>
                          <td class="p-4">${c.storeName}</td>
                          <td class="p-4">${commissionRate}%</td>
                          <td class="p-4 font-semibold">${amountText}</td>
                          <td class="p-4">${actionButton}</td>
                      </tr>
                      `;
          })
          .reverse()
          .join("")
      : `<tr><td colspan="5" class="text-center p-4 text-gray-500">No pending commissions.</td></tr>`;
    paidTableBody.innerHTML = agentPaidCommissions.length
      ? agentPaidCommissions
          .map((c) => {
            const commissionRate = agent?.commissions[c.storeName] || 0;
            return `
                      <tr class="hover:bg-gray-50">
                          <td class="p-4">${new Date(
                            c.paidDate
                          ).toLocaleDateString()}</td>
                          <td class="p-4">${new Date(
                            c.date
                          ).toLocaleDateString()}</td>
                          <td class="p-4">${c.storeName}</td>
                          <td class="p-4">${commissionRate}%</td>
                          <td class="p-4 font-semibold">₹${c.commissionAmount.toFixed(
                            2
                          )}</td>
                      </tr>
                      `;
          })
          .reverse()
          .join("")
      : `<tr><td colspan="5" class="text-center p-4 text-gray-500">No paid commissions history.</td></tr>`;
  };

  const renderTransportationPage = () => {
    const transportationTableBody = document.getElementById("transportation-table-body");
    const transportSelectName = document.getElementById("transport-select-name");
    const transporters = [
      ...new Set(transportation.map((t) => t.transportationName)),
    ];
    transportSelectName.innerHTML =
      `<option value="all">All Transporters</option>` +
      transporters
        .map((name) => `<option value="${name}">${name}</option>`)
        .join("");
    if (!transportationTableBody) return;
    transportationTableBody.innerHTML =
      transportation
        .map(
          (item, index) => `
            <tr class="hover:bg-gray-50">
                <td class="p-4">${new Date(item.date).toLocaleDateString()}</td>
                <td class="p-4 font-medium">${item.transportationName}</td>
                <td class="p-4 text-sm">${item.stores.join(", ")}</td>
                <td class="p-4 space-x-2">
                    <button class="text-blue-600 hover:text-blue-800 font-semibold" onclick="openEditTransportationModal(${index})">Edit</button>
                    <button class="text-red-500 hover:text-red-700 font-semibold" onclick="removeTransportation(${index})">Delete</button>
                </td>
            </tr>`
        )
        .join("") ||
      `<tr><td colspan="4" class="text-center p-4 text-gray-500">No transportation assigned yet.</td></tr>`;
  };

  const renderPaymentsPage = () => {
    const paymentStoreSelect = document.getElementById("payment-store-select");
    const duePaymentStoreSelect = document.getElementById("due-payment-store-select");
    const paymentDownloadStoreSelect = document.getElementById("payment-download-store-select");
    if (!paymentStoreSelect) return;
    const allStoreOptions = stores
      .map(
        (store) =>
          `<option value="${store.storeName}">${store.storeName}</option>`
      )
      .join("");
    paymentStoreSelect.innerHTML =
      "<option value=''>Select Store</option>" + allStoreOptions;
    if (duePaymentStoreSelect) {
      duePaymentStoreSelect.innerHTML =
        "<option value=''>Select Store</option>" + allStoreOptions;
    }
    if (paymentDownloadStoreSelect) {
      const allStoresInvolved = [
        ...new Set([
          ...orders.map((o) => o.storeName),
          ...payments.map((p) => p.storeName),
          ...duePayments.map((dp) => dp.storeName),
        ]),
      ].sort();
      const paymentStoreOptions = allStoresInvolved
        .map(
          (storeName) => `<option value="${storeName}">${storeName}</option>`
        )
        .join("");
      paymentDownloadStoreSelect.innerHTML =
        "<option value='all'>All Stores</option>" + paymentStoreOptions;
    }
    renderPaymentHistory();
  };

const renderPaymentHistory = () => {
    const paymentsTableBody = document.getElementById("payments-table-body");
    if (!paymentsTableBody) return;

    // 1. Get Filter Values
    const storeFilter = document.getElementById("payment-download-store-select")?.value || "all";
    const startDate = document.getElementById("payment-download-start-date")?.value;
    const endDate = document.getElementById("payment-download-end-date")?.value;

    // 2. Filter the Data
    const filteredPayments = payments.filter((payment) => {
      // Check Store
      if (storeFilter !== "all" && payment.storeName !== storeFilter) {
        return false;
      }
      
      // Check Date Range (only if dates are selected)
      const paymentDate = payment.date.slice(0, 10); // YYYY-MM-DD
      if (startDate && paymentDate < startDate) return false;
      if (endDate && paymentDate > endDate) return false;

      return true;
    });

    // 3. Render the Table
    paymentsTableBody.innerHTML = filteredPayments.length
      ? filteredPayments
          .map(
            (payment, index) => `
        <tr class="hover:bg-gray-50">
            <td class="p-4">${new Date(payment.date).toLocaleString()}</td>
            <td class="p-4 font-medium">${payment.storeName}</td>
            <td class="p-4">₹${(payment.cashAmount || 0).toFixed(2)}</td>
            <td class="p-4">₹${(payment.onlineAmount || 0).toFixed(2)}</td>
            <td class="p-4 font-semibold">₹${(
              (payment.cashAmount || 0) + (payment.onlineAmount || 0)
            ).toFixed(2)}</td>
            <td class="p-4 space-x-2">
                <button class="text-blue-600 hover:text-blue-800 font-semibold" onclick="openEditPaymentModal(${
                    // We need to find the original index because filtered array indices won't match
                    payments.indexOf(payment) 
                })">Edit</button>
                <button class="text-red-500 hover:text-red-700 font-semibold" onclick="removePayment(${
                    payments.indexOf(payment)
                })">Delete</button>
            </td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="6" class="text-center p-4 text-gray-500">No payments found for the selected criteria.</td></tr>`;
  };

  function handleAddStore(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    stores.push({
      storeName: formData.get("storeName"),
      customerName: formData.get("customerName"),
      transport: parseFloat(formData.get("transport")) || 0,
      storeCommission: parseFloat(formData.get("storeCommission")) || 0,
      phoneNumber: formData.get("phoneNumber"),
      details: formData.get("details"),
    });
    saveData();
    renderStores();
    updateDashboard();
    e.target.reset();
  }

  function handleAddProduct(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    products.push({
      productName: formData.get("productName"),
      price: parseFloat(formData.get("price")),
    });
    saveData();
    renderProducts();
    updateDashboard();
    e.target.reset();
  }

  function handleSubmitOrder() {
    if (currentEditingOrderId) {
      const orderIndex = orders.findIndex(
        (o) => o.orderId === currentEditingOrderId
      );
      if (orderIndex === -1) {
        alert("Error: Original order not found for update.");
        cancelEdit();
        return;
      }
      if (cart.length === 0) {
        alert(
          "Cart cannot be empty. To delete an order, use the delete button."
        );
        return;
      }

      const itemsTotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const originalOrder = orders[orderIndex];

      originalOrder.items = cart;
      originalOrder.itemsTotal = itemsTotal;
      originalOrder.total = itemsTotal + originalOrder.transportCharge;

      const commIndex = pendingCommissions.findIndex(
        (c) => c.orderId === currentEditingOrderId
      );
      const agent = agents.find((a) =>
        a.commissions.hasOwnProperty(originalOrder.storeName)
      );

      if (commIndex > -1) {
        if (agent) {
          const commissionRate = agent.commissions[originalOrder.storeName];
          const newCommissionAmount = itemsTotal * (commissionRate / 100);
          pendingCommissions[commIndex].commissionAmount = newCommissionAmount;
        } else {
          pendingCommissions.splice(commIndex, 1);
        }
      } else if (agent) {
        const commissionRate = agent.commissions[originalOrder.storeName];
        const commissionAmount = itemsTotal * (commissionRate / 100);
        pendingCommissions.push({
          agentName: agent.agentName,
          storeName: originalOrder.storeName,
          orderId: originalOrder.orderId,
          date: originalOrder.date,
          commissionAmount: commissionAmount,
        });
      }

      saveData();
      alert("Order updated successfully!");
      cancelEdit();
      renderTodaysOrders();
    } else {
      const storeName = document.getElementById("order-store-select").value;
      const store = stores.find((s) => s.storeName === storeName);
      if (!store || cart.length === 0) {
        alert("Please select a store and add items to the cart.");
        return;
      }
      const itemsTotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const orderId = Date.now().toString();
      const newOrder = {
        orderId,
        date: new Date().toISOString(),
        storeName,
        customerName: store.customerName,
        items: cart,
        itemsTotal,
        transportCharge: store.transport || 0,
        storeCommission: store.storeCommission || 0,
        total: itemsTotal + (store.transport || 0),
      };
      orders.push(newOrder);

      const agent = agents.find((a) => a.commissions.hasOwnProperty(storeName));
      if (agent) {
        const commissionRate = agent.commissions[storeName];
        const commissionAmount = newOrder.itemsTotal * (commissionRate / 100);
        pendingCommissions.push({
          agentName: agent.agentName,
          storeName: newOrder.storeName,
          orderId: newOrder.orderId,
          date: newOrder.date,
          commissionAmount: commissionAmount,
        });
      }
      saveData();
      alert("Order placed successfully!");
      cart = [];
      renderCart();
      document.getElementById("place-order-form").reset();
      renderTodaysOrders();
      updateDashboard();
    }
  }

function handleGenerateBill() {
    const storeName = document.getElementById("billing-store-select").value;
    const billDate = document.getElementById("billing-date").value;
    if (!storeName || !billDate) {
      alert("Please select a store and a date.");
      return;
    }
    const store = stores.find((s) => s.storeName === storeName);

    const relevantOrders = orders.filter((o) => {
      const orderDate = new Date(o.date).toISOString().slice(0, 10);
      return o.storeName === storeName && orderDate === billDate;
    });

    const relevantReturns = returns.filter((r) => {
      const returnDate = new Date(r.date).toISOString().slice(0, 10);
      return r.storeName === storeName && returnDate === billDate;
    });

    if (relevantOrders.length === 0 && relevantReturns.length === 0) {
      alert(
        `No orders or returns found for ${storeName} on ${new Date(
          billDate
        ).toLocaleDateString("en-GB")}.`
      );
      return;
    }

    const relevantPayments = payments.filter((p) => {
      const paymentDate = new Date(p.date).toISOString().slice(0, 10);
      return p.storeName === storeName && paymentDate === billDate;
    });
    const cashPaid = relevantPayments.reduce(
      (sum, p) => sum + (p.cashAmount || 0),
      0
    );
    const onlinePaid = relevantPayments.reduce(
      (sum, p) => sum + (p.onlineAmount || 0),
      0
    );

    const previousDue = calculateDue(storeName, billDate, false);
    const currentDueAmount = calculateDue(storeName, billDate, true);

    const billOutput = document.getElementById("bill-output");

    let ordersHtml = "";
    if (relevantOrders.length > 0) {
      ordersHtml = `
            <h3 class="text-lg font-semibold border-b pb-2 mb-4">Orders for ${new Date(
              billDate
            ).toLocaleDateString("en-GB")}</h3>
            ${relevantOrders
              .map((order) => {
                const storeCommissionValue =
                  order.itemsTotal * (order.storeCommission / 100);
                return `
                <div class="mb-4 border-b pb-4">
                    <p><strong>Order Time:</strong> ${new Date(
                      order.date
                    ).toLocaleTimeString()}</p>
                    <table class="w-full text-sm mt-2">
                        <thead><tr class="border-b"><th class="text-left py-1">Item</th><th class="text-right py-1">Qty</th><th class="text-right py-1">Price</th><th class="text-right py-1">Total</th></tr></thead>
                        <tbody>${order.items
                          .map(
                            (item) =>
                              `<tr><td class="py-1">${
                                item.productName
                              }</td><td class="text-right py-1">${
                                item.quantity
                              }</td><td class="text-right py-1">₹${
                                item.price
                              }</td><td class="text-right py-1">₹${(
                                item.quantity * item.price
                              ).toFixed(2)}</td></tr>`
                          )
                          .join("")}</tbody>
                    </table>
                    <div class="text-right mt-2 space-y-1">
                        <p class="font-semibold">Items Total: ₹${order.itemsTotal.toFixed(
                          2
                        )}</p>
                        <p class="text-sm">Transport: + ₹${order.transportCharge.toFixed(
                          2
                        )}</p>
                        <p class="text-sm text-red-500">Store Commission: - ₹${storeCommissionValue.toFixed(
                          2
                        )}</p>
                        <p class="font-bold text-lg">Order Net Total: ₹${(
                          order.total - storeCommissionValue
                        ).toFixed(2)}</p>
                    </div>
                </div>`;
              })
              .join("")}`;
    } else {
      ordersHtml = `<h3 class="text-lg font-semibold border-b pb-2 mb-4">Orders</h3><p class='text-gray-500'>No orders for this day.</p>`;
    }

    let returnsHtml = "";
    if (relevantReturns.length > 0) {
      const combinedReturnItems = relevantReturns.flatMap((r) => r.items);
      const totalReturnValue = relevantReturns.reduce(
        (sum, r) => sum + r.totalReturnValue,
        0
      );
      const totalReturnCommission = relevantReturns.reduce(
        (sum, r) => sum + r.commissionAdjustment,
        0
      );

      returnsHtml = `
            <h3 class="text-lg font-semibold border-b pb-2 mb-4 mt-6">Returns</h3>
            <table class="w-full text-sm mt-2">
                <thead><tr class="border-b"><th class="text-left py-1">Item</th><th class="text-right py-1">Qty</th><th class="text-right py-1">Price</th><th class="text-right py-1">Total</th></tr></thead>
                <tbody>
                    ${combinedReturnItems
                      .map(
                        (item) =>
                          `<tr><td class="py-1">${
                            item.productName
                          }</td><td class="text-right py-1">${
                            item.quantity
                          }</td><td class="text-right py-1">₹${
                            item.price
                          }</td><td class="text-right py-1">₹${(
                            item.quantity * item.price
                          ).toFixed(2)}</td></tr>`
                      )
                      .join("")}
                </tbody>
            </table>
            <div class="text-right mt-2 space-y-1">
                <p class="font-semibold">Returned Value: ₹${totalReturnValue.toFixed(
                  2
                )}</p>
                <p class="text-sm text-green-600">Commission Reversal: + ₹${totalReturnCommission.toFixed(
                  2
                )}</p>
                <p class="font-bold text-lg text-red-500">Net Return Value: - ₹${(
                  totalReturnValue - totalReturnCommission
                ).toFixed(2)}</p>
            </div>
        `;
    } else {
      returnsHtml = `<h3 class="text-lg font-semibold border-b pb-2 mb-4 mt-6">Returns</h3><p class="text-gray-500">No returns for this day.</p>`;
    }

    // --- MODIFICATION: Removed the "Previous Due Payment Added" logic here ---

    billOutput.innerHTML = `
                <div class="relative min-h-[300px]">
                    <img src="image_6a1dd8.png" alt="CastleMOMO Logo" class="bill-watermark">
                    <div class="flex items-center space-x-2 mb-4">
                        <img src="image_6a1dd8.png" alt="CastleMOMO Logo" class="h-12 w-12">
                        <h2 class="text-xl font-bold">Bill for ${storeName}</h2>
                    </div>
                    ${ordersHtml}
                    ${returnsHtml}
                    <div class="border-t mt-8 pt-4">
                        <h3 class="text-lg font-semibold border-b pb-2 mb-4">Payment Summary</h3>
                        <div class="text-right space-y-1">
                            <p>Paid by Cash: ₹${cashPaid.toFixed(2)}</p>
                            <p>Paid by Online: ₹${onlinePaid.toFixed(2)}</p>
                        </div>
                    </div>
                    <div class="border-t mt-8 pt-4 text-right">
                        
                        <p class="text-lg">Total Previous Due: ₹${previousDue.toFixed(
                          2
                        )}</p>
                        <p class="text-2xl font-bold mt-4">Current Due Amount: ₹${currentDueAmount.toFixed(
                          2
                        )}</p>
                    </div>
                </div>
            `;
    document
      .getElementById("bill-output-container")
      .classList.remove("hidden");

    document.getElementById("share-bill-btn").onclick = () =>
      shareBillAsImage(storeName, billOutput);
    document.getElementById("download-bill-btn").onclick = () =>
      downloadBillAsImage(storeName, billOutput);
  }

  function handleDownloadOrdersExcel() {
    const selectedDate = document.getElementById("order-download-date").value;

    if (!selectedDate) {
      alert("Please select a date for the report.");
      return;
    }

    const filteredOrders = orders.filter((o) => {
      const orderDate = o.date.slice(0, 10);
      return orderDate === selectedDate;
    });

    if (filteredOrders.length === 0) {
      alert("No orders found for the selected date.");
      return;
    }

    const allStoreNames = [
      ...new Set(filteredOrders.map((o) => o.storeName)),
    ].sort();

    const allProductNames = products.map((p) => p.productName);

    const reportData = allProductNames.map((pName) => {
      const row = {
        Item: pName,
      };
      let totalQuantity = 0;
      allStoreNames.forEach((sName) => {
        const quantity = filteredOrders
          .filter((o) => o.storeName === sName)
          .flatMap((o) => o.items)
          .filter((i) => i.productName === pName)
          .reduce((sum, item) => sum + item.quantity, 0);
        row[sName] = quantity > 0 ? quantity : "";
        totalQuantity += quantity;
      });
      row["Total"] = totalQuantity;
      row["Stock"] = "";
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");
    const fileName = `Order_Report_${selectedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  // --- NEW: Print Store Report Directly ---
  function handlePrintStoreReport() {
    const storeName = document.getElementById("store-download-select").value;
    const date = document.getElementById("order-store-report-date").value;

    if (!storeName || !date) {
      alert("Please select a store and a date to print the report.");
      return;
    }

    const filteredOrders = orders.filter(
      (o) => o.storeName === storeName && o.date.startsWith(date)
    );

    if (filteredOrders.length === 0) {
      alert(
        `No orders found for store: ${storeName} on ${new Date(
          date
        ).toLocaleDateString("en-GB")}.`
      );
      return;
    }

    const aggregatedItems = {};
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!aggregatedItems[item.productName]) {
          aggregatedItems[item.productName] = 0;
        }
        aggregatedItems[item.productName] += item.quantity;
      });
    });

    const dateStr = new Date(date).toLocaleDateString("en-GB");

    // Generate the Receipt HTML
    const printContent = `
      <html>
        <head>
          <title>Print Receipt - ${storeName}</title>
          <style>
            @page { size: 75mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 70mm; 
              margin: 0 auto; 
              padding: 10px;
              color: #000;
              background-color: #fff;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            h2 { font-size: 16px; font-weight: bold; margin: 5px 0; text-transform: uppercase; }
            p { font-size: 10px; margin: 0; }
            .dashed-line { border-bottom: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { font-size: 11px; text-transform: uppercase; padding-bottom: 5px; }
            td { font-size: 12px; font-weight: bold; padding: 4px 0; }
            img { width: 120px; height: auto; display: block; margin: 0 auto 5px; opacity: 1.0; }
          </style>
        </head>
        <body>
          <div class="text-center">
             <img src="image_6a1dd8.png" alt="">
             <h2>${storeName}</h2>
             <p>DATE: ${dateStr}</p>
             <p>REPORT TYPE: DAILY ORDER</p>
          </div>
          <div class="dashed-line"></div>
          <table>
            <thead>
              <tr>
                <th class="text-left">ITEM</th>
                <th class="text-right">QTY</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(aggregatedItems)
                .map(
                  ([item, quantity]) => `
                  <tr>
                    <td>${item}</td>
                    <td class="text-right">${quantity}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
          <div class="dashed-line"></div>
          <div class="text-center" style="margin-top: 15px;">
             <p>*** END OF REPORT ***</p>
             <p style="font-size: 9px; margin-top: 5px;">Generated by Business Manager</p>
          </div>
          <script>
             window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=400');
    printWindow.document.write(printContent);
    printWindow.document.close();
  }

  function handleDownloadStoreReportImage() {
    const storeName = document.getElementById("store-download-select").value;
    const date = document.getElementById("order-store-report-date").value;

    if (!storeName || !date) {
      alert("Please select a store and a date to download the report.");
      return;
    }

    const filteredOrders = orders.filter(
      (o) => o.storeName === storeName && o.date.startsWith(date)
    );

    if (filteredOrders.length === 0) {
      alert(
        `No orders found for store: ${storeName} on ${new Date(
          date
        ).toLocaleDateString("en-GB")}.`
      );
      return;
    }

    const aggregatedItems = {};
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!aggregatedItems[item.productName]) {
          aggregatedItems[item.productName] = 0;
        }
        aggregatedItems[item.productName] += item.quantity;
      });
    });

    const tempDiv = document.createElement("div");

    // --- THERMAL RECEIPT STYLING ---
    tempDiv.style.width = "70mm";
    tempDiv.style.padding = "15px";
    tempDiv.style.backgroundColor = "#fff";
    tempDiv.style.color = "#000";
    tempDiv.style.fontFamily = "'Courier New', Courier, monospace";
    tempDiv.style.fontSize = "12px";
    tempDiv.style.lineHeight = "1.2";
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";

    const dateStr = new Date(date).toLocaleDateString("en-GB");

    let content = `
        <div style="text-align: center; margin-bottom: 10px;">
            <img src="image_6a1dd8.png" alt="" style="width: 120px; height: auto; margin: 0 auto 5px; display: block; opacity: 1.0;"> 
            <h2 style="font-size: 16px; font-weight: bold; margin: 5px 0; text-transform: uppercase;">${storeName}</h2>
            <p style="font-size: 10px; margin: 0;">DATE: ${dateStr}</p>
            <p style="font-size: 10px; margin: 0;">REPORT TYPE: DAILY ORDER</p>
        </div>
        
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="text-align: left; font-size: 11px; text-transform: uppercase; padding-bottom: 5px;">ITEM</th>
                    <th style="text-align: right; font-size: 11px; text-transform: uppercase; padding-bottom: 5px;">QTY</th>
                </tr>
            </thead>
            <tbody style="font-size: 12px; font-weight: bold;">
                ${Object.entries(aggregatedItems)
                  .map(
                    ([item, quantity]) => `
                    <tr>
                        <td style="padding: 4px 0;">${item}</td>
                        <td style="text-align: right; padding: 4px 0;">${quantity}</td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
        
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        
        <div style="text-align: center; margin-top: 15px;">
            <p style="font-size: 10px; margin: 0;">*** END OF REPORT ***</p>
            <p style="font-size: 9px; margin-top: 5px;">Generated by Business Manager</p>
        </div>
    `;

    tempDiv.innerHTML = content;
    document.body.appendChild(tempDiv);

    html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: tempDiv.scrollWidth,
      windowHeight: tempDiv.scrollHeight,
    })
      .then((canvas) => {
        const link = document.createElement("a");
        link.download = `Receipt_${storeName}_${date}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        document.body.removeChild(tempDiv);
      })
      .catch((err) => {
        console.error("Error generating receipt:", err);
        alert("Failed to generate receipt image. Please try again.");
        document.body.removeChild(tempDiv);
      });
  }

function handleDownloadPaymentsReport() {
    const startDateStr = document.getElementById(
      "payment-download-start-date"
    ).value;
    const endDateStr = document.getElementById(
      "payment-download-end-date"
    ).value;
    const storeFilter = document.getElementById(
      "payment-download-store-select"
    ).value;

    if (!startDateStr || !endDateStr) {
      alert("Please select a start and end date for the ledger report.");
      return;
    }
    if (startDateStr > endDateStr) {
      alert("Start date cannot be after end date.");
      return;
    }

    // 1. DETERMINE WHICH STORES TO PROCESS
    let storesToProcess = [];
    if (storeFilter === "all") {
        // If "All Stores" is selected, get every store that has ever had an order or payment
        storesToProcess = [
            ...new Set([
                ...orders.map((o) => o.storeName),
                ...payments.map((p) => p.storeName),
            ]),
        ].sort();
    } else {
        // If a specific store is selected, ONLY process that one
        storesToProcess = [storeFilter];
    }

    const finalReportData = [
      ["Date", "Shop", "Bill (₹)", "Cash (₹)", "Online (₹)", "Due (₹)"],
    ];
    let hasData = false;

    // 2. LOOP THROUGH EACH SELECTED STORE
    for (const storeName of storesToProcess) {
      // Calculate Opening Balance (Everything BEFORE the start date)
      let runningBalance = calculateDue(storeName, startDateStr, false);

      // Add a separator row if we are printing multiple stores
      if (storeFilter === "all" && finalReportData.length > 1) {
        finalReportData.push([]);
      }

      // Add Opening Balance Row
      finalReportData.push([
        `Opening Balance for ${storeName} as on ${new Date(
          startDateStr
        ).toLocaleDateString("en-GB")}`,
        "",
        "",
        "",
        "",
        runningBalance.toFixed(2),
      ]);

      // Initialize daily summary for the date range
      const dailySummary = {};
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().slice(0, 10);
        dailySummary[dateStr] = {
          bill: 0,
          cash: 0,
          online: 0,
          returns: 0,
        };
      }

      // 3. AGGREGATE DATA (STRICTLY FILTERED BY storeName)
      orders
        .filter(
          (o) =>
            o.storeName === storeName && // Strict check
            o.date.slice(0, 10) >= startDateStr &&
            o.date.slice(0, 10) <= endDateStr
        )
        .forEach((o) => {
          const date = o.date.slice(0, 10);
          dailySummary[date].bill +=
            o.total - o.itemsTotal * (o.storeCommission / 100);
        });

      payments
        .filter(
          (p) =>
            p.storeName === storeName && // Strict check
            p.date.slice(0, 10) >= startDateStr &&
            p.date.slice(0, 10) <= endDateStr
        )
        .forEach((p) => {
          const date = p.date.slice(0, 10);
          dailySummary[date].cash += p.cashAmount || 0;
          dailySummary[date].online += p.onlineAmount || 0;
        });

      returns
        .filter(
          (r) =>
            r.storeName === storeName && // Strict check
            r.date.slice(0, 10) >= startDateStr &&
            r.date.slice(0, 10) <= endDateStr
        )
        .forEach((r) => {
          const date = r.date.slice(0, 10);
          dailySummary[date].returns +=
            r.totalReturnValue - r.commissionAdjustment;
        });

      // 4. GENERATE ROWS FOR THIS STORE
      Object.keys(dailySummary)
        .sort()
        .forEach((dateStr) => {
          const day = dailySummary[dateStr];
          const netChange = day.bill - day.returns - day.cash - day.online;
          
          // Only show rows where something happened
          if (
              Math.abs(day.bill) > 0.01 || 
              Math.abs(day.cash) > 0.01 || 
              Math.abs(day.online) > 0.01 || 
              Math.abs(day.returns) > 0.01
          ) {
            hasData = true;
            runningBalance += netChange;
            finalReportData.push([
              new Date(dateStr).toLocaleDateString("en-GB"),
              storeName,
              day.bill > 0 ? day.bill.toFixed(2) : "-",
              day.cash > 0 ? day.cash.toFixed(2) : "-",
              day.online > 0 ? day.online.toFixed(2) : "-",
              runningBalance.toFixed(2),
            ]);
          }
        });
        
        // Add Closing Balance Row
        finalReportData.push([
            `Closing Balance for ${storeName}`,
            "",
            "",
            "",
            "",
            runningBalance.toFixed(2)
        ]);
        finalReportData.push([]); // Empty row for spacing
    }

    if (!hasData && storesToProcess.length > 0) {
      // If we found no transaction data, we still check if we have valid opening balances
      // But generally, we want to warn the user if the sheet is mostly empty
      const userConfirmed = confirm("No transactions found for the selected range. Do you still want to download the Opening/Closing balances?");
      if(!userConfirmed) return;
    } else if (storesToProcess.length === 0) {
      alert("No stores found to process.");
      return;
    }

    // 5. EXPORT TO EXCEL
    const worksheet = XLSX.utils.aoa_to_sheet(finalReportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger Report");
    
    // Construct a nice filename
    const fileStoreName = storeFilter === "all" ? "All_Stores" : storeFilter;
    const fileName = `Ledger_${fileStoreName}_${startDateStr}_to_${endDateStr}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  }

  function handleDownloadTodaySheet() {
    const today = new Date().toISOString().slice(0, 10);
    const todaysOrders = orders.filter((o) => o.date.startsWith(today));

    if (todaysOrders.length === 0) {
      alert("No orders were placed today to generate a sheet.");
      return;
    }

    const storeNames = [
      ...new Set(todaysOrders.map((o) => o.storeName)),
    ].sort();
    const productNames = [
      ...new Set(products.map((p) => p.productName)),
    ].sort();

    const header = [
      "Date",
      "Shop",
      "Bill (₹)",
      ...productNames,
      "Cash (₹)",
      "Online (₹)",
      "Paid (₹)",
      "Due (₹)",
    ];
    const reportData = [header];

    storeNames.forEach((storeName) => {
      const storeOrders = todaysOrders.filter((o) => o.storeName === storeName);
      if (storeOrders.length === 0) return;

      const storeDetails = stores.find((s) => s.storeName === storeName);
      const storeCommission = storeDetails
        ? storeDetails.storeCommission / 100
        : 0;

      const itemQuantities = {};
      productNames.forEach((p) => (itemQuantities[p] = 0));
      let totalBill = 0;

      storeOrders.forEach((order) => {
        totalBill += order.total - order.itemsTotal * storeCommission;
        order.items.forEach((item) => {
          if (itemQuantities.hasOwnProperty(item.productName)) {
            itemQuantities[item.productName] += item.quantity;
          }
        });
      });

      const row = [
        new Date().toLocaleDateString("en-GB"),
        storeName,
        totalBill.toFixed(2),
      ];

      productNames.forEach((pName) => {
        row.push(itemQuantities[pName] > 0 ? itemQuantities[pName] : "");
      });

      row.push("", "", "", "");

      reportData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Today's Orders");
    const fileName = `Day_Sheet_${today}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  function handleDownloadMomoSheet() {
    const today = new Date().toISOString().slice(0, 10);
    const ordersToday = orders.filter((o) => o.date.startsWith(today));

    if (ordersToday.length === 0) {
      alert("No orders found for today.");
      return;
    }

    const reportableProductNames = products
      .filter((product) => {
        const lowerCaseName = product.productName.toLowerCase();
        return (
          lowerCaseName.includes("momo") || lowerCaseName.includes("soup")
        );
      })
      .map((product) => product.productName);

    if (reportableProductNames.length === 0) {
      alert("No 'Momo' or 'Soup' products were ordered today.");
      return;
    }

    const consolidatedOrders = {};

    ordersToday.forEach((order) => {
      if (!consolidatedOrders[order.storeName]) {
        consolidatedOrders[order.storeName] = {};
        reportableProductNames.forEach((productName) => {
          consolidatedOrders[order.storeName][productName] = 0;
        });
      }

      order.items.forEach((item) => {
        if (reportableProductNames.includes(item.productName)) {
          consolidatedOrders[order.storeName][item.productName] +=
            item.quantity;
        }
      });
    });

    const sortedStoreNames = Object.keys(consolidatedOrders).sort();

    const reportData = sortedStoreNames.map((storeName) => {
      const row = { "Store Name": storeName };
      Object.assign(row, consolidatedOrders[storeName]);
      return row;
    });

    if (reportData.length === 0) {
      alert("No relevant orders found for today.");
      return;
    }

    const worksheetData = [
      ["Momo & Soup Orders Report"],
      [`Date: ${new Date().toLocaleDateString("en-GB")}`],
      [],
      ["Store Name", ...reportableProductNames],
    ];

    reportData.forEach((row) => {
      const rowValues = [row["Store Name"]];
      reportableProductNames.forEach((productName) => {
        rowValues.push(row[productName] || 0);
      });
      worksheetData.push(rowValues);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Momo & Soup Orders"
    );

    const fileName = `Momo_Soup_Orders_${today}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  function handleDownloadTransportationExcel() {
    const selectedDate = document.getElementById(
      "transport-download-date"
    ).value;
    const selectedTransporter = document.getElementById(
      "transport-select-name"
    ).value;

    if (!selectedDate) {
      alert("Please select a date for the report.");
      return;
    }

    let relevantTransports = transportation.filter((t) => {
      const transportDate = t.date.slice(0, 10);
      return transportDate === selectedDate;
    });

    if (selectedTransporter !== "all") {
      relevantTransports = relevantTransports.filter(
        (t) => t.transportationName === selectedTransporter
      );
    }

    if (relevantTransports.length === 0) {
      alert("No transportation assignments found for the selected criteria.");
      return;
    }

    const allOrdersInDate = orders.filter((o) => {
      const orderDate = o.date.slice(0, 10);
      return orderDate === selectedDate;
    });

    const allProductNames = [
      ...new Set(products.map((p) => p.productName)),
    ].sort();

    const storeNames = [
      ...new Set(relevantTransports.flatMap((t) => t.stores)),
    ].sort();

    const quantityMap = {};
    allProductNames.forEach((pName) => {
      quantityMap[pName] = {};
      storeNames.forEach((sName) => {
        quantityMap[pName][sName] = "";
      });
    });

    allOrdersInDate.forEach((order) => {
      if (storeNames.includes(order.storeName)) {
        order.items.forEach((item) => {
          if (allProductNames.includes(item.productName)) {
            if (quantityMap[item.productName][order.storeName]) {
              quantityMap[item.productName][order.storeName] += item.quantity;
            } else {
              quantityMap[item.productName][order.storeName] = item.quantity;
            }
          }
        });
      }
    });

    const worksheetData = [];
    worksheetData.push([
      `Delivery Challan for ${
        selectedTransporter !== "all" ? selectedTransporter : "All Transporters"
      }`,
    ]);
    worksheetData.push([`Date: ${selectedDate}`]);
    worksheetData.push([]);

    const headerRow = ["Item"];
    storeNames.forEach((sName) => {
      headerRow.push(sName);
    });
    worksheetData.push(headerRow);

    allProductNames.forEach((pName) => {
      const row = [pName];
      storeNames.forEach((sName) => {
        row.push(quantityMap[pName][sName] || "-");
      });
      worksheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Delivery Challan");

    const fileName = `Delivery_Challan_${
      selectedTransporter !== "all" ? selectedTransporter + "_" : ""
    }${selectedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  function handleDownloadTransportStoreDetails() {
    const selectedDate = document.getElementById(
      "transport-download-date"
    ).value;
    const selectedTransporter = document.getElementById(
      "transport-select-name"
    ).value;

    if (selectedTransporter === "all") {
      alert("Please select a specific transporter to download store details.");
      return;
    }

    if (!selectedDate) {
      alert("Please select a date for the report.");
      return;
    }

    let relevantTransports = transportation.filter((t) => {
      const transportDate = t.date.slice(0, 10);
      return (
        transportDate === selectedDate &&
        t.transportationName === selectedTransporter
      );
    });

    if (relevantTransports.length === 0) {
      alert("No transportation assignments found for the selected criteria.");
      return;
    }

    const assignedStores = [
      ...new Set(relevantTransports.flatMap((t) => t.stores)),
    ];

    const storeDetailsData = [];
    assignedStores.forEach((storeName) => {
      const store = stores.find((s) => s.storeName === storeName);
      if (store) {
        storeDetailsData.push({
          "Store/Counter Name": store.storeName,
          Code: store.details,
          "Phone Number": store.phoneNumber,
        });
      }
    });

    if (storeDetailsData.length === 0) {
      alert("No store details found for the selected criteria.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(storeDetailsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Store Challan");

    const fileName = `Store_Challan_${selectedTransporter}_${selectedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

function handleDownloadMomoSticker() {
    const storeName = document.getElementById("momo-sticker-store-select").value;
    
    if (!storeName) {
      alert("Please select a store (or All Stores) to download stickers.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    // This array will hold all the rows for our Excel file
    const worksheetData = []; 

    // --- Helper Function: adds a specific store's momo data to the sheet ---
    const processStoreStickers = (targetStoreName) => {
        // Find orders for this store today
        const ordersToday = orders.filter(
            (o) => o.storeName === targetStoreName && o.date.startsWith(today)
        );

        if (ordersToday.length === 0) return false;

        const aggregatedItems = {};
        let hasMomo = false;

        // Aggregate counts for items containing "momo"
        ordersToday.forEach((order) => {
            order.items.forEach((item) => {
                if (item.productName.toLowerCase().includes("momo")) {
                    if (!aggregatedItems[item.productName]) {
                        aggregatedItems[item.productName] = 0;
                    }
                    aggregatedItems[item.productName] += item.quantity;
                    hasMomo = true;
                }
            });
        });

        // If this store has no momos today, skip it
        if (!hasMomo) return false;

        // --- Add to Worksheet Data ---
        // 1. Store Name Header (Bold/Uppercased style)
        worksheetData.push([targetStoreName.toUpperCase()]); 
        
        // 2. Column Headers
        worksheetData.push(["Item", "Quantity"]); 

        // 3. Item Rows
        Object.entries(aggregatedItems).forEach(([item, quantity]) => {
            worksheetData.push([item, quantity]);
        });

        // 4. Add gap (empty rows) after this store
        worksheetData.push([]); 
        worksheetData.push([]); 
        
        return true;
    };

    // --- Main Logic ---
    if (storeName === "all") {
        // Get all stores that have orders today to avoid checking empty ones
        const storesWithOrders = [...new Set(orders
            .filter(o => o.date.startsWith(today))
            .map(o => o.storeName)
        )].sort();

        let anyDataFound = false;

        // Loop through every store and add their block to the sheet
        storesWithOrders.forEach(store => {
            const hasData = processStoreStickers(store);
            if (hasData) anyDataFound = true;
        });

        if (!anyDataFound) {
            alert("No Momo orders found for any store today.");
            return;
        }

    } else {
        // Handle Single Store Selection
        const hasData = processStoreStickers(storeName);
        if (!hasData) {
            alert(`No Momo orders found for ${storeName} today.`);
            return;
        }
    }

    // --- Generate Excel ---
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Optional: Set column widths (Col A wider, Col B narrower)
    const wscols = [
        { wch: 30 }, 
        { wch: 10 } 
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Momo Stickers");

    const fileName = `Momo_Stickers_${storeName === 'all' ? 'All_Stores' : storeName}_${today}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  function handleOwnerSignup(e) {
    e.preventDefault();
    const newPassword = document.getElementById("new-owner-password").value;
    const confirmPassword = document.getElementById(
      "confirm-owner-password"
    ).value;
    if (newPassword.length < 4) {
      alert("Password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    ownerPassword = newPassword;
    saveData();
    alert("Owner password set successfully!");
    renderPage("agent");
  }
// ---------------------------------------------------------
  // MISSING FUNCTIONS FIX
  // ---------------------------------------------------------

  function handlePaymentStoreSelect(e) {
    const storeName = e.target.value;
    const dueInfoDiv = document.getElementById("store-due-info");
    const orderInfoDiv = document.getElementById("store-order-total-info");

    if (!storeName) {
      dueInfoDiv.classList.add("hidden");
      orderInfoDiv.classList.add("hidden");
      return;
    }

    // 1. Calculate Current Due
    const currentDue = calculateDue(storeName, new Date().toISOString().slice(0, 10), true);
    
    // 2. Calculate Today's Order Total
    const today = new Date().toISOString().slice(0, 10);
    const todaysOrders = orders.filter(o => o.storeName === storeName && o.date.startsWith(today));
    const todaysTotal = todaysOrders.reduce((sum, o) => sum + o.total, 0);

    // Update UI
    dueInfoDiv.textContent = `Current Total Due: ₹${currentDue.toFixed(2)}`;
    dueInfoDiv.classList.remove("hidden");
    
    if (todaysTotal > 0) {
        orderInfoDiv.textContent = `Today's Orders Value: ₹${todaysTotal.toFixed(2)}`;
        orderInfoDiv.classList.remove("hidden");
    } else {
        orderInfoDiv.classList.add("hidden");
    }
  }

  function handleAddPayment(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const storeName = document.getElementById("payment-store-select").value; // Get explicitly from select
    const cashAmount = parseFloat(formData.get("cashAmount")) || 0;
    const onlineAmount = parseFloat(formData.get("onlineAmount")) || 0;

    if (!storeName) {
      alert("Please select a store.");
      return;
    }

    if (cashAmount === 0 && onlineAmount === 0) {
      alert("Please enter a valid amount (Cash or Online).");
      return;
    }

    payments.push({
      date: new Date().toISOString(),
      storeName: storeName,
      cashAmount: cashAmount,
      onlineAmount: onlineAmount
    });

    saveData();
    renderPaymentHistory();
    // Re-trigger select logic to update due amount immediately
    handlePaymentStoreSelect({ target: { value: storeName } });
    
    alert("Payment recorded successfully!");
    e.target.reset();
    // Reset the select value manually as reset() might not catch the select if it's outside standard flow or needs explicit reset
    document.getElementById("payment-store-select").value = storeName; 
  }

  function handleAddDuePayment(e) {
    e.preventDefault();
    const storeName = document.getElementById("due-payment-store-select").value;
    const amount = parseFloat(document.getElementById("dueAmount").value);

    if (!storeName || isNaN(amount)) {
      alert("Please select a store and enter a valid amount.");
      return;
    }

    duePayments.push({
      date: new Date().toISOString(),
      storeName: storeName,
      amount: amount
    });

    saveData();
    alert(`Due payment of ₹${amount} added for ${storeName}.`);
    e.target.reset();
  }

  function handleAddTransportation(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const transportationName = formData.get("transportationName");
    // Get all checked boxes for stores
    const selectedStores = Array.from(document.querySelectorAll('input[name="transport_stores"]:checked'))
                                .map(cb => cb.value);
    const deliveryShopCode = document.getElementById("edit-deliveryShopCode").value; // Using the ID from the form

    if (!transportationName || selectedStores.length === 0) {
      alert("Please enter a Transporter Name and select at least one Store.");
      return;
    }

    transportation.push({
      date: new Date().toISOString(),
      transportationName: transportationName,
      stores: selectedStores,
      deliveryShopCode: deliveryShopCode || ""
    });

    saveData();
    renderTransportationPage();
    alert("Transportation assigned successfully!");
    e.target.reset();
  }

  function handleAddAgent(e) {
      e.preventDefault();
      const formData = new FormData(e.target);
      const agentName = formData.get("agentName");
      
      // Get all checked stores
      const selectedStoreCheckboxes = document.querySelectorAll('input[name="selected_stores"]:checked');
      const commissions = {};
      
      selectedStoreCheckboxes.forEach(checkbox => {
          const storeName = checkbox.value;
          const commissionVal = parseFloat(document.querySelector(`input[name="commission_${storeName}"]`).value);
          if (!isNaN(commissionVal)) {
              commissions[storeName] = commissionVal;
          }
      });

      if (!agentName || Object.keys(commissions).length === 0) {
          alert("Please enter Agent Name and select at least one store with a commission.");
          return;
      }

      agents.push({
          agentName,
          commissions
      });

      saveData();
      renderAgents();
      updateDashboard();
      e.target.reset();
      // Disable all commission inputs again
      document.querySelectorAll('#agent-store-list input[type="number"]').forEach(input => {
          input.disabled = true;
          input.value = "";
      });
      alert("Agent added successfully.");
  }

  function handleDownloadAgentStatement(agentName, monthYear) {
      // Format monthYear (YYYY-MM) to filter dates
      const [year, month] = monthYear.split("-");
      
      const relevantPending = pendingCommissions.filter(c => 
          c.agentName === agentName && 
          c.date.startsWith(monthYear)
      );
      
      const relevantPaid = paidCommissions.filter(c => 
          c.agentName === agentName && 
          c.paidDate.startsWith(monthYear)
      );

      if (relevantPending.length === 0 && relevantPaid.length === 0) {
          alert("No data found for this agent in the selected month.");
          return;
      }

      const data = [
          ["Agent Statement"],
          [`Agent: ${agentName}`],
          [`Month: ${monthYear}`],
          [],
          ["Type", "Date", "Store", "Amount (₹)", "Status"],
      ];

      relevantPaid.forEach(c => {
          data.push(["Paid Commission", c.paidDate.slice(0,10), c.storeName, c.commissionAmount.toFixed(2), "PAID"]);
      });

      relevantPending.forEach(c => {
           data.push(["Pending Commission", c.date.slice(0,10), c.storeName, c.commissionAmount.toFixed(2), "PENDING"]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Agent Statement");
      XLSX.writeFile(workbook, `Statement_${agentName}_${monthYear}.xlsx`);
  }
  window.openEditStoreModal = (index) => {
    promptForPassword(() => {
      const store = stores[index];
      document.getElementById("edit-store-index").value = index;
      document.getElementById("edit-customerName").value = store.customerName;
      document.getElementById("edit-storeName").value = store.storeName;
      document.getElementById("edit-transport").value = store.transport;
      document.getElementById("edit-storeCommission").value =
        store.storeCommission;
      document.getElementById("edit-phoneNumber").value = store.phoneNumber;
      document.getElementById("edit-details").value = store.details;
      editStoreModal.classList.remove("hidden");
    }, `Enter password to edit store: ${stores[index].storeName}`);
  };

  window.openEditProductModal = (index) => {
    promptForPassword(() => {
      const product = products[index];
      document.getElementById("edit-product-index").value = index;
      document.getElementById("edit-productName").value = product.productName;
      document.getElementById("edit-price").value = product.price;
      editProductModal.classList.remove("hidden");
    }, `Enter password to edit product: ${products[index].productName}`);
  };

  window.openEditTransportationModal = (index) => {
    promptForPassword(() => {
      const item = transportation[index];
      document.getElementById("edit-transportation-index").value = index;
      document.getElementById("edit-transportationName").value =
        item.transportationName;
      const storeListContainer = document.getElementById(
        "edit-transportation-store-list"
      );
      storeListContainer.innerHTML = stores
        .map(
          (store) => `
              <label class="flex items-center">
                  <input type="checkbox" name="edit_transport_stores" value="${
                    store.storeName
                  }" class="h-4 w-4 text-indigo-600 border-gray-300 rounded" ${
            item.stores.includes(store.storeName) ? "checked" : ""
          }>
                  <span class="ml-3 text-gray-700">${store.storeName}</span>
              </label>
          `
        )
        .join("");
      document.getElementById("edit-deliveryShopCode").value =
        item.deliveryShopCode || "";
      editTransportationModal.classList.remove("hidden");
    }, `Enter password to edit assignment for: ${transportation[index].transportationName}`);
  };

  window.openEditPaymentModal = (index) => {
    promptForPassword(() => {
      const payment = payments[index];
      document.getElementById("edit-payment-index").value = index;
      document.getElementById("edit-payment-store-name").textContent =
        payment.storeName;
      document.getElementById("edit-payment-date").textContent = new Date(
        payment.date
      ).toLocaleString();
      document.getElementById("edit-cashAmount").value = payment.cashAmount;
      document.getElementById("edit-onlineAmount").value = payment.onlineAmount;
      editPaymentModal.classList.remove("hidden");
    }, `Enter password to edit payment for ${payments[index].storeName}.`);
  };

  editStoreForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const index = document.getElementById("edit-store-index").value;
    stores[index] = {
      customerName: document.getElementById("edit-customerName").value,
      storeName: document.getElementById("edit-storeName").value,
      transport:
        parseFloat(document.getElementById("edit-transport").value) || 0,
      storeCommission:
        parseFloat(document.getElementById("edit-storeCommission").value) || 0,
      phoneNumber: document.getElementById("edit-phoneNumber").value,
      details: document.getElementById("edit-details").value,
    };
    saveData();
    renderStores();
    editStoreModal.classList.add("hidden");
  });

  editProductForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const index = document.getElementById("edit-product-index").value;
    products[index] = {
      productName: document.getElementById("edit-productName").value,
      price: parseFloat(document.getElementById("edit-price").value),
    };
    saveData();
    renderProducts();
    editProductModal.classList.add("hidden");
  });

  editTransportationForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const index = document.getElementById("edit-transportation-index").value;
    const transportationName = document.getElementById(
      "edit-transportationName"
    ).value;
    const selectedStores = [
      ...document.querySelectorAll(
        'input[name="edit_transport_stores"]:checked'
      ),
    ].map((el) => el.value);
    const deliveryShopCode = document.getElementById(
      "edit-deliveryShopCode"
    ).value;
    if (!transportationName || selectedStores.length === 0) {
      alert("Please provide a name and select at least one store.");
      return;
    }
    const existingTransport = transportation.find(
      (t) =>
        t.transportationName === transportationName &&
        t.deliveryShopCode === deliveryShopCode
    );
    if (existingTransport) {
      existingTransport.stores = [
        ...new Set([...existingTransport.stores, ...selectedStores]),
      ];
    } else {
      transportation.push({
        date: new Date().toISOString(),
        transportationName,
        stores: selectedStores,
        deliveryShopCode: deliveryShopCode || "",
      });
    }
    saveData();
    renderTransportationPage();
    editTransportationModal.classList.add("hidden");
  });

  function handleEditPayment(e) {
    e.preventDefault();
    const index = document.getElementById("edit-payment-index").value;
    const cashAmount =
      parseFloat(document.getElementById("edit-cashAmount").value) || 0;
    const onlineAmount =
      parseFloat(document.getElementById("edit-onlineAmount").value) || 0;

    if (cashAmount === 0 && onlineAmount === 0) {
      alert("Please enter a valid amount for either cash or online.");
      return;
    }
    payments[index].cashAmount = cashAmount;
    payments[index].onlineAmount = onlineAmount;

    saveData();
    renderPaymentHistory();
    editPaymentModal.classList.add("hidden");
    alert("Payment updated successfully!");
  }

  cancelEditStoreBtn.addEventListener("click", () =>
    editStoreModal.classList.add("hidden")
  );
  cancelEditProductBtn.addEventListener("click", () =>
    editProductModal.classList.add("hidden")
  );
  cancelEditTransportationBtn.addEventListener("click", () =>
    editTransportationModal.classList.add("hidden")
  );

  const calculateDue = (storeName, date, inclusive = true) => {
    const filterFn = (item) => {
      const itemDate = item.date.slice(0, 10);
      const isBeforeOrOn = inclusive ? itemDate <= date : itemDate < date;
      return item.storeName === storeName && isBeforeOrOn;
    };

    const ordersUpToDate = orders.filter(filterFn);
    const returnsUpToDate = returns.filter(filterFn);
    const paymentsUpToDate = payments.filter(filterFn);

    const initialDue = duePayments
      .filter((dp) => dp.storeName === storeName)
      .reduce((sum, dp) => sum + dp.amount, 0);

    const totalOrderValue = ordersUpToDate.reduce((sum, o) => {
      const netOrderTotal =
        o.itemsTotal +
        o.transportCharge -
        o.itemsTotal * (o.storeCommission / 100);
      return sum + netOrderTotal;
    }, 0);

    const totalReturnValue = returnsUpToDate.reduce((sum, r) => {
      const netReturnTotal = r.totalReturnValue - r.commissionAdjustment;
      return sum + netReturnTotal;
    }, 0);

    const totalPaid = paymentsUpToDate.reduce(
      (sum, p) => sum + (p.cashAmount + p.onlineAmount),
      0
    );

    return initialDue + totalOrderValue - totalReturnValue - totalPaid;
  };

  async function shareBillAsImage(storeName, billElement) {
    if (!navigator.share) {
      alert("Web Share API is not supported in your browser.");
      return;
    }

    const shareBtn = document.getElementById("share-bill-btn");
    const originalBtnText = shareBtn.innerHTML;
    shareBtn.innerHTML = "Processing...";
    shareBtn.disabled = true;

    try {
      const canvas = await html2canvas(billElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      const file = new File(
        [blob],
        `bill_${storeName}_${new Date().toISOString().slice(0, 10)}.png`,
        { type: "image/png" }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Bill for ${storeName}`,
          text: `Here is the bill for ${storeName}.`,
        });
      } else {
        alert(
          "File sharing is not supported on this device. Please use the download button."
        );
      }
    } catch (error) {
      console.error("Error generating or sharing bill image:", error);
      alert(
        "An error occurred while trying to share the bill. Please try downloading it instead."
      );
    } finally {
      shareBtn.innerHTML = originalBtnText;
      shareBtn.disabled = false;
    }
  }

  async function downloadBillAsImage(storeName, billElement) {
    const downloadBtn = document.getElementById("download-bill-btn");
    const originalBtnText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = "Downloading...";
    downloadBtn.disabled = true;

    try {
      const canvas = await html2canvas(billElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `bill_${storeName}_${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error generating bill image for download:", error);
      alert(
        "An error occurred while trying to download the bill. Please try again."
      );
    } finally {
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.disabled = false;
    }
  }

  window.removeStore = (index) => {
    promptForPassword(() => {
      stores.splice(index, 1);
      saveData();
      renderStores();
      updateDashboard();
    }, `Enter password to delete store: ${stores[index].storeName}`);
  };

  window.removeProduct = (index) => {
    promptForPassword(() => {
      products.splice(index, 1);
      saveData();
      renderProducts();
      updateDashboard();
    }, `Enter password to delete product: ${products[index].productName}`);
  };

  window.removeAgent = (index) => {
    promptForPassword(() => {
      agents.splice(index, 1);
      saveData();
      renderAgents();
      updateDashboard();
    }, `Enter password to delete agent: ${agents[index].agentName}`);
  };

  window.removeTransportation = (index) => {
    promptForPassword(() => {
      transportation.splice(index, 1);
      saveData();
      renderTransportationPage();
    }, `Enter password to delete assignment for: ${transportation[index].transportationName}`);
  };

  window.removePayment = (index) => {
    const payment = payments[index];
    promptForPassword(() => {
      payments.splice(index, 1);
      saveData();
      renderPaymentHistory();
    }, `Enter password to delete payment of ₹${(
      payment.cashAmount + payment.onlineAmount
    ).toFixed(2)} for ${payment.storeName}`);
  };

  window.payCommission = (orderId) => {
    const commissionToPay = pendingCommissions.find(
      (c) => c.orderId === orderId
    );
    if (!commissionToPay) {
      alert("Commission not found.");
      return;
    }
    promptForPassword(() => {
      const globalIndex = pendingCommissions.findIndex(
        (c) => c.orderId === commissionToPay.orderId
      );
      if (globalIndex > -1) {
        const [paidItem] = pendingCommissions.splice(globalIndex, 1);
        paidItem.paidDate = new Date().toISOString();
        paidCommissions.push(paidItem);
        saveData();
        const selectedAgent =
          document.getElementById("agent-select-name").value;
        if (selectedAgent) {
          renderAgentCommissions(selectedAgent);
        }
        alert("Commission marked as paid!");
      }
    }, `Enter owner password to pay commission of ₹${commissionToPay.commissionAmount.toFixed(2)} for ${commissionToPay.storeName}`);
  };

  window.updateCart = (productIndex, change) => {
    const product = products[productIndex];
    let cartItem = cart.find(
      (item) => item.productName === product.productName
    );
    if (cartItem) {
      cartItem.quantity += change;
      if (cartItem.quantity <= 0) {
        cart = cart.filter((item) => item.productName !== product.productName);
      }
    } else if (change > 0) {
      cart.push({
        ...product,
        quantity: change,
        price: parseFloat(product.price),
      });
    }
    renderCart();
  };

  window.setCartQuantity = (productIndex, quantity) => {
    const product = products[productIndex];
    const qty = parseFloat(quantity);
    let cartItem = cart.find(
      (item) => item.productName === product.productName
    );
    if (isNaN(qty) || qty <= 0) {
      cart = cart.filter((item) => item.productName !== product.productName);
    } else {
      if (cartItem) {
        cartItem.quantity = qty;
      } else {
        cart.push({
          ...product,
          quantity: qty,
          price: parseFloat(product.price),
        });
      }
    }
    renderCart();
  };

  window.removeFromCart = (cartIndex) => {
    cart.splice(cartIndex, 1);
    renderCart();
  };

  window.editOrder = (orderId) => {
    promptForPassword(() => {
      const orderToEdit = orders.find((o) => o.orderId === orderId);
      if (!orderToEdit) {
        alert("Order not found!");
        return;
      }

      currentEditingOrderId = orderId;

      document.getElementById("order-store-select").value =
        orderToEdit.storeName;
      document.getElementById("order-store-select").disabled = true;
      cart = JSON.parse(JSON.stringify(orderToEdit.items));
      renderCart();

      const orderSubmitButtons = document.getElementById(
        "order-submit-buttons"
      );
      orderSubmitButtons.innerHTML = `
            <div class="flex flex-col sm:flex-row gap-2">
                <button id="update-order-btn" class="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold">Update Order</button>
                <button id="cancel-edit-btn" class="w-full bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold">Cancel Edit</button>
            </div>
          `;

      document
        .getElementById("update-order-btn")
        .addEventListener("click", handleSubmitOrder);
      document
        .getElementById("cancel-edit-btn")
        .addEventListener("click", cancelEdit);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, `Enter password to edit order.`);
  };

  window.deleteOrder = (orderId) => {
    const orderIndex = orders.findIndex((o) => o.orderId === orderId);
    if (orderIndex === -1) {
      alert("Order not found.");
      return;
    }
    const orderToDelete = orders[orderIndex];

    promptForPassword(() => {
      if (
        confirm(
          `Are you sure you want to delete the order for ${orderToDelete.storeName}? This cannot be undone.`
        )
      ) {
        orders.splice(orderIndex, 1);

        const commIndex = pendingCommissions.findIndex(
          (c) => c.orderId === orderId
        );
        if (commIndex > -1) {
          pendingCommissions.splice(commIndex, 1);
        }

        saveData();
        renderTodaysOrders();
        updateDashboard();
        alert("Order deleted successfully.");
      }
    }, `Enter password to delete order.`);
  };

  function cancelEdit() {
    currentEditingOrderId = null;
    cart = [];
    renderCart();

    document.getElementById("order-store-select").disabled = false;
    document.getElementById("place-order-form").reset();

    const orderSubmitButtons = document.getElementById(
      "order-submit-buttons"
    );
    orderSubmitButtons.innerHTML = `
            <button id="place-order-btn" class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Place Order</button>
        `;
    document
      .getElementById("place-order-btn")
      .addEventListener("click", handleSubmitOrder);
  }

  function renderReturnsPage() {
    renderStoreOptionsForReturn();
    renderProductsForReturn();
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("return-filter-date").value = today;
    renderReturnsList(today);
    document
      .getElementById("record-return-btn")
      .addEventListener("click", handleSubmitReturn);
    document
      .getElementById("return-filter-date")
      .addEventListener("change", (e) => renderReturnsList(e.target.value));
    document
      .getElementById("return-product-list")
      .addEventListener("keydown", (e) => {
        const activeElement = document.activeElement;
        if (
          activeElement &&
          activeElement.tagName === "INPUT" &&
          activeElement.type === "number"
        ) {
          const productInputs = document.querySelectorAll(
            '#return-product-list input[type="number"]'
          );
          const parentDivs = Array.from(productInputs).map((input) =>
            input.closest("div")
          );
          const activeParent = activeElement.closest("div");
          const currentIndex = parentDivs.indexOf(activeParent);

          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (currentIndex < parentDivs.length - 1) {
              parentDivs[currentIndex + 1]
                .querySelector('input[type="number"]')
                .focus();
            }
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (currentIndex > 0) {
              parentDivs[currentIndex - 1]
                .querySelector('input[type="number"]')
                .focus();
            }
          }
        }
      });
  }

  function renderStoreOptionsForReturn() {
    const returnStoreSelect = document.getElementById("return-store-select");
    if (!returnStoreSelect) return;
    const storeOptions =
      "<option value=''>Select Store</option>" +
      stores
        .map(
          (store) =>
            `<option value="${store.storeName}">${store.storeName}</option>`
        )
        .join("");
    returnStoreSelect.innerHTML = storeOptions;
  }

  function renderProductsForReturn() {
    const returnProductList = document.getElementById("return-product-list");
    if (!returnProductList) return;
    returnProductList.innerHTML = products.length
      ? products
          .map(
            (product, index) => `
          <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
              <div><p class="font-semibold">${product.productName}</p><p class="text-sm text-gray-600">₹${product.price}</p></div>
              <div class="flex items-center space-x-2">
                  <input type="number" step="0.01" value="0" min="0" aria-label="Quantity for ${product.productName}" class="w-20 text-center border rounded-md p-2" onchange="setReturnCartQuantity(${index}, this.value)">
              </div>
          </div>`
          )
          .join("")
      : `<p class="text-gray-500 p-4">Add products to see them here.</p>`;
  }

  window.updateReturnCart = (productIndex, change) => {
    const product = products[productIndex];
    let cartItem = returnCart.find(
      (item) => item.productName === product.productName
    );
    if (cartItem) {
      cartItem.quantity += change;
      if (cartItem.quantity <= 0) {
        returnCart = returnCart.filter(
          (item) => item.productName !== product.productName
        );
      }
    } else if (change > 0) {
      returnCart.push({
        ...product,
        quantity: change,
        price: parseFloat(product.price),
      });
    }
    renderReturnCart();
  };

  window.setReturnCartQuantity = (productIndex, quantity) => {
    const product = products[productIndex];
    const qty = parseFloat(quantity);
    let cartItem = returnCart.find(
      (item) => item.productName === product.productName
    );
    if (isNaN(qty) || qty <= 0) {
      returnCart = returnCart.filter(
        (item) => item.productName !== product.productName
      );
    } else {
      if (cartItem) {
        cartItem.quantity = qty;
      } else {
        returnCart.push({
          ...product,
          quantity: qty,
          price: parseFloat(product.price),
        });
      }
    }
    renderReturnCart();
  };

  window.removeFromReturnCart = (cartIndex) => {
    returnCart.splice(cartIndex, 1);
    renderReturnCart();
  };

  function renderReturnCart() {
    const cartItemsContainer = document.getElementById("return-cart-items");
    const cartTotalEl = document.getElementById("return-cart-total");
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = returnCart.length
      ? returnCart
          .map(
            (item, index) => `
        <div class="flex justify-between items-center">
            <div><span class="font-medium">${item.productName}</span> x ${
              item.quantity
            }</div>
            <div class="flex items-center space-x-2"><span>₹${(
              item.price * item.quantity
            ).toFixed(
              2
            )}</span><button class="text-red-500 text-xs font-bold" onclick="removeFromReturnCart(${index})">X</button></div>
        </div>`
          )
          .join("")
      : `<p class="text-gray-500 p-4">No items in return cart</p>`;

    cartTotalEl.textContent = `₹${returnCart
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2)}`;

    const productInputs = document.querySelectorAll(
      '#return-product-list input[type="number"]'
    );
    productInputs.forEach((input, index) => {
      const product = products[index];
      const cartItem = returnCart.find(
        (item) => item.productName === product.productName
      );
      input.value = cartItem ? cartItem.quantity : 0;
    });
  }

  function handleSubmitReturn() {
    if (currentEditingReturnId) {
      const returnIndex = returns.findIndex(
        (r) => r.returnId === currentEditingReturnId
      );
      if (returnIndex === -1) {
        alert("Error: Original return not found for update.");
        cancelReturnEdit();
        return;
      }
      if (returnCart.length === 0) {
        alert("Return cart cannot be empty. To delete, use the delete button.");
        return;
      }

      const totalReturnValue = returnCart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const originalReturn = returns[returnIndex];

      originalReturn.items = returnCart;
      originalReturn.totalReturnValue = totalReturnValue;
      originalReturn.commissionAdjustment =
        totalReturnValue *
          (stores.find((s) => s.storeName === originalReturn.storeName)
            ?.storeCommission /
            100) || 0;

      const commIndex = pendingCommissions.findIndex(
        (c) => c.returnId === originalReturn.returnId
      );
      if (commIndex > -1) {
        pendingCommissions[commIndex].commissionAmount =
          -originalReturn.commissionAdjustment;
      }

      saveData();
      alert("Return updated successfully!");
      cancelReturnEdit();
      renderReturnsList(document.getElementById("return-filter-date").value);
    } else {
      const storeName = document.getElementById("return-store-select").value;
      const store = stores.find((s) => s.storeName === storeName);
      if (!store || returnCart.length === 0) {
        alert("Please select a store and add items to the return cart.");
        return;
      }

      const totalReturnValue = returnCart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const returnId = Date.now().toString();
      const commissionAdjustment =
        totalReturnValue * (store.storeCommission / 100) || 0;

      const newReturn = {
        returnId,
        date: new Date().toISOString(),
        storeName,
        items: returnCart,
        totalReturnValue,
        commissionAdjustment,
      };

      returns.push(newReturn);

      const agent = agents.find((a) => a.commissions.hasOwnProperty(storeName));
      if (agent) {
        pendingCommissions.push({
          agentName: agent.agentName,
          storeName: newReturn.storeName,
          returnId: newReturn.returnId,
          date: newReturn.date,
          commissionAmount: -commissionAdjustment,
        });
      }

      saveData();
      alert("Return recorded successfully!");
      returnCart = [];
      renderReturnCart();
      document.getElementById("record-return-form").reset();
      renderReturnsList(document.getElementById("return-filter-date").value);
    }
  }

  function renderReturnsList(filterDate) {
    const returnsTableBody = document.getElementById("returns-table-body");
    if (!returnsTableBody) return;

    const filteredReturns = filterDate
      ? returns.filter((r) => r.date.startsWith(filterDate))
      : returns;

    returnsTableBody.innerHTML = filteredReturns.length
      ? filteredReturns
          .map(
            (r) => `
        <tr class="hover:bg-gray-50">
            <td class="p-4">${new Date(r.date).toLocaleString()}</td>
            <td class="p-4 font-medium">${r.storeName}</td>
            <td class="p-4 text-sm">${r.items
              .map(
                (item) => `<div>${item.productName} x ${item.quantity}</div>`
              )
              .join("")}</td>
            <td class="p-4 font-semibold">₹${r.totalReturnValue.toFixed(
              2
            )}</td>
            <td class="p-4 space-x-2">
                <button class="text-blue-600 hover:text-blue-800 font-semibold text-sm" onclick="editReturn('${
                  r.returnId
                }')">Edit</button>
                <button class="text-red-500 hover:text-red-700 font-semibold text-sm" onclick="deleteReturn('${
                  r.returnId
                }')">Delete</button>
            </td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="text-center p-4 text-gray-500">No returns found for this date.</td></tr>`;
  }

  window.editReturn = (returnId) => {
    promptForPassword(() => {
      const returnToEdit = returns.find((r) => r.returnId === returnId);
      if (!returnToEdit) {
        alert("Return not found!");
        return;
      }

      currentEditingReturnId = returnId;

      document.getElementById("return-store-select").value =
        returnToEdit.storeName;
      document.getElementById("return-store-select").disabled = true;
      returnCart = JSON.parse(JSON.stringify(returnToEdit.items));
      renderReturnCart();

      const returnSubmitButtons = document.getElementById(
        "return-submit-buttons"
      );
      returnSubmitButtons.innerHTML = `
            <div class="flex flex-col sm:flex-row gap-2">
                <button id="update-return-btn" class="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold">Update Return</button>
                <button id="cancel-return-edit-btn" class="w-full bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold">Cancel Edit</button>
            </div>
          `;
      document
        .getElementById("update-return-btn")
        .addEventListener("click", handleSubmitReturn);
      document
        .getElementById("cancel-return-edit-btn")
        .addEventListener("click", cancelReturnEdit);
    }, `Enter password to edit return.`);
  };

  window.deleteReturn = (returnId) => {
    promptForPassword(() => {
      const returnIndex = returns.findIndex((r) => r.returnId === returnId);
      if (returnIndex === -1) {
        alert("Return not found.");
        return;
      }
      if (confirm("Are you sure you want to delete this return record?")) {
        returns.splice(returnIndex, 1);
        const commIndex = pendingCommissions.findIndex(
          (c) => c.returnId === returnId
        );
        if (commIndex > -1) {
          pendingCommissions.splice(commIndex, 1);
        }
        saveData();
        renderReturnsList(document.getElementById("return-filter-date").value);
        alert("Return record deleted.");
      }
    }, `Enter password to delete return.`);
  };

  function cancelReturnEdit() {
    currentEditingReturnId = null;
    returnCart = [];
    renderReturnCart();

    document.getElementById("return-store-select").disabled = false;
    document.getElementById("record-return-form").reset();

    const returnSubmitButtons = document.getElementById(
      "return-submit-buttons"
    );
    returnSubmitButtons.innerHTML = `
            <button id="record-return-btn" class="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold">Record Return</button>
        `;
    document
      .getElementById("record-return-btn")
      .addEventListener("click", handleSubmitReturn);
  }

  init();
});
