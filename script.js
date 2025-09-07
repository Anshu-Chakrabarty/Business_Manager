document.addEventListener("DOMContentLoaded", function () {
  // --- DATA STORAGE using localStorage for persistence ---
  let stores = JSON.parse(localStorage.getItem("stores")) || [];
  let products = JSON.parse(localStorage.getItem("products")) || [];
  let orders = JSON.parse(localStorage.getItem("orders")) || [];
  let payments = JSON.parse(localStorage.getItem("payments")) || [];
  let agents = JSON.parse(localStorage.getItem("agents")) || [];
  let transportation =
    JSON.parse(localStorage.getItem("transportation")) || [];
  let pendingCommissions =
    JSON.parse(localStorage.getItem("pendingCommissions")) || [];
  let paidCommissions =
    JSON.parse(localStorage.getItem("paidCommissions")) || [];
  let ownerPassword = localStorage.getItem("ownerPassword") || null;

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
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const editTransportationModal = document.getElementById(
    "edit-transportation-modal"
  );
  const editTransportationForm = document.getElementById(
    "edit-transportation-form"
  );
  const cancelEditTransportationBtn = document.getElementById(
    "cancel-edit-transportation"
  );
  const resetPasswordModal = document.getElementById("reset-password-modal");
  const resetPasswordForm = document.getElementById("reset-password-form");
  const cancelResetPasswordBtn = document.getElementById(
    "cancel-reset-password"
  );
  const resetPasswordError = document.getElementById("reset-password-error");

  // --- STATE ---
  let cart = [];
  let passwordCallback = null;
  let loggedInUser = null;

  // --- DATA PERSISTENCE ---
  const saveData = () => {
    localStorage.setItem("stores", JSON.stringify(stores));
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("payments", JSON.stringify(payments));
    localStorage.setItem("agents", JSON.stringify(agents));
    localStorage.setItem("transportation", JSON.stringify(transportation));
    localStorage.setItem(
      "pendingCommissions",
      JSON.stringify(pendingCommissions)
    );
    localStorage.setItem("paidCommissions", JSON.stringify(paidCommissions));
    localStorage.setItem("ownerPassword", ownerPassword);
  };

  // --- PAGE TEMPLATES (Unchanged) ---
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
              <div class="bg-white p-6 rounded-xl shadow-md"><h3 class="text-xl font-semibold mb-4">Add New Store</h3><form id="add-store-form" class="space-y-4"><input type="text" name="storeName" placeholder="Store Name" class="w-full p-3 border border-gray-300 rounded-lg" required><input type="text" name="customerName" placeholder="Customer Name" class="w-full p-3 border border-gray-300 rounded-lg" required><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="number" step="0.01" name="transport" placeholder="Transportation Charge (₹) (Optional)" class="w-full p-3 border border-gray-300 rounded-lg"><input type="number" step="0.01" name="storeCommission" placeholder="Store Comm (%)" class="w-full p-3 border border-gray-300 rounded-lg" required></div><input type="text" name="phoneNumber" placeholder="Shop Phone Number" class="w-full p-3 border border-gray-300 rounded-lg"><textarea name="details" placeholder="Basic Details" rows="2" class="w-full p-3 border border-gray-300 rounded-lg"></textarea><button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">Add Store</button></form></div>
              <div class="mt-8 mb-4">
                <input type="text" id="search-store-input" placeholder="Search by Store or Customer Name..." class="w-full p-3 border border-gray-300 rounded-lg">
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mt-8 mb-4">All Stores</h3><div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">#</th><th class="p-4 font-semibold text-sm">Name</th><th class="p-4 font-semibold text-sm">Customer</th><th class="p-4 font-semibold text-sm">Transport (₹)</th><th class="p-4 font-semibold text-sm">Store Comm (%)</th><th class="p-4 font-semibold text-sm">Phone Number</th><th class="p-4 font-semibold text-sm">Details</th><th class="p-4 font-semibold text-sm">Actions</th></tr></thead><tbody id="stores-table-body" class="divide-y divide-gray-200"></tbody></table></div>`,
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
              <div class="mt-8">
                  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <h3 class="text-2xl font-bold text-gray-800">Order Reports</h3>
                        <div class="flex flex-col sm:flex-row items-start sm:items-end gap-2 w-full sm:w-auto">
                            <div class="w-full sm:w-auto">
                                <label for="order-download-start-date" class="block text-sm font-medium text-gray-700">From</label>
                                <input type="date" id="order-download-start-date" class="p-2 border border-gray-300 rounded-lg w-full">
                            </div>
                            <div class="w-full sm:w-auto">
                               <label for="order-download-end-date" class="block text-sm font-medium text-gray-700">To</label>
                               <input type="date" id="order-download-end-date" class="p-2 border border-gray-300 rounded-lg w-full">
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
                  <div class="bg-white rounded-xl shadow-md overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="p-4 font-semibold text-sm">Date</th><th class="p-4 font-semibold text-sm">Store</th><th class="p-4 font-semibold text-sm">Customer</th><th class="p-4 font-semibold text-sm">Items</th><th class="p-4 font-semibold text-sm">Store Commission</th><th class="p-4 font-semibold text-sm">Order Total</th></tr></thead><tbody id="todays-orders-table-body" class="divide-y divide-gray-200"></tbody></table></div>
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
                          <span class="hidden sm:inline">Download Store Report Image</span>
                      </button>
                      <div class="w-full sm:w-auto">
                          <label for="momo-sticker-store-select" class="block text-sm font-medium text-gray-700">Momo Sticker</label>
                          <select id="momo-sticker-store-select" class="p-2 border border-gray-300 rounded-lg w-full">
                              <option value="">Select Store</option>
                          </select>
                      </div>
                      <button id="download-momo-sticker-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center w-full sm:w-auto justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                          <span class="hidden sm:inline">Download Momo Sticker</span>
                      </button>
                  </div>
              </div>`,
    billing: () => `
              <h2 class="text-3xl font-bold text-gray-800 mb-6">Billing</h2>
              <div class="bg-white p-6 rounded-xl shadow-md">
                  <h3 class="text-xl font-semibold mb-4">Generate Bill</h3>
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div class="flex-grow md:col-span-2">
                          <label for="billing-store-select" class="block text-sm font-medium text-gray-700">Store</label>
                          <select id="billing-store-select" class="mt-1 w-full p-3 border border-gray-300 rounded-lg" required><option value="">Select a Store</option></select>
                      </div>
                      <div class="flex-grow md:col-span-2">
                          <label for="billing-date" class="block text-sm font-medium text-gray-700">Date</label>
                          <input type="date" id="billing-date" class="mt-1 w-full p-3 border border-gray-300 rounded-lg">
                      </div>
                      <button id="generate-bill-btn" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold h-fit w-full md:col-span-4">Generate</button>
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
                          <button id="download-bill-btn" class="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold">Download Bill</button>
                  </div>
              </div>`,
    agent: () => {
      if (!ownerPassword) {
        return `
            <div class="bg-white p-6 rounded-xl shadow-md text-center">
                <h3 class="text-xl font-semibold mb-4">Welcome!</h3>
                <p class="text-gray-600 mb-6">Please set up an owner password to secure your application and manage agents.</p>
                <form id="initial-owner-signup-form" class="space-y-4 max-w-sm mx-auto">
                    <input type="password" id="new-owner-password" placeholder="Enter New Password" class="w-full p-3 border border-gray-300 rounded-lg" required>
                    <input type="password" id="confirm-owner-password" placeholder="Confirm New Password" class="w-full p-3 border border-gray-300 rounded-lg" required>
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
                              <input type="text" name="agentName" placeholder="Agent Name" class="w-full p-3 border border-gray-300 rounded-lg" required>
                              <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">Select Stores & Set Commission</label>
                                  <div id="agent-store-list" class="space-y-2 max-h-60 overflow-y-auto border p-4 rounded-lg">
                                      ${
                                        stores
                                          .map(
                                            (store) =>
                                              `<div class="flex items-center justify-between"><label class="flex items-center"><input type="checkbox" name="selected_stores" value="${store.storeName}" class="h-4 w-4 text-indigo-600 border-gray-300 rounded"><span class="ml-3 text-gray-700">${store.storeName}</span></label><input type="number" step="0.01" name="commission_${store.storeName}" placeholder="Comm %" class="w-24 p-1 border border-gray-300 rounded-lg text-sm" disabled></div>`
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
              <div class="bg-white p-6 rounded-xl shadow-md">
                  <h3 class="text-xl font-semibold mb-4">Record a Payment</h3>
                  <form id="add-payment-form" class="space-y-4">
                      <select id="payment-store-select" class="w-full p-3 border border-gray-300 rounded-lg" required>
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
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0 v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                                <span class="hidden sm:inline">Download</span>
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
                      <input type="text" name="transportationName" placeholder="Car/Person Name" class="w-full p-3 border border-gray-300 rounded-lg" required>
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
                      <input type="text" id="edit-deliveryShopCode" placeholder="Delivery Shop Code" class="w-full p-3 border border-gray-300 rounded-lg">
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
                              <label for="transport-download-start-date" class="block text-sm font-medium text-gray-700">From</label>
                              <input type="date" id="transport-download-start-date" class="p-2 border border-gray-300 rounded-lg w-full">
                          </div>
                          <div class="w-full sm:w-auto">
                             <label for="transport-download-end-date" class="block text-sm font-medium text-gray-700">To</label>
                             <input type="date" id="transport-download-end-date" class="p-2 border border-gray-300 rounded-lg w-full">
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
              </div>
              `,
  };

  // --- MODIFIED: Momo Sheet Download Function ---
  function handleDownloadMomoSheet() {
    const today = new Date().toISOString().slice(0, 10);
    const ordersToday = orders.filter((o) => o.date.startsWith(today));

    if (ordersToday.length === 0) {
      alert("No orders found for today.");
      return;
    }

    // NEW: Dynamically find all unique "Momo" or "Soup" products from today's orders (case-insensitive)
    const reportableProductNames = [
      ...new Set(
        ordersToday
          .flatMap((o) => o.items)
          .filter((item) => {
            const lowerCaseName = item.productName.toLowerCase();
            return lowerCaseName.includes("momo") || lowerCaseName.includes("soup");
          })
          .map((item) => item.productName)
      ),
    ].sort();

    if (reportableProductNames.length === 0) {
      alert("No 'Momo' or 'Soup' products were ordered today.");
      return;
    }

    const consolidatedOrders = {};

    ordersToday.forEach((order) => {
      // Ensure a row for the store exists
      if (!consolidatedOrders[order.storeName]) {
        consolidatedOrders[order.storeName] = {
          "Store Name": order.storeName,
          Date: new Date(order.date).toLocaleDateString("en-GB"),
        };
        // Initialize all product columns to 0 for this store
        reportableProductNames.forEach((productName) => {
          consolidatedOrders[order.storeName][productName] = 0;
        });
      }

      // Add quantities from the order
      order.items.forEach((item) => {
        if (reportableProductNames.includes(item.productName)) {
          consolidatedOrders[order.storeName][item.productName] +=
            item.quantity;
        }
      });
    });

    const reportData = Object.values(consolidatedOrders);

    if (reportData.length === 0) {
      alert("No relevant orders found for today.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Momo & Soup Orders");

    const fileName = `Momo_Soup_Orders_${today}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  // --- INITIALIZATION ---
  const init = () => {
    renderPage("dashboard");
  };

  // --- All other functions are unchanged, placing them here for completeness ---
  // (The rest of your script.js code remains the same as the previous version)

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
    document
      .getElementById("place-order-btn")
      .addEventListener("click", handlePlaceOrder);
    document
      .getElementById("download-orders-btn")
      .addEventListener("click", handleDownloadOrdersExcel);
    document
      .getElementById("download-momo-sheet-btn")
      .addEventListener("click", handleDownloadMomoSheet);
    renderStoreOptionsForOrder();
    renderProductsForOrder();
    document
      .getElementById("order-product-list")
      .addEventListener("keydown", (e) => {
        const activeElement = document.activeElement;
        if (
          activeElement &&
          activeElement.tagName === "INPUT" &&
          activeElement.type === "number"
        ) {
          const productInputs = document.querySelectorAll(
            '#order-product-list input[type="number"]'
          );
          const currentIndex = Array.from(productInputs).indexOf(activeElement);
          if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault();
            if (currentIndex < productInputs.length - 1) {
              productInputs[currentIndex + 1].focus();
            }
          } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault();
            if (currentIndex > 0) {
              productInputs[currentIndex - 1].focus();
            }
          }
        }
      });
    document
      .getElementById("download-store-orders-img-btn")
      .addEventListener("click", handleDownloadStoreReportImage);
    const momoStickerStoreSelect = document.getElementById(
      "momo-sticker-store-select"
    );
    momoStickerStoreSelect.innerHTML =
      "<option value=''>Select Store</option>" +
      stores
        .map((s) => `<option value="${s.storeName}">${s.storeName}</option>`)
        .join("");
    document
      .getElementById("download-momo-sticker-btn")
      .addEventListener("click", handleDownloadMomoSticker);
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
    if (!ownerPassword) {
      const signupForm = document.getElementById("initial-owner-signup-form");
      if (signupForm) {
        signupForm.addEventListener("submit", handleOwnerSignup);
      }
      return;
    }
    const agentSelect = document.getElementById("agent-select-name");
    const agentDetailsView = document.getElementById("agent-details-view");
    const addAgentForm = document.getElementById("add-agent-form");
    const downloadStatementBtn = document.getElementById(
      "download-agent-statement-btn"
    );
    agentSelect.innerHTML =
      `<option value="">Select an Agent</option>` +
      agents
        .map((a) => `<option value="${a.agentName}">${a.agentName}</option>`)
        .join("");
    agentSelect.addEventListener("change", (e) => {
      const selectedAgentName = e.target.value;
      if (selectedAgentName) {
        agentDetailsView.classList.remove("hidden");
        renderAgentCommissions(selectedAgentName);
      } else {
        agentDetailsView.classList.add("hidden");
      }
    });
    downloadStatementBtn.addEventListener("click", () => {
      const selectedAgentName = agentSelect.value;
      const monthYear = document.getElementById("agent-report-month").value;
      if (selectedAgentName && monthYear) {
        handleDownloadAgentStatement(selectedAgentName, monthYear);
      } else {
        alert(
          "Please select an agent and a month to download the statement."
        );
      }
    });
    if (addAgentForm) {
      addAgentForm.addEventListener("submit", handleAddAgent);
      const agentStoreList = document.getElementById("agent-store-list");
      agentStoreList.addEventListener("change", (e) => {
        if (e.target.type === "checkbox") {
          const commInput = document.querySelector(
            `input[name="commission_${e.target.value}"]`
          );
          if (commInput) {
            commInput.disabled = !e.target.checked;
            if (!e.target.checked) {
              commInput.value = "";
            }
          }
        }
      });
    }
    renderAgents();
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
  // ... and the rest of your functions (updateDashboard, renderStores, etc.)
  // (They are unchanged and not repeated here for brevity, but they are included in the downloadable file)
  const updateDashboard = () => {
    const totalStoresEl = document.getElementById("dashboard-total-stores");
    const totalProductsEl = document.getElementById(
      "dashboard-total-products"
    );
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
      .map((store, index) => ({ ...store,
        originalIndex: index
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
    const storeDownloadSelect = document.getElementById(
      "store-download-select"
    );
    const momoStickerStoreSelect = document.getElementById(
      "momo-sticker-store-select"
    );
    if (!orderStoreSelect) return;
    const allStoresInvolved = [
      ...new Set(stores.map((o) => o.storeName)),
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
    if (momoStickerStoreSelect) {
      momoStickerStoreSelect.innerHTML = storeOptions;
    }
  };
  const renderProductsForOrder = () => {
    const orderProductList = document.getElementById("order-product-list");
    if (!orderProductList) return;
    orderProductList.innerHTML = products.length ?
      products
      .map(
        (product, index) => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <div><p class="font-semibold">${
              product.productName
            }</p><p class="text-sm text-gray-600">₹${product.price}</p></div>
            <div class="flex items-center space-x-2">
                <button class="quantity-btn" onclick="updateCart(${index}, -1)">-</button>
                <input type="number" step="0.01" value="0" min="0" class="w-16 text-center border rounded-md" onchange="setCartQuantity(${index}, this.value)">
                <button class="quantity-btn" onclick="updateCart(${index}, 1)">+</button>
            </div>
        </div>`
      )
      .join("") :
      `<p class="text-gray-500 p-4">Add products to see them here.</p>`;
  };
  const renderCart = () => {
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalEl = document.getElementById("cart-total");
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = cart.length ?
      cart
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
      .join("") :
      `<p class="text-gray-500 p-4">No items in cart</p>`;
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
    const todaysOrders = orders.filter((o) => o.date.startsWith(today));
    todaysOrdersTableBody.innerHTML = todaysOrders.length ?
      todaysOrders
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
        </tr>`
      )
      .join("") :
      `<tr><td colspan="6" class="text-center p-4 text-gray-500">No orders placed today.</td></tr>`;
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
    const pendingTableBody = document.getElementById(
      "pending-commissions-table-body"
    );
    const paidTableBody = document.getElementById(
      "paid-commissions-table-body"
    );
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
    pendingTableBody.innerHTML = agentPendingCommissions.length ?
      agentPendingCommissions
      .map((c) => {
        const commissionRate = agent.commissions[c.storeName] || 0;
        return `
                  <tr class="hover:bg-gray-50">
                      <td class="p-4">${new Date(
                        c.date
                      ).toLocaleDateString()}</td>
                      <td class="p-4">${c.storeName}</td>
                      <td class="p-4">${commissionRate}%</td>
                      <td class="p-4 font-semibold">₹${c.commissionAmount.toFixed(
                        2
                      )}</td>
                      <td class="p-4"><button class="text-green-600 hover:text-green-800 font-semibold" onclick="payCommission('${
                        c.orderId
                      }')">Pay</button></td>
                  </tr>
                  `;
      })
      .reverse()
      .join("") :
      `<tr><td colspan="5" class="text-center p-4 text-gray-500">No pending commissions.</td></tr>`;
    paidTableBody.innerHTML = agentPaidCommissions.length ?
      agentPaidCommissions
      .map((c) => {
        const commissionRate = agent.commissions[c.storeName] || 0;
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
      .join("") :
      `<tr><td colspan="5" class="text-center p-4 text-gray-500">No paid commissions history.</td></tr>`;
  };
  const renderTransportationPage = () => {
    const transportationTableBody = document.getElementById(
      "transportation-table-body"
    );
    const transportSelectName = document.getElementById(
      "transport-select-name"
    );
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
    const paymentDownloadStoreSelect = document.getElementById(
      "payment-download-store-select"
    );
    if (!paymentStoreSelect) return;
    const allStoreOptions = stores
      .map(
        (store) =>
        `<option value="${store.storeName}">${store.storeName}</option>`
      )
      .join("");
    paymentStoreSelect.innerHTML =
      "<option value=''>Select Store</option>" + allStoreOptions;
    if (paymentDownloadStoreSelect) {
      const allStoresInvolved = [
        ...new Set([
          ...orders.map((o) => o.storeName),
          ...payments.map((p) => p.storeName),
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
    paymentsTableBody.innerHTML = payments.length ?
      payments
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
            <td class="p-4"><button class="text-red-500 hover:text-red-700 font-semibold" onclick="removePayment(${index})">Delete</button></td>
        </tr>`
      )
      .join("") :
      `<tr><td colspan="6" class="text-center p-4 text-gray-500">No payments recorded yet.</td></tr>`;
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
    if (relevantOrders.length === 0) {
      alert(
        `No orders found for ${storeName} on ${new Date(
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
    const totalOrderedBefore = orders
      .filter((o) => o.storeName === storeName && o.date.slice(0, 10) < billDate)
      .reduce((sum, o) => {
        const commissionValue = o.itemsTotal * (o.storeCommission / 100);
        return sum + o.total - commissionValue;
      }, 0);
    const totalPaidBefore = payments
      .filter((p) => p.storeName === storeName && p.date.slice(0, 10) < billDate)
      .reduce(
        (sum, p) => sum + (p.cashAmount || 0) + (p.onlineAmount || 0),
        0
      );
    const previousDue = totalOrderedBefore - totalPaidBefore;
    const dueAmount = calculateDue(storeName);
    const billOutput = document.getElementById("bill-output");
    billOutput.innerHTML = `
        <div class="relative min-h-[300px]">
            <img src="image_6a1dd8.png" alt="CastleMOMO Logo" class="bill-watermark">
            <div class="flex items-center space-x-2 mb-4">
                <img src="image_6a1dd8.png" alt="CastleMOMO Logo" class="h-8 w-8">
                <h2 class="text-xl font-bold">Bill for ${storeName}</h2>
            </div>
            <p class="text-gray-600 mb-4">Date: ${new Date(
              billDate
            ).toLocaleDateString("en-GB")}</p>
            <h3 class="text-lg font-semibold border-b pb-2 mb-4">Orders</h3>
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
              .join("")}
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
                <p class="text-2xl font-bold mt-4">Current Due Amount: ₹${dueAmount.toFixed(
                  2
                )}</p>
            </div>
        </div>
    `;
    document
      .getElementById("bill-output-container")
      .classList.remove("hidden");
    document.getElementById("download-bill-btn").onclick = () => window.print();
    document.getElementById("share-bill-btn").onclick = () =>
      shareBill(storeName, billOutput);
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
      (a) => a.agentName.toLowerCase() === agentName.toLowerCase()
    );
    if (existingAgentIndex > -1) {
      agents[existingAgentIndex].commissions = commissions;
    } else {
      agents.push({
        agentName,
        commissions
      });
    }
    saveData();
    renderAgents();
    updateDashboard();
    e.target.reset();
    document
      .querySelectorAll('#agent-store-list input[type="number"]')
      .forEach((input) => (input.disabled = true));
  }
  function handleDownloadAgentStatement(agentName, monthYear) {
    const [year, month] = monthYear.split("-");
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, parseInt(month), 0)
      .toISOString()
      .slice(0, 10);
    const agentPendingCommissions = pendingCommissions.filter(
      (c) => c.agentName === agentName && c.date.slice(0, 7) === monthYear
    );
    const agentPaidCommissions = paidCommissions.filter(
      (c) => c.agentName === agentName && c.date.slice(0, 7) === monthYear
    );
    const reportData = [
      ["Agent Statement for", agentName],
      ["Month:", monthYear],
      [],
      ["Pending Commissions"],
      ["Order Date", "Store", "Commission (%)", "Amount (₹)"],
      ...agentPendingCommissions.map((c) => {
        const agent = agents.find((a) => a.agentName === agentName);
        const commissionRate =
          agent && agent.commissions[c.storeName] ?
          agent.commissions[c.storeName] :
          0;
        return [
          new Date(c.date).toLocaleDateString(),
          c.storeName,
          `${commissionRate}%`,
          c.commissionAmount.toFixed(2),
        ];
      }),
      [],
      ["Paid Commissions"],
      ["Paid Date", "Order Date", "Store", "Commission (%)", "Amount (₹)"],
      ...agentPaidCommissions.map((c) => {
        const agent = agents.find((a) => a.agentName === agentName);
        const commissionRate =
          agent && agent.commissions[c.storeName] ?
          agent.commissions[c.storeName] :
          0;
        return [
          new Date(c.paidDate).toLocaleDateString(),
          new Date(c.date).toLocaleDateString(),
          c.storeName,
          `${commissionRate}%`,
          c.commissionAmount.toFixed(2),
        ];
      }),
    ];
    if (
      agentPendingCommissions.length === 0 &&
      agentPaidCommissions.length === 0
    ) {
      alert(`No commission data found for ${agentName} in ${monthYear}.`);
      return;
    }
    const worksheet = XLSX.utils.aoa_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agent Statement");
    const fileName = `Agent_Statement_${agentName}_${monthYear}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
  function handleAddTransportation(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const transportationName = formData.get("transportationName");
    const selectedStores = formData.getAll("transport_stores");
    const deliveryShopCode = formData.get("deliveryShopCode");
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
    e.target.reset();
  }
  function handleAddPayment(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const storeName = document.getElementById("payment-store-select").value;
    const cashAmount = parseFloat(formData.get("cashAmount")) || 0;
    const onlineAmount = parseFloat(formData.get("onlineAmount")) || 0;
    if (!storeName || (cashAmount === 0 && onlineAmount === 0)) {
      alert(
        "Please select a store and enter a valid amount for either cash or online."
      );
      return;
    }
    payments.push({
      date: new Date().toISOString(),
      storeName,
      cashAmount,
      onlineAmount,
    });
    saveData();
    alert("Payment recorded!");
    renderPaymentsPage();
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
  function handleUpdatePendingCommission(e) {
    e.preventDefault();
    const agentName = document.getElementById("agent-name-pending").value;
    const orderId = document.getElementById("order-id-pending").value;
    const commissionAmount = parseFloat(
      document.getElementById("commission-amount-pending").value
    );
    const storeName = document.getElementById("store-name-pending").value;
    const date = document.getElementById("commission-date-pending").value;
    if (
      !agentName ||
      !orderId ||
      isNaN(commissionAmount) ||
      !storeName ||
      !date
    ) {
      alert("Please fill out all fields.");
      return;
    }
    const newCommission = {
      agentName,
      storeName,
      orderId,
      date: new Date(date).toISOString(),
      commissionAmount,
    };
    pendingCommissions.push(newCommission);
    saveData();
    renderAgentCommissions(loggedInUser.agentName);
    alert("Pending commission updated successfully!");
    e.target.reset();
  }
  function handleUpdatePaidCommission(e) {
    e.preventDefault();
    const agentName = document.getElementById("agent-name-paid").value;
    const orderId = document.getElementById("order-id-paid").value;
    const commissionAmount = parseFloat(
      document.getElementById("commission-amount-paid").value
    );
    const storeName = document.getElementById("store-name-paid").value;
    const date = document.getElementById("commission-date-paid").value;
    if (
      !agentName ||
      !orderId ||
      isNaN(commissionAmount) ||
      !storeName ||
      !date
    ) {
      alert("Please fill out all fields.");
      return;
    }
    const newPaidCommission = {
      agentName,
      storeName,
      orderId,
      date: new Date(date).toISOString(),
      commissionAmount,
      paidDate: new Date().toISOString(),
    };
    paidCommissions.push(newPaidCommission);
    saveData();
    renderAgentCommissions(loggedInUser.agentName);
    alert("Paid commission updated successfully!");
    e.target.reset();
  }
  function handleDownloadOrdersExcel() {
    const startDate = document.getElementById(
      "order-download-start-date"
    ).value;
    const endDate = document.getElementById("order-download-end-date").value;
    if (!startDate || !endDate) {
      alert("Please select a start and end date for the report.");
      return;
    }
    const filteredOrders = orders.filter((o) => {
      const orderDate = o.date.slice(0, 10);
      return orderDate >= startDate && orderDate <= endDate;
    });
    if (filteredOrders.length === 0) {
      alert("No orders found in the selected date range.");
      return;
    }
    const allStoreNames = [
      ...new Set(filteredOrders.map((o) => o.storeName)),
    ].sort();
    const allProductNames = [
      ...new Set(products.map((p) => p.productName)),
    ].sort();
    const reportData = allProductNames.map((pName) => {
      const row = {
        Item: pName
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
    const fileName = `Order_Report_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
    tempDiv.classList.add("p-8", "bg-white", "shadow-lg", "rounded-lg");
    tempDiv.style.width = "fit-content";
    tempDiv.style.padding = "20px";
    tempDiv.style.whiteSpace = "pre";
    let content = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 24px; font-weight: bold;">${storeName}</h1>
            <p style="font-size: 16px; color: #6b7280;">Order Report for ${new Date(
              date
            ).toLocaleDateString("en-GB")}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <th style="padding: 10px; text-align: left;">Item</th>
                    <th style="padding: 10px; text-align: right;">Quantity</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(aggregatedItems)
                  .map(
                    ([item, quantity]) => `
                    <tr>
                        <td style="padding: 10px;">${item}</td>
                        <td style="padding: 10px; text-align: right;">${quantity}</td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;
    tempDiv.innerHTML = content;
    document.body.appendChild(tempDiv);
    html2canvas(tempDiv, {
        scale: 2
      })
      .then((canvas) => {
        const link = document.createElement("a");
        link.download = `${storeName}_orders_${date}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        tempDiv.remove();
      })
      .catch((err) => {
        console.error("Error generating image:", err);
        alert("Failed to generate image. Please try again.");
        tempDiv.remove();
      });
  }
  function handleDownloadPaymentsReport() {
    const startDate = document.getElementById(
      "payment-download-start-date"
    ).value;
    const endDate = document.getElementById("payment-download-end-date").value;
    const storeFilter = document.getElementById(
      "payment-download-store-select"
    ).value;
    if (!startDate || !endDate) {
      alert("Please select a start and end date for the ledger report.");
      return;
    }
    if (startDate > endDate) {
      alert("Start date cannot be after end date.");
      return;
    }
    const allStoresInvolved = [
      ...new Set([
        ...orders.map((o) => o.storeName),
        ...payments.map((p) => p.storeName),
      ]),
    ].sort();
    const storesToProcess =
      storeFilter === "all" ? allStoresInvolved : [storeFilter];
    if (storesToProcess.length === 0) {
      alert("No stores have any records to generate a report.");
      return;
    }
    const finalReportData = [
      ["Date", "Shop", "Particulars", "Debit (₹)", "Credit (₹)", "Balance (₹)"],
    ];
    let hasData = false;
    for (const storeName of storesToProcess) {
      const totalOrderedBefore = orders
        .filter(
          (o) => o.storeName === storeName && o.date.slice(0, 10) < startDate
        )
        .reduce((sum, o) => {
          const commissionValue = o.itemsTotal * (o.storeCommission / 100);
          return sum + o.total - commissionValue;
        }, 0);
      const totalPaidBefore = payments
        .filter(
          (p) => p.storeName === storeName && p.date.slice(0, 10) < startDate
        )
        .reduce(
          (sum, p) => sum + (p.cashAmount || 0) + (p.onlineAmount || 0),
          0
        );
      let runningBalance = totalOrderedBefore - totalPaidBefore;
      const ordersInRange = orders
        .filter(
          (o) =>
          o.storeName === storeName &&
          o.date.slice(0, 10) >= startDate &&
          o.date.slice(0, 10) <= endDate
        )
        .map((o) => ({
          date: new Date(o.date),
          type: "Order",
          details: o
        }));
      const paymentsInRange = payments
        .filter(
          (p) =>
          p.storeName === storeName &&
          p.date.slice(0, 10) >= startDate &&
          p.date.slice(0, 10) <= endDate
        )
        .map((p) => ({
          date: new Date(p.date),
          type: "Payment",
          details: p
        }));
      const transactions = [...ordersInRange, ...paymentsInRange];
      if (transactions.length === 0 && runningBalance === 0) {
        continue;
      }
      hasData = true;
      transactions.sort((a, b) => a.date - b.date);
      if (storeFilter === "all" && finalReportData.length > 1) {
        finalReportData.push([]);
      }
      finalReportData.push([
        startDate,
        storeName,
        "Opening Balance",
        "",
        "",
        runningBalance.toFixed(2),
      ]);
      transactions.forEach((tx) => {
        const txDate = tx.date.toISOString().slice(0, 10);
        if (tx.type === "Order") {
          const order = tx.details;
          const commissionValue =
            order.itemsTotal * (order.storeCommission / 100);
          const netAmount = order.total - commissionValue;
          runningBalance += netAmount;
          finalReportData.push([
            txDate,
            storeName,
            `Bill (Order #${order.orderId.slice(-4)})`,
            netAmount.toFixed(2),
            "",
            runningBalance.toFixed(2),
          ]);
        } else {
          // Payment
          const payment = tx.details;
          if (payment.cashAmount && payment.cashAmount > 0) {
            runningBalance -= payment.cashAmount;
            finalReportData.push([
              txDate,
              storeName,
              "Payment Received (Cash)",
              "",
              payment.cashAmount.toFixed(2),
              runningBalance.toFixed(2),
            ]);
          }
          if (payment.onlineAmount && payment.onlineAmount > 0) {
            runningBalance -= payment.onlineAmount;
            finalReportData.push([
              txDate,
              storeName,
              "Payment Received (Online)",
              "",
              payment.onlineAmount.toFixed(2),
              runningBalance.toFixed(2),
            ]);
          }
        }
      });
      finalReportData.push([
        endDate,
        storeName,
        "Closing Balance",
        "",
        "",
        runningBalance.toFixed(2),
      ]);
    }
    if (!hasData) {
      alert(
        "No transaction data found for the selected stores in the specified date range."
      );
      return;
    }
    const worksheet = XLSX.utils.aoa_to_sheet(finalReportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger Report");
    const fileName = `Ledger_Report_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
  function handleDownloadTransportationExcel() {
    const startDate = document.getElementById(
      "transport-download-start-date"
    ).value;
    const endDate = document.getElementById(
      "transport-download-end-date"
    ).value;
    const selectedTransporter = document.getElementById(
      "transport-select-name"
    ).value;
    if (!startDate || !endDate) {
      alert("Please select a date or date range for the report.");
      return;
    }
    let relevantTransports = transportation.filter((t) => {
      const transportDate = t.date.slice(0, 10);
      return transportDate >= startDate && transportDate <= endDate;
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
    const allOrdersInDateRange = orders.filter((o) => {
      const orderDate = o.date.slice(0, 10);
      return orderDate >= startDate && orderDate <= endDate;
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
    allOrdersInDateRange.forEach((order) => {
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
        selectedTransporter !== "all"
          ? selectedTransporter
          : "All Transporters"
      }`,
    ]);
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
    const dateString = startDate ?
      `${startDate}_to_${endDate || "today"}` :
      `until_${endDate}`;
    const fileName = `Delivery_Challan_${
      selectedTransporter !== "all" ? selectedTransporter + "_" : ""
    }${dateString}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
  function handleDownloadTransportStoreDetails() {
    const startDate = document.getElementById(
      "transport-download-start-date"
    ).value;
    const endDate = document.getElementById(
      "transport-download-end-date"
    ).value;
    const selectedTransporter = document.getElementById(
      "transport-select-name"
    ).value;
    if (selectedTransporter === "all") {
      alert(
        "Please select a specific transporter to download store details."
      );
      return;
    }
    if (!startDate || !endDate) {
      alert("Please select a date or date range for the report.");
      return;
    }
    let relevantTransports = transportation.filter((t) => {
      const transportDate = t.date.slice(0, 10);
      return (
        transportDate >= startDate &&
        transportDate <= endDate &&
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
    const dateString = startDate ?
      `${startDate}_to_${endDate || "today"}` :
      `until_${endDate}`;
    const fileName = `Store_Challan_${selectedTransporter}_${dateString}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
  function handleDownloadMomoSticker() {
    const storeName = document.getElementById(
      "momo-sticker-store-select"
    ).value;
    if (!storeName) {
      alert("Please select a store to download stickers.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const ordersToday = orders.filter(
      (o) => o.storeName === storeName && o.date.startsWith(today)
    );
    if (ordersToday.length === 0) {
      alert(`No orders found for ${storeName} today.`);
      return;
    }
    const aggregatedItems = {};
    const momoProductNames = ["Veg Momo", "Chicken Momo", "Soup Momo"];
    ordersToday.forEach((order) => {
      order.items.forEach((item) => {
        if (momoProductNames.includes(item.productName)) {
          if (!aggregatedItems[item.productName]) {
            aggregatedItems[item.productName] = 0;
          }
          aggregatedItems[item.productName] += item.quantity;
        }
      });
    });
    const stickerData = [];
    stickerData.push({
      "Store Name": storeName
    });
    stickerData.push({});
    if (aggregatedItems["Veg Momo"])
      stickerData.push({
        Item: "Veg Momo",
        Quantity: aggregatedItems["Veg Momo"],
      });
    if (aggregatedItems["Chicken Momo"])
      stickerData.push({
        Item: "Chicken Momo",
        Quantity: aggregatedItems["Chicken Momo"],
      });
    if (aggregatedItems["Soup Momo"])
      stickerData.push({
        Item: "Soup Momo",
        Quantity: aggregatedItems["Soup Momo"],
      });
    if (stickerData.length <= 2) {
      alert(`No momo orders for ${storeName} today.`);
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(stickerData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${storeName} Stickers`);
    const fileName = `${storeName}_Momo_Stickers_${today}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
  function handleDownloadAgentReport() {
    const startDate = document.getElementById("agent-report-start-date").value;
    const endDate = document.getElementById("agent-report-end-date").value;
    const selectedAgent = document.getElementById("agent-report-name").value;
    if (!startDate || !endDate) {
      alert("Please select a start and end date for the report.");
      return;
    }
    const commissionsInRange = pendingCommissions.filter((c) => {
      const commissionDate = c.date.slice(0, 10);
      return commissionDate >= startDate && commissionDate <= endDate;
    });
    let agentsToReport = agents;
    if (selectedAgent !== "all") {
      agentsToReport = agents.filter((a) => a.agentName === selectedAgent);
      if (selectedAgent === "owner") {
        agentsToReport.push({
          agentName: "owner",
          commissions: {}
        });
      }
    }
    const reportData = [];
    agentsToReport.forEach((agent) => {
      const agentCommissions = commissionsInRange.filter(
        (c) => c.agentName === agent.agentName
      );
      if (agentCommissions.length > 0) {
        const totalCommission = agentCommissions.reduce(
          (sum, c) => sum + c.commissionAmount,
          0
        );
        reportData.push({
          "Agent Name": agent.agentName,
          "Total Commission (₹)": totalCommission.toFixed(2),
          "Number of Orders": agentCommissions.length,
        });
      }
    });
    if (reportData.length === 0) {
      alert(`No agent commission data found for the selected criteria.`);
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Agent Commission Report"
    );
    const fileName =
      selectedAgent === "all" ?
      `Agent_Commission_Report_${startDate}_to_${endDate}.xlsx` :
      `Agent_Commission_Report_${selectedAgent}_${startDate}_to_${endDate}.xlsx`;
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
  editStoreForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const index = document.getElementById("edit-store-index").value;
    stores[index] = {
      customerName: document.getElementById("edit-customerName").value,
      storeName: document.getElementById("edit-storeName").value,
      transport: parseFloat(document.getElementById("edit-transport").value) || 0,
      storeCommission: parseFloat(document.getElementById("edit-storeCommission").value) ||
        0,
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
      price: parseFloat(document.getElementById("edit-price").value).toFixed(
        2
      ),
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
  cancelEditStoreBtn.addEventListener("click", () =>
    editStoreModal.classList.add("hidden")
  );
  cancelEditProductBtn.addEventListener("click", () =>
    editProductModal.classList.add("hidden")
  );
  cancelEditTransportationBtn.addEventListener("click", () =>
    editTransportationModal.classList.add("hidden")
  );
  const calculateTotalOrdered = (storeName) => {
    return orders
      .filter((o) => o.storeName === storeName)
      .reduce((sum, o) => {
        const commissionValue = o.itemsTotal * (o.storeCommission / 100);
        return sum + o.total - commissionValue;
      }, 0);
  };
  const calculateTotalOrderedUpToDate = (storeName, date) => {
    const ordersUpToDate = orders.filter(
      (o) => o.storeName === storeName && o.date.slice(0, 10) < date
    );
    return ordersUpToDate.reduce((sum, o) => {
      const commissionValue = o.itemsTotal * (o.storeCommission / 100);
      return sum + o.total - commissionValue;
    }, 0);
  };
  const calculateTotalPaidUpToDate = (storeName, date) => {
    const paymentsUpToDate = payments.filter(
      (p) => p.storeName === storeName && p.date.slice(0, 10) < date
    );
    return paymentsUpToDate.reduce(
      (sum, p) => sum + (p.cashAmount || 0) + (p.onlineAmount || 0),
      0
    );
  };
  const calculateDue = (storeName) => {
    const totalOrderedValue = calculateTotalOrdered(storeName);
    const totalPaid = payments
      .filter((p) => p.storeName === storeName)
      .reduce(
        (sum, p) => sum + (p.cashAmount || 0) + (p.onlineAmount || 0),
        0
      );
    return totalOrderedValue - totalPaid;
  };
  const shareBill = async (storeName, billElement) => {
    const shareBtn = document.getElementById("share-bill-btn");
    const originalBtnText = shareBtn.innerHTML;
    shareBtn.innerHTML = "Processing...";
    shareBtn.disabled = true;
    const billContainer = document.getElementById("bill-output");
    const originalStyle = billContainer.style.cssText;
    billContainer.style.width = "300px";
    billContainer.style.padding = "10px";
    billContainer.style.position = "relative";
    try {
      const canvas = await html2canvas(billElement, {
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      const file = new File([blob], `Bill_for_${storeName}.png`, {
        type: "image/png",
      });
      if (navigator.canShare && navigator.canShare({
          files: [file]
        })) {
        await navigator.share({
          title: `Bill for ${storeName}`,
          text: `Here is the bill for ${storeName}.`,
          files: [file],
        });
      } else {
        throw new Error("File sharing not supported.");
      }
    } catch (error) {
      console.error("Error sharing image:", error);
      const billContent = billElement.innerText;
      try {
        await navigator.share({
          title: `Bill for ${storeName}`,
          text: billContent,
        });
      } catch (shareError) {
        console.error("Error sharing text:", shareError);
        alert(
          "Sharing failed. You may need to enable it in your browser settings."
        );
      }
    } finally {
      billContainer.style.cssText = originalStyle;
      shareBtn.innerHTML = originalBtnText;
      shareBtn.disabled = false;
    }
  };
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
        const selectedAgent = document.getElementById("agent-select-name").value;
        if (selectedAgent) {
          renderAgentCommissions(selectedAgent);
        }
        alert("Commission marked as paid!");
      }
    }, `Enter owner password to pay commission of ₹${commissionToPay.commissionAmount.toFixed(
      2
    )} for ${commissionToPay.storeName}`);
  };
  window.updateCart = (productIndex, change) => {
    const product = products[productIndex];
    let cartItem = cart.find(
      (item) => item.productName === product.productName
    );
    if (cartItem) {
      cartItem.quantity += change;
      if (cartItem.quantity <= 0) {
        cart = cart.filter(
          (item) => item.productName !== product.productName
        );
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

  init();
});
