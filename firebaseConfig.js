// firebaseConfig.js - Configuración de Firebase para la app.
// Aquí inicializo Firebase usando los datos de mi proyecto de Firebase Console.

import { initializeApp } from 'firebase/app';

// Estos datos los proporciona Firebase al crear el proyecto (son públicos, no son sensibles).
const firebaseConfig = {
  apiKey: "AIzaSyAxGXal8rNPyCFP2XMualqQqEkBIO8fYek",                 // Clave pública de la API de Firebase
  authDomain: "reactnativelogin-6bb17.firebaseapp.com",              // Dominio de autenticación (para login, etc)
  projectId: "reactnativelogin-6bb17",                               // ID del proyecto en Firebase
  storageBucket: "reactnativelogin-6bb17.firebasestorage.app",       // Bucket de almacenamiento (para imágenes)
  messagingSenderId: "515275569986",                                 // ID para mensajes y notificaciones (no usado aquí)
  appId: "1:515275569986:web:0b1720f1ac71bbc63604f",                 // ID de la app (identifica esta app en Firebase)
  measurementId: "G-WRX9Y1P2Z7"                                      // ID para Google Analytics (opcional, no lo uso)
};

// Inicializo la app de Firebase con la configuración anterior.
// Así puedo usar Auth, Firestore, Storage, etc.
const app = initializeApp(firebaseConfig);

// Exporto la app para poder importarla en el resto de archivos
export default app;
