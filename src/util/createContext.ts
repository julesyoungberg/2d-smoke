const EXTENSIONS = ['EXT_color_buffer_float', 'OES_texture_float_linear'];
const extensionRefs = {};

/**
 * create WebGL context with required extensions
 */
export default function createContext() {
    const gl: WebGLRenderingContext = (document.getElementById('webgl-canvas') as any).getContext(
        'webgl2'
    );
    if (!gl) {
        alert('need WebGL2');
        return undefined;
    }

    for (let i = 0; i < EXTENSIONS.length; i++) {
        const ext = EXTENSIONS[i];
        extensionRefs[ext] = gl.getExtension(ext);
        if (!ext) {
            alert(`need ${ext}`);
            return undefined;
        }
    }

    return gl;
}
