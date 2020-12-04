interface createTextureOptions {
    internalFormat: number;
    format: number;
    type: number;
    width: number;
    height: number;
    src: any;
}

export default function createTexture(gl: any, opt: createTextureOptions) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, opt.format, opt.width, opt.height, 0, opt.format, opt.type, opt.src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return texture;
}
