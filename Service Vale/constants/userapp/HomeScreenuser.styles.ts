import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
  },
  notificationIcon: {
    backgroundColor: "#3498db",
    borderRadius: 20,
    padding: 8,
  },
  revenueContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  servicesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },
  dailyRevenue: {
    backgroundColor: "#3498db",
  },
  monthlyRevenue: {
    backgroundColor: "#2ecc71",
  },
  pendingCard: {
    backgroundColor: "#fff",
    borderLeftWidth: 4,
    borderLeftColor: "#e67e22",
  },
  completedCard: {
    backgroundColor: "#fff",
    borderLeftWidth: 4,
    borderLeftColor: "#27ae60",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardCount: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 8,
    color: "#2c3e50",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTrend: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 4,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  viewButtonText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  activityTime: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  bottomButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3498db",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
