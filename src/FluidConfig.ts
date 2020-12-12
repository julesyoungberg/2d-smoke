import { GUI } from "dat.gui";

export default class FluidConfig {
    gui: GUI;

    // texture resolutions
    simResolution = 128;
    dyeResolution = 512;
    coputeResolution = 512;

    // fluid properties
    buoyancy = 1;
    buoyancyKappa = 0.25;
    buoyancySigma = 0.1;
    color = [100, 100, 100];
    densityDissipation = 0.01;
    gravity = 0; // 100;
    pressure = 0.8;
    // rest temperature of the fluid
    // 10 for smoke
    // 15 for clouds
    restTemp = 10;
    temperatureDissipation = 0.01;
    velocityDissipation = 0.01;
    viscosity = 0.101;
    vorticity = 40;

    // sim config
    pressureIterations = 50;
    splatRadius = 0.1;
    splatForce = 6000;

    constructor(gui: GUI) {
        this.gui = gui;

        gui.addColor(this, 'color');

        gui.add(this, 'densityDissipation', 0, 0.5);
        gui.add(this, 'velocityDissipation', 0, 0.5);
        gui.add(this, 'temperatureDissipation', 0, 0.5);

        gui.add(this, 'buoyancy', 0, 2);
        gui.add(this, 'buoyancyKappa', 0, 1);
        gui.add(this, 'buoyancySigma', 0, 1);
        gui.add(this, 'gravity', 0, 1000);
        gui.add(this, 'pressure', 0, 1);
        gui.add(this, 'restTemp', 0, 30);
        gui.add(this, 'viscosity', 0, 500);
        gui.add(this, 'vorticity', 0, 100);

        gui.add(this, 'splatRadius', 0.001, 10);
        gui.add(this, 'splatForce', 0, 10000);
    }

    getColor() {
        return this.color.map(c => c / (255 * 50));
    }
}
