# CampoGestor

App de gestão agrícola da **Fazenda Santa Rita** (e unidades relacionadas).

Funciona como site/PWA: abra o `index.html` ou publique a pasta inteira (GitHub Pages, Netlify, servidor próprio).

## Estrutura do projeto

```
CampoGestor/
├── index.html              # Entrada do app
├── css/
│   └── app.css             # Visual completo
├── js/
│   ├── core/
│   │   ├── config.js       # Constantes, tipos, categorias
│   │   └── data.js         # Dados iniciais (SEED)
│   ├── services/
│   │   └── cloud.js        # Login + sincronização Supabase
│   ├── telas/              # Uma tela por arquivo (só HTML)
│   │   ├── hoje.js
│   │   ├── frota.js
│   │   ├── estoque.js
│   │   └── …
│   ├── gestos.js           # Swipe do menu + puxar para atualizar
│   └── app.js              # Orquestração: menu, formulários, eventos
├── assets/                 # Imagens do app
├── public/                 # Favicon, OG, extras
├── backup/                 # Cópias antigas (não usar no dia a dia)
├── docs/historico/         # Notas antigas de versões
├── manifest.json
└── sw.js                   # Service worker (PWA)
```

## Como manter sem dor de cabeça

| O que você quer mudar | Onde mexer |
|----------------------|------------|
| Texto/layout de uma tela | `js/telas/NOME.js` |
| Cor, card, chip, hero | `css/app.css` |
| Login / nuvem | `js/services/cloud.js` |
| Clique, formulário, menu | `js/app.js` |
| Tipos de máquina, categorias | `js/core/config.js` |
| Gestos de dedo | `js/gestos.js` |

**Regra simples:** telas só desenham; `app.js` só reage a cliques; nuvem fica isolada em `services/`.

## Scripts no `index.html` (ordem importa)

1. `data.js` + `config.js` — base  
2. `cloud.js` — auth e sync  
3. `telas/*` — render  
4. `app.js` — UI e eventos  
5. `gestos.js` — toque  

## Nuvem (Supabase)

Configuração em `js/core/config.js` (`SB_URL`, `SB_KEY`).  
Sessão fica no aparelho e é renovada automaticamente (`refresh_token`).

## Offline

Hoje os dados ficam no `localStorage` do aparelho.  
Abertura total sem internet ainda depende de cache/PWA — evolução futura.

## Backup

Cópias antigas em `backup/`. Não edite esses arquivos no fluxo normal.

## Atualização — Talhões, Aplicação e Centro Histórico (Safra)

Nova estrutura:

- **Hoje**: agora inclui a janela oficial de plantio e o progresso da safra.
- **Talhões**: lista de todos os talhões. Ao clicar, mostra o histórico filtrado pela safra atual.
- **Aplicação**: ordens de campo, seleção de talhões, cálculo automático de produto e histórico de aplicações.
- **Safra**: virou o centro histórico. Escolha a safra e veja as seções Preparo de solo, Adubação, Plantio+Sulco e Aplicações.

Arquivos novos: `js/telas/talhoes.js`, `js/telas/aplicacao.js`.
