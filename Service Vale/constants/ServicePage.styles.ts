import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  serviceBox: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 30,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  applicantItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  applicantName: {
    fontSize: 16,
    color: '#007bff',
  },
  noApplicantsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 15,
  },
  modalCloseButton: {
    marginTop: 15,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
  },
});