# Guia de leitura para a equipe

O objetivo é permitir que cada pessoa encontre a tela, o estilo e a conexão com o Firebase sem precisar navegar por várias pastas.

## 1. Comece por uma tela

Para ver como a interface é montada, abra `src/app/(tabs)/inicio.tsx`. Esse é o início. Para entender um formulário, abra `src/app/login.tsx` ou `src/app/cadastro.tsx`.

Cada tela contém:

1. **Imports:** os recursos usados, como View, Text, Firebase e estilos.
2. **Estados:** os valores que mudam, como e-mail digitado, carregamento e mensagens.
3. **Funções:** o que acontece quando alguém toca em um botão.
4. **Return:** o JSX que desenha os componentes React Native na tela.

No login, a função `login()` valida os campos, chama `signInWithEmailAndPassword()` e abre o início se o Firebase aceitar o acesso. No cadastro, `register()` cria o usuário e salva o nome. Não há mais um formulário genérico escondendo essas duas telas.

## 2. Onde editar cada coisa

| Quero alterar… | Arquivo |
| --- | --- |
| Tela de entrada (usa o mesmo login) | `src/app/index.tsx` → `login.tsx` |
| Conteúdo e cards do início | `src/app/(tabs)/inicio.tsx` |
| Login | `src/app/login.tsx` |
| Recuperação com código por e-mail | `src/app/recuperar-senha.tsx` |
| Chamadas de recuperação ao servidor | `src/recuperacao.ts` |
| Backend de envio e troca da senha | `functions/index.mjs` e `functions/recovery.mjs` |
| Cadastro de conta | `src/app/cadastro.tsx` |
| Perfil e botão Sair | `src/app/(tabs)/perfil.tsx` |
| Barra inferior e nomes das abas | `src/app/(tabs)/_layout.tsx` |
| Navegação geral | `src/app/_layout.tsx` |
| Aparência das telas | `src/styles.ts` |
| Cores e tamanhos da marca | `src/tema.ts` |
| Projeto Firebase usado | `.env.local` |
| Inicialização do Firebase e persistência do login | `src/firebase.ts` |
| Busca e leitura dos pontos | `src/pontos.ts` |
| Quem está conectado | `src/sessao.tsx` |
| Mensagens de erro e validações | `src/validacoes.ts` |
| Formato de um ponto de ônibus | `src/tipos.ts` |
| Telas do painel administrativo | `src/app/(tabs)/admin/` |
| Papel de admin, usuários e gravação de pontos | `src/admin.ts` |
| Validações do painel e lista de admins usada pela interface | `src/admin-validacoes.ts` |
| Quem é admin e o que cada um pode gravar | `firebase/firestore.rules` |

## 3. Como usar os estilos

`src/styles.ts` reúne os estilos por finalidade:

- `welcomeStyles`: disposição responsiva da entrada e do login.
- `recoveryStyles`: detalhes da recuperação de senha.
- `homeStyles`: início e cards dos pontos.
- `authStyles`: login e cadastro, que têm a mesma aparência.
- `profileStyles`: Perfil.
- `placeholderStyles`: telas com Em breve.
- `adminStyles`: telas do painel administrativo.

Na tela, você verá uma importação como:

```tsx
import { authStyles as styles } from '@/styles';
```

Isso só dá o nome curto `styles` ao bloco de autenticação. Quando um componente usa `style={styles.input}`, procure a propriedade `input` dentro de `authStyles` no arquivo de estilos.

Cores pontuais também são aplicadas pela tela com `colors.primary` ou `t.text`. Esses valores vêm de `src/tema.ts`; não é outra folha de estilos.

## 4. Por que existem app, tabs e layout?

O projeto usa Expo Router. Nesse sistema, o nome do arquivo cria a rota:

- `app/login.tsx` abre `/login`.
- `app/cadastro.tsx` abre `/cadastro`.
- `app/(tabs)/perfil.tsx` abre `/perfil`.
- `app/index.tsx` abre `/`, reutilizando o formulário de `login.tsx`.
- `app/recuperar-senha.tsx` abre `/recuperar-senha`.
- `app/(tabs)/inicio.tsx` abre `/inicio`, a lista de pontos após o acesso.
- `app/(tabs)/admin/index.tsx` abre `/admin`, o painel administrativo. Ele fica dentro de `(tabs)` para manter a barra inferior, mas não tem botão próprio: abre pelo Perfil.

