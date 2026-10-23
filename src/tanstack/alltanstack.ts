import { useMutation, useQuery, useQueryClient, QueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  loginCustomer,
  LoginPayload,
  RegisterPayload,
  kitchenLoginPayload,
  registerAdmin,
  registerCustomer,
  loginAdmin,
  fetchFilteredTopItems,
  fetchFilteredRecentOrders,
  fetchOrderPopup,
  fetchFilteredSales,
  fetchFilteredOrders,
  fetchFilteredRevenue,
  fetchAdminDashboard,
  fetchOrdersPageList,
  fetchMenuDashboard,
  addCategoryAPI,
  addMenuItemAPI,
  updateMenuItemAPI,
  deleteMenuItemAPI,
  fetchStaffDashboard,
  addRoleAPI,
  addStaffAPI,
  updateStaffAPI,
  deleteStaffAPI,
  fetchStaffMgmtDashboard,
  filterAttendanceAPI,
  respondToLeaveAPI,
  fetchFeedbackDashboard,
  fetchPaymentsDashboard,
  filterRevenueTrendsAPI,
  filterPaymentDistributionAPI,
  fetchTables,
  addTableAPI,
  updateTableAPI,
  fetchCategoryItemsAPI,
  fetchReservationsDashboard,
  addReservationAPI,
  filterReservationsAPI,
  updateReservationActionAPI,
  fetchOpsDashboardSummaryAPI,
  openCounterSessionAPI,
  closeCounterSessionAPI,
  fetchStoreIssuesAPI,
  createStoreIssueAPI,
  assignStoreIssueAPI,
  updateStoreIssueStatusAPI,
  fetchStockRequestsAPI,
  createStockRequestAPI,
  approveStockRequestAPI,
  rejectStockRequestAPI,
  updateSettingsAPI,
  fetchSettingsAPI,
  //staff
  StaffLoginPayload,
  loginStaff,
  clockIn,
  clockOut,
  fetchLeaveDashboard,
  applyLeave,
  fetchStaffOpsDashboard,
  reportStoreIssue,
  fetchStaffRoleDashboard,
  fetchAttendanceHistory,
  filterAttendance,
  filterLeaves,
  fetchStaffNotifications,
  markStaffNotificationRead,
  loginKitchen,
completeStoreIssueApi,
startStoreIssueApi ,

  // ---- Kitchen Portal APIs ----
  fetchKitchenDashboard,
  filterKitchenDashboard,
  startCookingAPI,
  markReadyAPI,
  reportKitchenIssueAPI,
  resumeOrderAPI,
  goBackAPI,
  backToPreparingAPI,
  fetchKitchenPastOrders,
  filterKitchenPastOrders,
  fetchKitchenOpsDashboard,
  reportKitchenStoreIssue,
  sendKitchenStockRequest,
  fetchKitchenStoreIssues,
  // ---- Admin extras ----
  fetchStockManagementAPI,
  updateItemQuantityAPI,
  markNotificationReadAPI,
  fetchAdminNotificationsAPI,
  fetchCashoutListAPI,
  deleteCashoutAPI,
  fetchSingleIssueDetailsAPI,
  fetchMenuItemByIdAPI,
  StaffFormInput,
  // ---- Customer Orders ----
  fetchActiveOrders,
  fetchPastOrders,
  placeOrderAPI,
  PlaceOrderPayload,
  // ---- Customer Menu ----
  fetchCustomerMenu,
  // ---- Customer Cart ----
  addToCartAPI,
  AddToCartPayload,
  updateCartAPI,
  UpdateCartPayload,
  viewCartAPI,
  deleteCartItemAPI,
  DeleteCartItemPayload,
  clearCartAPI,
  submitFeedbackAPI,
  SubmitFeedbackPayload,
  fetchFeedbackOrdersAPI,
  fetchOrderFeedbackItemsAPI,
  addSpecialNoteAPI,
  AddSpecialNotePayload,
  loginOrganization,
  OrganizationLoginPayload,
  // ---- Counter (POS) ----
  loginCounter,
  CounterLoginPayload,
  fetchCounterActiveOrdersDashboard,
  processOrderAPI,
  markServedAPI,
  MarkServedPayload,
  markItemsServedAPI,
  MarkItemsServedPayload,
  markPaidAPI,
  MarkPaidPayload,
  fetchCounterPastOrders,
  fetchCounterNotifications,
  updatePreparingQuantityAPI,
  PreparingQtyPayload,
  confirmTransferOrderAPI,
  ConfirmTransferPayload,
  fetchCounterNewOrderDashboard,
  filterCounterMenuItemsAPI,
  FilterMenuPayload,
  addToCounterCartAPI,
  CounterAddToCartPayload,
  deleteCounterCartItemAPI,
  CounterDeleteCartItemPayload,
  createCounterOrderAPI,
  CounterCreateOrderPayload,
  confirmCounterOrderAPI,
  CounterConfirmOrderPayload,
  fetchCounterReservationsDashboard,
  addCounterReservationAPI,
  filterCounterReservationsAPI,
  counterReservationActionAPI,
  type CounterAddReservationPayload,
  type CounterReservationAction,
  CounterCartQtyPayload,
  // ---- Counter Operations ----
  fetchCounterOpsSummaryAPI,
  openCounterCashSessionAPI,
  closeCounterCashSessionAPI,
  addCounterCashoutAPI,
  fetchCounterCashoutsAPI,
  createCounterStoreIssueAPI,
  fetchCounterStockRequestsAPI,
  type OpsSummary,
  type CashoutRow,
  type StockRequestRow,
  fetchCounterTableStatusAPI,
  markNotificationReadAPIcounter,
  markAllNotificationsReadAPIcounter,
  fetchCounterBillAPI,
  registerOrganization,
  sendRegisterOtp,
} from '@/AllApis/AllApi';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';


