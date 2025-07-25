import { Platform, StatusBar, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginLeft: 15,
  },
  headerCount: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
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
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  activeFilter: {
    backgroundColor: "#5E72E4",
  },
  filterButtonText: {
    color: "#5E72E4",
    fontWeight: "500",
    fontSize: 15,
    marginLeft: 8,
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
  activeFiltersText: {
    color: "#6B7280",
    fontSize: 14,
  },
  clearFilterText: {
    color: "#EF4444",
    fontSize: 14,
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
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
    width: "100%",
  },
  filterOptionText: {
    fontSize: 16,
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
    fontSize: 20,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 100,
  },
   serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#EDF2F7",
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    maxWidth: '70%',
    flexShrink: 1,
  },
  serviceTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceIcon: {
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: "#D1FAE5",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#065F46",
  },
  serviceDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#4A5568",
    marginLeft: 8,
    flex: 1,
    flexWrap: "wrap",
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 13,
    color: "#718096",
    marginLeft: 8,
  },
  serviceBoyText: {
    fontSize: 15,
    color: "#5E72E4",
    fontWeight: "500",
  },
  actionButtons: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  createBillButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5E72E4",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  createBillButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  moveToPendingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F59E0B",
    padding: 12,
    borderRadius: 8,
  },
  moveToPendingButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#4A5568",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#718096",
    marginTop: 8,
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingMoreContainer: {
  padding: 20,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
},
loadingMoreText: {
  marginLeft: 10,
  color: '#718096',
},
});