let floatTextures: any;
let floatTexturesLinear: any;
let textureHalfFloat: any;
let textureHalfFloatLinear: any;

/**
 * create WebGL context with required extensions
 */
export default function createContext() {
    const gl = (document.getElementById('webgl-canvas') as any).getContext('webgl');
    floatTextures = gl.getExtension('OES_texture_float');
    floatTexturesLinear = gl.getExtension('OES_texture_float_linear');
    textureHalfFloat = gl.getExtension('OES_texture_half_float');
    textureHalfFloatLinear = gl.getExtension('OES_texture_half_float_linear');
    return gl;
}
