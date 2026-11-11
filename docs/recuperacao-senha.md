# Recuperação com código por e-mail

O fluxo está implementado, mas **o envio real depende de configurar o Resend e publicar as Cloud Functions**. Habilitar E-mail/senha no Authentication não publica essas funções.

## Como funciona

Login → Esqueci minha senha → informar e-mail → receber código de 6 dígitos → digitar código, nova senha e confirmação → voltar ao login.

O Firebase continua gerenciando as contas e as senhas. As funções fazem a verificação do código e o Resend entrega o e-mail. O app não gera nem confere códigos localmente, não grava a senha no Firestore e não recebe chaves administrativas.

## 1. Preparar o envio

1. Crie uma conta em [Resend](https://resend.com/).
2. Em **Domains**, adicione um domínio que a equipe controla e cadastre no DNS os registros solicitados. Aguarde a verificação.
3. Em **API Keys**, crie uma chave com permissão de envio para esse domínio. Guarde-a; não coloque no Git ou em variáveis `EXPO_PUBLIC_*`.
4. Escolha um remetente do domínio verificado, por exemplo `Meu Ponto <acesso@seu-dominio.com.br>`.

O remetente de teste `onboarding@resend.dev` permite testes apenas para destinatários autorizados pela conta Resend. Ele não serve para enviar recuperação para todos os usuários. Não é necessário contratar hospedagem de site para usar um domínio de envio, mas é necessário controlar seu DNS.

## 2. Preparar o Firebase

Para publicar Cloud Functions, o projeto precisa do **plano Blaze**, com faturamento habilitado. Esse passo deve ser feito pelo responsável da conta no Console. Consulte os custos antes de mudar o plano; os limites de tentativas do código não são um limite financeiro da plataforma.

Na raiz do projeto, em um terminal PowerShell:

```powershell
npm.cmd install --prefix functions
npx.cmd firebase-tools@latest login
```

Não execute `firebase init` sobre o projeto: os arquivos necessários já estão preparados.

## 3. Configurar os valores

Copie `functions/.env.example` para `functions/.env.meu-ponto-b8ede` e substitua os dois valores:

```dotenv
PASSWORD_RESET_FROM="Meu Ponto <acesso@seu-dominio.com.br>"
FIREBASE_WEB_API_KEY="mesmo-valor-de-EXPO_PUBLIC_FIREBASE_API_KEY"
```

A chave Web acima é a configuração pública do projeto Firebase. A chave do Resend e o segredo do código ficam no Secret Manager, com estes comandos:

```powershell
npx.cmd firebase-tools@latest functions:secrets:set RESEND_API_KEY --project meu-ponto-b8ede
npx.cmd firebase-tools@latest functions:secrets:set PASSWORD_RESET_SECRET --project meu-ponto-b8ede
```

Cada comando pede o valor no terminal. No primeiro, cole a chave do Resend. No segundo, cole um segredo aleatório de pelo menos 32 bytes, gerado por um gerenciador de senhas ou por este comando local:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Não envie esses valores no chat. A troca de `PASSWORD_RESET_SECRET` invalida códigos ainda pendentes. Não use senha pessoal, matrícula ou a chave pública do Firebase como segredo.

## 4. Publicar

```powershell
npx.cmd firebase-tools@latest deploy --only functions:password-recovery --project meu-ponto-b8ede
```

Esse comando publica somente as duas funções deste recurso, na região `southamerica-east1`. O app já utiliza essa mesma região. O deploy roda os testes do backend antes da publicação. O runtime configurado é Node.js 22.

As regras atuais em `firebase/firestore.rules` negam acesso às coleções privadas. **Não habilite modo de teste nem crie uma regra global de leitura/escrita.** Se as regras publicadas forem diferentes das do repositório, revise-as antes de publicar:

```powershell
npx.cmd firebase-tools@latest deploy --only firestore:rules --project meu-ponto-b8ede
```

Em **Google Cloud Console → Firestore → Time-to-live (TTL)**, crie uma política para o campo `expiresAt` em cada grupo de coleções:

- `_passwordResetChallenges`
- `_passwordResetLimits`

O TTL faz a limpeza posterior dos registros expirados, inclusive o e-mail dos desafios. A expiração de 10 minutos é verificada pelo código mesmo se o TTL demorar a excluir o documento. Desafios concluídos são apagados imediatamente quando possível.

## 5. Testar depois do deploy

1. Abra o app sem estar conectado e toque em **Esqueci minha senha**.
2. Informe o e-mail de uma conta real de teste, cadastrada com senha.
3. Confira o recebimento no e-mail e no spam.
4. Digite um código errado para conferir a mensagem. Depois use o correto e uma nova senha com pelo menos 8 caracteres.
5. Entre com a nova senha. A senha antiga deve falhar.
6. Confira que o mesmo código não pode ser usado novamente e que reenviar invalida o anterior.

São permitidas 5 tentativas por desafio, 3 solicitações por hora por e-mail, com intervalo de 60 segundos, e 10 solicitações por hora por IP. Os limites também se aplicam a e-mails sem conta. Várias pessoas na mesma rede compartilham o limite de IP.

O código é consumido antes da alteração da senha para impedir duas confirmações simultâneas. Se a política de senha do Firebase rejeitar a nova senha, ou houver uma falha de rede durante a confirmação, pode ser necessário pedir outro código. Na dúvida sobre uma falha de confirmação, teste primeiro entrar com a nova senha.

A resposta de envio não confirma se existe conta para o e-mail informado. Falhas do provedor de e-mail são registradas sem dados pessoais nos logs das funções; confira **Firebase Console → Functions → Logs** e o painel **Emails** do Resend se o e-mail não chegar. O app nunca mostra um código de teste como alternativa.

## Onde editar

| Parte | Arquivo |
| --- | --- |
| Tela e etapas do formulário | `src/app/recuperar-senha.tsx` |
| Chamadas do app ao backend | `src/recuperacao.ts` |
| Envio do e-mail e troca da senha | `functions/index.mjs` |
| Código, validade e limites | `functions/recovery.mjs` |
| Estilos da tela | `src/styles.ts`: `authStyles` e `recoveryStyles` |
| Testes das regras de segurança | `functions/tests/recovery.test.mjs` |

`functions/` é um backend Node.js separado, executado pelo Firebase. As telas do app continuam em React Native. O `package.json` dentro dessa pasta instala dependências do servidor; o da raiz instala as do app.

Testes locais, sem enviar e-mails nem modificar contas:

```powershell
npm.cmd --prefix functions test
npm.cmd --prefix functions run check
npm.cmd run lint
npm.cmd run typecheck
```

Referências: [Cloud Functions](https://firebase.google.com/docs/functions/get-started), [funções callable](https://firebase.google.com/docs/functions/callable), [Secret Manager](https://firebase.google.com/docs/functions/config-env), [confirmação de recuperação no Firebase](https://firebase.google.com/docs/reference/rest/auth#section-confirm-password-reset), [envio pelo Resend](https://resend.com/docs/api-reference/emails/send-email).
