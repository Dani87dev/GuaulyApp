// metro.config.js - Configuración de Metro Bundler para Expo.
// Aquí hago algunos ajustes para que Expo y Firebase funcionen bien, sobre todo en la versión web.

const { getDefaultConfig } = require('expo/metro-config');

// Consigo la configuración por defecto de Expo
const defaultConfig = getDefaultConfig(__dirname);

// Si uso archivos CommonJS (*.cjs) los añado a las extensiones permitidas
defaultConfig.resolver.sourceExts.push('cjs');

// DESACTIVO los “package exports” de los paquetes.
// Esto es imprescindible para evitar que Metro intente cargar la versión web de Firebase, que suele dar problemas.
// Sin esta línea, Expo puede petar al importar Firebase en proyectos que usan react-native-web.
defaultConfig.resolver.unstable_enablePackageExports = false;

// Exporto la configuración modificada para que la use Metro
module.exports = defaultConfig;