// ============================================================================
// ZUSTAND REMOVED
// `useAuthStore((s) => s.token)` ippudu AuthContext nunchi token teesukuntundi.
// Kabatti kinda unna hooks anni marchakunda pani chestayi.
// ============================================================================
function useAuthStore<T>(selector: (s: { token: string | null }) => T): T {
  const { token } = useAuth();
  return selector({ token });
}

// Backend sometimes returns HTTP 200 with { success: false, message }.
// This turns that into a real error so onError (red toast) runs.
const ensureSuccess = (res: any) => {
  if (res?.success === false) throw new Error(res.message || 'Action not allowed');
  return res;
};

export const useOrganizationLoginMutation = () => {
  return useMutation({
    mutationFn: (data: OrganizationLoginPayload) => loginOrganization(data),
  });
};

export function getErrorMessage(err: any, fallback: string = 'Something went wrong'): string {
  const detail = err?.response?.data?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => {
        if (typeof d === 'string') return d;
        const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : '';
        return field ? `${field}: ${d?.msg}` : d?.msg || JSON.stringify(d);
      })
      .join(', ');
  }

  if (detail && typeof detail === 'object') {
    return detail.message || detail.msg || JSON.stringify(detail);
  }

  return err?.message || fallback;
}

// ============================================================================
// AUTH
// ============================================================================
export const useAdminRegisterMutation = () => {
  return useMutation({
    mutationFn: (data: RegisterPayload) => registerAdmin(data),
  });
};

export const useCustomerRegisterMutation = () => {
  return useMutation({
    mutationFn: (data: RegisterPayload) => registerCustomer(data),
  });
};

export const useAdminLoginMutation = () => {
  return useMutation({
    mutationFn: (data: LoginPayload) => loginAdmin(data),
  });
};

export const useStaffLoginMutation = () => {
  return useMutation({
    mutationFn: (data: StaffLoginPayload) => loginStaff(data),
  });
};

export const useKitchenLoginMutation = () => {
  return useMutation({
    mutationFn: (data: kitchenLoginPayload) => loginKitchen(data),
  });
};

export const useCustomerLoginMutation = () => {
  return useMutation({
    mutationFn: (data: LoginPayload) => loginCustomer(data),
  });
};

// ============================================================================
// COUNTER (POS) LOGIN
// Use this (not useStaffLoginMutation) for the "Counter Staff / cashier"
// login option — the counter endpoints only accept a token minted by
// /counter/counter_staff_login.
// ============================================================================
export const useCounterLoginMutation = () => {
  return useMutation({
    mutationFn: (data: CounterLoginPayload) => loginCounter(data),
  });
};

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================
export const useAdminDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => fetchAdminDashboard(token!),
    enabled: !!token,
  });
};

export const useFilteredRevenue = (filter: string) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['filteredRevenue', filter],
    queryFn: () => fetchFilteredRevenue(filter, token!),
    enabled: !!token,
  });
};

export const useFilteredOrders = (filter: string) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['filteredOrders', filter],
    queryFn: () => fetchFilteredOrders(filter, token!),
    enabled: !!token,
  });
};

export const useFilteredSales = (filter: string) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['filteredSales', filter],
    queryFn: () => fetchFilteredSales(filter, token!),
    enabled: !!token,
  });
};

export const useFilteredTopItems = (filter: string) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['filteredTopItems', filter],
    queryFn: () => fetchFilteredTopItems(filter, token!),
    enabled: !!token,
  });
};

export const useFilteredRecentOrders = (filter: string) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['filteredRecentOrders', filter],
    queryFn: () => fetchFilteredRecentOrders(filter, token!),
    enabled: !!token,
  });
};

export const useOrderPopup = (orderId: string | null) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['orderPopup', orderId],
    queryFn: () => fetchOrderPopup(orderId!, token!),
    enabled: !!token && !!orderId,
  });
};

// ============================================================================
// ADMIN ORDERS
// ============================================================================
export const useOrdersPageList = (dateFilter: string) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['adminOrdersList', dateFilter],
    queryFn: () => fetchOrdersPageList(dateFilter, token!),
    enabled: !!token,
  });
};

// ============================================================================
// ADMIN MENU
// ============================================================================
export const useMenuDashboard = (enabled: boolean = true) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['menuDashboard'],
    queryFn: () => fetchMenuDashboard(token!),
    enabled: !!token && enabled,
    retry: false,
  });
};


export const useAddCategory = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => addCategoryAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuDashboard'] });
      toast.success('Category added successfully!');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to add category')),
  });
};

export const useAddMenuItem = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => addMenuItemAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuDashboard'] });
      toast.success('Item added successfully!');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to add item')),
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => updateMenuItemAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuDashboard'] });
      toast.success('Item updated successfully!');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to update item')),
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (itemId: number) => deleteMenuItemAPI(itemId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuDashboard'] });
      toast.success('Item deleted successfully!');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to delete item')),
  });
};

export const useCategoryItems = (categoryName: string) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['categoryItems', categoryName],
    queryFn: () => fetchCategoryItemsAPI(categoryName, token!),
    enabled: !!token && categoryName !== 'all',
  });
};

// --- SINGLE MENU ITEM (prefill Edit dialog) ---
export const useMenuItemById = (itemId: number | null) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['menuItem', itemId],
    queryFn: () => fetchMenuItemByIdAPI(itemId!, token!),
    enabled: !!token && !!itemId,
  });
};

