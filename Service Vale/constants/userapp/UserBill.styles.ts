import { Platform, StatusBar, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  container: {
    flex: 1,
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40,
    paddingBottom: 20,
    backgroundColor: "#5E72E4",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
  },
  headerCount: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
        paddingBottom: 100,
  },
    filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#EBF4FF",
  },
  filterButtonText: {
    color: "#5E72E4",
    fontSize: 14,
    fontWeight: "500",
  },
  clearFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  clearFilterText: {
    color: "#5E72E4",
    fontSize: 14,
    fontWeight: "500",
  },
  activeFilter: {
    backgroundColor: "#5E72E4",
  },
  activeFilterText: {
    color: "#FFF",
  },
  activeFiltersContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F7FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5E72E4",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipText: {
    color: "#FFF",
    fontSize: 12,
    marginRight: 6,
  },
  modalContainer1: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent1: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle1: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  modalScrollBox1: {
    maxHeight: 300,
    marginBottom: 10,
  },
  filterOption1: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterOptionContainer1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterOptionText1: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  countBadge1: {
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    color: "#4B5563",
  },
  modalCloseButton1: {
    marginTop: 15,
    backgroundColor: "#5E72E4",
    padding: 10,
    borderRadius: 5,
    alignSelf: "center",
  },
  modalCloseButtonText1: {
    color: "white",
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle1: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 24
  },
  formGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5568",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F7FAFC",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#2D3748",
  },
    input1: {
    backgroundColor: "#F7FAFC",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#2D3748",
    marginBottom: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  paymentSummary: {
    backgroundColor: "#F7FAFC",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#4A5568",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
  },
  paymentMethodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  methodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flex: 1,
    marginHorizontal: 5,
  },
  methodButtonActive: {
    backgroundColor: "#5E72E4",
    borderColor: "#5E72E4",
  },
  methodText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#5E72E4",
  },
  methodTextActive: {
    color: "#FFF",
  },
  cashPaymentContainer: {
    marginBottom: 15,
  },
  changeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  changeLabel: {
    fontSize: 14,
    color: "#4A5568",
  },
  changeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#38A169",
  },
  signatureContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    alignItems: "center",
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5568",
    marginBottom: 10,
  },
  signatureImage: {
    width: 200,
    height: 80,
    resizeMode: "contain",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 5,
    marginBottom: 10,

  },
  changeSignatureButton: {
    marginBottom: 10,
  },
  changeSignatureText: {
    color: "#5E72E4",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  addSignatureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#EBF4FF",
    marginBottom: 15,
  },
  addSignatureText: {
    color: "#5E72E4",
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#5E72E4",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#5E72E4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  billsListContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingRight: 20,
    paddingLeft: 20,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#4A5568",
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#718096",
  },
  billCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  billCustomer: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
  },
  billService: {
    fontSize: 14,
    color: "#718096",
  },
  billAmountContainer: {
    backgroundColor: "#EBF4FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  billAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5E72E4",
  },
  billFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  billNumber: {
    fontSize: 12,
    color: "#718096",
  },
  billStatus: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPaid: {
    backgroundColor: "#C6F6D5",
    color: "#22543D",
  },
  statusPending: {
    backgroundColor: "#FEEBC8",
    color: "#7B341E",
  },
  statusCancelled: {
    backgroundColor: "#FED7D7",
    color: "#742A2A",
  },
  billDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  billDate: {
    fontSize: 12,
    color: "#718096",
    gap: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
  },
  modalContent: {
    padding: 20,
  },
  modalScrollBox: {
    maxHeight: 300,
    marginBottom: 10,
  },
  filterOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterOptionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterOptionText: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  countBadge: {
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    color: "#4B5563",
  },
  modalCloseButton: {
    marginTop: 15,
    backgroundColor: "#5E72E4",
    padding: 10,
    borderRadius: 5,
    alignSelf: "center",
  },
  modalCloseButtonText: {
    color: "white",
    fontSize: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5568",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#2D3748",
    flex: 1,
    textAlign: "right",
  },
  statusPaidText: {
    color: "#22543D",
  },
  statusPendingText: {
    color: "#7B341E",
  },
  statusCancelledText: {
    color: "#742A2A",
  },
  notesText: {
    fontSize: 14,
    color: "#4A5568",
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 5,
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    flex: 1,
  },
  rateButton: {
    backgroundColor: "#F6AD55",
  },
  printButton: {
    backgroundColor: "#5E72E4",
  },
  whatsappButton: {
    backgroundColor: "#25D366",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  signatureModalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  signatureModalContent: {
    backgroundColor: "#FFF",
    margin: 20,
    borderRadius: 15,
    height: "60%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  signatureModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  signatureModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
  },
  signatureCanvasContainer: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 150,
    backgroundColor: "#5E72E4",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5E72E4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomButton: {
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  bottomButtonActive: {
    marginTop: -25,
    backgroundColor: "#5E72E4",
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: "#5E72E4",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EBF4FF",
  },
  bottomButtonIconActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  bottomButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#718096",
    marginTop: 5,
  },
  bottomButtonTextActive: {
    color: "#FFF",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  serviceType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#92400E",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
  },
  searchIcon: {
    marginLeft: 8,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
   loadingMoreContainer: {
  padding: 10,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
},
loadingMoreText: {
  marginLeft: 10,
  color: '#718096',
},
});
