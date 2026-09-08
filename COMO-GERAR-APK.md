# Como gerar o APK do CampoGestor

O app é um web app (PWA). No celular Android você já pode instalar pela tela de "Adicionar à tela inicial" no Chrome.

Para gerar um **APK** de verdade (instalável como app nativo):

## Opção rápida (recomendado)

1. Abra o app no Chrome do celular.
2. Menu → **Instalar app** / **Adicionar à tela inicial**.
3. Pronto — funciona offline e aparece como ícone.

## Opção Capacitor (APK real)

No computador com Android Studio instalado:

```bash
cd app
npm install
npm run build
npx cap init CampoGestor com.fazenda.campogestor --web-dir dist
npx cap add android
npx cap sync android
npx cap open android
```

No Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s).

O APK sai em `android/app/build/outputs/apk/`.

---

**Neste ambiente de desenvolvimento não é possível compilar o APK binário** (falta Android SDK e espaço). O código do app está completo e pronto para você gerar o APK localmente com os passos acima.
