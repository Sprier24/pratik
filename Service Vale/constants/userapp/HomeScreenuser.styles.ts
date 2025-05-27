// In HomeScreenuser.styles.ts
import { Platform, StatusBar, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#f5f7fa',
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    backgroundColor: '#3498db',
    borderRadius: 20,
    padding: 8,
    marginRight: 10,
  },
  logoutIcon: {
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    padding: 8,
  },
  revenueContainer: {
    marginBottom: 16,
  },
  revenueCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  dailyRevenue: {
    backgroundColor: '#3498db',
  },
  monthlyRevenue: {
    backgroundColor: '#2ecc71',
  },
  servicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  serviceCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#fff',
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e67e22',
  },
  completedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  revenueCardTitle: {
    color: '#fff',
  },
  serviceCardTitle: {
    color: '#2c3e50',
  },
  cardAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  cardCount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#2c3e50',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  viewButtonText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  bottomButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3498db',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  icon: {
    marginRight: 8,
  },
});