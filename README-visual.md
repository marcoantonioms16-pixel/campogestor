# CampoGestor — Visual Premium

Esta versão mantém a estrutura funcional do CampoGestor e aplica uma nova camada visual:

- paleta verde profundo + creme + dourado discreto;
- cards, botões, formulários e estados refinados;
- chips padrão unificados em todas as telas;
- chips especiais somente para a aba Hoje;
- barra inferior de navegação rápida;
- splash de abertura com a cena agrícola aprovada, usando uma película escura para manter o texto legível;
- CSS centralizado em `css/app.css`;
- telas separadas em `js/telas/`;
- backup original preservado em `index.original-backup.html`.

A imagem usada na abertura já está dentro do projeto em `assets/splash-fazenda.jpg`, portanto não depende de um link externo.

## Segurança da alteração

Os arquivos JavaScript foram verificados com `node --check`. A lógica de dados, Supabase e renderização existente foi preservada; as mudanças principais são de apresentação e navegação visual.
