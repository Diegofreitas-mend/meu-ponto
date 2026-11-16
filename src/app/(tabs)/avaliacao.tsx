
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { enviarAvaliacao, verificarAvaliacao } from "@/avaliacoes";
import { avaliacaoStyles as estilos } from "@/styles";
import { useStops } from "@/pontos";
import { useAuth } from "@/sessao";
import { Brand } from "@/tema";

type PropsFormulario = {
  pontoId: string;
};

const tagsPositivas = [
  "Limpo",
  "Bem iluminado",
  "Possui cobertura",
  "Acessível",
  "Bem conservado",
  "Seguro",
];

const tagsProblemas = [
  "Sujo",
  "Sem iluminação",
  "Sem cobertura",
  "Falta de acessibilidade",
  "Estrutura danificada",
  "Insegurança",
  "Assento danificado",
  "Sinalização ruim",
];

const limiteTags = 5;

function FormularioAvaliacao({ pontoId }: PropsFormulario) {
  const { user } = useAuth();
  const { stops, loading, error, reload } = useStops("");
  const ponto = stops.find((item) => item.id === pontoId);

  const [nota, setNota] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [descricao, setDescricao] = useState("");
  const [verificacao, setVerificacao] = useState<{
    chave: string;
    existe: boolean;
    erro: string | null;
  } | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const usuarioId = user?.uid;
  const chave = JSON.stringify([pontoId, usuarioId, tentativa]);
  const atual = verificacao?.chave === chave ? verificacao : null;
  const verificando = !!usuarioId && !atual;
  const jaAvaliou = atual?.existe ?? false;
  const erroVerificacao = usuarioId
    ? atual?.erro
    : "É necessário entrar na conta para avaliar este ponto.";

  useEffect(() => {
    let ativo = true;

    if (!usuarioId) return;

    verificarAvaliacao(pontoId, usuarioId)
      .then((existe) => {
        if (ativo) setVerificacao({ chave, existe, erro: null });
      })
      .catch(() => {
        if (ativo) {
          setVerificacao({
            chave,
            existe: false,
            erro: "Não foi possível verificar se você já avaliou este ponto.",
          });
        }
      });

    return () => {
      ativo = false;
    };
  }, [pontoId, usuarioId, chave]);

  function alternarTag(tag: string) {
    if (enviando) return;

    setTags((anteriores) => {
      if (anteriores.includes(tag)) {
        return anteriores.filter((item) => item !== tag);
      }

      if (anteriores.length >= limiteTags) {
        return anteriores;
      }

      return [...anteriores, tag];
    });

    setMensagem(null);
  }

  function renderizarTags(opcoes: string[]) {
    return (
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 10,
          marginBottom: 14,
        }}
      >
        {opcoes.map((tag) => {
          const selecionada = tags.includes(tag);
          const desabilitada =
            enviando || (!selecionada && tags.length >= limiteTags);

          return (
            <Pressable
              key={tag}
              onPress={() => alternarTag(tag)}
              disabled={desabilitada}
              accessibilityRole="checkbox"
              accessibilityLabel={tag}
              accessibilityState={{
                checked: selecionada,
                disabled: desabilitada,
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                borderWidth: 1,
                borderColor: selecionada
                  ? Brand.themes.light.primary
                  : "#CBD5E1",
                backgroundColor: selecionada
                  ? "#E8F1FF"
                  : "#FFFFFF",
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 20,
                opacity: desabilitada ? 0.45 : 1,
              }}
            >
              {selecionada && (
                <Ionicons
                  name="checkmark"
                  size={15}
                  color={Brand.themes.light.primary}
                />
              )}
              <Text
                style={{
                  color: selecionada
                    ? Brand.themes.light.primary
                    : "#334155",
                  fontSize: 13,
                  fontWeight: selecionada ? "600" : "400",
                }}
              >
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  async function enviar() {
    if (
      !user ||
      !ponto ||
      enviando ||
      verificando ||
      erroVerificacao ||
      jaAvaliou ||
      enviado
    ) {
      return;
    }

    if (nota < 1 || nota > 5) {
      setMensagem("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    if (tags.length > limiteTags) {
      setMensagem("Selecione no máximo 5 tags.");
      return;
    }

    setMensagem(null);
    setEnviando(true);

    try {
      const existe = await verificarAvaliacao(pontoId, user.uid);

      if (existe) {
        setVerificacao({ chave, existe: true, erro: null });
        return;
      }

      await enviarAvaliacao({
        pontoId,
        usuarioId: user.uid,
        nota,
        tags,
        descricao: descricao.trim(),
      });

      setEnviado(true);
    } catch {
      setMensagem(
        "Não foi possível enviar a avaliação. Verifique sua conexão e as regras do Firebase.",
      );
    } finally {
      setEnviando(false);
    }
  }

  function estado(
    mensagemEstado: string,
    nomeIcone: "checkmark-circle-outline" | "information-circle-outline",
  ) {
    return (
      <View style={estilos.estadoCentral}>
        <View style={estilos.cartaoEstado}>
          <Ionicons
            name={nomeIcone}
            size={48}
            color={Brand.themes.light.primary}
          />
          <Text style={estilos.mensagem}>{mensagemEstado}</Text>
          <Pressable
            style={estilos.botaoVoltar}
            onPress={() => router.navigate("/inicio")}
            accessibilityRole="button"
          >
            <Text style={estilos.textoVoltar}>Voltar aos pontos</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (enviado) {
    return (
      <SafeAreaView style={estilos.areaSegura}>
        {estado("Avaliação enviada com sucesso!", "checkmark-circle-outline")}
      </SafeAreaView>
    );
  }

  if (jaAvaliou) {
    return (
      <SafeAreaView style={estilos.areaSegura}>
        {estado("Você já avaliou este ponto.", "information-circle-outline")}
      </SafeAreaView>
    );
  }

  const bloqueado =
    loading ||
    verificando ||
    enviando ||
    !!erroVerificacao ||
    !!error ||
    !ponto ||
    !user ||
    nota === 0;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={estilos.areaSegura}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={estilos.containerGeral}
      >
        <Text style={estilos.tituloCabecalho}>Adicionar avaliação</Text>

        <Text style={estilos.subtitulo}>
          Conte como foi sua experiência neste ponto de ônibus.
        </Text>

        {loading ? (
          <ActivityIndicator
            color={Brand.themes.light.primary}
            accessibilityLabel="Carregando ponto"
          />
        ) : error ? (
          <View>
            <Text style={estilos.aviso}>{error}</Text>
            <Pressable
              style={estilos.botaoVoltar}
              onPress={reload}
              accessibilityRole="button"
            >
              <Text style={estilos.textoVoltar}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : !ponto ? (
          <View>
            <Text style={estilos.aviso}>
              Este ponto não foi encontrado ou não está publicado.
            </Text>
            <Pressable
              style={estilos.botaoVoltar}
              onPress={() => router.navigate("/inicio")}
              accessibilityRole="button"
            >
              <Text style={estilos.textoVoltar}>Escolher outro ponto</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={estilos.cartaoPonto}>
              <Text style={estilos.rotuloPonto}>Ponto selecionado</Text>
              <Text style={estilos.nomePonto}>{ponto.name}</Text>
              <Text style={estilos.enderecoPonto}>
                {ponto.address} · {ponto.city}
              </Text>
            </View>

            <Text style={estilos.tituloCampo}>
              Qual nota você dá para este ponto?
            </Text>

            <View style={estilos.containerEstrelas}>
              {[1, 2, 3, 4, 5].map((valor) => (
                <Pressable
                  key={valor}
                  style={estilos.botaoEstrela}
                  onPress={() => setNota(valor)}
                  accessibilityRole="button"
                  accessibilityLabel={`Avaliar com ${valor} de 5 estrelas`}
                  accessibilityState={{ selected: nota === valor }}
                  disabled={enviando}
                >
                  <Ionicons
                    name={valor <= nota ? "star" : "star-outline"}
                    size={32}
                    color={valor <= nota ? "#F5B301" : "#94A3B8"}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={estilos.textoNota}>
              {nota
                ? `${nota} de 5 estrelas`
                : "Toque nas estrelas para avaliar"}
            </Text>

            <Text style={estilos.tituloCampo}>Tags (opcional)</Text>
            <Text style={estilos.ajudaCampo}>
              Selecione até 5 características deste ponto.
            </Text>

            <Text style={estilos.tituloCampo}>Pontos positivos</Text>
            {renderizarTags(tagsPositivas)}

            <Text style={estilos.tituloCampo}>Problemas encontrados</Text>
            {renderizarTags(tagsProblemas)}

            <Text style={estilos.ajudaCampo}>
              {tags.length}/{limiteTags} tags selecionadas
            </Text>

            <Text style={estilos.tituloCampo}>
              Descrição da avaliação (opcional)
            </Text>

            <TextInput
              style={[estilos.campoDeTexto, estilos.areaDeTexto]}
              placeholder="O que você achou deste ponto?"
              placeholderTextColor={Brand.themes.light.textSecondary}
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
              editable={!enviando}
              accessibilityLabel="Descrição da avaliação"
            />

            <Text style={estilos.ajudaCampo}>
              {descricao.length}/500 caracteres
            </Text>

            {verificando && (
              <ActivityIndicator
                color={Brand.themes.light.primary}
                accessibilityLabel="Verificando avaliação"
              />
            )}

            {erroVerificacao && (
              <View>
                <Text style={estilos.aviso}>{erroVerificacao}</Text>
                <Pressable
                  style={estilos.botaoVoltar}
                  onPress={() => setTentativa((valor) => valor + 1)}
                  accessibilityRole="button"
                >
                  <Text style={estilos.textoVoltar}>Tentar novamente</Text>
                </Pressable>
              </View>
            )}

            {mensagem && (
              <Text style={estilos.aviso} accessibilityRole="alert">
                {mensagem}
              </Text>
            )}

            <Pressable
              style={[
                estilos.botaoEnviar,
                bloqueado && estilos.botaoDesabilitado,
              ]}
              onPress={enviar}
              disabled={bloqueado}
              accessibilityRole="button"
              accessibilityState={{ disabled: bloqueado }}
            >
              {enviando ? (
                <ActivityIndicator color={Brand.themes.light.onDisabled} />
              ) : (
                <Text
                  style={[
                    estilos.textoBotaoEnviar,
                    bloqueado && estilos.textoBotaoDesabilitado,
                  ]}
                >
                  Enviar avaliação
                </Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AvaliacaoScreen() {
  const { pontoId } = useLocalSearchParams<{ pontoId?: string }>();

  if (!pontoId) {
    return (
      <SafeAreaView style={estilos.areaSegura}>
        <View style={estilos.estadoCentral}>
          <View style={estilos.cartaoEstado}>
            <Ionicons
              name="bus-outline"
              size={48}
              color={Brand.themes.light.primary}
            />
            <Text style={estilos.mensagem}>
              Escolha primeiro um ponto na tela inicial para adicionar sua
              avaliação.
            </Text>
            <Pressable
              style={estilos.botaoVoltar}
              onPress={() => router.navigate("/inicio")}
              accessibilityRole="button"
            >
              <Text style={estilos.textoVoltar}>Encontrar um ponto</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return <FormularioAvaliacao key={pontoId} pontoId={pontoId} />;
}