A pasta `(tabs)` agrupa as telas com a barra inferior; o nome entre parênteses não aparece no endereço. O login e o cadastro ficam fora dela para não mostrar a barra durante a autenticação.

O `_layout.tsx` da raiz faz o papel de organizar o app inteiro, semelhante à parte de navegação de um App.js. O `_layout.tsx` de `(tabs)` monta somente a barra inferior. Não são telas extras.

Para esconder uma aba da barra sem bloquear a rota, use `tabBarButton: () => null`. Não use `href: null`: nesta versão do Expo Router ele redireciona a rota para o Início.

Não crie styles.ts dentro de app: o Router poderia interpretá-lo como outra página.

## 5. Caminho dos dados

**Pontos:** Firestore → consulta em `pontos.ts` → estado `stops` → cards em `inicio.tsx`.

**Login:** campos em `login.tsx` → Firebase Authentication → sessão em `sessao.tsx` → nome e e-mail no Perfil.

**Cadastro:** campos em `cadastro.tsx` → Firebase Authentication cria a conta → salva o nome → abre o início.

**Perfil do usuário:** ao entrar, `useSincronizarUsuario()` (chamado no `_layout.tsx` da raiz) cria ou atualiza `usuarios/{uid}` no Firestore com nome, e-mail e status. Se o status for `bloqueado`, o app desconecta a pessoa.

**Painel administrativo:** botão no Perfil (só para admins) → telas em `src/app/(tabs)/admin/` → funções em `admin.ts` → Firestore. Pontos são gravados em `stops`; usuários em `usuarios` e `admins`. Quem decide se a pessoa é admin são as regras do Firestore: a lista fixa `adminsIniciais()` ou um documento em `admins/{uid}`. O passo a passo está em [docs/admin.md](docs/admin.md).

**Sair:** botão em `perfil.tsx` → `signOut()` → a sessão passa a não ter usuário → o app volta para a tela de entrada.

`useStops` e `useAuth` são funções React usadas pelas telas. A primeira acompanha os pontos e a busca; a segunda entrega a sessão. A separação evita colocar detalhes de rede e recuperação de sessão dentro de cada tela.

As senhas são entregues ao Firebase Authentication. O app não grava senhas no Firestore. A configuração pública do projeto fica em .env.local; nenhuma chave administrativa deve ser colocada no aplicativo.

**Recuperar senha:** tela `recuperar-senha.tsx` → chamadas em `recuperacao.ts` → Cloud Functions em `functions/` → Resend envia o código → backend verifica e atualiza a senha no Firebase Authentication. A pasta `functions` é um servidor Node.js separado; ela não faz parte do app React Native. O passo a passo de ativação está em [docs/recuperacao-senha.md](docs/recuperacao-senha.md).

## 6. O que são os outros arquivos?

- `.tsx`: código de React Native com componentes e tipos.
- `.ts`: código TypeScript sem interface JSX.
- `tipos.ts`: descreve campos esperados; não é outra tela nem outro banco.
- `expo.d.ts`: suporte de tipos do Expo; não precisa editar ao desenvolver telas.
- `components/CampoSenha.tsx`: campo com o botão de mostrar/ocultar senha, reutilizado em login e cadastro.
- `components/EmBreve.tsx`: pequeno aviso reutilizado nas abas ainda não implementadas.
- `firebase/firestore.rules`: controla quais documentos podem ser lidos e alterados. Editar o arquivo exige publicar as regras no Firebase.
- Lista de admins iniciais: existe em `firebase/firestore.rules` (função `adminsIniciais()`, a que vale) e em `src/admin-validacoes.ts` (`ADMINS_INICIAIS`, só para a interface). Altere as duas juntas; o `npm.cmd run test:data` avisa se ficarem diferentes. Só inclua e-mails de contas que já existem.

node_modules contém bibliotecas instaladas; .expo contém cache; dist contém a saída de distribuição. Essas pastas não são telas e não devem ser editadas manualmente. O backup local preserva arquivos antigos e não entra no Git.

## 7. Rotina para trabalhar em equipe

Antes de editar, encontre a tela na tabela acima. Faça a mudança de comportamento nela; se for visual, altere o bloco correspondente em styles.ts. Não copie código de Firebase para cada tela: reutilize firebase.ts.

Antes de enviar a alteração:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:data
```

Teste no celular e confira carregamento, erro e lista vazia.

Se a alteração mexer em `firebase/firestore.rules`, publique as regras depois que a mudança for aprovada:

```powershell
firebase deploy --only firestore:rules
```