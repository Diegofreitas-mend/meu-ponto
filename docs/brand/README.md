# Meu Ponto · Identidade visual

Versão 1.0 · Novembro de 2026

Referência oficial para design, desenvolvimento e comunicação do Meu Ponto. A identidade parte da logo fornecida; o símbolo e o lettering originais foram preservados.

## Arquivos e fonte de verdade

- [Painel visual](./index.html): abra no navegador; inclui aplicações e exemplo de tela.
- [Logo original](../../assets/brand/meu-ponto-logo.png): PNG transparente, 253 × 94 px.
- [Tokens de implementação](../../src/tema.ts): cores semânticas, temas, tipografia e medidas.

Os tokens estão prontos para adoção pelos componentes. Esta entrega não substitui as telas atuais nem altera o tema de execução do app. Alterações futuras devem atualizar tokens e guia na mesma revisão.

## Essência

**Informação trazendo conforto.** Um serviço de mobilidade próximo das pessoas, claro e confiável. O pin comunica localização; o ônibus identifica o transporte; o círculo amarelo destaca o ponto de encontro.

Princípios: orientação antes de decoração; informação legível em movimento; linguagem acolhedora; acessibilidade como parte da composição. Evite aparências de jogo, excesso de gradientes e telas saturadas com as três cores ao mesmo tempo.

## Paleta

| Cor | Hex | Papel |
| --- | --- | --- |
| Verde Ponto | `#16A34A` | Assinatura, símbolo e elementos de marca |
| Azul Caminho | `#2563EB` | Ação principal, links e seleção |
| Amarelo Encontro | `#FACC15` | Destaques pontuais e avaliação |
| Tinta | `#14251D` | Texto principal sobre superfícies claras |
| Texto secundário | `#52645A` | Descrições e metadados |
| Névoa | `#F5F8F6` | Fundo geral claro |
| Branco | `#FFFFFF` | Cards e conteúdo |

Proporção sugerida: 80% superfícies neutras, 15% verde/azul e até 5% amarelo. Não é uma regra de contagem de pixels, mas uma orientação para hierarquia.

### Combinações de leitura

- Botão principal: branco sobre azul; não usar branco sobre o verde ou amarelo originais em textos pequenos.
- Amarelo: usar texto Tinta; jamais branco.
- Verde para texto de sucesso: usar `#166534` sobre `#DCFCE7` ou branco.
- Erro: `#B91C1C` sobre `#FEE2E2`, sempre acompanhado de mensagem e ícone.
- Modo escuro: usar `Brand.themes.dark`; não inverter cores automaticamente.
- Cor não deve ser o único sinal de estado: combine texto, ícone, borda e seleção identificável.

## Logo

A versão fornecida tem lettering branco e deve aparecer sobre fundo escuro uniforme, preferencialmente Tinta. O PNG tem transparência: fundo branco torna o nome ilegível.

- Preserve a proporção 253:94 e toda a área visível; use ajuste `contain`.
- Margem livre mínima: 1/4 da altura da logo em todos os lados.
- Largura recomendada com slogan: 240–253 px lógicos. Não usar o slogan em tamanhos em que ele fique ilegível.
- O original é pequeno: não ampliar para impressão, banners ou imagens de alta densidade. Solicitar o arquivo vetorial da marca antes desses usos.
- Para cabeçalhos compactos, usar o nome “Meu Ponto” em texto de interface. Uma versão oficial sem slogan e um símbolo isolado ainda precisam de matriz vetorial aprovada.
- Não esticar, rotacionar, redesenhar o ônibus, adicionar sombra, alterar as cores ou colocar sobre fotos movimentadas.
- Não usar este PNG horizontal diretamente como ícone de app, favicon ou splash. Esses usos precisam de exportações específicas a partir da matriz vetorial.

## Tipografia

O lettering da logo é um ativo próprio e não deve ser recomposto com outra fonte.

Para a interface, utilizar a fonte nativa do sistema: SF no iOS, Roboto no Android e `system-ui` na web. Isso mantém carregamento rápido e boa cobertura de caracteres sem novas dependências. A semelhança vem da hierarquia, do peso e do espaçamento, não de imitar o logotipo.

