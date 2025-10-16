// src/stores/world.ts
import { defineStore } from 'pinia';

export const useWorldStore = defineStore('world', {
    state: () => ({
        units: 1, // 1 unité = 1 mètre
        floorVisible: {
            0: true,
            1: true,
            2: true,
        } as Record<number, boolean>,
        ceilingHeight: 3.2,
        wallThicknessInterior: 0.3,
        theme: 'chateau',
    }),

    actions: {
        toggleFloorVisibility(floor: number) {
            if (floor in this.floorVisible) {
                this.floorVisible[floor] = !this.floorVisible[floor];
            }
        },

        setTheme(theme: string) {
            this.theme = theme;
        },

        setUnits(value: number) {
            this.units = value;
        },
    },

    getters: {
        scale: (state) => `${state.units}m/unit`,
        visibleFloors: (state) =>
            Object.entries(state.floorVisible)
                .filter(([_, visible]) => visible)
                .map(([floor]) => Number(floor)),
    },
});
