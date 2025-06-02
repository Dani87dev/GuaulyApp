// Pantalla Principal: es la pantalla de inicio tras hacer login.
// Aquí muestro la imagen, nombre de usuario y los accesos rápidos a Amigos, Paseo y Perfil.
// También gestiono la animación de carga de imagen y los datos de usuario desde Firestore.

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native'; // Asegúrate de que TouchableOpacity está aquí
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../firebaseConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Easing } from 'react-native';

// ¡Eliminamos la importación de Ripple!
// import Ripple from 'react-native-material-ripple'; // <-- ¡Esta línea debe desaparecer!

// Colores y tamaños globales de botones
const BUTTON_SIZE = 80;
const BUTTON_COLOR = '#8d6e63';    // Marrón claro botones
const COLOR_GENERAL = '#5d4037';   // Marrón oscuro para textos y paw

const auth = getAuth(app);
const db = getFirestore(app);

export default function Principal({ navigation }) {
  // Estados principales
  const [selectedImage, setSelectedImage] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('Usuario Nuevo');
  const [fadeAnim] = React.useState(new Animated.Value(0));

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const fadeInImage = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const startPulsating = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useFocusEffect(
    useCallback(() => {
      const cargarDatosUsuario = async () => {
        const user = auth.currentUser;
        if (user) {
          try {
            const docRef = doc(db, 'usuarios', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.nombreUsuario && data.nombreUsuario.trim() !== '') {
                setNombreUsuario(data.nombreUsuario);
              } else {
                setNombreUsuario('Usuario Nuevo');
              }
              if (data.imagenPerfil) {
                setSelectedImage(data.imagenPerfil);
                fadeInImage();
              } else {
                setSelectedImage(null);
                fadeInImage();
              }
            } else {
              setNombreUsuario('Usuario Nuevo');
              setSelectedImage(null);
              fadeInImage();
            }
          } catch (error) {
            console.log('Error al cargar datos de usuario:', error);
            setNombreUsuario('Usuario Nuevo');
            setSelectedImage(null);
            fadeInImage();
          }
        }
      };

      cargarDatosUsuario();
      startPulsating();

      return () => {
        pulseAnim.setValue(1);
      };
    }, [pulseAnim])
  );

  // --- UI PRINCIPAL ---
  return (
    <LinearGradient
      colors={['#f5e9da', '#ede4dc', '#fff']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Iconos de patita como fondo */}
      <MaterialCommunityIcons
        name="paw"
        size={110}
        color={COLOR_GENERAL}
        style={styles.patitaSuperior}
        pointerEvents="none"
      />
      <MaterialCommunityIcons
        name="paw"
        size={160}
        color={COLOR_GENERAL}
        style={styles.patitaInferior}
        pointerEvents="none"
      />
      {/* HEADER FIJO CON ICONO Y TEXTO */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerLogoContainer}>
          <View style={styles.pawIconWrapper}>
            <MaterialCommunityIcons name="paw" size={60} color={COLOR_GENERAL} />
          </View>
          <Text style={styles.logoText}>GUAULY</Text>
        </View>
        <Text style={styles.subtitulo}>tu app de paseos</Text>
        {/* Imagen de perfil redonda, con sombra y fade-in */}
        <View style={styles.avatarShadow}>
          <TouchableOpacity activeOpacity={0.8}>
            <Animated.Image
              source={
                selectedImage
                  ? { uri: selectedImage }
                  : require('../assets/perfil_default.png')
              }
              style={[
                styles.imagenRedonda,
                { opacity: fadeAnim },
                { transform: [{ scale: pulseAnim }] }
              ]}
              onLoad={fadeInImage}
            />
          </TouchableOpacity>
        </View>
        <Text
          style={
            nombreUsuario === 'Usuario Nuevo'
                ? styles.nombreUsuarioTemporal
                : styles.nombreUsuario
            }
        >
            {nombreUsuario.split(' ').join('\n')}
          </Text>

           {nombreUsuario === 'Usuario Nuevo' && (
            <TouchableOpacity
              style={styles.botonEditarPerfil}
              onPress={() => navigation.navigate('Perfil')}
              activeOpacity={0.7}
            >
              <Text style={styles.botonEditarPerfilTexto}>Editar Perfil</Text>
            </TouchableOpacity>
          )}

      </View>

      {/* Footer fijo con los tres botones: Amigos, Paseo y Perfil */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.buttonWrapper}>
          {/* BOTÓN AMIGOS - VOLVEMOS A TouchableOpacity */}
          <TouchableOpacity // <-- ¡Vuelve a TouchableOpacity!
            style={[styles.bottomButton, { backgroundColor: BUTTON_COLOR }]} // <-- Quitamos 'overflow: hidden' si lo habías añadido aquí
            onPress={() => navigation.navigate('Amigos')}
            activeOpacity={0.7} // <-- Propiedad de TouchableOpacity para feedback visual
          >
            <Ionicons name="people" size={50} color="white" />
          </TouchableOpacity>
        </View>

        {/* Los otros botones ya estaban como TouchableOpacity */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: BUTTON_COLOR }]}
            onPress={() => navigation.navigate('Paseo')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="dog-side" size={60} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: BUTTON_COLOR }]}
            onPress={() => navigation.navigate('Perfil')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle" size={50} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  patitaSuperior: {
    position: 'absolute',
    top: 200,
    left: 40,
    zIndex: 0,
    opacity: 0.10,
    transform: [{ rotate: '-22deg' }],
  },
  patitaInferior: {
    position: 'absolute',
    bottom: 45,
    top: 500,
    right: 12,
    zIndex: 0,
    opacity: 0.09,
    transform: [{ rotate: '-22deg' }],
  },
  fixedHeader: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
    zIndex: 10,
    paddingBottom: 14,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 0,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 8,
  },
  pawIconWrapper: {
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 6,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    color: COLOR_GENERAL,
    marginLeft: 12,
    letterSpacing: 8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR_GENERAL,
    marginTop: -5,
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'right',
    width: '100%',
    paddingRight: 45,
  },
  avatarShadow: {
    shadowColor: '#7E5E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    borderRadius: 105,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 8,
    marginTop: 70,
    borderWidth: 2,
    borderColor: '#7E5E3B',
  },
  imagenRedonda: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 7,
    borderColor: '#a1887f',
  },
  nombreUsuario: {
    fontSize: 38,
    fontWeight: '900',
    color: '#333',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 8,
  },
   nombreUsuarioTemporal: {
    fontSize: 30,
    fontWeight: '700',
    color: '#8d6e63',
    marginTop: 10,
    marginBottom: 0,
    textAlign: 'center',
  },

  botonEditarPerfil: {
    backgroundColor: BUTTON_COLOR,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 15,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  botonEditarPerfilTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 101,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonWrapper: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  bottomButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});