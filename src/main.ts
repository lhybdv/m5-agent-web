import { createPinia } from 'pinia';
import { createApp } from 'vue';
import './style.scss';
import MateChat from '@matechat/core';
import VueDevui from 'vue-devui';
import App from './App.vue';
import i18n from './i18n';
import { useMenuStore } from './store/menu-store';

const pinia = createPinia();

createApp(App).use(pinia).use(MateChat).use(VueDevui).use(i18n).mount('#app');

const menuStore = useMenuStore();
window.addEventListener('message', (event) => {
    const { type, menuLabel } = event.data || {};
    if (type === 'MENU_SELECTED' && typeof menuLabel === 'string') {
        menuStore.setMenuLabel(menuLabel); // 触发组件响应
    }
});