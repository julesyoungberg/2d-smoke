interface buildTextureOptions {
    internalFormat: number;
    format: number;
    type: number;
    width: number;
    height: number;
    src: any;
    wrapping?: number;
    filtering?: number;
}

/**
 * Builds a 2D texture based on the given options.
 * @param gl
 * @param textureID
 * @param opt
 */
export default function buildTexture(gl: any, textureID: number, opt: buildTextureOptions) {
    gl.bindTexture(gl.TEXTURE_2D, textureID);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        opt.format,
        opt.width,
        opt.height,
        0,
        opt.format,
        opt.type,
        opt.src
    );
    const wrapping = opt.wrapping || gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapping);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapping);
    const filtering = opt.wrapping || gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
}

/**
 * Builds a 2D texture of scalars
 * @param gl
 * @param textureID
 * @param width
 * @param height
 * @param src
 */
export function buildScalarTexture(
    gl: any,
    textureID: number,
    width: number,
    height: number,
    src: any
) {
    return buildTexture(gl, textureID, {
        internalFormat: gl.LUMINANCE,
        format: gl.LUMINANCE,
        type: gl.FLOAT,
        width,
        height,
        src,
    });
}

/**
 * Builds a 2D texture of vec2s
 * @param gl
 * @param textureID
 * @param width
 * @param height
 * @param src
 */
export function buildVec2Texture(
    gl: any,
    textureID: number,
    width: number,
    height: number,
    src: any
) {
    return buildTexture(gl, textureID, {
        internalFormat: gl.LUMINANCE_ALPHA,
        format: gl.LUMINANCE_ALPHA,
        type: gl.FLOAT,
        width,
        height,
        src,
    });
}

/**
 * Build a 2D texture of vec3s
 * @param gl
 * @param width
 * @param height
 * @param src
 */
export function buildVec3Texture(
    gl: any,
    textureID: number,
    width: number,
    height: number,
    src: any
) {
    return buildTexture(gl, textureID, {
        internalFormat: gl.RGB,
        format: gl.RGB,
        type: gl.FLOAT,
        width,
        height,
        src,
    });
}
