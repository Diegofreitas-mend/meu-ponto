// Configuração e acesso aos serviços Firebase usados pelo aplicativo.
// Os valores do projeto são lidos do .env.local; não coloque senhas aqui.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Auth, Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

export function getFirebaseApp() {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
  if (required.some(key => !config[key]?.trim())) {
    throw new Error('Configure o Firebase no arquivo .env.local. Veja o guia docs/firebase.md.');
  }
  // Evita criar duas conexões quando o Expo recarrega o código.
  return getApps().length ? getApp() : initializeApp(config);
}

// Firestore: banco onde ficam os pontos publicados.
export function getDatabase() {
  return getFirestore(getFirebaseApp());
}

let sessionAuth: Auth | undefined;

// Authentication: login, cadastro e sessão do usuário.
export function getSessionAuth() {
  if (sessionAuth) return sessionAuth;
  const app = getFirebaseApp();

  if (Platform.OS === 'web') {
    // O Firebase mantém a sessão no armazenamento do navegador.
    sessionAuth = FirebaseAuth.getAuth(app);
  } else {
    // No Android/iOS o SDK usa AsyncStorage para restaurar a sessão.
    // Essa função existe na versão nativa do SDK; os tipos também atendem à web.
    const nativeAuth = FirebaseAuth as typeof FirebaseAuth & {
      getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
    };
    try {
      sessionAuth = FirebaseAuth.initializeAuth(app, {
        persistence: nativeAuth.getReactNativePersistence(AsyncStorage),
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/already-initialized') {
        sessionAuth = FirebaseAuth.getAuth(app);
      } else { throw error; }
    }
  }
  return sessionAuth;
}
