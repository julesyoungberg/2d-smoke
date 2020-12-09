import * as twgl from 'twgl.js';

import createContext from './util/createContext';
import FluidSimulator from './FluidSimulator';

const gl = createContext();

const fluidSimulator = new FluidSimulator(gl);
fluidSimulator.setup();

function render(time: number) {
    twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    fluidSimulator.update(time);
    fluidSimulator.draw();

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
