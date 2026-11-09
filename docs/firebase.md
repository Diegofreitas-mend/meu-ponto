# Configurar o Firebase no Meu Ponto

O backend agora é o **Cloud Firestore**, banco gerenciado pelo Firebase. Não há servidor Node/SQLite para iniciar. O app acompanha os documentos publicados e não cria dados automaticamente.

## 1. Criar o projeto

1. Abra https://console.firebase.google.com/ e entre com sua conta Google.
2. Crie o projeto Meu Ponto ou use o projeto existente da equipe.
3. Analytics não é necessário para esta tela.
4. Na visão geral, escolha **Adicionar app → Web**, o ícone `</>`.
5. Dê um nome como Meu Ponto Expo e registre o app. Hosting não é necessário agora.

O cadastro Web atende Android, iOS, web e Expo Go porque usamos o Firebase JavaScript SDK. Não são necessários google-services.json, GoogleService-Info.plist nem uma conta de serviço nesta integração.

## 2. Onde configurar no código

No Console, vá em **Configurações do projeto → Geral → Seus apps → app Web → Configuração do SDK**. Escolha a opção de configuração e encontre o objeto `firebaseConfig`.

Na raiz do repositório, abra **`.env.local`**. O arquivo já foi preparado com campos vazios. Se não existir, copie `.env.example` para `.env.local`.

| Valor em firebaseConfig | Variável em .env.local |
| --- | --- |
| apiKey | EXPO_PUBLIC_FIREBASE_API_KEY |
| authDomain | EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN |
| projectId | EXPO_PUBLIC_FIREBASE_PROJECT_ID |
| storageBucket | EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET |
| messagingSenderId | EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID |
| appId | EXPO_PUBLIC_FIREBASE_APP_ID |

Cole somente o valor depois de `=`, sem vírgula. Não copie o objeto inteiro. measurementId não é utilizado. O código que lê esses valores está em `src/firebase.ts`; não precisa editá-lo.

Variáveis EXPO_PUBLIC_ são visíveis dentro do app. A configuração identifica o projeto Firebase, mas não concede autorização administrativa. **Nunca inclua private keys, conta de serviço ou credenciais administrativas no app.** O arquivo .env.local é ignorado pelo Git; cada dev configura o seu.

## 3. Criar o banco e publicar as regras

1. No Console, abra **Build / Criação → Firestore Database → Criar banco de dados**.
2. Use o banco **(default)**, edição Standard, e escolha a região conforme seus usuários.
3. Comece no modo de **produção**, sem escrita pública.
4. Quando o banco estiver criado, abra **Regras**.
5. Cole o conteúdo de **firebase/firestore.rules** deste repositório e clique em **Publicar**.

As regras permitem ler somente documentos de stops com `published: true` e bloqueiam qualquer escrita pelo aplicativo. Os membros autorizados da equipe cadastram os dados pelo Console conforme suas permissões Google/Firebase. Todo o documento publicado pode ser lido publicamente: não inclua dados pessoais ou informações internas.

O firebase.json também aponta para as regras, caso a equipe adote o Firebase CLI. Editar o arquivo local não publica regras; use o botão Publicar do Console nesta etapa.

## 4. Cadastrar o primeiro ponto real

Na aba **Dados** do Firestore, crie a coleção **stops**, adicione um documento com **ID automático** e preencha dados verificados:

| Campo | Tipo no Console | Conteúdo |
| --- | --- | --- |
| name | string | Nome real do ponto |
| address | string | Endereço real |
| city | string | Cidade/UF |
| published | boolean | true para aparecer no app |
| condition | string | unknown se não verificada; good apenas se confirmada |
| tags | array de strings | Características verificadas; pode ser vazio |
| lines | array de strings | Linhas verificadas; pode ser vazio |
| rating | null | Sem avaliações |
| reviewCount | number | 0 inicialmente |
| alerts | array | Vazio inicialmente |

Também pode omitir tags, lines, rating, reviewCount, condition e alerts: os padrões são vazios, sem nota, zero avaliações e condição não informada. Não use strings nos campos boolean ou number.

Para um alerta real, adicione um **map** ao array alerts com title (string), message (string) e createdAt (string ISO no formato AAAA-MM-DDTHH:mm:ssZ, preenchida com a data real). Remova esse map para resolver o alerta. O card mostra Com alerta enquanto houver relatos.

