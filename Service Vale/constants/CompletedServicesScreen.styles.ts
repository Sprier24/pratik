import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  notificationIcon: {
    backgroundColor: '#3498db',
    borderRadius: 20,
    padding: 8,
  },
  revenueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  revenueBox: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },
  dailyRevenue: {
    backgroundColor: '#3498db',
  },
  monthlyRevenue: {
    backgroundColor: '#2ecc71',
  },
  revenueTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  revenueTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  tableWrapper: {
    width: width - 32,
  },
  tableTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  viewAllText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
  },
  tableHeaderCell: {
    paddingRight: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7f8c8d',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tableCell: {
    paddingRight: 8,
  },
  tableData: {
    fontSize: 14,
    color: '#34495e',
  },
  idColumn: {
    width: 40,
  },
  serviceColumn: {
    width: width - 160,
  },
  actionColumn: {
    width: 60,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3498db',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#065F46',
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewText: {
    marginLeft: 6,
    color: '#2563EB',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 10,
  },
  serviceDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  serviceBoyText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    width: 150,
    textAlign: 'left',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});