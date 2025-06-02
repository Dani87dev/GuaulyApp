// Pantalla Bienvenida: aquí gestiono el login y el registro de usuarios.
// Uso Firebase Auth para autenticar, Firestore para guardar usuarios nuevos y estilos llamativos con paw y colorines.

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc } from 'firebase/firestore';
import app from '../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Colores principales para los estilos de la pantalla
const COLOR_GENERAL = '#5d4037'; // Marrón principal
const COLOR_BOTON = '#8d6e63';   // Marrón más claro para botones
const COLOR_SOMBRA = 'rgba(0,0,0,0.15)';

const auth = getAuth(app); // Inicializo Firebase Auth
const db = getFirestore(app); // Inicializo Firestore

export default function Bienvenida({ navigation }) {
  // Estados locales de los campos y errores
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Esta función se usa para registrarse o iniciar sesión según el modo (signup/signin)
  const handleAuth = async (mode) => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        // Registro de usuario con email y contraseña
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Guardo el usuario en la colección 'usuarios' de Firestore (solo email y fotoURL vacío)
        await setDoc(doc(db, "usuarios", cred.user.uid), {
          email: email,
          fotoURL: '',
        });
      } else {
        // Login normal
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Si va bien, paso a la pantalla principal
      navigation.replace('Principal');
    } catch (e) {
      // Si algo falla, muestro el error
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UI PRINCIPAL ---
  return (
    <LinearGradient
      colors={['#f5e9da', '#ede4dc', '#fff']} // Fondo degradado marrón claro
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Iconos de patita de fondo decorativos */}
      <MaterialCommunityIcons
        name="paw"
        size={100}
        color={COLOR_GENERAL}
        style={styles.patitaSuperior}
        pointerEvents="none"
      />
      <MaterialCommunityIcons
        name="paw"
        size={150}
        color={COLOR_GENERAL}
        style={styles.patitaInferior}
        pointerEvents="none"
      />
      {/* KeyboardAvoidingView para que no tape el teclado los inputs */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Título y subtítulo de la app */}
          <Text style={styles.title}>GUAULY</Text>
          <Text style={styles.subtitulo}>
            <Text style={{ fontWeight: 'bold', color: COLOR_GENERAL }}>¡Conecta, pasea y disfruta!</Text>{"\n"}
            Tu red de amigos peludos.
          </Text>
          {/* Paw central en grande */}
          <MaterialCommunityIcons
            name="paw"
            size={150}
            color={COLOR_GENERAL}
            style={styles.iconoCentral}
            pointerEvents="none"
          />

          {/* Formulario de login/registro */}
          <View style={styles.formulario}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#aaa"
            />
            <TextInput
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#aaa"
            />
            {/* Si hay error lo muestro */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Si está cargando muestro spinner, si no, los botones */}
            {loading ? (
              <ActivityIndicator size="large" color={COLOR_GENERAL} style={{ marginVertical: 18 }} />
            ) : (
              <View style={styles.botonesColumn}>
                {/* Botón Entrar */}
                <TouchableOpacity
                  style={[styles.botonCustom, { backgroundColor: COLOR_BOTON }]}
                  onPress={() => handleAuth('signin')}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="login" size={24} color="#fff" />
                  <Text style={styles.botonCustomText}>Entrar</Text>
                </TouchableOpacity>
                {/* Botón Registrarse */}
                <TouchableOpacity
                  style={[styles.botonCustom, { backgroundColor: COLOR_BOTON }]}
                  onPress={() => handleAuth('signup')}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="account-plus" size={24} color="#fff" />
                  <Text style={styles.botonCustomText}>Registrarse</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 55,
    fontWeight: '900',
    color: COLOR_GENERAL,
    letterSpacing: 8,
    textShadowColor: COLOR_SOMBRA,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 7,
    alignSelf: 'center',
    marginBottom: 0,
    marginTop: 16,
  },
  subtitulo: {
    fontSize: 18,
    marginBottom: 12,
    marginTop: 2,
    fontStyle: 'italic',
    color: COLOR_GENERAL,
    textAlign: 'center',
    width: '100%',
    lineHeight: 26,
    letterSpacing: 1,
  },
  iconoCentral: {
    alignSelf: 'center',
    marginBottom: 8,
    marginTop: 0,
    opacity: 0.23,
  },
  formulario: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 5,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 13,
    marginBottom: 16,
    fontSize: 17,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 1, height: 1 },
    shadowRadius: 4,
    color: COLOR_GENERAL,
  },
  botonesColumn: {
    width: '100%',
    marginTop: 8,
  },
  botonCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 13,
    marginBottom: 13,
    elevation: 2,
    shadowColor: COLOR_SOMBRA,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    width: '100%',
  },
  botonCustomText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 12,
    letterSpacing: 2,
  },
  error: {
    color: '#d11a2a',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  patitaSuperior: {
    position: 'absolute',
    top: 34,
    left: 0,
    zIndex: 0,
    opacity: 0.11,
    transform: [{ rotate: '-22deg' }],
  },
  patitaInferior: {
    position: 'absolute',
    bottom: 42,
    right: 10,
    zIndex: 0,
    opacity: 0.09,
    transform: [{ rotate: '18deg' }],
  },
});
