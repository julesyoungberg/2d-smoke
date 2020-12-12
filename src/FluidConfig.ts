import { GUI } from "dat.gui";

export default class FluidConfig {
    gui: GUI;
    // texture resolutions
    simResolution = 128;
    dyeResolution = 512;
    coputeResolution = 512;
    // fluid properties
    densityDissipation = 0.001;
    pressure = 0.8;
    restTemp = 0;
    temperatureDissipation = 0.05;
    velocityDissipation = 0.05;
    viscosity = 0.101;
    vorticity = 50;
    // sim config
    pressureIterations = 50;
    splatRadius = 0.1;
    splatForce = 6000;

    constructor(gui: GUI) {
        this.gui = gui;

        gui.add(this, 'densityDissipation', 0, 1);
        gui.add(this, 'velocityDissipation', 0, 1);
        gui.add(this, 'temperatureDissipation', 0, 1);

        gui.add(this, 'pressure', 0, 1);
        gui.add(this, 'restTemp', 0, 100);
        gui.add(this, 'viscosity', 0, 500);
        gui.add(this, 'vorticity', 0, 100);

        gui.add(this, 'splatRadius', 0.001, 10);
        gui.add(this, 'splatForce', 0, 10000);
    }
}
