// src/three/utils/ticker.ts
export function createTicker(callback: () => void) {
    let frameId: number

    const tick = () => {
        callback()
        frameId = requestAnimationFrame(tick)
    }

    const start = () => {
        frameId = requestAnimationFrame(tick)
    }

    const stop = () => {
        cancelAnimationFrame(frameId)
    }

    return { start, stop }
}
