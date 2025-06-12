import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useNotification } from './src/notifications/useNotification'

const App = () => {

    useNotification()

    return (
        <View style={{ flex: 1, backgroundColor: "black", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 40, color: "white" }}>Hello World</Text>
        </View>
    )
}

export default App

const styles = StyleSheet.create({})