// ============================================================================
// ADMIN STAFF & ROLES
// ============================================================================
export const useStaffDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['staffDashboard'],
    queryFn: () => fetchStaffDashboard(token!),
    enabled: !!token,
  });
};

export const useAddRole = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => addRoleAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffDashboard'] });
      toast.success('Role added successfully!');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to add role')),
  });
};

export const useAddStaff = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: StaffFormInput) => addStaffAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffDashboard'] });
      toast.success('Staff added successfully!');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to add staff')),
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StaffFormInput }) => updateStaffAPI(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffDashboard'] });
      toast.success('Staff updated successfully!');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to update staff')),
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (id: number) => deleteStaffAPI(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffDashboard'] });
      toast.success('Staff deleted successfully!');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to delete staff')),
  });
};

// ============================================================================
// STAFF MANAGEMENT (attendance / leave, admin side)
// ============================================================================
export const useStaffMgmtDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['staffMgmtDashboard'],
    queryFn: () => fetchStaffMgmtDashboard(token!),
    enabled: !!token,
  });
};

export const useFilterAttendance = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (inputDate: string) => filterAttendanceAPI(inputDate, token!),
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to filter attendance')),
  });
};

export const useRespondToLeave = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => respondToLeaveAPI(data, token!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staffMgmtDashboard'] });
      toast.success(`Leave request ${variables.action} successfully!`);
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to process request')),
  });
};

////staff notifaction
export const useStaffNotifications = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['staffNotifications'],
    queryFn: () => fetchStaffNotifications(token!),
    enabled: !!token,
    refetchInterval: 30000,
  });
};

export const useMarkStaffNotificationRead = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (notification_id: number) =>
      ensureSuccess(await markStaffNotificationRead({ notification_id }, token!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['staffAttendanceDashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to mark notification read')),
  });
};

// ============================================================================
// FEEDBACK
// ============================================================================
export const useFeedbackDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['feedbackDashboard'],
    queryFn: () => fetchFeedbackDashboard(token!),
    enabled: !!token,
  });
};

// ============================================================================
// PAYMENTS
// ============================================================================
export const usePaymentsDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['paymentsDashboard'],
    queryFn: () => fetchPaymentsDashboard(token!),
    enabled: !!token,
  });
};

export const useFilterRevenueTrends = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (filterType: string) => filterRevenueTrendsAPI(filterType, token!),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to filter revenue trends')),
  });
};

export const useFilterPaymentDistribution = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (filterType: string) => filterPaymentDistributionAPI(filterType, token!),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to filter payment distribution')),
  });
};

// ============================================================================
// TABLES & QR
// ============================================================================
export const useTables = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['tables'],
    queryFn: () => fetchTables(token!),
    enabled: !!token,
  });
};

export const useAddTable = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => addTableAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table added');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to add table')),
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateTableAPI(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table updated');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to update table')),
  });
};

// ============================================================================
// RESERVATIONS
// ============================================================================
export const useReservationsDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['reservationsDashboard'],
    queryFn: () => fetchReservationsDashboard(token!),
    enabled: !!token,
  });
};

export const useAddReservation = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => addReservationAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservationsDashboard'] });
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Failed to add reservation')),
  });
};

// NOTE: filterReservationsAPI (POST /admin/reservations/filter) exists on
// the backend but has no wired-up UI yet. Hook is ready for when it is built.
export const useFilterReservations = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (filters: { status?: string; reservation_type?: string; from_date?: string; to_date?: string }) =>
      filterReservationsAPI(filters, token!),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to filter reservations')),
  });
};

export const useUpdateReservationAction = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) => updateReservationActionAPI(id, action, token!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reservationsDashboard'] });
      toast.success(data.message || 'Status updated successfully');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to update status')),
  });
};

// ============================================================================
// OPERATIONS (counter session / issues / stock requests)
// ============================================================================
export const useOpsDashboard = (enabled: boolean = true) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['opsDashboard'],
    queryFn: () => fetchOpsDashboardSummaryAPI(token!),
    enabled: !!token && enabled,
  });
};

export const useOpenCounter = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: { opening_cash: number }) => openCounterSessionAPI(data, token!),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['opsDashboard'] });
      toast.success(res.message);
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to open counter')),
  });
};

export const useCloseCounter = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: { closing_cash: number; notes?: string }) => closeCounterSessionAPI(data, token!),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['opsDashboard'] });
      toast.success(res.message);
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to close counter')),
  });
};

export const useStoreIssues = (enabled: boolean = true) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['storeIssues'],
    queryFn: () => fetchStoreIssuesAPI(token!),
    enabled: !!token && enabled,
  });
};

export const useCreateIssue = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => createStoreIssueAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeIssues'] });
      toast.success('Issue Reported');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to report issue')),
  });
};

export const useAssignIssue = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => assignStoreIssueAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeIssues'] });
      toast.success('Issue Assigned');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to assign issue')),
  });
};

export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => updateStoreIssueStatusAPI(data, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storeIssues'] }),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to update issue status')),
  });
};

// --- SINGLE ISSUE DETAIL ---
export const useSingleIssueDetails = (issueId: number | null) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['issueDetails', issueId],
    queryFn: () => fetchSingleIssueDetailsAPI(issueId!, token!),
    enabled: !!token && !!issueId,
  });
};

export const useStockRequests = (enabled: boolean = true) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['stockRequests'],
    queryFn: () => fetchStockRequestsAPI(token!),
    enabled: !!token && enabled,
  });
};

export const useCreateStockRequest = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => createStockRequestAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockRequests'] });
      toast.success('Stock Request Sent');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to send stock request')),
  });
};

