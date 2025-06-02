// Pantalla Paseo: aquí muestro mi ubicación en el mapa y la de mis amigos que están "paseando".
// Uso geolocalización, Firebase, y pinto un mapa con react-native-maps. Hay interruptor arriba para activarme y mostrarme en el mapa.

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, FlatList, ActivityIndicator, Image, Dimensions, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import app from '../firebaseConfig';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

// Colores generales para que el diseño sea uniforme
const COLOR_GENERAL = '#5d4037'; // Marrón principal
const COLOR_BOTON = '#3978f2';
const COLOR_SOMBRA = 'rgba(0,0,0,0.15)';
const COLOR_AVATAR = '#8d6e63'; // Borde de los avatares

const auth = getAuth(app);
const db = getFirestore(app);

export default function Paseo({ navigation }) {
  // Estados de la pantalla
  const [isPaseando, setIsPaseando] = useState(false); // ¿Estoy en modo paseo?
  const [cargandoEstado, setCargandoEstado] = useState(true); // ¿Sigo cargando mi estado?
  const [amigosPaseando, setAmigosPaseando] = useState([]); // Lista de amigos activos
  const [amigosDesconectados, setAmigosDesconectados] = useState([]); // Lista de amigos inactivos
  const [cargandoAmigos, setCargandoAmigos] = useState(true); // Spinner de amigos
  const [miUbicacion, setMiUbicacion] = useState(null); // Mi localización GPS
  const locationInterval = useRef(null); // Intervalo para actualizar mi ubicación cada 10s

  // Al entrar, leo de Firestore si estoy en modo paseo y mi última ubicación
  useEffect(() => {
    const cargarEstado = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsPaseando(!!data.paseando); // true/false
          if (data.ubicacion) {
            setMiUbicacion({
              latitude: data.ubicacion.latitude,
              longitude: data.ubicacion.longitude,
            });
          }
        }
      } catch (error) {
        console.log('Error cargando estado de paseo:', error);
      }
      setCargandoEstado(false);
    };
    cargarEstado();
  }, []);

  // Cuando cambio el interruptor de "paseando", pido permisos y empiezo a actualizar ubicación cada 10s
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || cargandoEstado) return;

    if (isPaseando) {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permiso denegado para la ubicación');
          return;
        }
        enviarUbicacion();
        // Actualizo mi ubicación cada 10 segundos
        locationInterval.current = setInterval(() => {
          enviarUbicacion();
        }, 10000);
      })();
    } else {
      // Si desactivo el paseo, paro el intervalo y limpio mi ubicación en Firestore
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }
      if (!cargandoEstado) {
        setDoc(
          doc(db, 'usuarios', user.uid),
          { paseando: false, ubicacion: null },
          { merge: true }
        );
      }
    }

    // Limpio el intervalo si salgo de la pantalla
    return () => {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }
    };
  }, [isPaseando, cargandoEstado]);

  // Función para pedir la localización y guardarla en Firestore
  const enviarUbicacion = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      let location = await Location.getCurrentPositionAsync({});
      setMiUbicacion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      await setDoc(
        doc(db, 'usuarios', user.uid),
        {
          paseando: true,
          ubicacion: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now()
          }
        },
        { merge: true }
      );
    } catch (error) {
      console.log('Error enviando ubicación:', error);
    }
  };

  // Cargo amigos de mi lista, y para cada uno miro si está "paseando" y su ubicación
  useEffect(() => {
    const cargarAmigos = async () => {
      setCargandoAmigos(true);
      const user = auth.currentUser;
      if (!user) {
        setAmigosPaseando([]);
        setAmigosDesconectados([]);
        setCargandoAmigos(false);
        return;
      }
      try {
        const amigosRef = collection(db, 'usuarios', user.uid, 'amigos');
        const amigosSnap = await getDocs(amigosRef);

        const amigosUIDs = amigosSnap.docs.map(doc => doc.id);

        const activos = [];
        const desconectados = [];

        // Para cada amigo consulto su documento de usuario
        for (const uid of amigosUIDs) {
          const amigoDocRef = doc(db, 'usuarios', uid);
          const amigoDocSnap = await getDoc(amigoDocRef);
          if (amigoDocSnap.exists()) {
            const data = amigoDocSnap.data();
            const amigoInfo = {
              uid: uid,
              nombre: data.nombreUsuario || 'Sin nombre',
              fotoURL: data.fotoURL || data.imagenPerfil || '',
              ubicacion: data.ubicacion,
              paseando: !!data.paseando
            };
            // Si está paseando y tiene ubicación lo meto en "activos", si no en "desconectados"
            if (amigoInfo.paseando && data.ubicacion) {
              activos.push(amigoInfo);
            } else {
              desconectados.push(amigoInfo);
            }
          }
        }
        setAmigosPaseando(activos);
        setAmigosDesconectados(desconectados);
      } catch (error) {
        console.log('Error cargando amigos:', error);
      }
      setCargandoAmigos(false);
    };

    cargarAmigos();
    // Cada minuto recargo la lista para tener datos frescos
    const refreshInterval = setInterval(cargarAmigos, 60000);

    return () => clearInterval(refreshInterval);

  }, [isPaseando]);

  // Cambiar el estado de "paseando" (activado/desactivado)
  const togglePaseando = async (value) => {
    setIsPaseando(value);
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(
        doc(db, 'usuarios', user.uid),
        { paseando: value },
        { merge: true }
      );
    } catch (error) {
      console.log('Error al guardar estado de paseo:', error);
    }
  };

  // Configuración del mapa
  const mapHeight = 320;
  const { width } = Dimensions.get('window');
  // Región inicial del mapa (mi posición o centrado en España)
  const region = miUbicacion
    ? {
        latitude: miUbicacion.latitude,
        longitude: miUbicacion.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 40.4168,      // Madrid centro como por defecto
        longitude: -3.7038,
        latitudeDelta: 4,
        longitudeDelta: 4,
      };

  // Acorta el nombre para mostrarlo en la lista
  const nombreCorto = (nombre) => {
    if (!nombre) return '';
    if (nombre.length > 10) {
      return nombre.substring(0, 10) + '…';
    }
    return nombre;
  };

  // Si mantengo pulsado el nombre, muestro el nombre completo
  const mostrarNombreCompleto = (nombre) => {
    Alert.alert('Nombre completo', nombre || '(Sin nombre)');
  };

  // Renderiza el avatar, y si está desconectado pone un overlay gris encima
  const renderAvatar = (item, gris = false) => (
    <View style={styles.avatarContainer}>
      {item.fotoURL ? (
        <>
          <Image source={{ uri: item.fotoURL }} style={styles.amigoAvatar} />
          {gris && <View style={styles.overlayGris} />}
        </>
      ) : (
        <>
          <Ionicons name="person-circle-outline" size={48} color="#ccc" style={styles.amigoAvatar} />
          {gris && <View style={styles.overlayGris} />}
        </>
      )}
    </View>
  );

  // --- UI PRINCIPAL ---
  return (
    <LinearGradient
      colors={['#f5e9da', '#ede4dc', '#fff']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Cabecera: icono paw y texto grande */}
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="paw" size={55} color={COLOR_GENERAL} style={styles.pawIcon} />
          <Text style={styles.tituloPantalla}>PASEO</Text>
        </View>

        {/* Interruptor para activarse como visible en el mapa */}
        <View style={styles.switchBar}>
          <Text style={styles.switchLabel}>
            {isPaseando ? '¡Ahora estás paseando!' : '¿Estás paseando?'}
          </Text>
          <Switch
            value={isPaseando}
            onValueChange={togglePaseando}
            trackColor={{ false: "#ccc", true: "#8ae48a" }}
            thumbColor={isPaseando ? "#0f9d58" : "#fff"}
            style={{ marginLeft: 12 }}
          />
        </View>

        {/* Mapa donde se ven mi posición y la de mis amigos */}
        <MapView
          style={{ width: width - 32, height: mapHeight, borderRadius: 18, marginBottom: 22, alignSelf: 'center' }}
          initialRegion={region}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
          loadingEnabled={true}
        >
          {/* Mi ubicación marcada en azul */}
          {miUbicacion && (
            <Marker
              coordinate={miUbicacion}
              title="¡Tú!"
              pinColor="blue"
            >
              <Ionicons name="walk" size={38} color="#2369e6" />
            </Marker>
          )}
          {/* Ubicaciones de amigos activos */}
          {amigosPaseando.map((amigo) =>
            amigo.ubicacion ? (
              <Marker
                key={amigo.uid}
                coordinate={{
                  latitude: amigo.ubicacion.latitude,
                  longitude: amigo.ubicacion.longitude,
                }}
                title={amigo.nombre}
                description="Amigo en paseo"
              >
                {amigo.fotoURL ? (
                  <Image
                    source={{ uri: amigo.fotoURL }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: "#fff",
                    }}
                  />
                ) : (
                  <Ionicons name="paw" size={36} color="#59cf59" />
                )}
              </Marker>
            ) : null
          )}
        </MapView>

        {/* Lista de amigos en paseo */}
        <Text style={styles.amigosPaseandoTitulo}>
          {amigosPaseando.length > 0
            ? 'Tus amigos en paseo:'
            : 'Ningún amigo está en paseo ahora mismo'}
        </Text>
        {cargandoAmigos ? (
          <ActivityIndicator size="large" color={COLOR_BOTON} style={{ marginTop: 20 }} />
        ) : amigosPaseando.length === 0 ? null : (
          <FlatList
            data={amigosPaseando}
            keyExtractor={(item) => item.uid}
            numColumns={4}
            renderItem={({ item }) => (
              <View style={styles.amigoItemGrid}>
                {renderAvatar(item, false)}
                <Text
                  style={styles.amigoNombre}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  onLongPress={() => mostrarNombreCompleto(item.nombre)}
                >
                  {nombreCorto(item.nombre)}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.listaAmigosGrid}
            scrollEnabled={false}
          />
        )}

        {/* Lista de amigos desconectados */}
        {amigosDesconectados.length > 0 && (
          <>
            <Text style={styles.desconectadosTitulo}>Tus amigos desconectados:</Text>
            <FlatList
              data={amigosDesconectados}
              keyExtractor={(item) => item.uid}
              numColumns={4}
              renderItem={({ item }) => (
                <View style={styles.amigoItemGrid}>
                  {renderAvatar(item, true)}
                  <Text
                    style={styles.amigoNombreDesconectado}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    onLongPress={() => mostrarNombreCompleto(item.nombre)}
                  >
                    {nombreCorto(item.nombre)}
                  </Text>
                </View>
              )}
              contentContainerStyle={styles.listaAmigosGrid}
              scrollEnabled={false}
            />
          </>
        )}

        {/* Botón volver al final igual que en otras pantallas */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  scrollContainer: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    marginTop: 10,
  },
  pawIcon: {
    marginRight: 10,
    marginTop: -2,
  },
  tituloPantalla: {
    fontSize: 50,
    fontWeight: '900',
    color: COLOR_GENERAL,
    letterSpacing: 7,
    textShadowColor: COLOR_SOMBRA,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    alignSelf: 'center',
  },
  switchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    alignSelf: 'center',
  },
  switchLabel: {
    fontSize: 19,
    color: '#2c553c',
    fontWeight: '500',
  },
  amigosPaseandoTitulo: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLOR_GENERAL,
    marginBottom: 12,
    marginTop: 12,
    alignSelf: 'center',
  },
  desconectadosTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 20,
    marginBottom: 8,
    alignSelf: 'center',
  },
  amigoItemGrid: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
    marginHorizontal: 10,
    minWidth: 70,
    maxWidth: 100,
  },
  avatarContainer: {
    position: 'relative',
    width: 54,
    height: 54,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amigoAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    resizeMode: 'cover',
  },
  overlayGris: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#bbbbbb',
    opacity: 0.55,
  },
  amigoNombre: {
    fontSize: 14,
    color: COLOR_GENERAL,
    textAlign: 'center',
    fontWeight: 'bold',
    width: 70,
    overflow: 'hidden',
  },
  amigoNombreDesconectado: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontWeight: 'bold',
    width: 70,
    overflow: 'hidden',
  },
  listaAmigosGrid: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingBottom: 20,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: COLOR_GENERAL,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 6,
    shadowColor: COLOR_SOMBRA,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 19,
    marginLeft: 10,
  },
});
