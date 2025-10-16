<template>
  <div class="controls-panel">
    <h2>Contrôles</h2>
    <div class="etages">
      <button @click="toggleFloor(0)">Étage 0</button>
      <button @click="toggleFloor(1)">Étage 1</button>
      <button @click="toggleFloor(2)">Étage 2</button>
    </div>
    <button @click="recenter">Recentrer</button>
    <button @click="toggleOrbit">Animation orbitale</button>
  </div>
</template>

<script setup lang="ts">
import { useWorldStore } from '@/stores/world';
import { ref } from 'vue';

const store = useWorldStore();
const orbitEnabled = ref(false);

// 🔁 Préparation des handlers
const toggleFloor = (floor: number) => {
  // Pour l'étage 0, on souhaite afficher uniquement le niveau 0 et masquer le toit
  if (floor === 0) {
    const event = new CustomEvent('show-only-floor', { detail: { floor: 0 } });
    window.dispatchEvent(event);
    return;
  }
  // Comportement par défaut pour autres étages (si ajoutés plus tard)
  store.toggleFloorVisibility(floor);
  console.log(`Étage ${floor} →`, store.floorVisible[floor]);
};

const recenter = () => {
  const event = new CustomEvent('recenter-camera');
  window.dispatchEvent(event);
};

const toggleOrbit = () => {
  orbitEnabled.value = !orbitEnabled.value;
  const event = new CustomEvent('toggle-orbit', {
    detail: { enabled: orbitEnabled.value },
  });
  window.dispatchEvent(event);
};
</script>

<style scoped>
.controls-panel {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 8px;
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 10;
}

.controls-panel button {
  padding: 0.4rem 0.8rem;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #ccc;
  background: #f5f5f5;
  border-radius: 4px;
  transition: background 0.2s;
}

.controls-panel button:hover {
  background: #e0e0e0;
}

@media (max-width: 768px) {
  .controls-panel {
    display: none;
  }
}
</style>