export const useActionStockRequest = (action: 'approve' | 'reject') => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) =>
      action === 'approve' ? approveStockRequestAPI(data, token!) : rejectStockRequestAPI(data, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stockRequests'] }),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to process stock request')),
  });
};

// --- CASHOUTS ---
export const useCashoutList = (sessionId: number | null) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['cashoutList', sessionId],
    queryFn: () => fetchCashoutListAPI(sessionId!, token!),
    enabled: !!token && !!sessionId,
  });
};

export const useDeleteCashout = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (cashoutId: number) => deleteCashoutAPI(cashoutId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashoutList'] });
      queryClient.invalidateQueries({ queryKey: ['opsDashboard'] });
      toast.success('Cashout removed');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to delete cashout')),
  });
};

// ============================================================================
// STOCK MANAGEMENT (menu item quantities)
// ============================================================================
export const useStockManagement = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['stockManagement'],
    queryFn: () => fetchStockManagementAPI(token!),
    enabled: !!token,
  });
};

export const useUpdateItemQuantity = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: { item_id: number; quantity: number }) => updateItemQuantityAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockManagement'] });
      toast.success('Quantity updated');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to update quantity')),
  });
};

// ============================================================================
// ADMIN NOTIFICATIONS (bell in AdminDashboard layout)
// GET  /admin/show_notifications   -> useAdminNotifications
// PUT  /admin/notifications/read   -> useMarkNotificationRead
//
// GET response: { message, restaurant_id, total_notifications,
//                 data: [{ id, title, message, time: "09:30 AM", is_read }] }
// (backend sends no "type", so the icon type is derived from the title)
// ============================================================================
export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  time: string; // already formatted by backend ("%I:%M %p")
  read: boolean;
  type: 'order' | 'payment' | 'staff' | 'system';
}

const notificationTypeFromTitle = (title: string): AdminNotification['type'] => {
  const t = (title || '').toLowerCase();
  if (t.includes('order')) return 'order';
  if (t.includes('payment') || t.includes('paid') || t.includes('cash')) return 'payment';
  if (t.includes('staff') || t.includes('leave') || t.includes('clock') || t.includes('attendance')) return 'staff';
  return 'system';
};

const normalizeAdminNotifications = (raw: any): AdminNotification[] => {
  // Backend subscription check can return 200 + { success:false }
  if (raw?.success === false) throw new Error(raw.message || 'Notifications not available');
  const list: any[] = raw?.data ?? [];
  return list.map((n) => ({
    id: n.id,
    title: n.title ?? 'Notification',
    message: n.message ?? '',
    time: n.time ?? '',
    read: Boolean(n.is_read),
    type: notificationTypeFromTitle(n.title),
  }));
};

export const useAdminNotifications = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['adminNotifications'],
    queryFn: async () => normalizeAdminNotifications(await fetchAdminNotificationsAPI(token!)),
    enabled: !!token,
    refetchInterval: 30000,
    retry: false,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    // backend returns 200 + {success:false} when notification not found / feature blocked
    mutationFn: async (data: { notification_id: number }) =>
         ensureSuccess(await markNotificationReadAPI(data.notification_id, token!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to mark notification read')),
  });
};

// ============================================================================
// SETTINGS
// ============================================================================
export const useSettingsDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['settingsDashboard'],
    queryFn: () => fetchSettingsAPI(token!),
    enabled: !!token,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => updateSettingsAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settingsDashboard'] });
      toast.success('Settings saved to database successfully!');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to save settings')),
  });
};

// ============================================================================
// STAFF PORTAL HOOKS
// ============================================================================
export const useStaffAttendanceDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['staffAttendanceDashboard'],
    queryFn: () => fetchStaffRoleDashboard(token!),
    enabled: !!token,
  });
};

export const useClockInMutation = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async () => ensureSuccess(await clockIn(token!)),
    onSuccess: (data) => {
      toast.success(data?.message || 'Clocked in');
      queryClient.invalidateQueries({ queryKey: ['staffAttendanceDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['staffAttendanceHistory'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to clock in')),
  });
};

export const useClockOutMutation = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async () => ensureSuccess(await clockOut(token!)),
    onSuccess: (data) => {
      toast.success(data?.message || 'Clocked out');
      queryClient.invalidateQueries({ queryKey: ['staffAttendanceDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['staffAttendanceHistory'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to clock out')),
  });
};

export const useStaffLeaveDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['staffLeaveDashboard'],
    queryFn: () => fetchLeaveDashboard(token!),
    enabled: !!token,
  });
};

export const useApplyLeaveMutation = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: any) => ensureSuccess(await applyLeave(data, token!)),
    onSuccess: (data) => {
      toast.success(data?.message || 'Leave applied successfully');
      queryClient.invalidateQueries({ queryKey: ['staffLeaveDashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to apply leave')),
  });
};

export const useStaffOpsDashboard = (enabled: boolean = true) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['staffOpsDashboard'],
    queryFn: () => fetchStaffOpsDashboard(token!),
    enabled: !!token && enabled,
  });
};

export const useReportStoreIssueMutation = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: any) => ensureSuccess(await reportStoreIssue(data, token!)),
    onSuccess: (data) => {
      toast.success(data?.message || 'Issue reported successfully');
      queryClient.invalidateQueries({ queryKey: ['staffOpsDashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to report issue')),
  });
};
// Backend errors ni (success:false / error key) real error ga marchadaniki
const ensureAttendanceOk = (res: any) => {
  if (res?.success === false) throw new Error(res.message || 'Access denied');
  if (res?.error) throw new Error(res.message || res.error);
  return res;
};

