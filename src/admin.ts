import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword, inMemoryPersistence, initializeAuth, signOut, updateProfile,
} from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
import { getDatabase, getFirebaseApp, getSessionAuth } from '@/firebase';
import { useAuth } from '@/sessao';
import { authErrorMessage } from '@/validacoes';
import {
  ehAdminInicial, lerPontoAdmin, lerUsuario, type DadosPonto, type FormularioUsuario, type PontoAdmin, type StatusUsuario, type UsuarioCadastrado,
} from '@/admin-validacoes';

export function useAdmin() {
  const { user } = useAuth();
  const inicial = ehAdminInicial(user?.email);
  const [resultado, setResultado] = useState<{ uid: string; admin: boolean } | null>(null);

  useEffect(() => {
    if (!user || inicial) return;
    const uid = user.uid;
    return onSnapshot(doc(getDatabase(), 'admins', uid),
      snapshot => setResultado({ uid, admin: snapshot.exists() }),
      () => setResultado({ uid, admin: false }));
  }, [user, inicial]);

  if (!user) return { admin: false, verificando: false };
  if (inicial) return { admin: true, verificando: false };
  const atual = resultado?.uid === user.uid ? resultado : null;
  return { admin: atual?.admin === true, verificando: !atual };
}

export function useSincronizarUsuario() {
  const { user } = useAuth();
  const nome = (user?.displayName ?? '').trim().slice(0, 80);
  const email = user?.email ?? '';

  useEffect(() => {
    if (!user || !email) return;
    const referencia = doc(getDatabase(), 'usuarios', user.uid);
    let criando = false;
    return onSnapshot(referencia, snapshot => {
      if (!snapshot.exists()) {
        if (criando) return;
        criando = true;
        void setDoc(referencia, { nome, email, status: 'ativo', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
          .catch(() => { criando = false; });
        return;
      }
      const dados = snapshot.data();
      if (dados.status === 'bloqueado') {
        avisar('Conta bloqueada', 'Sua conta foi bloqueada por um administrador do Meu Ponto.');
        void signOut(getSessionAuth());
        return;
      }
      if ((nome && dados.nome !== nome) || dados.email !== email) {
        void updateDoc(referencia, { nome: nome || dados.nome, email, updatedAt: serverTimestamp() }).catch(() => undefined);
      }
    }, () => undefined);
  }, [user, nome, email]);
}

export type UsuarioAdmin = UsuarioCadastrado & { admin: boolean; adminInicial: boolean };

export function observarUsuarios(aoAtualizar: (usuarios: UsuarioAdmin[]) => void, aoErro: (erro: Error) => void) {
  let usuarios: UsuarioCadastrado[] | null = null;
  let admins: Set<string> | null = null;
  const emitir = () => {
    if (!usuarios || !admins) return;
    const concedidos = admins;
    aoAtualizar(usuarios
      .map(usuario => ({ ...usuario, admin: concedidos.has(usuario.uid) || ehAdminInicial(usuario.email), adminInicial: ehAdminInicial(usuario.email) }))
      .sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email, 'pt-BR')));
  };
  const falha = () => aoErro(new Error('Não foi possível carregar os usuários. Confira se as regras foram publicadas.'));
  const pararUsuarios = onSnapshot(collection(getDatabase(), 'usuarios'), snapshot => {
    usuarios = snapshot.docs.map(item => lerUsuario(item.id, item.data()));
    emitir();
  }, falha);
  const pararAdmins = onSnapshot(collection(getDatabase(), 'admins'), snapshot => {
    admins = new Set(snapshot.docs.map(item => item.id));
    emitir();
  }, falha);
  return () => { pararUsuarios(); pararAdmins(); };
}

export async function criarUsuario(dados: FormularioUsuario): Promise<UsuarioCadastrado> {
  const secundario = initializeApp(getFirebaseApp().options, `cadastro-admin-${Date.now()}`);
  try {
    const auth = initializeAuth(secundario, { persistence: inMemoryPersistence });
    const { user } = await createUserWithEmailAndPassword(auth, dados.email.trim(), dados.senha);
    const nome = dados.nome.trim();
    const email = user.email ?? dados.email.trim();
    await updateProfile(user, { displayName: nome });
    // Gravado como o próprio novo usuário, como no cadastro normal.
    await setDoc(doc(getFirestore(secundario), 'usuarios', user.uid),
      { nome, email, status: 'ativo', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await signOut(auth);
    return { uid: user.uid, nome, email, status: 'ativo' };
  } finally {
    await deleteApp(secundario).catch(() => undefined);
  }
}

export async function definirAdmin(usuario: UsuarioAdmin, admin: boolean) {
  const referencia = doc(getDatabase(), 'admins', usuario.uid);
  if (!admin) { await deleteDoc(referencia); return; }
  const concedidoPor = getSessionAuth().currentUser?.uid;
  if (!concedidoPor) throw new Error('Entre novamente para continuar.');
  await setDoc(referencia, { email: usuario.email, concedidoPor, createdAt: serverTimestamp() });
}

export async function alterarStatusUsuario(uid: string, status: StatusUsuario) {
  await updateDoc(doc(getDatabase(), 'usuarios', uid), { status, updatedAt: serverTimestamp() });
}

export function mensagemErroAdmin(erro: unknown): string {
  const { code = '', message = '' } = (erro ?? {}) as { code?: string; message?: string };
  if (code.startsWith('auth/')) return authErrorMessage(erro);
  const tipo = code.replace(/^firestore\//, '');
  if (tipo === 'permission-denied') return 'Acesso negado. Confira se as regras foram publicadas e se você continua admin.';
  if (tipo === 'unavailable') return 'Sem conexão. Verifique sua internet e tente novamente.';
  if (!code && message) return message; // Erros do próprio app, ex.: "Já existe uma tag com esse nome."
  return 'Não foi possível concluir. Tente novamente.';
}

export function observarTodosPontos(aoAtualizar: (pontos: PontoAdmin[]) => void, aoErro: (erro: Error) => void) {
  return onSnapshot(collection(getDatabase(), 'stops'), snapshot => {
    aoAtualizar(snapshot.docs.map(item => lerPontoAdmin(item.id, item.data()))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
  }, () => aoErro(new Error('Não foi possível carregar os pontos. Confira se as regras foram publicadas.')));
}

export async function buscarPonto(id: string): Promise<PontoAdmin | null> {
  const resultado = await getDoc(doc(getDatabase(), 'stops', id));
  return resultado.exists() ? lerPontoAdmin(resultado.id, resultado.data()) : null;
}

export async function salvarPonto(id: string | null, dados: DadosPonto) {
  if (id) {
    await updateDoc(doc(getDatabase(), 'stops', id), { ...dados, updatedAt: serverTimestamp() });
    return id;
  }
  const novo = await addDoc(collection(getDatabase(), 'stops'), { ...dados, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return novo.id;
}

export function confirmar(titulo: string, mensagem: string, acao = 'Confirmar'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${titulo}\n\n${mensagem}`) ?? false);
  return new Promise(resolve => Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
    { text: acao, style: 'destructive', onPress: () => resolve(true) },
  ], { cancelable: true, onDismiss: () => resolve(false) }));
}

function avisar(titulo: string, mensagem: string) {
  if (Platform.OS === 'web') globalThis.alert?.(`${titulo}\n\n${mensagem}`);
  else Alert.alert(titulo, mensagem);
}
