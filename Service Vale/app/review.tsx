import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

// Replace with your actual Place ID
const GOOGLE_PLACE_ID = "ChIJc9plIFBP4DsRIYg6eae1wYk"; // Example ID

const GoogleReviewScreen = () => {
  const reviewUrl = `https://search.google.com/local/reviews?placeid=${GOOGLE_PLACE_ID}`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: reviewUrl }}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
        )}
      />
    </View>
  );
};

export default GoogleReviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
});
