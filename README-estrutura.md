# CampoGestor — estrutura reestruturada

A aparência e a organização funcional do app foram preservadas. A mudança é principalmente interna, para facilitar manutenção e reduzir regressões.

## Estrutura

- `index.html` — casca da aplicação e carregamento dos arquivos.
- `css/app.css` — estilos.
- `js/core/data.js` — cadastro inicial e dados-base.
- `js/core/config.js` — chaves, configurações, rotina e catálogos.
- `js/telas/*.js` — renderização isolada de cada tela.
- `js/app.js` — estado, persistência, eventos, formulários e orquestração.

## Regra de manutenção

- Alteração visual geral → `css/app.css`.
- Cadastro inicial/tabelas base → `js/core/data.js`.
- Configurações e catálogos → `js/core/config.js`.
- Alteração específica de uma tela → arquivo correspondente em `js/telas/`.
- Salvamento, sincronização, eventos e regras compartilhadas → `js/app.js`.

## Importante

A tela da Frota continua com os mesmos nomes, ordem e organização dos chips. A separação em `js/telas/frota.js` é estrutural e não deve ser usada para alterar o layout sem solicitação explícita.

## Execução

A aplicação continua sendo um site estático e pode ser hospedada como antes. Os scripts são carregados com `<script src>` em ordem, evitando dependência de bundler.
