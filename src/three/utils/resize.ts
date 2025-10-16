// src/three/utils/resize.ts
import { WebGLRenderer, PerspectiveCamera } from 'three'

export function createResizeHandler(
    container: HTMLElement,
    renderer: WebGLRenderer,
    camera: PerspectiveCamera,
    maxDPR = 1.5
) {
    const handleResize = () => {
        const { clientWidth, clientHeight } = container
        const dpr = Math.min(window.devicePixelRatio, maxDPR)

        renderer.setPixelRatio(dpr)
        renderer.setSize(clientWidth, clientHeight, false)

        camera.aspect = clientWidth / clientHeight
        camera.updateProjectionMatrix()
    }

    const start = () => {
        window.addEventListener('resize', handleResize)
        handleResize()
    }

    const stop = () => {
        window.removeEventListener('resize', handleResize)
    }

    return { start, stop }
}
