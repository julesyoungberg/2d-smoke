import * as twgl from 'twgl.js';

import createContext from './util/createContext';
import FluidSimulator from './FluidSimulator';
import getSimulationSize from './util/getSimulationSize';

const gl = createContext();

const size = getSimulationSize(gl.canvas.width);

const fluidSimulator = new FluidSimulator(gl, size);
fluidSimulator.setup();

function render(time: number) {
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    fluidSimulator.update(time);
    fluidSimulator.draw();

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
