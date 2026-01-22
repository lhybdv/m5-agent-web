import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMenuStore = defineStore('menu', () => {
    const menuLabel = ref("");

    const setMenuLabel = (label: string) => {
        menuLabel.value = label;
    }

    return { menuLabel, setMenuLabel };
});