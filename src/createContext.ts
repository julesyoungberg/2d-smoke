let floatTextures: any;
let floatTexturesLinear: any;

// create WebGL context with required extensions
export default function createContext() {
    const gl = (document.getElementById('webgl-canvas') as any).getContext('webgl');
    floatTextures = gl.getExtension('OES_texture_float');
    floatTexturesLinear = gl.getExtension('OES_texture_float_linear');
    if (!(floatTextures && floatTexturesLinear)) {
        alert('no floating point texture support, please update your browser');
    }
    return gl;
}