| Estilo | Tamanho / entrelinha | Peso | Aplicação |
| --- | --- | --- | --- |
| Display | 32 / 40 | 700 | Abertura de fluxo |
| Título | 24 / 32 | 700 | Título da tela |
| Subtítulo | 20 / 28 | 600 | Seções e cards principais |
| Corpo | 16 / 24 | 400 | Conteúdo e campos |
| Rótulo | 14 / 20 | 600 | Botões e identificação |
| Legenda | 12 / 16 | 400 | Metadados não essenciais |

As medidas são unidades lógicas; na web, px. Informações essenciais devem usar pelo menos o estilo Corpo. Suportar ampliação de texto, quebra de linha e conteúdo longo. Não fixar a altura de cards que contêm texto.

## Layout e componentes

Base de espaçamento: 4. Escala: 4, 8, 12, 16, 24, 32 e 48. Margens laterais de tela: 24; usar 16 em telas muito estreitas. Espaço entre seções: 32. Cards usam preenchimento de 16–24.

- **Botão principal:** azul, texto branco, altura mínima 48, raio 12, peso 600. Uma ação principal por área de decisão. Em carregamento, manter largura, mostrar progresso e impedir envio duplicado.
- **Botão secundário:** superfície neutra, contorno visível e texto azul. Ação destrutiva usa vermelho e texto explícito.
- **Campos:** rótulo permanente acima, altura mínima 48, raio 12 e contorno. Placeholder é exemplo, não substitui rótulo. Erro abaixo do campo com instrução de correção.
- **Cards:** superfície branca, raio 20, borda discreta. Evitar sombra pesada. Conteúdo tocável precisa de feedback e nome acessível.
- **Chips:** raio 999, ícone opcional e texto. Estado selecionado combina fundo, contorno e indicação programática.
- **Navegação:** ícone + rótulo; item ativo azul e com marcador adicional. Manter o comportamento esperado em cada plataforma com Expo Router.
- **Avaliação:** estrelas amarelas preenchidas; não selecionadas usam contorno escuro. Cada estrela tem área de toque de 48 e nome como “Avaliar com 4 de 5 estrelas”.
- **Ícones:** traço consistente de 2, tamanho visual 24, família única por contexto. Usar a biblioteca já instalada; não misturar emojis com ícones funcionais.
- **Mapas:** pins de marca verdes, seleção azul com anel e descrição. Status de lotação ou segurança exige legenda e texto; amarelo não significa automaticamente risco.

Áreas de toque: no mínimo 48 × 48, mesmo quando o ícone tem 24. O foco de teclado deve ter contorno visível com espaço em relação ao componente. Validar foco sobre cada superfície. Desabilitado não pode parecer uma ação disponível.

## Movimento e estados

Transições curtas: 150 ms para feedback e 220 ms para mudança de estado. Respeitar redução de movimento do sistema. Evitar animação contínua em informação operacional.

Prever estados vazio, carregando, sem conexão, erro e sucesso. Nunca apresentar dados simulados como informação de transporte ao vivo. Carregamento de localização precisa de explicação e alternativa manual quando a permissão for negada.

## Voz

Português brasileiro, frases curtas e verbos claros. Use “Encontrar um ponto”, “Adicionar avaliação” e “Tentar novamente”. Diga o que aconteceu e a próxima ação: “Não foi possível carregar os pontos. Verifique sua conexão e tente novamente.” Evite jargão técnico, culpa e promessas de segurança que o serviço não pode garantir.

## Como implementar

```tsx
import { Brand } from '@/tema';

const theme = Brand.themes.light; // selecionar conforme o tema do sistema
const buttonStyle = {
  backgroundColor: theme.primary,
  minHeight: Brand.control.minHeight,
  borderRadius: Brand.radius.input,
  paddingHorizontal: Brand.spacing.xl,
};
```

Consumir tokens em vez de repetir hexadecimais. Use `Brand.typography` para estilos de texto e `Brand.themes` para cores de interface; `Brand.colors` fica reservado a ativos e assinatura. Não usar dados de negócio no arquivo de tokens.

## Revisão antes de integrar

Conferir tema claro e escuro, fonte ampliada, leitor de tela, teclado na web, estados de erro e dispositivo estreito. Comparar com o painel visual e executar `npm run lint` e `npm run typecheck`. O painel mostra direção visual e dados ilustrativos; não representa funcionalidades já implementadas.
