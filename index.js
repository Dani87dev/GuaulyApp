// index.js - Entrada principal de la app en Expo.
// Aquí le digo a Expo que el componente raíz de la app es App.js.

import { registerRootComponent } from 'expo';
import App from './App';

// Registra el componente App como el componente raíz de toda la app.
// Esto hace que al arrancar la app, se cargue App.js como punto inicial.
registerRootComponent(App);
