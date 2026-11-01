import { createApp } from 'vue';
import App from './components/App.vue';
import router from './router';
import '../css/app.css';

createApp(App).use(router).mount('#app');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.error('Impossible d’activer le mode hors ligne.', error);
        });
    });
}