// GET /staff/attendance/attendance_history
export const useStaffAttendanceHistory = (enabled: boolean = true) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['staffAttendanceHistory'],
    queryFn: async () => ensureAttendanceOk(await fetchAttendanceHistory(token!)),
    enabled: !!token && enabled,
    retry: false,
  });
};

// POST /staff/attendance/attendance_filter
export const useFilterStaffAttendance = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (payload: { from_date: string; to_date: string; status?: string }) =>
      ensureAttendanceOk(await filterAttendance(payload, token!)),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to filter attendance')),
  });
};

// POST /staff/leave/leave_filter
export const useFilterStaffLeaves = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (payload: { status?: string; leave_type?: string }) =>
      ensureAttendanceOk(await filterLeaves(payload, token!)),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to filter leaves')),
  });
};


// 1. Report issue
export const useReportStoreIssue = (token: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { title: string; description: string; priority: string }) =>
      reportStoreIssue(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-issues'] });
    },
  });
};

// 2. Start issue


export const useStartStoreIssue = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth(); // mee project lo token ekkada nundi vastundo alaa teesuko

  return useMutation({
    mutationFn: (payload: { issue_id: number }) => startStoreIssueApi(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-ops-dashboard'] });
    },
  });
};


export const useCompleteStoreIssue = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (payload: { issue_id: number }) => completeStoreIssueApi(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPS_KEY });
    },
    onError: (err: any) => {
      console.error(err?.response?.data?.detail || 'Unable to complete issue');
    },
  });
};


// ============================================================================
// KITCHEN PORTAL HOOKS
// ============================================================================
export const useKitchenDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['kitchenDashboard'],
    queryFn: () => fetchKitchenDashboard(token!),
    enabled: !!token,
    refetchInterval: 15000,
  });
};

export const useFilterKitchenDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (payload: any) => filterKitchenDashboard(payload, token!),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to filter orders')),
  });
};

export const useStartCooking = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (payload: any) => startCookingAPI(payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenActiveOrders'] });
      toast.success('🔥 Started cooking');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to start cooking')),
  });
};

export const useMarkReady = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (payload: any) => markReadyAPI(payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenActiveOrders'] });
      toast.success('✅ Marked ready');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to mark ready')),
  });
};

export const useReportKitchenIssue = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (payload: any) => reportKitchenIssueAPI(payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenActiveOrders'] });
      toast.success('⚠️ Issue reported');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to report issue')),
  });
};

export const useResumeOrder = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (payload: any) => resumeOrderAPI(payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenActiveOrders'] });
      toast.success('🔥 Resumed cooking');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to resume order')),
  });
};

export const useGoBackOrder = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (payload: any) => goBackAPI(payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenActiveOrders'] });
      toast.success('↩️ Moved back to To Do');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to move order back')),
  });
};

export const useBackToPreparing = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (payload: any) => backToPreparingAPI(payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenActiveOrders'] });
      toast.success('↩️ Moved back to Preparing');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to move order back')),
  });
};

export const useKitchenPastOrders = (enabled: boolean = true) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['kitchenPastOrders'],
    queryFn: () => fetchKitchenPastOrders(token!),
    enabled: !!token && enabled,
  });
};

export const useFilterKitchenPastOrders = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (payload: any) => filterKitchenPastOrders(payload, token!),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to filter past orders')),
  });
};

export const useKitchenOpsDashboard = (enabled: boolean = true) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['kitchenOpsDashboard'],
    queryFn: () => fetchKitchenOpsDashboard(token!),
    enabled: !!token && enabled,
  });
};

export const useReportKitchenStoreIssueMutation = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => reportKitchenStoreIssue(data, token!),
    onSuccess: (data) => {
      toast.success(data?.message || 'Issue reported successfully');
      queryClient.invalidateQueries({ queryKey: ['kitchenOpsDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenStoreIssues'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to report issue')),
  });
};

export const useSendKitchenStockRequestMutation = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: any) => sendKitchenStockRequest(data, token!),
    onSuccess: (data) => {
      toast.success(data?.message || 'Stock request sent');
      queryClient.invalidateQueries({ queryKey: ['kitchenOpsDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenStockRequests'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to send stock request')),
  });
};

export const useKitchenStoreIssues = (enabled: boolean = true) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['kitchenStoreIssues'],
    queryFn: () => fetchKitchenStoreIssues(token!),
    enabled: !!token && enabled,
  });
};

// ============================================================================
// CUSTOMER MENU
// ============================================================================
export const useCustomerMenu = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['customerMenu'],
    queryFn: () => fetchCustomerMenu(token!),
    enabled: !!token,
  });
};

// ============================================================================
// CUSTOMER CART (server-side — Cart + Cart_Items on the backend)
// ============================================================================
export const useCart = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => viewCartAPI(token!),
    enabled: !!token,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: AddToCartPayload) => addToCartAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to add to cart')),
  });
};

export const useUpdateCart = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: UpdateCartPayload) => updateCartAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to update cart')),
  });
};

export const useDeleteCartItem = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: DeleteCartItemPayload) => deleteCartItemAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to remove item')),
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: () => clearCartAPI(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to clear cart')),
  });
};

// ============================================================================
// CUSTOMER ORDERS
// ============================================================================
export const useActiveOrders = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['activeOrders'],
    queryFn: () => fetchActiveOrders(token!),
    enabled: !!token,
    refetchInterval: 10000, // real-time feel kosam
  });
};

export const usePastOrders = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['pastOrders'],
    queryFn: () => fetchPastOrders(token!),
    enabled: !!token,
  });
};

