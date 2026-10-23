import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Shared auth header helper (used by almost every call below)
const getAuthHeaders = (token: string, isFormData = false) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {})
  }
});

// ============================================================================
// AUTH / REGISTER / LOGIN
// ============================================================================
export interface RegisterPayload {
  restaurant_name: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'cashier' | 'kitchen' | 'admin' | 'organization';
  password: string;
  otp: string;
}

// --- ORGANIZATION REGISTER ---
export interface OrganizationRegisterPayload {
  organization_name: string; // must exist in the Organizations table
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: string;              // check OrganizationRegisterSchema for allowed values
}

export const registerOrganization = async (data: OrganizationRegisterPayload) => {
  const response = await axios.post(`${API_URL}/organization/auth/register`, data);
  return response.data;
};

// --- ORGANIZATION LOGIN (separate from restaurant/admin login) ---
export interface OrganizationLoginPayload {
  organization_name: string;   // organization_name (restaurant_name kadu)
  email: string;
  password: string;
}

export const loginOrganization = async (data: OrganizationLoginPayload) => {
  const response = await axios.post(`${API_URL}/organization/auth/login`, data);
  return response.data;
};

// OTP (FIXED: API_URL add chesanu, relative URL production lo fail avtundi)
export const sendRegisterOtp = (payload: { email: string; role: string }) =>
  axios.post(`${API_URL}/auth/verify-otp`, payload).then((r) => r.data);

// 1. Explicit Admin Registration
export const registerAdmin = async (data: RegisterPayload) => {
  const response = await axios.post(`${API_URL}/auth/admin_register`, data);
  return response.data;
};

// 2. Explicit Customer/Staff Registration
export const registerCustomer = async (data: RegisterPayload) => {
  // Note: Adjust the prefix (/customer/ or /auth/) based on how you included it in main.py
  const response = await axios.post(`${API_URL}/customer/auth/register`, data);
  return response.data;
};

// --- LOGIN APIS ---
export interface LoginPayload {
  restaurant_name: string;
  email: string;
  password: string;
}

export const loginCustomer = async (data: LoginPayload) => {
  const response = await axios.post(`${API_URL}/customer/auth/login`, data);
  return response.data;
};

export const loginAdmin = async (data: LoginPayload) => {
  const response = await axios.post(`${API_URL}/auth/login`, data);
  return response.data;
};

export interface StaffLoginPayload {
  restaurant_name: string;
  email: string;
  password: string;
  role: string; // Required by backend schema
}

export const loginStaff = async (data: StaffLoginPayload) => {
  const response = await axios.post(`${API_URL}/staff/auth/login`, data);
  return response.data;
};

export interface kitchenLoginPayload {
  restaurant_name: string;
  email: string;
  password: string;
  role: string;
}

