// App.js - Punto de entrada de la app.
// Aquí configuro toda la navegación principal usando React Navigation.
// Enlazo todas las pantallas (Bienvenida, Principal, Amigos, Perfil, Paseo).

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Importo todas las pantallas principales
import Bienvenida from './screens/Bienvenida';
import Principal from './screens/Principal';
import Amigos from './screens/Amigos';
import Perfil from './screens/Perfil';
import Paseo from './screens/Paseo';
import TrailerLogo from './screens/TrailerLogo';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="TrailerLogo"
          screenOptions={{
            headerShown: false,
            // *** ¡CAMBIO CLAVE AQUÍ PARA LA TRANSICIÓN A UN FUNDIDO SUAVE! ***
            animation: 'none', // ¡Esto hará que las pantallas se fundan en lugar de aparecer de golpe!
          }}
        >
          <Stack.Screen name="TrailerLogo" component={TrailerLogo} />
          <Stack.Screen name="Bienvenida" component={Bienvenida} />
          <Stack.Screen name="Principal" component={Principal} />
          <Stack.Screen name="Amigos" component={Amigos} />
          <Stack.Screen name="Perfil" component={Perfil} />
          <Stack.Screen name="Paseo" component={Paseo} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}