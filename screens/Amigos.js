// Pantalla Amigos: aquí gestiono la lista de amigos, puedo buscar usuarios, añadirlos y borrarlos.
// Uso Firebase Auth, Firestore y estilos sencillos. Hay comentarios en todo el archivo explicando lo que hace cada parte.

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import app from '../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';

// Defino algunos colores para que el diseño sea más fácil de mantener
const COLOR_GENERAL = '#5d4037'; // Marrón principal
const COLOR_BOTON = '#3978f2';   // Azul botones
const COLOR_SOMBRA = 'rgba(0,0,0,0.15)';
const COLOR_AVATAR = '#8d6e63';  // Marrón claro para borde avatar

export default function Amigos({ navigation }) {
  // Estados locales
  const [amigos, setAmigos] = useState([]); // Lista de mis amigos
  const [busqueda, setBusqueda] = useState(''); // Texto del buscador
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null); // Resultado de buscar usuario
  const [loading, setLoading] = useState(true); // Si estoy cargando amigos
  const [buscando, setBuscando] = useState(false); // Si estoy buscando usuario

  const auth = getAuth(app); // Autenticación Firebase
  const db = getFirestore(app); // Firestore

  // Al montar la pantalla, escucho en tiempo real la colección de amigos de este usuario
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const amigosRef = collection(db, 'usuarios', user.uid, 'amigos');
    // onSnapshot: escucha cambios en la colección y actualiza lista en tiempo real
    const unsubscribe = onSnapshot(amigosRef, (snapshot) => {
      const amigosList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAmigos(amigosList);
      setLoading(false);
    });

    // Limpio el listener cuando salgo de la pantalla
    return unsubscribe;
  }, []);

  // --- FUNCIONES DE LA PANTALLA ---

  // Buscar usuario por su nombre de usuario (nombreUsuario)
  const buscarUsuario = async () => {
    setBuscando(true);
    setResultadoBusqueda(null);
    try {
      // Busco en la colección 'usuarios' donde el campo nombreUsuario coincida
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('nombreUsuario', '==', busqueda.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // No hay usuarios con ese nombre
        setResultadoBusqueda({ notFound: true });
      } else {
        // Si hay, guardo el primero encontrado para poder añadirlo luego
        const userDoc = querySnapshot.docs[0];
        setResultadoBusqueda({
          uid: userDoc.id,
          ...userDoc.data()
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo buscar el usuario.');
    }
    setBuscando(false);
  };

  // Añadir un amigo a mi lista (se guarda en mi colección subcolección 'amigos')
  const agregarAmigo = async () => {
    const user = auth.currentUser;
    if (!user || !resultadoBusqueda) return;

    // Uso su foto de perfil si la tiene, si no el campo imagenPerfil, si no ''
    const urlFoto = resultadoBusqueda.fotoURL || resultadoBusqueda.imagenPerfil || '';

    try {
      const amigoDoc = doc(db, 'usuarios', user.uid, 'amigos', resultadoBusqueda.uid);
      await setDoc(amigoDoc, {
        nombre: resultadoBusqueda.nombreUsuario,
        uid: resultadoBusqueda.uid,
        fotoURL: urlFoto,
      });
      Alert.alert('Amigo añadido', `${resultadoBusqueda.nombreUsuario} ha sido añadido a tus amigos.`);
      setResultadoBusqueda(null);
      setBusqueda('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo añadir el amigo.');
    }
  };

  // Eliminar un amigo de mi lista
  const borrarAmigo = async (amigoId) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'usuarios', user.uid, 'amigos', amigoId));
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el amigo.');
    }
  };

  // Renderiza el avatar del amigo con sombra tipo Principal.js
  const renderAvatar = (item) => (
    <View style={styles.avatarShadow}>
      {item.fotoURL ? (
        <Image source={{ uri: item.fotoURL }} style={styles.avatar} />
      ) : (
        <Ionicons name="person-circle-outline" size={46} color="#ccc" style={styles.avatar} />
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
      {/* ScrollView para que todo se pueda mover si hay teclado */}
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Cabecera: icono pata y título */}
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="paw" size={55} color={COLOR_GENERAL} style={styles.pawIcon} />
          <Text style={styles.title}>AMIGOS</Text>
        </View>

        {/* Buscador de usuarios */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar usuario"
            value={busqueda}
            onChangeText={setBusqueda}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={styles.lupaButton} onPress={buscarUsuario} disabled={buscando || !busqueda}>
            <Ionicons name="search" size={24} color={buscando || !busqueda ? "#aaa" : COLOR_GENERAL} />
          </TouchableOpacity>
        </View>

        {/* Si he buscado, muestro el resultado */}
        {resultadoBusqueda && (
          <View style={styles.resultBox}>
            {resultadoBusqueda.notFound ? (
              <Text style={{ color: "#a00", textAlign: 'center', fontWeight: 'bold' }}>
                No se ha encontrado ningún usuario con ese nombre.
              </Text>
            ) : (
              <View style={styles.usuarioEncontrado}>
                <Ionicons name="person-circle" size={32} color={COLOR_BOTON} />
                <Text style={{ fontSize: 18, marginLeft: 12, color: COLOR_GENERAL, fontWeight: 'bold' }}>
                  {resultadoBusqueda.nombreUsuario}
                </Text>
                {/* Botón para añadir como amigo */}
                <TouchableOpacity style={styles.addButton} onPress={agregarAmigo}>
                  <Ionicons name="person-add" size={22} color="#fff" />
                  <Text style={styles.addButtonText}> Añadir</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Lista de amigos actuales */}
        {loading ? (
          // Mientras cargo, muestro el spinner
          <ActivityIndicator size="large" color={COLOR_BOTON} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={amigos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.amigoItem}>
                {renderAvatar(item)}
                <Text style={styles.amigoNombre}>{item.nombre || item.id}</Text>
                <TouchableOpacity onPress={() => borrarAmigo(item.id)} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={26} color="#d11a2a" />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.list}
            scrollEnabled={false}
          />
        )}

        {/* Botón de volver atrás */}
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
  title: {
    fontSize: 45,
    fontWeight: '900',
    color: COLOR_GENERAL,
    letterSpacing: 7,
    textShadowColor: COLOR_SOMBRA,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    alignSelf: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: COLOR_SOMBRA,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
    color: COLOR_GENERAL,
  },
  lupaButton: {
    padding: 4,
    marginLeft: 4,
  },
  resultBox: {
    backgroundColor: '#e6f2ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 14,
    shadowColor: COLOR_SOMBRA,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  usuarioEncontrado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: COLOR_BOTON,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 15,
    elevation: 2,
    shadowColor: COLOR_SOMBRA,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
  list: {
    paddingBottom: 25,
  },
  amigoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 15,
    marginBottom: 14,
    shadowColor: COLOR_SOMBRA,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 3,
  },
  amigoNombre: {
    fontSize: 18,
    color: COLOR_GENERAL,
    fontWeight: '700',
    marginLeft: 6,
    flex: 1,
  },
  deleteButton: {
    marginLeft: 'auto',
    paddingLeft: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarShadow: {
    shadowColor: COLOR_AVATAR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.44,
    shadowRadius: 8,
    elevation: 7,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLOR_AVATAR,
    width: 46,
    height: 46,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