export const usePlaceOrder = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: PlaceOrderPayload) => placeOrderAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Order placed!');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to place order')),
  });
};

export const useFeedbackOrders = (enabled: boolean = true) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['feedbackOrders'],
    queryFn: () => fetchFeedbackOrdersAPI(token!),
    enabled: !!token && enabled,
  });
};

// order_feedback_items is a POST on the backend but conceptually a "fetch
// items for this order" query, so it's modeled as useQuery keyed on the
// selected order id rather than a manual mutation call.
export const useOrderFeedbackItems = (orderId: string | null) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['orderFeedbackItems', orderId],
    queryFn: () => fetchOrderFeedbackItemsAPI({ order_id: orderId! }, token!),
    enabled: !!token && !!orderId,
  });
};

export const useSubmitFeedback = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: SubmitFeedbackPayload) => submitFeedbackAPI(data, token!),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to submit feedback')),
  });
};

export const useAddSpecialNote = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: AddSpecialNotePayload) => addSpecialNoteAPI(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      toast.success('Note added');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to add note')),
  });
};

export const toItemIdFormat = (menuItemId: number): string =>
  `ITM-${String(menuItemId).padStart(3, '0')}`;

// ============================================================================
// COUNTER (POS) HOOKS
// ============================================================================

// --- ACTIVE ORDERS DASHBOARD (todo / preparing / ready) ---
export const useCounterActiveOrdersDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['counterActiveOrdersDashboard'],
    queryFn: async () => {
      const res = await fetchCounterActiveOrdersDashboard(token!);
      if (res?.success === false) throw new Error(res.message || 'Access denied');
      return res;
    },
    enabled: !!token,
    retry: false,
    refetchInterval: (query) => (query.state.error ? false : 8000),
  });
};

// --- PAST ORDERS (served orders history) ---
export const useCounterPastOrders = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['counterPastOrders'],
    queryFn: async () => ensureSuccess(await fetchCounterPastOrders(token!)),
    enabled: !!token,
  });
};

// --- PROCESS ORDER: To Do -> kitchen (POST /counter/process_order) ---
export const useProcessOrder = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: { order_id: string }) => ensureSuccess(await processOrderAPI(data, token!)),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['counterActiveOrdersDashboard'] });
      toast.success(res?.message || 'Order sent to kitchen');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to process order')),
  });
};
export const useCounterProcessOrder = useProcessOrder;

// --- MARK SERVED: whole order (PUT /counter/mark_served) ---
export const useMarkServed = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: MarkServedPayload) => ensureSuccess(await markServedAPI(data, token!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterActiveOrdersDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['counterPastOrders'] });
      toast.success('🍽️ Order marked as served');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to mark served')),
  });
};

// --- MARK SERVED: selected items (POST /counter/mark_served) ---
export const useCounterMarkItemsServed = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: MarkItemsServedPayload) => ensureSuccess(await markItemsServedAPI(data, token!)),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['counterActiveOrdersDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['counterPastOrders'] });
      toast.success(res?.message || 'Items marked as served');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to mark items served')),
  });
};

export const useCounterNotifications = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['counterNotifications'],
    queryFn: () => fetchCounterNotifications(token!),
    enabled: !!token,
    refetchInterval: 15000,
  });
};

export const useUpdatePreparingQuantity = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: PreparingQtyPayload) =>
      ensureSuccess(await updatePreparingQuantityAPI(data, token!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterActiveOrdersDashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to update quantity')),
  });
};

export const useConfirmTransferOrder = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: ConfirmTransferPayload) => confirmTransferOrderAPI(data, token!),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['counterActiveOrdersDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['counterNewOrderDashboard'] });
      toast.success(res?.message || 'Order transferred');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to transfer order')),
  });
};

export const useCounterNewOrderDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['counterNewOrderDashboard'],
    queryFn: () => fetchCounterNewOrderDashboard(token!),
    enabled: !!token,
  });
};

export const useFilterCounterMenuItems = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: FilterMenuPayload) => filterCounterMenuItemsAPI(data, token!),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to filter menu')),
  });
};

export const useCreateCounterOrder = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: CounterCreateOrderPayload) => createCounterOrderAPI(data, token!),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to prepare order summary')),
  });
};

export const useCounterReservationsDashboard = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['counterReservationsDashboard'],
    queryFn: () => fetchCounterReservationsDashboard(token!),
    enabled: !!token,
  });
};

export const useAddCounterReservation = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: CounterAddReservationPayload) => addCounterReservationAPI(data, token!),
    onSuccess: (res: any) => {
      // check_feature_access fail aithe backend 200 tho {success:false} istundi
      if (res?.success === false) {
        toast.error(res.message || 'Reservations not available for this plan');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['counterReservationsDashboard'] });
      toast.success(res?.message || 'Reservation created');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to add reservation')),
  });
};

// Status/type/date filter UI pettinappudu vaadukovachu
export const useFilterCounterReservations = () => {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (filters: { status?: string; reservation_type?: string; from_date?: string; to_date?: string }) =>
      filterCounterReservationsAPI(filters, token!),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to filter reservations')),
  });
};

export const useCounterReservationAction = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: CounterReservationAction }) =>
      counterReservationActionAPI(id, action, token!),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res.message || 'Action not allowed');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['counterReservationsDashboard'] });
      toast.success(res?.message || 'Status updated');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to update status')),
  });
};

const emptyCart = (tableNo: string) => ({
  current_order: { cart_id: null, table_no: tableNo, items: [] as any[], grand_total: 0 },
});

const getCachedCart = (qc: QueryClient, tableNo: string): any =>
  qc.getQueryData(['counterCart', tableNo]) ?? emptyCart(tableNo);

