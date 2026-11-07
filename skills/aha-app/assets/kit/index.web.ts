import { registerRootComponent } from 'expo';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// On the web, Skia's CanvasKit (public/canvaskit.wasm) must load before any Skia code runs.
LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(async () => {
  const App = (await import('./App')).default;
  registerRootComponent(App);
});
