// Gestão de usuários pelo Firestore (plano gratuito): coleções usuarios e admins.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  alterarStatusUsuario, confirmar, criarUsuario, definirAdmin, mensagemErroAdmin, observarUsuarios, type UsuarioAdmin,
} from '@/admin';
import { validarUsuario, type FormularioUsuario } from '@/admin-validacoes';
import { useAuth } from '@/sessao';
import { adminStyles as styles } from '@/styles';
import { colors } from '@/tema';

const formularioVazio: FormularioUsuario = { nome: '', email: '', senha: '' };

export default function AdminUsuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [formulario, setFormulario] = useState(formularioVazio);

  // 1. Lista atualizada em tempo real.
  useEffect(() => observarUsuarios(lista => { setUsuarios(lista); setErro(null); }, falha => setErro(falha.message)), []);

  // 2. Ações sobre um usuário. As regras recusam alterar a si mesmo, admins iniciais e bloquear admins.
  async function executar(usuario: UsuarioAdmin, acao: 'admin' | 'status') {
    const bloqueado = usuario.status === 'bloqueado';
    const titulo = acao === 'admin'
      ? usuario.admin ? 'Remover acesso de admin?' : 'Tornar admin?'
      : bloqueado ? 'Desbloquear conta?' : 'Bloquear conta?';
    const detalhe = acao === 'admin'
      ? 'A mudança vale imediatamente.'
      : bloqueado ? 'A pessoa poderá usar o app novamente.' : 'A pessoa será desconectada e não poderá avaliar pontos.';
    if (!(await confirmar(titulo, `${usuario.email}\n${detalhe}`))) return;
    setOcupado(usuario.uid);
    setErro(null);
    setAviso(null);
    try {
      if (acao === 'admin') await definirAdmin(usuario, !usuario.admin);
      else await alterarStatusUsuario(usuario.uid, bloqueado ? 'ativo' : 'bloqueado');
      setAviso('Alteração salva.');
    } catch (causa) { setErro(mensagemErroAdmin(causa)); }
    finally { setOcupado(null); }
  }

  // 3. Nova conta com senha temporária. A pessoa troca em "Esqueci a senha".
  async function cadastrar() {
    const validacao = validarUsuario(formulario);
    if (validacao) { setErro(validacao); return; }
    setOcupado('novo');
    setErro(null);
    setAviso(null);
    try {
      const usuario = await criarUsuario(formulario);
      setFormulario(formularioVazio);
      setAviso(`Conta criada para ${usuario.email}. Envie a senha temporária à pessoa por um canal seguro.`);
    } catch (causa) { setErro(mensagemErroAdmin(causa)); }
    finally { setOcupado(null); }
  }

  const termo = busca.trim().toLowerCase();
  const visiveis = (usuarios ?? []).filter(item => !termo || `${item.nome} ${item.email}`.toLowerCase().includes(termo));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {erro && <Text accessibilityRole="alert" style={styles.error}>{erro}</Text>}
      {aviso && <Text accessibilityRole="alert" style={styles.success}>{aviso}</Text>}

      <Text style={styles.section}>Nova conta</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={formulario.nome} onChangeText={nome => setFormulario(f => ({ ...f, nome }))}
          maxLength={80} autoCapitalize="words" accessibilityLabel="Nome" editable={ocupado !== 'novo'} />
        <Text style={styles.label}>E-mail</Text>
        <TextInput style={styles.input} value={formulario.email} onChangeText={email => setFormulario(f => ({ ...f, email }))}
          maxLength={254} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" accessibilityLabel="E-mail" editable={ocupado !== 'novo'} />
        <Text style={styles.label}>Senha temporária</Text>
        <TextInput style={styles.input} value={formulario.senha} onChangeText={senha => setFormulario(f => ({ ...f, senha }))}
          maxLength={128} autoCapitalize="none" autoCorrect={false} secureTextEntry accessibilityLabel="Senha temporária" editable={ocupado !== 'novo'} />
        <Text style={styles.hint}>Mínimo de 8 caracteres. A pessoa pode trocá-la em “Esqueci a senha”.</Text>
        <Pressable accessibilityRole="button" disabled={!!ocupado} onPress={() => void cadastrar()} style={[styles.button, !!ocupado && styles.disabled]}>
          {ocupado === 'novo' ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.buttonText}>Criar conta</Text>}
        </Pressable>
      </View>

      <Text style={styles.section}>Contas</Text>
      <Text style={styles.hint}>Aparecem aqui as contas que entraram no app a partir desta versão e as criadas pelo painel.</Text>
      <TextInput style={styles.input} value={busca} onChangeText={setBusca} placeholder="Buscar por nome ou e-mail"
        placeholderTextColor={colors.textSecondary} autoCapitalize="none" accessibilityLabel="Buscar usuário" />

      {!usuarios && !erro && <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando usuários" />}
      {usuarios && !visiveis.length && <Text style={styles.subtitle}>Nenhum usuário encontrado.</Text>}
      {visiveis.map(usuario => {
        const proprio = usuario.uid === user?.uid;
        const bloqueado = usuario.status === 'bloqueado';
        return (
          <View key={usuario.uid} style={styles.card}>
            <Text style={styles.cardTitle}>{usuario.nome || 'Sem nome'}{proprio ? ' (você)' : ''}</Text>
            <Text style={styles.cardText}>{usuario.email}</Text>
            <View style={styles.row}>
              {usuario.adminInicial && <View style={[styles.badge, styles.badgeSuccess]}><Text style={styles.badgeText}>Admin inicial</Text></View>}
              {usuario.admin && !usuario.adminInicial && <View style={[styles.badge, styles.badgeSuccess]}><Text style={styles.badgeText}>Admin</Text></View>}
              {bloqueado && <View style={[styles.badge, styles.badgeDanger]}><Text style={styles.badgeText}>Bloqueado</Text></View>}
            </View>
            {proprio || usuario.adminInicial
              ? <Text style={styles.hint}>{proprio ? 'Você não pode alterar o próprio acesso.' : 'Admins iniciais são definidos nas regras do Firestore.'}</Text>
              : <View style={styles.row}>
                {ocupado === usuario.uid ? <ActivityIndicator color={colors.primary} /> : <>
                  {!bloqueado && (
                    <Pressable accessibilityRole="button" disabled={!!ocupado} onPress={() => void executar(usuario, 'admin')} style={[styles.secondary, !!ocupado && styles.disabled]}>
                      <Text style={styles.secondaryText}>{usuario.admin ? 'Remover admin' : 'Tornar admin'}</Text>
                    </Pressable>
                  )}
                  {!usuario.admin && (
                    <Pressable accessibilityRole="button" disabled={!!ocupado} onPress={() => void executar(usuario, 'status')}
                      style={[bloqueado ? styles.secondary : styles.danger, !!ocupado && styles.disabled]}>
                      <Text style={bloqueado ? styles.secondaryText : styles.dangerText}>{bloqueado ? 'Desbloquear' : 'Bloquear'}</Text>
                    </Pressable>
                  )}
                </>}
              </View>}
            {usuario.admin && !usuario.adminInicial && !proprio && <Text style={styles.hint}>Para bloquear, remova o acesso de admin antes.</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}