export const loginKitchen = async (data: kitchenLoginPayload) => {
  const response = await axios.post(`${API_URL}/kitchen/login`, data);
  return response.data;
};

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================
export const fetchAdminDashboard = async (token: string) => {
  const res = await fetch(`${API_URL}/admin/dashboard/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const fetchOrderPopup = async (orderId: string, token: string) => {
  const res = await axios.get(`${API_URL}/admin/dashboard/order_popup?order_id=${orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// ---- Dashboard filter functions ----
// Backend expects raw query param `filter` and the exact strings
// "today" | "7 days" (WITH a space) | "month" | "year".
// UI ids are 'today' | '7days' | 'month' | 'year' — only '7days' is remapped.
const toBackendFilterValue = (filter: string): string =>
  filter === '7days' ? '7 days' : filter;

export const fetchFilteredRevenue = async (filter: string, token: string) => {
  const res = await axios.get(
    `${API_URL}/admin/dashboard/filter_revenue?filter=${encodeURIComponent(toBackendFilterValue(filter))}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const fetchFilteredOrders = async (filter: string, token: string) => {
  const res = await axios.get(
    `${API_URL}/admin/dashboard/filter_orders?filter=${encodeURIComponent(toBackendFilterValue(filter))}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const fetchFilteredSales = async (filter: string, token: string) => {
  const res = await axios.get(
    `${API_URL}/admin/dashboard/filter_sales?filter=${encodeURIComponent(toBackendFilterValue(filter))}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const fetchFilteredTopItems = async (filter: string, token: string) => {
  const res = await axios.get(
    `${API_URL}/admin/dashboard/filter_top_items?filter=${encodeURIComponent(toBackendFilterValue(filter))}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const fetchFilteredRecentOrders = async (filter: string, token: string) => {
  const res = await axios.get(
    `${API_URL}/admin/dashboard/filter_recent_orders?filter=${filter === 'all' ? 'all' : encodeURIComponent(toBackendFilterValue(filter))}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// ============================================================================
// ADMIN ORDERS
// ============================================================================
export const fetchOrdersPageList = async (filter: string, token: string) => {
  const res = await axios.get(`${API_URL}/admin/orders/orders_filter?filter=${filter}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// ============================================================================
// ADMIN MENU
// ============================================================================
export const fetchMenuDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/menu/`, getAuthHeaders(token));
  return res.data;
};

export const addCategoryAPI = async (data: { category_name: string; description: string }, token: string) => {
  const res = await axios.post(`${API_URL}/admin/menu/add_category`, data, getAuthHeaders(token));
  return res.data;
};

export const addMenuItemAPI = async (data: any, token: string) => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('price', data.price.toString());
  formData.append('description', data.description);
  formData.append('category', data.category);
  formData.append('type', data.type);
  formData.append('is_vegitarian', data.is_vegitarian.toString()); // backend spelling
  if (data.image) formData.append('image', data.image);

  const res = await axios.post(`${API_URL}/admin/menu/add_item`, formData, getAuthHeaders(token, true));
  return res.data;
};

export const updateMenuItemAPI = async (data: any, token: string) => {
  const formData = new FormData();
  formData.append('item_id', data.item_id.toString());
  if (data.name) formData.append('name', data.name);
  if (data.price) formData.append('price', data.price.toString());
  if (data.description) formData.append('description', data.description);
  if (data.category) formData.append('category', data.category);
  if (data.type) formData.append('type', data.type);
  if (data.is_vegitarian !== undefined) formData.append('is_vegitarian', data.is_vegitarian.toString());

  // Only append image if a NEW file was selected
  if (data.image instanceof File) {
    formData.append('image', data.image);
  }

  const res = await axios.put(`${API_URL}/admin/menu/update_item`, formData, getAuthHeaders(token, true));
  return res.data;
};

export const deleteMenuItemAPI = async (itemId: number, token: string) => {
  const res = await axios.delete(`${API_URL}/admin/menu/delete_item/${itemId}`, getAuthHeaders(token));
  return res.data;
};

export const fetchCategoryItemsAPI = async (categoryName: string, token: string) => {
  const res = await axios.get(`${API_URL}/admin/menu/get_category_items/${categoryName}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// Single menu item (prefill the Edit Item dialog with fresh data)
export const fetchMenuItemByIdAPI = async (itemId: number, token: string) => {
  const res = await axios.get(`${API_URL}/admin/menu/get_item/${itemId}`, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// ADMIN STAFF & ROLES
// ============================================================================
export const fetchStaffDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/staff_roles`, getAuthHeaders(token));
  return res.data;
};

export const addRoleAPI = async (data: { role_name: string; permissions: string[] }, token: string) => {
  const res = await axios.post(`${API_URL}/admin/staff_and_roles/add_role`, data, getAuthHeaders(token));
  return res.data;
};

export const deleteStaffAPI = async (staffId: number, token: string) => {
  const res = await axios.delete(`${API_URL}/admin/staff_and_roles/delete_staff_member/${staffId}`, getAuthHeaders(token));
  return res.data;
};

// StaffTab.tsx (react-hook-form + zod) builds the payload in the exact shape
// the backend's Add_Staff / Update_Staff schemas expect; sent as-is.
export interface StaffFormInput {
  full_name: string;
  email: string;
  password?: string;       // required by backend on ADD, omitted on UPDATE
  role: string;
  shift: string;
  phone_number: string;
  active_status: boolean;
}

export const addStaffAPI = async (data: StaffFormInput, token: string) => {
  const res = await axios.post(`${API_URL}/admin/staff_and_roles/add_new_staff`, data, getAuthHeaders(token));
  return res.data;
};

export const updateStaffAPI = async (staffId: number, data: StaffFormInput, token: string) => {
  const res = await axios.put(`${API_URL}/admin/staff_and_roles/edit_staff_member/${staffId}`, data, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// STAFF MANAGEMENT (attendance / leave, admin side)
// ============================================================================
export const fetchStaffMgmtDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/staff_mgmt`, getAuthHeaders(token));
  return res.data;
};

export const filterAttendanceAPI = async (inputDate: string, token: string) => {
  const res = await axios.post(`${API_URL}/admin/filter_attendence`, { input_date: inputDate }, getAuthHeaders(token));
  return res.data;
};

export const respondToLeaveAPI = async (
  data: { leave_id: number; action: 'approved' | 'rejected'; admin_response?: string },
  token: string
) => {
  const res = await axios.post(`${API_URL}/admin/leave-request-response`, data, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// ADMIN NOTIFICATIONS (bell in the admin layout)
// GET /admin/show_notifications
//   -> { message, restaurant_id, total_notifications,
//        data: [{ id, title, message, time, is_read }] }
// PUT /admin/notifications/read   body: { notification_id }
// ============================================================================
export const fetchAdminNotificationsAPI = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/show_notifications`, getAuthHeaders(token));
  return res.data;
};

export const markNotificationReadAPI = async (notificationId: number, token: string) => {
  const res = await axios.patch(
    `${API_URL}/admin/notifications/read/${notificationId}`,
    {},
    getAuthHeaders(token)
  );
  return res.data; // { success, message, notification_id, is_read }
};
// ============================================================================
// STAFF NOTIFICATIONS
// ============================================================================
export const fetchStaffNotifications = async (token: string) => {
  const res = await axios.get(`${API_URL}/staff/dashboard/notifications`, getAuthHeaders(token));
  return res.data;
};

export const markStaffNotificationRead = async (data: { notification_id: number }, token: string) => {
  const res = await axios.put(`${API_URL}/staff/dashboard/read-notification`, data, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// FEEDBACK (admin side)
// ============================================================================
export const fetchFeedbackDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/customer_feedback`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// ============================================================================
// PAYMENTS (admin side)
// ============================================================================
export const fetchPaymentsDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/payments/`, getAuthHeaders(token));
  return res.data;
};

export const filterPaymentDistributionAPI = async (filterType: string, token: string) => {
  const res = await axios.post(`${API_URL}/admin/payments/filte_payment_distribution`, { filter_type: filterType }, getAuthHeaders(token));
  return res.data;
};

// Revenue trends — Filter_Revinue schema wants '3M' | '6M' | '1Y'
const mapRevenueTrendFilter = (filterType: string): '3M' | '6M' | '1Y' => {
  if (filterType === '3M' || filterType === '3months') return '3M';
  if (filterType === '6M' || filterType === '6months') return '6M';
  return '1Y';
};

export const filterRevenueTrendsAPI = async (filterType: string, token: string) => {
  const res = await axios.post(
    `${API_URL}/admin/payments/filte_revenue_trends`,
    { filter_type: mapRevenueTrendFilter(filterType) },
    getAuthHeaders(token)
  );
  return res.data;
};

// ============================================================================
// TABLES & QR (admin side)
// ============================================================================
export const fetchTables = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/tables_and_qr/`, getAuthHeaders(token));
  return res.data;
};

export const addTableAPI = async (data: { table_name: string; capacity: number }, token: string) => {
  const res = await axios.post(`${API_URL}/admin/tables_and_qr/add_new_table`, data, getAuthHeaders(token));
  return res.data;
};

export const updateTableAPI = async (tableId: number, data: { table_name: string; capacity: number }, token: string) => {
  const res = await axios.put(`${API_URL}/admin/tables_and_qr/edit_table/${tableId}`, data, getAuthHeaders(token));
  return res.data;
};

export const deleteTableAPI = async (tableId: number, token: string) => {
  const res = await axios.delete(`${API_URL}/admin/tables_and_qr/delete_table`, {
    ...getAuthHeaders(token),
    data: { table_id: tableId }
  });
  return res.data;
};

// ============================================================================
// RESERVATIONS (admin side)
// ============================================================================
export const fetchReservationsDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/reservations/dashboard`, getAuthHeaders(token));
  return res.data;
};

export const addReservationAPI = async (data: any, token: string) => {
  const res = await axios.post(`${API_URL}/admin/reservations/add`, data, getAuthHeaders(token));
  return res.data;
};

export const filterReservationsAPI = async (data: any, token: string) => {
  const res = await axios.post(`${API_URL}/admin/reservations/filter`, data, getAuthHeaders(token));
  return res.data;
};

export const updateReservationActionAPI = async (id: number, action: string, token: string) => {
  const res = await axios.put(`${API_URL}/admin/reservations/action/${id}`, { action }, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// OPERATIONS (admin side)
// ============================================================================
// --- Dashboard ---
export const fetchOpsDashboardSummaryAPI = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/operations/dashboard-summary`, getAuthHeaders(token));
  return res.data;
};

// --- Counter session ---
export const openCounterSessionAPI = async (data: { opening_cash: number }, token: string) => {
  const res = await axios.post(`${API_URL}/admin/operations/counter-session/open`, data, getAuthHeaders(token));
  return res.data;
};

export const closeCounterSessionAPI = async (data: { closing_cash: number; notes?: string }, token: string) => {
  const res = await axios.post(`${API_URL}/admin/operations/counter-session/close`, data, getAuthHeaders(token));
  return res.data;
};

export const addCashoutAPI = async (
  data: { session_id: number; amount: number; category: string; vendor: string; description: string },
  token: string
) => {
  const res = await axios.post(`${API_URL}/admin/operations/counter-session/add-cashout`, data, getAuthHeaders(token));
  return res.data;
};

// Cashouts (Operations > Counter Session)
export const fetchCashoutListAPI = async (sessionId: number, token: string) => {
  const res = await axios.get(`${API_URL}/admin/operations/counter-session/cashouts/${sessionId}`, getAuthHeaders(token));
  return res.data;
};

export const deleteCashoutAPI = async (cashoutId: number, token: string) => {
  const res = await axios.delete(`${API_URL}/admin/operations/counter-session/cashout/${cashoutId}`, getAuthHeaders(token));
  return res.data;
};

// --- Store issues ---
export const fetchStoreIssuesAPI = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/operations/store-issues/list`, getAuthHeaders(token));
  return res.data;
};

export const createStoreIssueAPI = async (data: { title: string; description: string; priority: string }, token: string) => {
  const res = await axios.post(`${API_URL}/admin/operations/store_issues/create`, data, getAuthHeaders(token));
  return res.data;
};

export const assignStoreIssueAPI = async (data: { issue_id: number; staff_id: number }, token: string) => {
  const res = await axios.post(`${API_URL}/admin/operations/store-issues/assign`, data, getAuthHeaders(token));
  return res.data;
};

export const updateStoreIssueStatusAPI = async (data: { issue_id: number; status: string }, token: string) => {
  const res = await axios.put(`${API_URL}/admin/operations/store-issues/update-status`, data, getAuthHeaders(token));
  return res.data;
};

// Single issue detail (Operations > Store Issues)
export const fetchSingleIssueDetailsAPI = async (issueId: number, token: string) => {
  const res = await axios.get(`${API_URL}/admin/operations/issues/${issueId}`, getAuthHeaders(token));
  return res.data;
};

// --- Stock requests ---
export const fetchStockRequestsAPI = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/operations/stock-requests/list`, getAuthHeaders(token));
  return res.data;
};

export const createStockRequestAPI = async (data: { item_id: number; present_quantity: number; reason: string }, token: string) => {
  const res = await axios.post(`${API_URL}/admin/operations/stock-requests/create`, data, getAuthHeaders(token));
  return res.data;
};

export const approveStockRequestAPI = async (data: { request_id: number }, token: string) => {
  const res = await axios.post(`${API_URL}/admin/stock-requests/approve`, data, getAuthHeaders(token));
  return res.data;
};

export const rejectStockRequestAPI = async (data: { request_id: number; reason: string }, token: string) => {
  const res = await axios.post(`${API_URL}/admin/stock-requests/reject`, data, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// STOCK MANAGEMENT (admin side)
// ============================================================================
export const fetchStockManagementAPI = async (token: string) => {
  const res = await axios.get(`${API_URL}/admin/stock_management`, getAuthHeaders(token));
  return res.data;
};

export const updateItemQuantityAPI = async (data: { item_id: number; quantity: number }, token: string) => {
  const res = await axios.put(`${API_URL}/admin/update-item-quantity`, data, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// SETTINGS (admin side)
// ============================================================================
export const fetchSettingsAPI = async (token: string) => {
 const res = await axios.get(`${API_URL}/admin/settings/settings/show_settings`, getAuthHeaders(token));}

export const updateSettingsAPI = async (data: any, token: string) => {
  const res = await axios.post(`${API_URL}/admin/settings/settings/`, data, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// STAFF PORTAL API
// ============================================================================
export const fetchStaffRoleDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/staff/dashboard/`, getAuthHeaders(token));
  return res.data;
};

export const clockIn = async (token: string) => {
  const res = await axios.post(`${API_URL}/staff/dashboard/clock_in`, {}, getAuthHeaders(token));
  return res.data;
};

export const clockOut = async (token: string) => {
  const res = await axios.put(`${API_URL}/staff/dashboard/clock_out`, {}, getAuthHeaders(token));
  return res.data;
};

export const fetchAttendanceHistory = async (token: string) => {
  const res = await axios.get(`${API_URL}/staff/attendance/attendance_history`, getAuthHeaders(token));
  return res.data;
};

export const filterAttendance = async (payload: { from_date: string; to_date: string; status?: string }, token: string) => {
  const res = await axios.post(`${API_URL}/staff/attendance/attendance_filter`, payload, getAuthHeaders(token));
  return res.data;
};

export const fetchLeaveDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/staff/leave/dashboard`, getAuthHeaders(token));
  return res.data;
};

export const applyLeave = async (payload: { leave_type: string; from_date: string; to_date: string; reason: string }, token: string) => {
  const res = await axios.post(`${API_URL}/staff/leave/apply_leave`, payload, getAuthHeaders(token));
  return res.data;
};

export const filterLeaves = async (payload: { status?: string; leave_type?: string }, token: string) => {
  const res = await axios.post(`${API_URL}/staff/leave/leave_filter`, payload, getAuthHeaders(token));
  return res.data;
};

export const fetchStaffOpsDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/staff/ops_dashboard/`, getAuthHeaders(token));
  return res.data;
};

export const reportStoreIssue = async (
  payload: { title: string; description: string; priority: string },
  token: string
) => {
  const res = await axios.post(
    `${API_URL}/staff/ops_dashboard/report_issue`,
    payload,
    getAuthHeaders(token)
  );
  return res.data;
};

export const startStoreIssueApi = async (
  payload: { issue_id: number },
  token: string
) => {
  const res = await axios.put(
    `${API_URL}/staff/ops_dashboard/start-issue`,
    payload,
    getAuthHeaders(token)
  );
  return res.data;
};

export const completeStoreIssueApi = async (
  payload: { issue_id: number },
  token: string
) => {
  const res = await axios.put(
    `${API_URL}/staff/ops_dashboard/complete-issue`,
    payload,
    getAuthHeaders(token)
  );
  return res.data;
};
// ============================================================================
// KITCHEN PORTAL API
// ============================================================================
export const fetchKitchenDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/kitchen/kitchen_dashboard/`, getAuthHeaders(token));
  return res.data;
};

export const filterKitchenDashboard = async (payload: any, token: string) => {
  const res = await axios.post(`${API_URL}/kitchen/kitchen_dashboard/dashboard_filter`, payload, getAuthHeaders(token));
  return res.data;
};

export const startCookingAPI = async (payload: any, token: string) => {
  const res = await axios.put(`${API_URL}/kitchen/kitchen_dashboard/start_cooking`, payload, getAuthHeaders(token));
  return res.data;
};

export const markReadyAPI = async (payload: any, token: string) => {
  const res = await axios.put(`${API_URL}/kitchen/kitchen_dashboard/mark_ready`, payload, getAuthHeaders(token));
  return res.data;
};

export const reportKitchenIssueAPI = async (payload: any, token: string) => {
  const res = await axios.post(`${API_URL}/kitchen/kitchen_dashboard/report_issue`, payload, getAuthHeaders(token));
  return res.data;
};

export const resumeOrderAPI = async (payload: any, token: string) => {
  const res = await axios.put(`${API_URL}/kitchen/kitchen_dashboard/resume_order`, payload, getAuthHeaders(token));
  return res.data;
};

export const goBackAPI = async (payload: any, token: string) => {
  const res = await axios.put(`${API_URL}/kitchen/kitchen_dashboard/go_back`, payload, getAuthHeaders(token));
  return res.data;
};

export const backToPreparingAPI = async (payload: any, token: string) => {
  const res = await axios.put(`${API_URL}/kitchen/kitchen_dashboard/back_to_preparing`, payload, getAuthHeaders(token));
  return res.data;
};

export const fetchKitchenPastOrders = async (token: string) => {
  const res = await axios.get(`${API_URL}/kitchen/past_orders`, getAuthHeaders(token));
  return res.data;
};

export const filterKitchenPastOrders = async (payload: any, token: string) => {
  const res = await axios.post(`${API_URL}/kitchen/past_orders_filter`, payload, getAuthHeaders(token));
  return res.data;
};

export const fetchKitchenOpsDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/kitchen/ops_dashboard/`, getAuthHeaders(token));
  return res.data;
};

export const reportKitchenStoreIssue = async (payload: any, token: string) => {
  const res = await axios.post(`${API_URL}/kitchen/ops_dashboard/ops_report_issue`, payload, getAuthHeaders(token));
  return res.data;
};

export const sendKitchenStockRequest = async (payload: any, token: string) => {
  const res = await axios.post(`${API_URL}/kitchen/ops_dashboard/send_stock_request`, payload, getAuthHeaders(token));
  return res.data;
};

export const fetchKitchenStoreIssues = async (token: string) => {
  const res = await axios.get(`${API_URL}/kitchen/ops_dashboard/store_issues_list`, getAuthHeaders(token));
  return res.data;
};

export const fetchKitchenStockRequests = async (token: string) => {
  const res = await axios.get(`${API_URL}/kitchen/ops_dashboard/stock_requests_list`, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// CUSTOMER — orders
// ============================================================================
export const fetchActiveOrders = async (token: string) => {
  const res = await axios.get(`${API_URL}/customer/orders/active_orders`, getAuthHeaders(token));
  return res.data;
};

export const fetchPastOrders = async (token: string) => {
  const res = await axios.get(`${API_URL}/customer/orders/past_orders`, getAuthHeaders(token));
  return res.data;
};

export interface PlaceOrderPayload {
  payment_method?: string;
  item_notes?: Record<number, string>; // { [menu_item_id]: "no onions" }
}

export const placeOrderAPI = async (data: PlaceOrderPayload, token: string) => {
  const res = await axios.post(`${API_URL}/customer/orders/place_order`, data, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// CUSTOMER — menu (customer_dashboard.py)
// ============================================================================
export const fetchCustomerMenu = async (token: string) => {
  const res = await axios.get(`${API_URL}/customer/dashboard/`, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// CUSTOMER — cart
// ============================================================================
export interface AddToCartPayload {
  item_id: number;
  table_no: number; // RestaurantTables.id, not a display label
  quantity: number;
}

export const addToCartAPI = async (data: AddToCartPayload, token: string) => {
  const res = await axios.post(`${API_URL}/customer/cart/add_to_cart`, data, getAuthHeaders(token));
  return res.data;
};

export interface UpdateCartPayload {
  item_id: number;
  quantity: number;
}

export const updateCartAPI = async (data: UpdateCartPayload, token: string) => {
  const res = await axios.put(`${API_URL}/customer/cart/update_cart`, data, getAuthHeaders(token));
  return res.data;
};

export const viewCartAPI = async (token: string) => {
  const res = await axios.get(`${API_URL}/customer/cart/view_cart`, getAuthHeaders(token));
  return res.data;
};

export interface DeleteCartItemPayload {
  item_id: number;
}

export const deleteCartItemAPI = async (data: DeleteCartItemPayload, token: string) => {
  const res = await axios.delete(`${API_URL}/customer/cart/delete_cart_item`, {
    ...getAuthHeaders(token),
    data, // axios DELETE needs the body under `data`
  });
  return res.data;
};

export const clearCartAPI = async (token: string) => {
  const res = await axios.delete(`${API_URL}/customer/cart/clear_cart`, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// CUSTOMER — feedback & special notes
// ============================================================================
export interface SubmitFeedbackPayload {
  order_id?: string;
  item_name?: string;
  rating: number;
  feedback_text?: string;
}

export const submitFeedbackAPI = async (data: SubmitFeedbackPayload, token: string) => {
  const res = await axios.post(`${API_URL}/customer/feedback/submit_feedback`, data, getAuthHeaders(token));
  return res.data;
};

export const fetchFeedbackOrdersAPI = async (token: string) => {
  const res = await axios.get(`${API_URL}/customer/feedback/feedback_orders`, getAuthHeaders(token));
  return res.data;
};

export interface OrderFeedbackItemsPayload {
  order_id: string;
}

export const fetchOrderFeedbackItemsAPI = async (data: OrderFeedbackItemsPayload, token: string) => {
  const res = await axios.post(`${API_URL}/customer/feedback/order_feedback_items`, data, getAuthHeaders(token));
  return res.data;
};

export interface AddSpecialNotePayload {
  item_id: string;   // format: "ITM-001" — pad the numeric menu item id to 3 digits
  note: string;
}

export const addSpecialNoteAPI = async (data: AddSpecialNotePayload, token: string) => {
  const res = await axios.post(`${API_URL}/customer/instructions/add_note`, data, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// COUNTER (POS) — prefix /counter
// All endpoints require the token returned by loginCounter (get_current_counter_user).
// Do NOT use the generic /staff/auth/login token here.
// ============================================================================

// --- COUNTER LOGIN ---
export interface CounterLoginPayload {
  restaurant_name: string;
  email: string;
  password: string;
  role_name: string; // e.g. "cashier"
}

export const loginCounter = async (data: CounterLoginPayload) => {
  const response = await axios.post(`${API_URL}/counter/counter_staff_login`, data);
  return response.data;
};

// --- ACTIVE ORDERS: response types ---
export interface ActiveOrderItem {
  order_item_id?: number; // backend pampithe matrame (item-wise serve ki)
  item_id?: number;       // backend pampithe matrame (+/- ki)
  item_name: string;
  quantity: number;
  price?: number;
  item_total?: number;
  item_status?: string;   // "ready" | "served"
  type?: string | null;   // "veg" | "non_veg" (VegDot ki)
}

export interface ActiveOrder {
  order_id: string;
  table_no: string | null;
  date: string;
  time: string;
  total_amount: number;
  final_amount?: number;
  status: string;
  sent_to_kitchen?: boolean;
  items: ActiveOrderItem[];
}

export interface ActiveOrdersResponse {
  message: string;
  active_orders: number;
  past_orders: number;
  todo_orders: { total_todo_orders: number; orders: ActiveOrder[] };
  preparing_orders: { total_preparing_orders: number; orders: ActiveOrder[] };
  ready_orders: { total_ready_orders: number; orders: ActiveOrder[] };
  total_notifications: number;
}

export interface PastOrder {
  order_id: string;
  table_no: string | null;
  items: string;
  total_amount: number;
  payment_method: string | null;
  time: string | null;
}

// --- ACTIVE ORDERS DASHBOARD (todo / preparing / ready columns) ---
export const fetchCounterActiveOrdersDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/counter/active_orders_dashboard`, getAuthHeaders(token));
  return res.data;
};

// --- PROCESS ORDER (To Do -> send to kitchen). Backend route is POST ---
export const processOrderAPI = async (data: { order_id: string }, token: string) => {
  const res = await axios.post(`${API_URL}/counter/process_order`, data, getAuthHeaders(token));
  return res.data;
};

// --- MARK SERVED (whole order, ready -> served) ---
export interface MarkServedPayload {
  order_id: string;
  order_item_ids?: number[];
}

// Backend MarkServedRequest lo order_item_ids required (422 otherwise),
// anduke empty list default ga pampistunnam.
export const markServedAPI = async (data: MarkServedPayload, token: string) => {
  const res = await axios.put(
    `${API_URL}/counter/mark_served`,
    { order_item_ids: [], ...data },
    getAuthHeaders(token)
  );
  return res.data;
};

// --- MARK SELECTED ITEMS SERVED (POST /counter/mark_served) ---
export interface MarkItemsServedPayload {
  order_id: string;
  order_item_ids: number[];
}

export const markItemsServedAPI = async (data: MarkItemsServedPayload, token: string) => {
  const res = await axios.post(`${API_URL}/counter/mark_served`, data, getAuthHeaders(token));
  return res.data;
};

// --- MARK PAID (confirm payment on an existing Payments row) ---
export type PayMethod = 'cash' | 'card' | 'upi';

export interface MarkPaidPayload {
  order_id: string;
  payment_method?: PayMethod;
}

export const markPaidAPI = async (data: MarkPaidPayload, token: string) => {
  const res = await axios.post(`${API_URL}/counter/mark_paid`, data, getAuthHeaders(token));
  return res.data;
};

// --- PAST ORDERS (served orders history) ---
export const fetchCounterPastOrders = async (token: string) => {
  const res = await axios.get(`${API_URL}/counter/past_orders`, getAuthHeaders(token));
  return res.data;
};

// --- NOTIFICATIONS (counter bell icon) ---
export const fetchCounterNotifications = async (token: string) => {
  const res = await axios.get(`${API_URL}/counter/notifications`, getAuthHeaders(token));
  return res.data;
};

// PATCH /counter/notifications/read/{id}
export const markNotificationReadAPIcounter = async (notificationId: number, token: string) => {
  const res = await axios.patch(
    `${API_URL}/counter/notifications/read/${notificationId}`,
    {},
    getAuthHeaders(token),
  );
  return res.data; // { success, message, notification_id, is_read }
};

// Backend has no read_all, so call the single endpoint per unread id
export const markAllNotificationsReadAPIcounter = async (ids: number[], token: string) => {
  const results = await Promise.all(
    ids.map((id) => markNotificationReadAPIcounter(id, token)),
  );
  return results;
};

// --- INCREMENT / DECREMENT ITEM QTY ON AN UNPAID, NOT-YET-SERVED ORDER ---
export interface PreparingQtyPayload {
  order_id: string;
  item_id: number;
  action: 'increment' | 'decrement';
}

export const updatePreparingQuantityAPI = async (data: PreparingQtyPayload, token: string) => {
  const res = await axios.put(
    `${API_URL}/counter/increment_and_decrement_preparing_quantity`,
    data,
    getAuthHeaders(token)
  );
  return res.data;
};

// --- CONFIRM TABLE TRANSFER FOR AN ORDER ---
export interface ConfirmTransferPayload {
  order_id: string;
  target_table: string; // table_name, e.g. "T5"
}

export const confirmTransferOrderAPI = async (data: ConfirmTransferPayload, token: string) => {
  const res = await axios.put(`${API_URL}/counter/confirm_transfer_order`, data, getAuthHeaders(token));
  return res.data;
};

// --- NEW ORDER DASHBOARD (tables list + full menu + filter options) ---
export const fetchCounterNewOrderDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/counter/new_order`, getAuthHeaders(token));
  return res.data;
};

// --- FILTER MENU ITEMS (veg/non-veg, food/drink, category) ---
export interface FilterMenuPayload {
  type?: string;          // "veg" | "non_veg"
  category?: string;
  category_type?: string; // "food" | "drink"
}

export const filterCounterMenuItemsAPI = async (data: FilterMenuPayload, token: string) => {
  const res = await axios.post(`${API_URL}/counter/filter_menu_items`, data, getAuthHeaders(token));
  return res.data;
};

// --- ADD ITEM TO A TABLE'S SERVER-SIDE CART ---
export interface CounterAddToCartPayload {
  table_no: string; // table_name
  item_id: number;
  quantity: number;
}

export const addToCounterCartAPI = async (data: CounterAddToCartPayload, token: string) => {
  const res = await axios.post(`${API_URL}/counter/add_to_cart`, data, getAuthHeaders(token));
  return res.data;
};

// --- REMOVE ITEM FROM A TABLE'S CART ---
export interface CounterDeleteCartItemPayload {
  table_no: string;
  item_id: number;
}

export const deleteCounterCartItemAPI = async (data: CounterDeleteCartItemPayload, token: string) => {
  const res = await axios.delete(`${API_URL}/counter/delete_item_from_cart`, {
    ...getAuthHeaders(token),
    data,
  });
  return res.data;
};

// --- GET BILL PREVIEW (subtotal/tax/grand_total) FOR THE TABLE'S CURRENT CART ---
export interface CounterCreateOrderPayload {
  table_no: string;
  staff_id: number;
}

export const createCounterOrderAPI = async (data: CounterCreateOrderPayload, token: string) => {
  const res = await axios.post(`${API_URL}/counter/create_order`, data, getAuthHeaders(token));
  return res.data;
};

// --- FINALIZE THE ORDER (cart -> Orders + OrderItems, status "todo") ---
export interface CounterConfirmOrderPayload {
  table_no: string;
  items_count: number;
  subtotal: number;
  tax: number;
  grand_total: number;
}

export const confirmCounterOrderAPI = async (data: CounterConfirmOrderPayload, token: string) => {
  const res = await axios.post(`${API_URL}/counter/confirm_order`, data, getAuthHeaders(token));
  return res.data;
};

// --- counter cart (server side, per table + staff) ---
export interface CounterCartLine {
  item_id: number;
  item_name: string;
  quantity: number;
  price: number;
  total: number;
}

// NOTE: backend calls the pre-tax sum "grand_total" in this response.
export interface CounterCartResponse {
  current_order: {
    cart_id: number | null;
    table_no: string;
    items: CounterCartLine[];
    grand_total: number;
  };
}

export const fetchCounterCartAPI = async (tableNo: string, token: string) => {
  const res = await axios.get(`${API_URL}/counter/view_cart`, {
    ...getAuthHeaders(token),
    params: { table_no: tableNo },
  });
  return res.data as CounterCartResponse;
};

export const fetchCounterTableStatusAPI = async (token: string) => {
  const res = await axios.get(`${API_URL}/counter/tables/status`, getAuthHeaders(token));
  return res.data;
};

export interface CounterCartQtyPayload {
  table_no: string;
  item_id: number;
  action: 'increment' | 'decrement';
}

export const updateCounterCartQuantityAPI = async (data: CounterCartQtyPayload, token: string) => {
  const res = await axios.put(`${API_URL}/counter/update_cart_quantity`, data, getAuthHeaders(token));
  return res.data as CounterCartResponse;
};

export const clearCounterCartAPI = async (data: { table_no: string }, token: string) => {
  const res = await axios.delete(`${API_URL}/counter/clear_cart`, {
    ...getAuthHeaders(token),
    data, // axios DELETE body goes under `data`
  });
  return res.data;
};

// --- bill of an already paid order ---
export const fetchCounterBillAPI = async (orderId: string, token: string) => {
  const res = await axios.get(`${API_URL}/counter/bill/${orderId}`, getAuthHeaders(token));
  return res.data;
};

// --- reservations (counter side) ---
export interface CounterAddReservationPayload {
  reservation_type: string; // 'table' | 'event' | 'full_venue'
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  reservation_date: string; // 'YYYY-MM-DD'
  reservation_time: string; // 'HH:MM'
  duration: number;         // MINUTES (backend shows duration // 60 as hours)
  guests: number;
  table_id?: number | null;
  advance_amount?: number;
  special_request?: string | null;
  description?: string;
}

export type CounterReservationAction = 'confirmed' | 'completed' | 'cancelled' | 'pending' | 'no_show';

export const fetchCounterReservationsDashboard = async (token: string) => {
  const res = await axios.get(`${API_URL}/counter/reservations/dashboard`, getAuthHeaders(token));
  return res.data;
};

export const addCounterReservationAPI = async (data: CounterAddReservationPayload, token: string) => {
  const res = await axios.post(`${API_URL}/counter/reservations/add`, data, getAuthHeaders(token));
  return res.data;
};

export const filterCounterReservationsAPI = async (
  filters: { status?: string; reservation_type?: string; from_date?: string; to_date?: string },
  token: string
) => {
  const res = await axios.post(`${API_URL}/counter/reservations/filter`, filters, getAuthHeaders(token));
  return res.data;
};

export const counterReservationActionAPI = async (id: number, action: CounterReservationAction, token: string) => {
  const res = await axios.put(`${API_URL}/counter/reservations/action/${id}`, { action }, getAuthHeaders(token));
  return res.data;
};

// ============================================================================
// COUNTER OPERATIONS (Operations tab: cash session / cashouts / issues / stock)
// Backend router: /counter/operations/...
// ============================================================================
export interface OpsSummary {
  counter_session: {
    status: 'open' | 'closed' | string;
    last_closing_balance: number;
    // optional: backend patch (dashboard-summary) tarvata vastayi
    session_id?: number;
    opened_by?: string | null;
    opened_at?: string | null;
    opening_cash?: number;
    expected_cash?: number;
    cash_sales?: number;
  };
  store_issues: { active_count: number };
  stock_requests: { pending_count: number };
}

export interface CashoutRow {
  id: number;
  amount: number;
  category: string;
  vendor: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StockRequestRow {
  id: number;
  item_name: string;
  requested_quantity: number;
  request_type: string;
  status: string;
  requested_by: string | null;
  requested_at: string | null;
}

export const fetchCounterOpsSummaryAPI = async (token: string) => {
  const res = await axios.get(`${API_URL}/counter/operations/dashboard-summary`, getAuthHeaders(token));
  return res.data;
};

export const openCounterCashSessionAPI = async (data: { opening_cash: number }, token: string) => {
  const res = await axios.post(`${API_URL}/counter/operations/counter-session/open`, data, getAuthHeaders(token));
  return res.data;
};

export const closeCounterCashSessionAPI = async (data: { closing_cash: number; notes?: string }, token: string) => {
  const res = await axios.post(`${API_URL}/counter/operations/counter-session/close`, data, getAuthHeaders(token));
  return res.data;
};

export const addCounterCashoutAPI = async (
  data: { session_id: number; amount: number; category: string; vendor?: string; description?: string },
  token: string
) => {
  const res = await axios.post(`${API_URL}/counter/operations/counter-session/add-cashout`, data, getAuthHeaders(token));
  return res.data;
};

export const fetchCounterCashoutsAPI = async (sessionId: number, token: string) => {
  const res = await axios.get(`${API_URL}/counter/operations/counter-session/cashouts/${sessionId}`, getAuthHeaders(token));
  return res.data;
};

export const createCounterStoreIssueAPI = async (
  data: { title: string; description: string; priority: string },
  token: string
) => {
  const res = await axios.post(`${API_URL}/counter/operations/store_issues/create`, data, getAuthHeaders(token));
  return res.data;
};

export const fetchCounterStockRequestsAPI = async (token: string) => {
  const res = await axios.get(`${API_URL}/counter/operations/stock-requests/list`, getAuthHeaders(token));
  return res.data;
};