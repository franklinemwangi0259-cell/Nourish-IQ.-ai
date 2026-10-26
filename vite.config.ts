import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      {
        name: 'vite-hmr-ws-stub',
        enforce: 'pre',
        transformIndexHtml: {
          order: 'pre',
          handler() {
            return [
              {
                tag: 'script',
                attrs: { type: 'text/javascript' },
                children: `
                  (function() {
                    var OrigWS = window.WebSocket;
                    if (OrigWS) {
                      window.WebSocket = function(url, protocols) {
                        if (protocols === 'vite-hmr' || (typeof url === 'string' && (url.indexOf('vite-hmr') !== -1 || url.indexOf('@vite') !== -1))) {
                          var stub = new EventTarget();
                          stub.readyState = 1;
                          stub.url = url;
                          stub.protocol = 'vite-hmr';
                          stub.send = function() {};
                          stub.close = function() {};
                          stub.addEventListener = EventTarget.prototype.addEventListener.bind(stub);
                          stub.removeEventListener = EventTarget.prototype.removeEventListener.bind(stub);
                          stub.dispatchEvent = EventTarget.prototype.dispatchEvent.bind(stub);
                          setTimeout(function() { stub.dispatchEvent(new Event('open')); }, 0);
                          return stub;
                        }
                        return new OrigWS(url, protocols);
                      };
                      window.WebSocket.prototype = OrigWS.prototype;
                      window.WebSocket.CONNECTING = 0;
                      window.WebSocket.OPEN = 1;
                      window.WebSocket.CLOSING = 2;
                      window.WebSocket.CLOSED = 3;
                    }
                  })();
                `,
                injectTo: 'head-prepend'
              }
            ];
          }
        }
      },
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'Nourish IQ',
          short_name: 'Nourish IQ',
          description: 'Smart Nutrition & Habit Tracker',
          theme_color: '#10b981',
          icons: [
            {
              src: 'https://i.postimg.cc/NM8Pdy2b/logo.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://i.postimg.cc/NM8Pdy2b/logo.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          maximumFileSizeToCacheInBytes: 5000000,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
    },
  };
});
