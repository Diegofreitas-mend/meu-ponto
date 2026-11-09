# Meu Ponto

Aplicativo React Native com Expo e Firebase para consultar os pontos de ônibus.

**Comece pelo [GUIA_DA_EQUIPE.md](GUIA_DA_EQUIPE.md).** Ele explica onde editar cada tela e o caminho dos dados.

## Rodar

```powershell
npm.cmd install
npm.cmd start
```

Para navegador: `npm.cmd run web`. Configure o Firebase no `.env.local`, seguindo [docs/firebase.md](docs/firebase.md).

## Organização simplificada

```text
src/
  app/                 Telas e navegação
    index.tsx          Entrada: reutiliza a tela de login
    login.tsx          Formulário e ação de login
    cadastro.tsx       Formulário e ação de cadastro
    recuperar-senha.tsx Recuperação com código e nova senha
    (tabs)/
      inicio.tsx       Pontos de ônibus após entrar
      perfil.tsx       Perfil e saída da conta
      mapa.tsx         Em breve
      avaliacao.tsx    Em breve
      alertas.tsx      Em breve
  styles.ts            Estilos de todas as telas, separados em blocos
  tema.ts              Cores, tamanhos e identidade visual
  firebase.ts          Configuração do banco e autenticação
  recuperacao.ts       Chamadas de recuperação ao backend
  sessao.tsx           Usuário conectado compartilhado entre as telas
  pontos.ts            Consulta, busca e carregamento dos pontos
  validacoes.ts        Conferência dos formulários e dados do banco
  tipos.ts             Formato dos dados em TypeScript
  expo.d.ts            Tipos de suporte do Expo
  components/          Campo de senha e aviso Em breve
```

Os dois arquivos `_layout.tsx` definem a navegação geral e a barra inferior. Eles substituem a configuração de navegação que normalmente ficaria no App.js.

## Conferir antes de entregar

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:data
npm.cmd --prefix functions test
```

## Outros arquivos

- `assets/`: logo e imagens.
- `docs/`: [identidade visual](docs/brand/README.md) e configuração do Firebase.
- `firebase/firestore.rules`: regras do banco.
- `functions/`: backend separado para enviar códigos por e-mail e redefinir senhas.
- `tests/`: testes das validações.
- `node_modules/`, `.expo/` e `dist/`: arquivos gerados pelas ferramentas.
- `_backup-projeto-local-2026-11-09/`: histórico local preservado, ignorado pelo Git.

Início, login, cadastro e Perfil estão implementados. Mapa, Avaliar e Alertas continuam com o aviso Em breve. Os dados da tela inicial vêm do Firestore; não há dados simulados no app.

A recuperação por código está implementada e precisa da configuração do Resend e do deploy das Cloud Functions para enviar e-mails reais. Siga [docs/recuperacao-senha.md](docs/recuperacao-senha.md).
