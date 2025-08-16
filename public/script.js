document.addEventListener("DOMContentLoaded", function () {
  // --- DATA STORAGE using localStorage for persistence ---
  let stores = JSON.parse(localStorage.getItem("stores")) || [];
  let products = JSON.parse(localStorage.getItem("products")) || [];
  let orders = JSON.parse(localStorage.getItem("orders")) || [];
  let payments = JSON.parse(localStorage.getItem("payments")) || [];
  let agents = JSON.parse(localStorage.getItem("agents")) || [];
  let transportation = JSON.parse(localStorage.getItem("transportation")) || [];
  let receivedCommissions =
    JSON.parse(localStorage.getItem("receivedCommissions")) || [];
  let agentPassword = localStorage.getItem("agentPassword") || null;

  // --- DOM ELEMENTS ---
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

  // --- STATE ---
  let cart = [];
  let passwordCallback = null; // To store the function to run after password success
  let isAgentLoggedIn = false;
  let loggedInAgentName = "";

  // --- DATA PERSISTENCE ---
  const saveData = () => {
    localStorage.setItem("stores", JSON.stringify(stores));
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("payments", JSON.stringify(payments));
    localStorage.setItem("agents", JSON.stringify(agents));
    localStorage.setItem("transportation", JSON.stringify(transportation));
    localStorage.setItem(
      "receivedCommissions",
      JSON.stringify(receivedCommissions)
    );
    if (agentPassword) {
      localStorage.setItem("agentPassword", agentPassword);
    }
  };

  // --- PAGE TEMPLATES ---
  const templates = {
    dashboard: () => `
            <h2 class="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div id="dashboard-stores-card" data-target="store" class="dashboard-card bg-white p-6 rounded-xl shadow-md flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Total Stores</p><p id="dashboard-total-stores" class="text-3xl font-bold text-gray-800">0</p></div><div class="bg-blue-100 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div></div>
                <div id="dashboard-products-card" data-target="product" class="dashboard-card bg-white p-6 rounded-xl shadow-md flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Total Products</p><p id="dashboard-total-products" class="text-3xl font-bold text-gray-800">0</p></div><div class="bg-green-100 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7l8 4" /></svg></div></div>
                <div id="dashboard-orders-card" data-target="order" class="dashboard-card bg-white p-6 rounded-xl shadow-md flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Today's Orders</p><p id="dashboard-todays-orders" class="text-3xl font-bold text-gray-800">0</p></div><div class="bg-yellow-100 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></div></div>
                <div id="dashboard-agents-card" data-target="agent" class="dashboard-card bg-white p-6 rounded-xl shadow-md flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Total Agents</p><p id="dashboard-total-agents" class="text-3xl font-bold text-gray-800">0</p></div><div class="bg-purple-100 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg></div></div>
            </div>`,
    store: () => `
            <h2 class="text-3xl font-bold text-gray-800 mb-6">Store Management</h2>
            <div class="bg-white p-6 rounded-xl shadow-md"><h3 class="text-xl font-semibold mb-4">Add New Store</h3><form id="add-store-form" class="space-y-4"><input type="text" name="storeName" placeholder="Store Name" class="w-full p-3 border border-gray-300 rounded-lg" required><input type="text" name="customerName" placeholder="Customer Name" class="w-full p-3 border border-gray-300 rounded-lg" required><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="number" step="0.01" name="transport" placeholder="Transportation Charge (₹) (Optional)" class="w-full p-3 border border-gray-300 rounded-lg"><input type="number" step="0.01" name="storeCommission" placeholder="Store Commission (%)" class="w-full p-3 border border-gray-300 rounded-lg" required></div><textarea name="details" placeholder="Basic Details" rows="2" class="w-full p-3 border border-gray-300 rounded-lg"></textarea><button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Add Store</button></form></div>
            <div class="mt-8 mb-4">
              <input type="text" id="search-store-input" placeholder="Search by Store or Customer Name..." class="w-full p-3 border border-gray-300 rounded-lg">
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mt-8 mb-4">All Stores</h3><div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">#</th><th class="p-4 font-semibold text-sm">Name</th><th class="p-4 font-semibold text-sm">Customer</th><th class="p-4 font-semibold text-sm">Transport (₹)</th><th class="p-4 font-semibold text-sm">Store Comm (%)</th><th class="p-4 font-semibold text-sm">Details</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="stores-table-body" class="divide-y divide-gray-200"></tbody></table></div>`,
    product: () => `
            <h2 class="text-3xl font-bold text-gray-800 mb-6">Product Management</h2>
            <div class="bg-white p-6 rounded-xl shadow-md"><h3 class="text-xl font-semibold mb-4">Add New Product</h3><form id="add-product-form" class="space-y-4"><input type="text" name="productName" placeholder="Product Name" class="w-full p-3 border border-gray-300 rounded-lg" required><input type="number" step="0.01" name="price" placeholder="Price" class="w-full p-3 border border-gray-300 rounded-lg" required><button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Add Product</button></form></div>
            <h3 class="text-2xl font-bold text-gray-800 mt-8 mb-4">All Products</h3><div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">#</th><th class="p-4 font-semibold text-sm">Name</th><th class="p-4 font-semibold text-sm">Price ₹</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="products-table-body" class="divide-y divide-gray-200"></tbody></table></div>`,
    order: () => `
            <h2 class="text-3xl font-bold text-gray-800 mb-6">Order Management</h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div class="bg-white p-6 rounded-xl shadow-md">
                        <h3 class="text-xl font-semibold mb-4">Place a New Order</h3>
                        <form id="place-order-form" class="space-y-4">
                            <select id="order-store-select" class="w-full p-3 border border-gray-300 rounded-lg" required><option value="">Select Store</option></select>
                        </form>
                    </div>
                    <div id="cart-section" class="bg-white p-6 rounded-xl shadow-md mt-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>Cart</h3>
                        <div id="cart-items" class="space-y-2 min-h-[80px]"></div>
                        <div class="mt-4 text-right border-t pt-4">
                            <p class="font-bold text-lg">Total: <span id="cart-total">₹0.00</span></p>
                            <button id="place-order-btn" class="mt-4 w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Place Order</button>
                        </div>
                    </div>
                </div>
                 <div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">Products</h3>
                    <div id="order-product-list" class="bg-white p-4 rounded-xl shadow-md space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto"></div>
                </div>
            </div>
            <div class="mt-8"><div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4"><h3 class="text-2xl font-bold text-gray-800">Today's Orders</h3><button id="download-orders-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>Download Product Quantity</button></div><div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">Date</th><th class="p-4 font-semibold text-sm">Store</th><th class="p-4 font-semibold text-sm">Customer</th><th class="p-4 font-semibold text-sm">Items</th><th class="p-4 font-semibold text-sm">Store Commission</th><th class="p-4 font-semibold text-sm">Order Total</th></tr></thead><tbody id="todays-orders-table-body" class="divide-y divide-gray-200"></tbody></table></div></div>`,
    billing: () => `
            <h2 class="text-3xl font-bold text-gray-800 mb-6">Billing</h2>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-xl font-semibold mb-4">Generate Bill</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div class="flex-grow">
                        <label for="billing-store-select" class="block text-sm font-medium text-gray-700">Store</label>
                        <select id="billing-store-select" class="mt-1 w-full p-3 border border-gray-300 rounded-lg" required><option value="">Select a Store</option></select>
                    </div>
                    <div>
                        <label for="billing-date" class="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" id="billing-date" class="mt-1 w-full p-3 border border-gray-300 rounded-lg">
                    </div>
                    <button id="generate-bill-btn" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold h-fit w-full md:w-auto">Generate</button>
                </div>
            </div>
            <div id="bill-output-container" class="mt-8 hidden">
                <div id="bill-output" class="bg-white p-8 rounded-xl shadow-lg">
                    </div>
                <div class="mt-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                     <button id="share-bill-btn" class="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                        Share
                    </button>
                    <button id="download-bill-btn" class="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold">Download Bill</button>
                </div>
            </div>`,
    agent: () => `
            <h2 class="text-3xl font-bold text-gray-800 mb-6">Agent Management</h2>
            <div id="agent-auth-section">
                </div>
            <div id="agent-content" class="hidden">
                 <div class="flex justify-between items-center mb-4">
                    <h3 class="text-2xl font-bold text-gray-800">Agent Dashboard</h3>
                    <button id="agent-logout-btn" class="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">Logout</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-white p-6 rounded-xl shadow-md">
                        <h3 class="text-xl font-semibold mb-4">Add/Update Agent</h3>
                        <form id="add-agent-form" class="space-y-4">
                            <input type="text" name="agentName" placeholder="Agent Name" class="w-full p-3 border border-gray-300 rounded-lg" required>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Select Stores & Set Commission</label>
                                <div id="agent-store-list" class="space-y-2 max-h-60 overflow-y-auto border p-4 rounded-lg">
                                    ${
                                      stores
                                        .map(
                                          (store) => `
                                        <div class="flex items-center justify-between">
                                            <label class="flex items-center">
                                                <input type="checkbox" name="selected_stores" value="${store.storeName}" class="h-4 w-4 text-indigo-600 border-gray-300 rounded">
                                                <span class="ml-3 text-gray-700">${store.storeName}</span>
                                            </label>
                                            <input type="number" step="0.01" name="commission_${store.storeName}" placeholder="Comm %" class="w-24 p-1 border border-gray-300 rounded-lg text-sm" disabled>
                                        </div>
                                    `
                                        )
                                        .join("") ||
                                      '<p class="text-gray-500">No stores available. Please add stores first.</p>'
                                    }
                                </div>
                            </div>
                            <button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Save Agent</button>
                        </form>
                    </div>
                    <div class="bg-white p-6 rounded-xl shadow-md">
                        <h3 class="text-xl font-semibold mb-4">Received Commissions</h3>
                        <div class="overflow-x-auto max-h-96">
                            <table class="w-full text-left"><thead class="bg-gray-50 sticky top-0"><tr><th class="p-4 font-semibold text-sm">Date</th><th class="p-4 font-semibold text-sm">Store</th><th class="p-4 font-semibold text-sm">Commission (₹)</th></tr></thead><tbody id="received-commissions-table-body" class="divide-y divide-gray-200"></tbody></table>
                        </div>
                    </div>
                </div>
                <div class="mt-8">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <h3 class="text-2xl font-bold text-gray-800">Agent Commission Report</h3>
                         <div class="flex items-center space-x-2 w-full sm:w-auto">
                            <input type="date" id="agent-report-date" class="p-2 border border-gray-300 rounded-lg w-full">
                            <button id="download-agent-report-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                                <span class="hidden sm:inline">Download</span>
                            </button>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-md overflow-x-auto">
                        <table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">#</th><th class="p-4 font-semibold text-sm">Agent Name</th><th class="p-4 font-semibold text-sm">Stores & Commissions</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="agents-table-body" class="divide-y divide-gray-200"></tbody></table>
                    </div>
                </div>
            </div>`,
    payment: () => `
            <h2 class="text-3xl font-bold text-gray-800 mb-6">Payment Handling</h2>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-xl font-semibold mb-4">Record a Payment</h3>
                <form id="add-payment-form" class="space-y-4">
                    <select id="payment-store-select" class="w-full p-3 border border-gray-300 rounded-lg" required><option value="">Select Store</option></select>
                    <div id="store-due-info" class="p-3 bg-yellow-100 text-yellow-800 rounded-lg hidden"></div>
                    <div id="store-order-total-info" class="p-3 bg-blue-100 text-blue-800 rounded-lg hidden"></div>
                    <input type="number" step="0.01" name="amount" placeholder="Amount Paid (₹)" class="w-full p-3 border border-gray-300 rounded-lg" required>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <div class="flex items-center space-x-4">
                            <label class="flex items-center"><input type="radio" name="paymentMethod" value="Cash" class="h-4 w-4 text-indigo-600 border-gray-300" checked> <span class="ml-2">Cash</span></label>
                            <label class="flex items-center"><input type="radio" name="paymentMethod" value="Online" class="h-4 w-4 text-indigo-600 border-gray-300"> <span class="ml-2">Online</span></label>
                        </div>
                    </div>
                    <button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Record Payment</button>
                </form>
            </div>
            <div class="mt-8">
                 <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h3 class="text-2xl font-bold text-gray-800">Payment History</h3>
                     <div class="flex items-center space-x-2 w-full sm:w-auto">
                        <input type="date" id="payment-download-date" class="p-2 border border-gray-300 rounded-lg w-full">
                        <button id="download-payments-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                            <span class="hidden sm:inline">Download</span>
                        </button>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">Date</th><th class="p-4 font-semibold text-sm">Store</th><th class="p-4 font-semibold text-sm">Amount (₹)</th><th class="p-4 font-semibold text-sm">Method</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="payments-table-body" class="divide-y divide-gray-200"></tbody></table></div>
            </div>`,
    transportation: () => `
            <h2 class="text-3xl font-bold text-gray-800 mb-6">Transportation Management</h2>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="text-xl font-semibold mb-4">Assign Transportation</h3>
                <form id="add-transportation-form" class="space-y-4">
                    <input type="text" name="transportationName" placeholder="Car/Person Name" class="w-full p-3 border border-gray-300 rounded-lg" required>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Select Stores</label>
                        <div id="transportation-store-list" class="space-y-2 max-h-60 overflow-y-auto border p-4 rounded-lg">
                             ${
                               stores
                                 .map(
                                   (store) => `
                                <label class="flex items-center">
                                    <input type="checkbox" name="transport_stores" value="${store.storeName}" class="h-4 w-4 text-indigo-600 border-gray-300 rounded">
                                    <span class="ml-3 text-gray-700">${store.storeName}</span>
                                </label>
                            `
                                 )
                                 .join("") ||
                               '<p class="text-gray-500">No stores available.</p>'
                             }
                        </div>
                    </div>
                    <button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Assign</button>
                </form>
            </div>
            <div class="mt-8">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h3 class="text-2xl font-bold text-gray-800">Transportation Assignments</h3>
                    <div class="flex items-center space-x-2 w-full sm:w-auto">
                        <input type="date" id="transport-download-date" class="p-2 border border-gray-300 rounded-lg w-full">
                        <button id="download-transport-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                            <span class="hidden sm:inline">Download</span>
                        </button>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">Date</th><th class="p-4 font-semibold text-sm">Name</th><th class="p-4 font-semibold text-sm">Assigned Stores</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="transportation-table-body" class="divide-y divide-gray-200"></tbody></table></div>
            </div>
            `,
  };

  // --- NAVIGATION & PAGE RENDERING ---
  const renderPage = (pageName) => {
    const contentDiv = document.getElementById(`content-${pageName}`);
    if (!contentDiv) return;

    contentDiv.innerHTML = templates[pageName]();

    // Re-bind event listeners for the new content
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
        renderTransportation();
        break;
    }
  };

  const navigateTo = (targetId) => {
    document.getElementById(`nav-${targetId}`).click();
    // For mobile, hide the sidebar after navigation
    if (window.innerWidth < 768) {
      sidebar.classList.add("-translate-x-full");
    }
  };

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const pageName = link.id.split("-")[1];
      sidebarLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      pageContents.forEach((content) => {
        content.id === `content-${pageName}`
          ? content.classList.remove("hidden")
          : content.classList.add("hidden");
      });
      renderPage(pageName);
      if (window.innerWidth < 768) {
        sidebar.classList.add("-translate-x-full");
      }
    });
  });

  mobileMenuButton.addEventListener("click", () => {
    sidebar.classList.toggle("-translate-x-full");
  });

  // --- EVENT LISTENER BINDING ---
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
    document
      .getElementById("place-order-btn")
      .addEventListener("click", handlePlaceOrder);
    document
      .getElementById("download-orders-btn")
      .addEventListener("click", handleDownloadProductQuantityExcel);
    renderStoreOptionsForOrder();
    renderProductsForOrder();
  }

  function bindBillingListeners() {
    document
      .getElementById("generate-bill-btn")
      .addEventListener("click", handleGenerateBill);
    const storeSelect = document.getElementById("billing-store-select");
    storeSelect.innerHTML += stores
      .map((s) => `<option value="${s.storeName}">${s.storeName}</option>`)
      .join("");
  }

  function bindAgentListeners() {
    const authSection = document.getElementById("agent-auth-section");
    const agentContent = document.getElementById("agent-content");

    if (!agentPassword) {
      // First time user, needs to set a password
      authSection.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-md"><h3 class="text-xl font-semibold mb-4">Create Agent Password</h3><p class="text-gray-600 mb-4">Create a secure password to manage agents and sensitive actions.</p><form id="agent-signup-form" class="space-y-4"><input type="password" id="new-agent-password" placeholder="Enter new password" class="w-full p-3 border border-gray-300 rounded-lg" required><input type="password" id="confirm-agent-password" placeholder="Confirm new password" class="w-full p-3 border border-gray-300 rounded-lg" required><button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Create Password</button></form></div>`;
      document
        .getElementById("agent-signup-form")
        .addEventListener("submit", handleAgentSignup);
    } else if (!isAgentLoggedIn) {
      // Password exists, show login form
      authSection.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-md"><h3 class="text-xl font-semibold mb-4">Agent Login</h3><form id="agent-login-form" class="space-y-4"><input type="text" id="agent-name-input" placeholder="Agent Name" class="w-full p-3 border border-gray-300 rounded-lg" required><input type="password" id="agent-password-input" placeholder="Enter Password" class="w-full p-3 border border-gray-300 rounded-lg" required><button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Login</button></form></div>`;
      document
        .getElementById("agent-login-form")
        .addEventListener("submit", handleAgentLogin);
    } else {
      // Logged in
      authSection.classList.add("hidden");
      agentContent.classList.remove("hidden");
      document
        .getElementById("add-agent-form")
        .addEventListener("submit", handleAddAgent);
      document
        .getElementById("agent-logout-btn")
        .addEventListener("click", handleAgentLogout);
      document
        .getElementById("download-agent-report-btn")
        .addEventListener("click", handleDownloadAgentReport);
      const storeList = agentContent.querySelector("#agent-store-list");
      storeList.addEventListener("change", (event) => {
        if (event.target.type === "checkbox") {
          const storeName = event.target.value;
          const commissionInput = storeList.querySelector(
            `input[name="commission_${storeName}"]`
          );
          commissionInput.disabled = !event.target.checked;
          if (!event.target.checked) commissionInput.value = "";
        }
      });
      renderAgents();
      renderReceivedCommissions();
    }
  }

  function bindPaymentListeners() {
    document
      .getElementById("add-payment-form")
      .addEventListener("submit", handleAddPayment);
    document
      .getElementById("payment-store-select")
      .addEventListener("change", handlePaymentStoreSelect);
    document
      .getElementById("download-payments-btn")
      .addEventListener("click", handleDownloadPaymentsReport);
  }

  function bindTransportationListeners() {
    document
      .getElementById("add-transportation-form")
      .addEventListener("submit", handleAddTransportation);
    document
      .getElementById("download-transport-btn")
      .addEventListener("click", handleDownloadTransportationExcel);
  }

  // --- RENDER FUNCTIONS ---
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
    // orders should have ISO date strings — ensure we compare against that
    todaysOrdersEl.textContent = orders.filter((o) =>
      (o.date || "").startsWith(today)
    ).length;
  };

  const renderStores = (searchTerm = "") => {
    const storesTableBody = document.getElementById("stores-table-body");
    if (!storesTableBody) return;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // First, map the original array to include the index, then filter.
    // This preserves the original index for the onclick events.
    const filteredStores = stores
      .map((store, index) => ({ ...store, originalIndex: index }))
      .filter(
        (store) =>
          store.storeName.toLowerCase().includes(lowerCaseSearchTerm) ||
          store.customerName.toLowerCase().includes(lowerCaseSearchTerm)
      );

    if (filteredStores.length === 0) {
      // Show a different message depending on whether a search is active
      const message = searchTerm ? "No stores found." : "No stores added yet.";
      storesTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-gray-500">${message}</td></tr>`;
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
            <td class="p-4">${store.details}</td>
            <td class="p-4 space-x-2"><button class="text-blue-600 hover:text-blue-800 font-semibold" onclick="openEditStoreModal(${store.originalIndex})">Edit</button><button class="text-red-500 hover:text-red-700 font-semibold" onclick="removeStore(${store.originalIndex})">Delete</button></td>
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
    if (!orderStoreSelect) return;
    orderStoreSelect.innerHTML =
      "<option value=''>Select Store</option>" +
      stores
        .map(
          (store) =>
            `<option value="${store.storeName}">${store.storeName}</option>`
        )
        .join("");
  };

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
                <button class="quantity-btn" onclick="updateCart(${index}, -1)">-</button>
                <input type="number" value="0" min="0" class="w-16 text-center border rounded-md" onchange="setCartQuantity(${index}, this.value)">
                <button class="quantity-btn" onclick="updateCart(${index}, 1)">+</button>
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

  const renderTodaysOrders = () => {
    const todaysOrdersTableBody = document.getElementById(
      "todays-orders-table-body"
    );
    if (!todaysOrdersTableBody) return;
    const today = new Date().toISOString().slice(0, 10);
    // ensure date exists and is ISO-like when saved
    const todaysOrders = orders.filter((o) => (o.date || "").startsWith(today));
    todaysOrdersTableBody.innerHTML = todaysOrders.length
      ? todaysOrders
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
            <td class="p-4 text-sm">${order.storeCommission}%</td>
            <td class="p-4 font-semibold">₹${order.total.toFixed(2)}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="6" class="text-center p-4 text-gray-500">No orders placed today.</td></tr>`;
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

  const renderReceivedCommissions = () => {
    const commissionTableBody = document.getElementById(
      "received-commissions-table-body"
    );
    if (!commissionTableBody) return;
    const agentCommissions = receivedCommissions.filter(
      (c) => c.agentName === loggedInAgentName
    );
    commissionTableBody.innerHTML =
      agentCommissions
        .map(
          (c) => `
        <tr class="hover:bg-gray-50">
            <td class="p-4">${new Date(c.date).toLocaleDateString()}</td>
            <td class="p-4">${c.storeName}</td>
            <td class="p-4 font-semibold">₹${c.commissionAmount.toFixed(2)}</td>
        </tr>
      `
        )
        .reverse()
        .join("") ||
      `<tr><td colspan="3" class="text-center p-4 text-gray-500">No commissions received yet.</td></tr>`;
  };

  const renderTransportation = () => {
    const transportationTableBody = document.getElementById(
      "transportation-table-body"
    );
    if (!transportationTableBody) return;
    transportationTableBody.innerHTML =
      transportation
        .map(
          (item, index) => `
        <tr class="hover:bg-gray-50">
            <td class="p-4">${new Date(item.date).toLocaleDateString()}</td>
            <td class="p-4 font-medium">${item.transportationName}</td>
            <td class="p-4 text-sm">${item.stores.join(", ")}</td>
            <td class="p-4"><button class="text-red-500 hover:text-red-700 font-semibold" onclick="removeTransportation(${index})">Delete</button></td>
        </tr>`
        )
        .join("") ||
      `<tr><td colspan="4" class="text-center p-4 text-gray-500">No transportation assigned yet.</td></tr>`;
  };

  const renderPaymentsPage = () => {
    const paymentStoreSelect = document.getElementById("payment-store-select");
    if (!paymentStoreSelect) return;
    paymentStoreSelect.innerHTML =
      "<option value=''>Select Store</option>" +
      stores
        .map(
          (store) =>
            `<option value="${store.storeName}">${store.storeName}</option>`
        )
        .join("");
    renderPaymentHistory();
  };

  const renderPaymentHistory = () => {
    const paymentsTableBody = document.getElementById("payments-table-body");
    if (!paymentsTableBody) return;
    paymentsTableBody.innerHTML = payments.length
      ? payments
          .map(
            (payment, index) => `
        <tr class="hover:bg-gray-50">
            <td class="p-4">${new Date(payment.date).toLocaleString()}</td>
            <td class="p-4 font-medium">${payment.storeName}</td>
            <td class="p-4 font-semibold">₹${payment.amount.toFixed(2)}</td>
            <td class="p-4">${payment.paymentMethod}</td>
            <td class="p-4"><button class="text-red-500 hover:text-red-700 font-semibold" onclick="removePayment(${index})">Delete</button></td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="text-center p-4 text-gray-500">No payments recorded yet.</td></tr>`;
  };

  // --- HANDLER FUNCTIONS ---
  function handleAddStore(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    stores.push({
      storeName: formData.get("storeName"),
      customerName: formData.get("customerName"),
      transport: parseFloat(formData.get("transport")) || 0,
      storeCommission: parseFloat(formData.get("storeCommission")) || 0,
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
      price: parseFloat(formData.get("price")).toFixed(2),
    });
    saveData();
    renderProducts();
    updateDashboard();
    e.target.reset();
  }

  function handlePlaceOrder() {
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
      date: new Date().toISOString(), // <-- date included (ISO)
      storeName,
      customerName: store.customerName,
      items: cart,
      itemsTotal,
      transportCharge: store.transport || 0,
      storeCommission: store.storeCommission || 0,
      total: itemsTotal + (store.transport || 0),
    };
    orders.push(newOrder);

    // Check for agent commission
    const agent = agents.find((a) => a.commissions && a.commissions.hasOwnProperty(storeName));
    if (agent) {
      const commissionRate = agent.commissions[storeName];
      const commissionAmount = newOrder.itemsTotal * (commissionRate / 100);
      receivedCommissions.push({
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

  function handleGenerateBill() {
    const storeName = document.getElementById("billing-store-select").value;
    const billDateInput = document.getElementById("billing-date");
    const billDate = billDateInput.value;

    if (!storeName) {
      alert("Please select a store.");
      return;
    }

    const store = stores.find((s) => s.storeName === storeName);
    const relevantOrders = billDate
      ? orders.filter(
          (o) => o.storeName === storeName && (o.date || "").startsWith(billDate)
        )
      : orders.filter((o) => o.storeName === storeName);

    if (relevantOrders.length === 0) {
      alert(
        `No orders found for ${storeName}` + (billDate ? ` on ${billDate}` : "")
      );
      return;
    }

    const totalPaid = payments
      .filter((p) => p.storeName === storeName)
      .reduce((sum, p) => sum + p.amount, 0);
    const dueAmount = calculateDue(storeName);
    const dateTitle = billDate
      ? `on ${new Date(billDate).toLocaleDateString()}`
      : "for All Time";

    const billOutput = document.getElementById("bill-output");
    billOutput.innerHTML = `
        <div class="text-center mb-8">
            <h2 class="text-2xl font-bold">Bill for ${storeName}</h2>
            <p class="text-gray-600">Date Range: ${dateTitle}</p>
        </div>
        <h3 class="text-lg font-semibold border-b pb-2 mb-4">Orders ${dateTitle}</h3>
        ${relevantOrders
          .map((order) => {
            const storeCommissionValue =
              order.itemsTotal * (order.storeCommission / 100);
            return `
            <div class="mb-4 border-b pb-4">
                <p><strong>Order Time:</strong> ${new Date(
                  order.date
                ).toLocaleString()}</p>
                <table class="w-full text-sm mt-2">
                    <thead><tr class="border-b"><th class="text-left py-1">Item</th><th class="text-right py-1">Qty</th><th class="text-right py-1">Price</th><th class="text-right py-1">Total</th></tr></thead>
                    <tbody>${order.items
                      .map(
                        (item) =>
                          `<tr><td class="py-1">${item.productName}</td><td class="text-right py-1">${item.quantity}</td><td class="text-right py-1">₹${item.price}</td><td class="text-right py-1">₹${(
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
                    <p class="text-sm text-red-500">Store Commission (${
                      order.storeCommission
                    }%): - ₹${storeCommissionValue.toFixed(2)}</p>
                    <p class="font-bold text-lg">Order Net Total: ₹${(
                      order.total - storeCommissionValue
                    ).toFixed(2)}</p>
                </div>
            </div>`;
          })
          .join("")}
        <div class="border-t mt-8 pt-4 text-right">
            <p class="text-lg">Total Paid (All Time): ₹${totalPaid.toFixed(
              2
            )}</p>
            <p class="text-2xl font-bold mt-4">Total Due Amount: ₹${dueAmount.toFixed(
              2
            )}</p>
        </div>
    `;

    document.getElementById("bill-output-container").classList.remove("hidden");
    document.getElementById("download-bill-btn").onclick = () => window.print();
    document.getElementById("share-bill-btn").onclick = () =>
      shareBill(storeName, dueAmount);
  }

  function handleAddAgent(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const agentName = formData.get("agentName");
    const selectedStores = formData.getAll("selected_stores");
    const commissions = {};

    selectedStores.forEach((storeName) => {
      const commissionValue = formData.get(`commission_${storeName}`);
      if (commissionValue) commissions[storeName] = parseFloat(commissionValue);
    });

    if (!agentName || Object.keys(commissions).length === 0) {
      alert(
        "Please provide agent name and at least one store with commission."
      );
      return;
    }
    const existingAgentIndex = agents.findIndex(
      (a) => a.agentName === agentName
    );
    if (existingAgentIndex > -1) {
      agents[existingAgentIndex].commissions = commissions;
    } else {
      agents.push({ agentName, commissions });
    }

    saveData();
    renderAgents();
    updateDashboard();
    e.target.reset();
    document
      .querySelectorAll('#agent-store-list input[type="number"]')
      .forEach((input) => (input.disabled = true));
  }

  function handleAddTransportation(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const transportationName = formData.get("transportationName");
    const selectedStores = formData.getAll("transport_stores");

    if (!transportationName || selectedStores.length === 0) {
      alert("Please provide a name and select at least one store.");
      return;
    }

    transportation.push({
      date: new Date().toISOString(),
      transportationName,
      stores: selectedStores,
    });
    saveData();
    renderTransportation();
    e.target.reset();
  }

  function handleAddPayment(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const storeName = document.getElementById("payment-store-select").value;
    const amount = parseFloat(formData.get("amount"));
    const paymentMethod = formData.get("paymentMethod");

    if (!storeName || !amount) {
      alert("Please select a store and enter a valid amount.");
      return;
    }

    payments.push({
      date: new Date().toISOString(),
      storeName,
      amount,
      paymentMethod,
    });

    saveData();
    alert("Payment recorded!");
    renderPaymentHistory();
    e.target.reset();
    document.getElementById("store-due-info").classList.add("hidden");
    document.getElementById("store-order-total-info").classList.add("hidden");
  }

  function handlePaymentStoreSelect(e) {
    const storeName = e.target.value;
    const storeDueInfo = document.getElementById("store-due-info");
    const storeOrderTotalInfo = document.getElementById(
      "store-order-total-info"
    );
    if (!storeName) {
      storeDueInfo.classList.add("hidden");
      storeOrderTotalInfo.classList.add("hidden");
      return;
    }
    const due = calculateDue(storeName);
    storeDueInfo.textContent = `Current Due for ${storeName}: ₹${due.toFixed(
      2
    )}`;
    storeDueInfo.classList.remove("hidden");

    const totalOrdered = orders
      .filter((o) => o.storeName === storeName)
      .reduce((sum, o) => sum + o.total, 0);
    storeOrderTotalInfo.textContent = `Total Ordered by ${storeName}: ₹${totalOrdered.toFixed(
      2
    )}`;
    storeOrderTotalInfo.classList.remove("hidden");
  }

  function handleDownloadProductQuantityExcel() {
    if (orders.length === 0) {
      alert("No orders available to generate a report.");
      return;
    }
    const storeProductQuantities = {};
    orders.forEach((order) => {
      if (!storeProductQuantities[order.storeName])
        storeProductQuantities[order.storeName] = {};
      order.items.forEach((item) => {
        storeProductQuantities[order.storeName][item.productName] =
          (storeProductQuantities[order.storeName][item.productName] || 0) +
          item.quantity;
      });
    });
    const productNames = [...new Set(products.map((p) => p.productName))];
    const worksheetData = [];
    const header = ["Store Name", ...productNames, "Total Products"];
    worksheetData.push(header);
    Object.entries(storeProductQuantities).forEach(
      ([storeName, productQtys]) => {
        let total = 0;
        const row = [storeName];
        productNames.forEach((pName) => {
          const qty = productQtys[pName] || 0;
          row.push(qty);
          total += qty;
        });
        row.push(total);
        worksheetData.push(row);
      }
    );
    const totalRow = ["TOTAL"];
    let grandTotal = 0;
    productNames.forEach((pName, i) => {
      const productTotal = Object.values(storeProductQuantities).reduce(
        (sum, qtys) => sum + (qtys[pName] || 0),
        0
      );
      totalRow.push(productTotal);
      grandTotal += productTotal;
    });
    totalRow.push(grandTotal);
    worksheetData.push(totalRow);
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Product Quantity Summary"
    );
    XLSX.writeFile(
      workbook,
      `Product_Quantity_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  function handleDownloadTransportationExcel() {
    const dateFilter = document.getElementById("transport-download-date").value;
    if (!dateFilter) {
      alert("Please select a date to download the report.");
      return;
    }
    const filteredData = transportation.filter((item) =>
      item.date.startsWith(dateFilter)
    );
    if (filteredData.length === 0) {
      alert(`No transportation data found for ${dateFilter}.`);
      return;
    }
    const worksheetData = filteredData.map((item) => ({
      Date: new Date(item.date).toLocaleDateString(),
      "Transportation Name": item.transportationName,
      "Assigned Stores": item.stores.join(", "),
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transportation Report");
    XLSX.writeFile(workbook, `Transportation_Report_${dateFilter}.xlsx`);
  }

  function handleDownloadPaymentsReport() {
    const dateFilter = document.getElementById("payment-download-date").value;
    if (!dateFilter) {
      alert("Please select a date to download the report.");
      return;
    }
    const filteredPayments = payments.filter((p) =>
      p.date.startsWith(dateFilter)
    );
    if (filteredPayments.length === 0) {
      alert(`No payments found for ${dateFilter}.`);
      return;
    }
    const reportData = filteredPayments.map((p) => ({
      Date: new Date(p.date).toLocaleString(),
      "Store Name": p.storeName,
      "Amount Paid": p.amount,
      "Payment Method": p.paymentMethod,
      "Due Amount After Payment": calculateDue(p.storeName),
    }));
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Report");
    XLSX.writeFile(workbook, `Payment_Report_${dateFilter}.xlsx`);
  }

  function handleDownloadAgentReport() {
    const dateFilter = document.getElementById("agent-report-date").value;
    if (!dateFilter) {
      alert("Please select a date for the report.");
      return;
    }
    const reportData = [];
    agents.forEach((agent) => {
      let totalCommission = 0;
      const storeBreakdown = [];
      Object.entries(agent.commissions).forEach(
        ([storeName, commissionRate]) => {
          const storeOrders = orders.filter(
            (o) => o.storeName === storeName && (o.date || "").startsWith(dateFilter)
          );
          const storeTotal = storeOrders.reduce(
            (sum, o) => sum + o.itemsTotal,
            0
          );
          const commission = storeTotal * (commissionRate / 100);
          totalCommission += commission;
          storeBreakdown.push(`${storeName}: ₹${commission.toFixed(2)}`);
        }
      );
      reportData.push({
        "Agent Name": agent.agentName,
        "Total Commission": totalCommission,
        "Commission Breakdown": storeBreakdown.join(" | "),
      });
    });
    if (reportData.length === 0) {
      alert(`No agent commission data for ${dateFilter}.`);
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Agent Commission Report"
    );
    XLSX.writeFile(workbook, `Agent_Commission_Report_${dateFilter}.xlsx`);
  }

  // --- PASSWORD & AUTH LOGIC ---
  function handleAgentSignup(e) {
    e.preventDefault();
    const newPassword = document.getElementById("new-agent-password").value;
    const confirmPassword = document.getElementById(
      "confirm-agent-password"
    ).value;
    if (newPassword.length < 4) {
      alert("Password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    agentPassword = newPassword;
    isAgentLoggedIn = true;
    loggedInAgentName = "Admin"; // Default name for the main user
    saveData();
    renderPage("agent");
  }

  function handleAgentLogin(e) {
    e.preventDefault();
    const name = document.getElementById("agent-name-input").value;
    const password = document.getElementById("agent-password-input").value;
    // For simplicity, we only have one admin/agent password.
    // A real app would look up the agent by name and check their specific password.
    if (password === agentPassword) {
      isAgentLoggedIn = true;
      loggedInAgentName = name;
      renderPage("agent");
    } else {
      alert("Incorrect password.");
    }
  }

  function handleAgentLogout() {
    isAgentLoggedIn = false;
    loggedInAgentName = "";
    renderPage("agent");
  }

  const promptForPassword = (callback, message) => {
    if (!agentPassword) {
      alert(
        "Please set up an agent password first in the Agent Management section."
      );
      return;
    }
    passwordCallback = callback;
    document.getElementById("password-prompt-message").textContent =
      message || "Please enter the agent password to proceed.";
    passwordModal.classList.remove("hidden");
    document.getElementById("password-input").focus();
  };

  passwordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.getElementById("password-input").value;
    if (password === agentPassword) {
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

  window.openEditStoreModal = (index) => {
    promptForPassword(() => {
      const store = stores[index];
      document.getElementById("edit-store-index").value = index;
      document.getElementById("edit-customerName").value = store.customerName;
      document.getElementById("edit-storeName").value = store.storeName;
      document.getElementById("edit-transport").value = store.transport;
      document.getElementById("edit-storeCommission").value =
        store.storeCommission;
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
      price: parseFloat(document.getElementById("edit-price").value).toFixed(2),
    };
    saveData();
    renderProducts();
    editProductModal.classList.add("hidden");
  });

  cancelEditStoreBtn.addEventListener("click", () =>
    editStoreModal.classList.add("hidden")
  );
  cancelEditProductBtn.addEventListener("click", () =>
    editProductModal.classList.add("hidden")
  );

  // --- GLOBAL & HELPER FUNCTIONS ---
  const calculateDue = (storeName) => {
    const totalOrderedValue = orders
      .filter((o) => o.storeName === storeName)
      .reduce((sum, o) => {
        const commissionValue = o.itemsTotal * (o.storeCommission / 100);
        return sum + o.total - commissionValue;
      }, 0);
    const totalPaid = payments
      .filter((p) => p.storeName === storeName)
      .reduce((sum, p) => sum + p.amount, 0);
    return totalOrderedValue - totalPaid;
  };

  const shareBill = async (storeName, dueAmount) => {
    const billText = `Bill for ${storeName}:\nTotal Due Amount: ₹${dueAmount.toFixed(
      2
    )}\n\nThank you!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bill for ${storeName}`,
          text: billText,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        alert("Could not share the bill.");
      }
    } else {
      navigator.clipboard.writeText(billText).then(() => {
        alert("Bill details copied to clipboard!");
      });
    }
  };

  window.removeStore = (index) => {
    promptForPassword(() => {
      stores.splice(index, 1);
      saveData();
      renderStores();
      updateDashboard();
    }, `Enter agent password to delete store: ${stores[index].storeName}`);
  };

  window.removeProduct = (index) => {
    promptForPassword(() => {
      products.splice(index, 1);
      saveData();
      renderProducts();
      updateDashboard();
    }, `Enter agent password to delete product: ${products[index].productName}`);
  };

  window.removeAgent = (index) => {
    promptForPassword(() => {
      agents.splice(index, 1);
      saveData();
      renderAgents();
      updateDashboard();
    }, `Enter agent password to delete agent: ${agents[index].agentName}`);
  };

  window.removeTransportation = (index) => {
    promptForPassword(() => {
      transportation.splice(index, 1);
      saveData();
      renderTransportation();
    }, `Enter agent password to delete assignment for: ${transportation[index].transportationName}`);
  };

  window.removePayment = (index) => {
    if (
      confirm(
        `Are you sure you want to delete this payment? This action cannot be undone.`
      )
    ) {
      payments.splice(index, 1);
      saveData();
      renderPaymentHistory();
    }
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
    const qty = parseInt(quantity, 10);
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

  // --- INITIAL RENDER ---
  const init = () => {
    renderPage("dashboard");
  };

  init();
});