rating e reviewCount são agregados administrativos nesta etapa e devem refletir avaliações reais. Com zero avaliações, rating precisa ser null. O envio de avaliações e o cálculo automático das notas ainda não estão implementados. Login e cadastro usam o Firebase Authentication. Mapa, Avaliar e Alertas continuam com Em breve; Perfil permite entrar, cadastrar e sair da conta.

Sem documentos publicados, o app mostra que não há pontos cadastrados. Ele não apresenta distância ou localização fictícia.

## 5. Rodar

Depois de preencher .env.local, pare o Expo com Ctrl+C e reinicie:

```powershell
npm.cmd start
```

Para navegador:

```powershell
npm.cmd run web
```

O celular precisa de internet. Não é necessário configurar IP do computador nem iniciar API local. Salvar um ponto publicado no Console deve atualizar a tela inicial. A busca filtra nome, endereço, cidade e características, ignorando acentos.

## Erros comuns

- **Configure o Firebase…**: faltam valores em .env.local ou o Expo precisa ser reiniciado.
- **Firestore recusou a leitura**: publique as regras no mesmo projeto indicado em PROJECT_ID.
- **Nenhum ponto cadastrado**: confira a coleção stops, o banco (default) e o boolean published: true.
- **Campo inválido no Firestore**: revise nomes e tipos pela tabela acima.
- **Firebase demorou a responder**: confira internet, valores do app e se o banco foi criado.

## Limites

A consulta acompanha o catálogo publicado; a busca ocorre no app. Quando o volume crescer, a consulta precisa de paginação/busca indexada. Acompanhe o consumo de leituras no Console.

A criação do projeto, o preenchimento da configuração e a publicação das regras dependem de acesso à sua conta. A conexão real só pode ser validada depois desses passos.

Referências: [Expo + Firebase](https://docs.expo.dev/guides/using-firebase/), [Configuração Web](https://firebase.google.com/docs/web/setup), [Firestore](https://firebase.google.com/docs/firestore/quickstart), [Regras](https://firebase.google.com/docs/firestore/security/get-started).

## Login e cadastro: habilitar no Firebase

As telas `/login` e `/cadastro` estão conectadas ao Firebase Authentication. A aba Perfil permite entrar, criar conta e sair. O app pede login antes de abrir as abas. As regras atuais do Firestore continuam permitindo consulta pública dos documentos publicados; a proteção de navegação não substitui as regras do banco.

No Firebase Console do projeto **meu-ponto-b8ede**:

1. Abra **Segurança → Authentication**.
2. Se aparecer, clique em **Começar / Get started**.
3. Abra **Método de login / Sign-in method**.
4. Selecione **E-mail/senha**, habilite a primeira opção e salve.
5. Não é necessário habilitar login por link sem senha.

Se houver uma política de senha mais exigente no projeto, ela também será aplicada pelo Firebase. O formulário exige pelo menos 8 caracteres no cadastro; contas já existentes podem entrar com a senha originalmente definida.

Não são necessárias novas variáveis nem mudanças nas regras do Firestore. Nome e e-mail são armazenados no usuário do Firebase Authentication; a senha é gerenciada pelo serviço e nunca é gravada no Firestore pelo app. Usuários não ganham permissões administrativas ao se cadastrar.

O app restaura a sessão no navegador e usa AsyncStorage para a persistência do Firebase no Android/iOS. A recuperação usa um código numérico digitado no app e requer configurar o Resend e publicar as Cloud Functions: siga [recuperacao-senha.md](recuperacao-senha.md). Não há disparo automático de e-mails no cadastro.

### Conferir o fluxo

1. Abra Perfil → Criar conta, informe nome, e-mail, senha e confirmação.
2. Após o cadastro, o app abre o início. Toque em Perfil para conferir nome e e-mail e a conta no Console em Authentication → Usuários.
3. Saia da conta e entre novamente com o mesmo e-mail/senha.
4. Reabra o app para conferir a restauração da sessão.
5. Na tela de login, informe o e-mail e toque em Esqueci minha senha para solicitar a recuperação.

Se aparecer `auth/configuration-not-found` ou a mensagem de provedor não habilitado, conclua a ativação acima. Ativar o Firestore não ativa o Authentication automaticamente.