const withoutLine = (cart: any, itemId: number) => {
  const items = (cart?.current_order?.items ?? []).filter((i: any) => i.item_id !== itemId);
  return {
    current_order: {
      ...cart.current_order,
      items,
      grand_total: items.reduce((s: number, i: any) => s + Number(i.total ?? 0), 0),
    },
  };
};

const syncCart = (qc: QueryClient, tableNo: string, res: any) => {
  if (res?.current_order) qc.setQueryData(['counterCart', tableNo], res);
};

// Backend lo "view cart" endpoint ledu, so cart ni add_to_cart response nunchi cache lo pettukuntam
export const useCounterCart = (tableNo: string | null) => {
  return useQuery({
    queryKey: ['counterCart', tableNo],
    queryFn: async () => emptyCart(tableNo!),
    enabled: !!tableNo,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useAddToCounterCart = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: CounterAddToCartPayload) =>
      ensureSuccess(await addToCounterCartAPI(data, token!)),
    onSuccess: (res: any, vars) => syncCart(queryClient, vars.table_no, res),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to add item')),
  });
};

// +1 => add_to_cart(qty 1).  -1 => delete item, then (qty-1) tho malli add (qty 1 aithe delete matrame)
export const useUpdateCounterCartQuantity = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: CounterCartQtyPayload) => {
      const cart = getCachedCart(queryClient, data.table_no);
      const line = (cart.current_order?.items ?? []).find((i: any) => i.item_id === data.item_id);
      const qty = Number(line?.quantity ?? 0);

      if (data.action === 'increment') {
        return ensureSuccess(
          await addToCounterCartAPI({ table_no: data.table_no, item_id: data.item_id, quantity: 1 }, token!)
        );
      }

      ensureSuccess(await deleteCounterCartItemAPI({ table_no: data.table_no, item_id: data.item_id }, token!));
      if (qty <= 1) return withoutLine(cart, data.item_id);
      return ensureSuccess(
        await addToCounterCartAPI({ table_no: data.table_no, item_id: data.item_id, quantity: qty - 1 }, token!)
      );
    },
    onSuccess: (res: any, vars) => syncCart(queryClient, vars.table_no, res),
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to update quantity')),
  });
};

export const useDeleteCounterCartItem = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: CounterDeleteCartItemPayload) =>
      ensureSuccess(await deleteCounterCartItemAPI(data, token!)),
    onSuccess: (_res: any, vars) => {
      queryClient.setQueryData(
        ['counterCart', vars.table_no],
        withoutLine(getCachedCart(queryClient, vars.table_no), vars.item_id)
      );
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to remove item')),
  });
};

// clear_cart endpoint ledu => prathi item ni okko okkati delete chestham
export const useClearCounterCart = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: { table_no: string }) => {
      const cart = getCachedCart(queryClient, data.table_no);
      for (const line of cart.current_order?.items ?? []) {
        await deleteCounterCartItemAPI({ table_no: data.table_no, item_id: line.item_id }, token!);
      }
      return true;
    },
    onSuccess: (_res: any, vars) => {
      queryClient.setQueryData(['counterCart', vars.table_no], emptyCart(vars.table_no));
      toast.info('Cart cleared');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to clear cart')),
  });
};

export const useConfirmCounterOrder = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: CounterConfirmOrderPayload) => confirmCounterOrderAPI(data, token!),
    onSuccess: (_res: any, vars) => {
      queryClient.invalidateQueries({ queryKey: ['counterActiveOrdersDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['counterNewOrderDashboard'] });

      queryClient.setQueryData(['counterCart', vars.table_no], emptyCart(vars.table_no));
      toast.success('🎉 Order placed!');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to place order')),
  });
};

// sends payment_method, caches the returned bill for the receipt
export const useMarkPaid = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: MarkPaidPayload) => markPaidAPI(data, token!),
    onSuccess: (res: any, vars) => {
      if (res?.success === false) {
        toast.error(res.message || 'Payment not allowed');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['counterActiveOrdersDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['counterPastOrders'] });
      if (res?.bill_details) {
        queryClient.setQueryData(['counterBill', vars.order_id], { bill_details: res.bill_details });
      }
      toast.success('✅ Payment confirmed');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to confirm payment')),
  });
};


// counter notification (bell)
export const useMarkCounterNotificationRead = () => {
  const qc = useQueryClient();
  const { token } = useAuth(); // nee existing token source
  return useMutation({
    mutationFn: (notificationId: number) =>
      markNotificationReadAPIcounter(notificationId, token as string),
    onSuccess: (res: any) => {
      if (res?.success === false) { toast.error(res.message || 'Unable to update notification'); return; }
      qc.invalidateQueries({ queryKey: ['counterNotifications'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Unable to update notification'),
  });
};

export const useMarkAllCounterNotificationsRead = () => {
  const qc = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (ids: number[]) => markAllNotificationsReadAPIcounter(ids, token as string),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['counterNotifications'] }),
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Unable to update notifications'),
  });
};


// bill of a paid order (Recent Payments -> Bill button)
export const useCounterBill = (orderId: string | null) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['counterBill', orderId],
    queryFn: () => fetchCounterBillAPI(orderId!, token!),
    enabled: !!token && !!orderId,
    staleTime: Infinity, // a paid bill never changes
  });
};



// ============================================================================
// COUNTER RESERVATIONS (Reservations tab)
// ============================================================================
export type ResType = 'table' | 'event' | 'full_venue';
export type ResStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface ResRow {
  id: number;
  reservation_code: string;
  reservation_type: ResType;
  customer_name: string;
  customer_phone?: string;
  reservation_date: string;
  reservation_time: string;
  duration: string; // "2h"
  guests: number;
  table_name: string | null;
  status: ResStatus;
  description?: string | null;
  special_request?: string | null;
}

