// Pantalla Perfil: aquí el usuario puede editar sus datos, subir una imagen de perfil y cerrar sesión.
// Uso Firestore para guardar los datos, Firebase Storage para la imagen, y un scroll para mejor experiencia.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import app from '../firebaseConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView, ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

// Colores de la pantalla
const COLOR_GENERAL = '#5d4037'; // Marrón principal
const COLOR_SOMBRA = 'rgba(0,0,0,0.15)';

const auth = getAuth(app);
const db = getFirestore(app);

export default function PerfilWrapper({ navigation }) {
  // Envuelvo el perfil en el gradiente y el handler para los gestos (para evitar errores en iOS/Android)
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#f5e9da', '#ede4dc', '#fff']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Perfil navigation={navigation} />
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

function Perfil({ navigation }) {
  // Estados de todos los campos del perfil
  const [idUsuario, setIdUsuario] = useState('');
  const [raza, setRaza] = useState('');
  const [edad, setEdad] = useState('');
  const [gustos, setGustos] = useState('');
  const [manias, setManias] = useState('');
  const [sexo, setSexo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); // Imagen seleccionada en el picker
  const [guardando, setGuardando] = useState(false);

  // Al entrar, cargo los datos de mi usuario desde Firestore
  useEffect(() => {
    const cargarDatos = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIdUsuario(data.nombreUsuario || '');
          setRaza(data.raza || '');
          setEdad(data.edad || '');
          setSelectedImage(data.imagenPerfil || null);
          setGustos(data.gustos || '');
          setManias(data.manias || '');
          setSexo(data.sexo || '');
        }
      }
      setCargando(false);
    };
    cargarDatos();
  }, []);

  // Elegir imagen de la galería (pide permiso)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permiso denegado para acceder a la galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],    // imagen cuadrada
      quality: 0.3,      // calidad media para no ocupar mucho
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri); // Guardo la uri temporal de la imagen seleccionada
    }
  };

  // Guardar todos los datos del perfil en Firestore y la imagen en Storage
  const guardarDatos = async () => {
    const user = auth.currentUser;
    if (!idUsuario.trim()) {
      Alert.alert('El ID usuario no puede estar vacío');
      return;
    }
    setGuardando(true);
    let downloadURL = selectedImage;
    try {
      // Si hay imagen seleccionada nueva (uri local), la subo a Firebase Storage
      if (selectedImage && !selectedImage.startsWith('http')) {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        const storage = getStorage(app);
        const imageRef = ref(storage, `imagenes_perfil/${user.uid}.jpg`);
        await uploadBytes(imageRef, blob);
        downloadURL = await getDownloadURL(imageRef);
      }
      // Guardo todo en el documento del usuario en Firestore (con merge para no machacar otros campos)
      await setDoc(
        doc(db, 'usuarios', user.uid),
        {
          nombreUsuario: idUsuario.trim(),
          raza: raza.trim(),
          edad: edad.trim(),
          imagenPerfil: downloadURL,
          gustos: gustos.trim(),
          manias: manias.trim(),
          sexo: sexo,
        },
        { merge: true }
      );
      Alert.alert('Perfil actualizado correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error guardando cambios');
      console.log(error);
    } finally {
      setGuardando(false);
    }
  };

  // Cerrar sesión y volver a Bienvenida
  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      navigation.replace('Bienvenida');
    } catch (error) {
      Alert.alert('Error al cerrar sesión');
      console.log(error);
    }
  };

  // Si está cargando, muestro pantalla de carga
  if (cargando)
    return (
      <View style={styles.center}>
        <Text>Cargando...</Text>
      </View>
    );

  // --- UI PRINCIPAL ---
  return (
    // Cierro el teclado al tocar fuera
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <GestureScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: 1, width: '100%' }} />

          {/* Header con icono paw y texto grande */}
          <View style={styles.headerSoloTitulo}>
            <MaterialCommunityIcons name="paw" size={55} color={COLOR_GENERAL} style={styles.pawIcon} />
            <Text style={styles.tituloPerfil}>PERFIL</Text>
          </View>

          {/* Imagen de perfil, o imagen por defecto si no hay */}
          <View style={styles.imagenPerfilContenedor}>
            <Image
              source={
                selectedImage
                  ? { uri: selectedImage }
                  : require('../assets/perfil_default.png')
              }
              style={styles.image}
            />
            {/* Botón para seleccionar imagen de galería */}
            <TouchableOpacity onPress={pickImage} style={styles.lapizSobreImagen}>
              <View style={styles.lapizCirculo}>
                <Ionicons name="pencil" size={18} color="#86736f" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Campos de texto para el perfil */}
          <View style={styles.filaInput}>
            <Text style={styles.labelInline}>ID usuario</Text>
            <TextInput
              style={styles.inputInline}
              value={idUsuario}
              onChangeText={setIdUsuario}
              placeholder="Introduce tu ID usuario"
              autoCapitalize="none"
              textAlign="right"
            />
          </View>

          <View style={styles.filaInput}>
            <Text style={styles.labelInline}>Raza</Text>
            <TextInput
              style={styles.inputInline}
              value={raza}
              onChangeText={setRaza}
              placeholder="Introduce la raza de tu perro"
              autoCapitalize="words"
              textAlign="right"
            />
          </View>

          <View style={styles.filaInput}>
            <Text style={styles.labelInline}>Sexo</Text>
            <TextInput
              style={styles.inputInline}
              value={sexo}
              onChangeText={setSexo}
              placeholder="Perro / Perra"
              autoCapitalize="words"
              textAlign="right"
            />
          </View>

          <View style={styles.filaInput}>
            <Text style={styles.labelInline}>Edad</Text>
            <TextInput
              style={styles.inputInline}
              value={edad}
              onChangeText={setEdad}
              placeholder="Introduce la edad de tu perro"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          {/* Sección de gustos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={22} color="#e11d48" style={styles.iconoCorazon} />
              <Text style={styles.sectionTitle}>Gustos y preferencias</Text>
            </View>
            <TextInput
              style={styles.textArea}
              value={gustos}
              onChangeText={setGustos}
              placeholder="¿Qué le gusta a tu perro? (jugar, correr, agua...)"
              multiline
            />
          </View>

          {/* Sección de manías */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-dislike" size={22} color="#6b7280" style={styles.iconoCorazon} />
              <Text style={styles.sectionTitle}>Manías y cosas que no le gustan</Text>
            </View>
            <TextInput
              style={styles.textArea}
              value={manias}
              onChangeText={setManias}
              placeholder="¿Qué NO le gusta o le da miedo? (ruidos, otros perros, bici...)"
              multiline
            />
          </View>

          {/* Botones de guardar, volver y cerrar sesión */}
          <View style={styles.botonesContenedor}>
            {/* Botón Volver */}
            <TouchableOpacity
              style={[styles.botonesCuadrados, { backgroundColor: '#8d6e63' }]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-undo-outline" size={50} color="white" />
            </TouchableOpacity>
            {/* Botón Guardar */}
            <TouchableOpacity
              style={[styles.botonesCuadrados, { backgroundColor: '#8d6e63' }]}
              onPress={guardarDatos}
              disabled={guardando}
              activeOpacity={0.7}
            >
              <Ionicons name="checkbox" size={36} color="white" />
            </TouchableOpacity>
            {/* Botón Cerrar sesión */}
            <TouchableOpacity
              style={[styles.botonesCuadrados, { backgroundColor: '#8d6e63' }]}
              onPress={cerrarSesion}
              activeOpacity={0.7}
            >
              <Ionicons name="power" size={36} color="white" />
            </TouchableOpacity>
          </View>
        </GestureScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    paddingTop: 60,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  headerSoloTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    marginTop: 10,
    width: '100%',
  },
  pawIcon: {
    marginRight: 10,
    marginTop: -2,
  },
  tituloPerfil: {
    fontSize: 45,
    fontWeight: '900',
    color: COLOR_GENERAL,
    letterSpacing: 7,
    textShadowColor: COLOR_SOMBRA,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    alignSelf: 'center',
  },
  imagenPerfilContenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    marginTop: 2,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  lapizSobreImagen: {
    position: 'absolute',
    bottom: 18,
    right: 80,
  },
  lapizCirculo: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  filaInput: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    marginTop: 5,
  },
  labelInline: {
    fontSize: 18,
    marginRight: 10,
    color: '#222',
    width: 110,
    fontWeight: 'bold',
  },
  inputInline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
    textAlign: 'right',
  },
  section: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#444',
  },
  iconoCorazon: {
    marginRight: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f7f7f7',
    minHeight: 50,
    textAlignVertical: 'top',
  },
  botonesContenedor: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  botonesCuadrados: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
