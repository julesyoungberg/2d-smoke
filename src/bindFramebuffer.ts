import { bindFramebufferInfo } from "twgl.js";

export default function bindFramebuffer(gl: any, framebuffer: number, width: number, height: number) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, width, height);
}