export interface ResDashboard {
  message?: string;
  settings?: { table_reservations: boolean; event_slots: boolean; full_venue_booking: boolean };
  reservations?: ResRow[];
  tables?: { id: number; table_name: string }[]; // backend patch tarvata vastundi
}

// Token: AuthContext nundi. Mee context lo token vere peru tho unte ikkada okka chota marchandi.
const useToken = (): string => {
  const auth: any = useAuth();
  return auth?.token ?? localStorage.getItem('access_token') ?? '';
};

const ROOT_KEY = ['counterReservationsDashboard'];

// Backend subscription fail aithe 200 tho { success:false } istundi
const check = (res: any) => {
  if (res?.success === false) throw new Error(res.message || 'Reservations not available for this plan');
  return res;
};
const errText = (e: any) => e?.response?.data?.detail || e?.message || 'Something went wrong';

export const useResDashboard = () => {
  const token = useToken();
  return useQuery<ResDashboard>({
    queryKey: ROOT_KEY,
    queryFn: async () => check(await fetchCounterReservationsDashboard(token)),
    enabled: !!token,
  });
};

export const useResFilter = (filters: { status?: ResStatus; reservation_type?: ResType }, enabled: boolean) => {
  const token = useToken();
  return useQuery<ResDashboard>({
    queryKey: [...ROOT_KEY, 'filter', filters],
    queryFn: async () => check(await filterCounterReservationsAPI(filters, token)),
    enabled: enabled && !!token,
  });
};

export const useResAdd = () => {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: async (data: CounterAddReservationPayload) => check(await addCounterReservationAPI(data, token)),
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Reservation created');
      qc.invalidateQueries({ queryKey: ROOT_KEY });
    },
    onError: (e: any) => toast.error(errText(e)),
  });
};

export const useResAction = () => {
  const qc = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: async (p: { id: number; action: CounterReservationAction }) =>
      check(await counterReservationActionAPI(p.id, p.action, token)),
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Status updated');
      qc.invalidateQueries({ queryKey: ROOT_KEY });
    },
    onError: (e: any) => toast.error(errText(e)),
  });
};

// ============================================================================
// ORGANIZATION / OTP
// ============================================================================
export const useOrganizationRegisterMutation = () =>
  useMutation({ mutationFn: registerOrganization });

export const useSendRegisterOtpMutation = () =>
  useMutation({ mutationFn: sendRegisterOtp });

// POST /kitchen/kitchen_dashboard/dashboard_filter as a query:
export const useKitchenActiveOrders = (
  filters: { status: string; type: string; category: string },
  enabled: boolean = true
) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['kitchenActiveOrders', filters.status, filters.type, filters.category],
    queryFn: () => filterKitchenDashboard(filters, token!),
    enabled: !!token && enabled,
    refetchInterval: 8000,
    placeholderData: keepPreviousData,
  });
};


export const useCounterTableStatus = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['counterTableStatus'],
    queryFn: async () => ensureSuccess(await fetchCounterTableStatusAPI(token!)),
    enabled: !!token,
  });
};
// ============================================================================
// COUNTER OPERATIONS HOOKS (Operations tab)
// ============================================================================
const OPS_KEY = ['counterOps'];

export const useCounterOpsSummary = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery<OpsSummary>({
    queryKey: [...OPS_KEY, 'summary'],
    queryFn: async () => ensureSuccess(await fetchCounterOpsSummaryAPI(token!)).data,
    enabled: !!token,
    retry: false,
  });
};

export const useCounterOpsCashouts = (sessionId: number | null) => {
  const token = useAuthStore((s) => s.token);
  return useQuery<CashoutRow[]>({
    queryKey: [...OPS_KEY, 'cashouts', sessionId],
    queryFn: async () => ensureSuccess(await fetchCounterCashoutsAPI(sessionId!, token!)).data ?? [],
    enabled: !!token && !!sessionId,
    retry: false,
  });
};

export const useCounterOpsStockRequests = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery<StockRequestRow[]>({
    queryKey: [...OPS_KEY, 'stockRequests'],
    queryFn: async () => ensureSuccess(await fetchCounterStockRequestsAPI(token!)).data ?? [],
    enabled: !!token,
    retry: false,
  });
};

export const useCounterOpsOpen = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: { opening_cash: number }) =>
      ensureSuccess(await openCounterCashSessionAPI(data, token!)),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: OPS_KEY });
      toast.success(res?.message || 'Counter opened');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to open counter')),
  });
};

export const useCounterOpsClose = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: { closing_cash: number; notes?: string }) =>
      ensureSuccess(await closeCounterCashSessionAPI(data, token!)),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: OPS_KEY });
      toast.success(res?.message || 'Counter closed');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to close counter')),
  });
};

export const useCounterOpsAddCashout = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: {
      session_id: number;
      amount: number;
      category: string;
      vendor?: string;
      description?: string;
    }) => ensureSuccess(await addCounterCashoutAPI(data, token!)),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: OPS_KEY });
      toast.success(res?.message || 'Cashout added');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to add cashout')),
  });
};

export const useCounterOpsCreateIssue = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: async (data: { title: string; description: string; priority: string }) =>
      ensureSuccess(await createCounterStoreIssueAPI(data, token!)),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: OPS_KEY });
      toast.success(res?.message || 'Issue reported');
    },
    onError: (err: any) => toast.error(getErrorMessage(err, 'Failed to report issue')),
  });
};