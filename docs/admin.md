# Área administrativa

Painel para gerenciar **usuários** e **pontos**. Fica em Perfil → **Painel administrativo**, e o botão só aparece para admins. O painel abre dentro das abas, então o rodapé continua visível para navegar. Funciona no plano gratuito (Spark) do Firebase, sem Cloud Functions.

## Como a segurança funciona

- As **regras do Firestore** (`firebase/firestore.rules`) decidem quem é admin. O app só mostra ou esconde telas: mesmo que alguém altere o app, não ganha acesso.
- **Admin** é quem está na lista fixa `adminsIniciais()` das regras **ou** tem um documento em `admins/{uid}`, criado por outro admin.
- A mesma lista existe em `src/admin-validacoes.ts` (`ADMINS_INICIAIS`), só para a interface. O teste `tests/admin-lista.test.mjs` falha se as duas forem diferentes.

## Admins iniciais

1. Confirme que a pessoa **já tem conta** no app (Firebase Console → Authentication).
2. Coloque o e-mail, em minúsculas, em `adminsIniciais()` (regras) **e** em `ADMINS_INICIAIS` (`src/admin-validacoes.ts`).
3. Rode `npm run test:data` e publique as regras com `firebase deploy --only firestore:rules`.
4. A pessoa abre o app e o botão **Painel administrativo** aparece no Perfil.

**Atenção:** só coloque na lista e-mails de contas que **já existem**. Não há verificação de e-mail, então, se o e-mail ainda não tiver conta, quem criar a conta primeiro com ele vira admin. Para dar acesso a outras pessoas, prefira **Tornar admin** no painel.

Admins iniciais não podem ser alterados pelo painel. Para mudar a lista, edite os dois arquivos e publique as regras.

## O que cada tela faz

| Tela | Ações | Onde grava |
| --- | --- | --- |
| Usuários | Listar, criar conta com senha temporária, tornar ou remover admin, bloquear ou desbloquear | `usuarios`, `admins` |
| Pontos | Listar todos (inclusive não publicados), criar, editar, publicar ou despublicar | `stops` |

- **Lista de usuários:** cada pessoa cria o próprio perfil em `usuarios/{uid}` ao abrir o app (`useSincronizarUsuario`, chamado no `_layout.tsx` da raiz). Contas antigas só aparecem depois que a pessoa abrir o app com esta versão.
- **Criar conta:** usa uma instância separada do Firebase. O admin continua conectado, e a pessoa troca a senha em "Esqueci a senha".
- **Tornar ou remover admin:** vale na hora. Ninguém remove o próprio acesso.
- **Bloquear:** o app desconecta a pessoa e as regras impedem novas avaliações. Sem Cloud Functions não é possível impedir o login no Firebase Authentication: se a pessoa entrar, o app a desconecta de novo. Para bloquear um admin, remova o acesso de admin antes.
- **Pontos:** não há exclusão, porque o Firestore não apagaria as avaliações dentro do ponto. Desmarque **Publicado**.

## Campos do ponto (`stops`) no formulário

São os mesmos campos que o app já lia:

| Campo no formulário | Campo | Onde aparece |
| --- | --- | --- |
| Nome, Endereço, Cidade | `name`, `address`, `city` | Card e detalhe |
| Latitude, Longitude | `latitude`, `longitude` | Mapa (sem coordenadas, o ponto não aparece no mapa) |
| Linhas de ônibus | `lines` | Card do Início e detalhe no Mapa |
| Etiquetas do ponto | `tags` | Card; "Acessível" e "Com cobertura" alimentam os filtros do Início e do Mapa |
| Boa condição confirmada | `condition: "good"` | Selo verde "Boa condição" no card |
| Publicado no app | `published` | Só pontos publicados aparecem para os usuários |

As etiquetas do ponto são diferentes das tags das avaliações, que continuam fixas em `src/app/(tabs)/avaliacao.tsx`. As opções do formulário ficam em `ETIQUETAS_PONTO` (`src/admin-validacoes.ts`). Campos antigos cadastrados pelo Console são preservados na edição.

## Coleções `usuarios` e `admins`

| Coleção | Campos | Quem grava |
| --- | --- | --- |
| `usuarios/{uid}` | nome, email, status (`ativo` ou `bloqueado`), createdAt, updatedAt | O próprio usuário (nome e e-mail); admin altera só o status |
| `admins/{uid}` | email, concedidoPor, createdAt | Somente admin |

## Publicar

```bash
npm run test:data
firebase deploy --only firestore:rules
```

Sem o Firebase CLI, cole o conteúdo de `firebase/firestore.rules` em **Firestore → Regras → Publicar**.

## Arquivos

| O quê | Onde |
| --- | --- |
| Lista de admins iniciais (fonte da verdade) e permissões | `firebase/firestore.rules` |
| Cópia da lista, etiquetas do ponto e validações | `src/admin-validacoes.ts` |
| Papel no app, usuários, sincronização do perfil e pontos | `src/admin.ts` |
| Telas | `src/app/(tabs)/admin/` |
| Painel dentro das abas (sem botão próprio) | `src/app/(tabs)/_layout.tsx` |
