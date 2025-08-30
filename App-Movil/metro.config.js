const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver para manejar dependencias específicas de plataforma
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configurar alias para resolver componentes específicos de web
config.resolver.alias = {
  'react-native-maps': require.resolve('./components/MapView.web.tsx'),
};

// Configurar extensiones de archivo
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.tsx', 'web.ts', 'web.js'];

module.exports = config;