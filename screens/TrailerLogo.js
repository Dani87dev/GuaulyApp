import { useEffect, useRef } from 'react';
import {Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Colores que ya usas en tu app para mantener la consistencia
const COLOR_GENERAL = '#5d4037'; // Marrón oscuro
const COLOR_PRIMARIO_CLARO = '#f5e9da'; // Fondo claro del degradado

export default function TrailerLogo({ navigation }) {
  // Animación para el icono y texto
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animación para la rotación de la patita
  const rotateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { 
    Animated.sequence([
      // FASE 1: Aparecer desde la nada Y GIRAR 1 VUELTA simultáneamente
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800, // Duración de la aparición 
          useNativeDriver: true,
        }),
        Animated.timing(rotateYAnim, {
          toValue: 1,
          duration: 800, // duracion de la rotación
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),

      // FASE 2: Pausa ESTÁTICA después de la aparición y el giro
      Animated.delay(800), // Se mantiene en 0.8 segundos

      // FASE 3: Hacerse GIGANTE y desaparecer 
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,             
          duration: 400,          
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 6,             // Escala a 6 veces su tamaño
          duration: 900,          // Se mantiene la duración para el escalado
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Cuando todas las animaciones terminan, navega a la pantalla de Bienvenida
      navigation.replace('Bienvenida'); // Mantener comentado para ajustes
    });

    return () => {
      rotateYAnim.setValue(0);
    };
  }, []);

  const rotateYInterpolate = rotateYAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[COLOR_PRIMARIO_CLARO, '#ede4dc', '#fff']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          styles.contentContainer
        ]}
      >
        <Animated.View style={{ transform: [{ rotateY: rotateYInterpolate }] }}>
          <MaterialCommunityIcons name="paw" size={200} color={COLOR_GENERAL} style={styles.logo} />
        </Animated.View>
        <Text style={styles.appName}>GUAULY</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  appName: {
    fontSize: 50,
    fontWeight: '900',
    color: COLOR_GENERAL,
    letterSpacing: 8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
});