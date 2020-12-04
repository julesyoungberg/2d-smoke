/**
 * Get simulation dimensions as the nearest power of 2 of screen width and apropriately scaled height
 * @param width
 * @param height
 */
export default function getSimulationDimensions(width: number, height: number) {
    let n = 1;
    while (n < width) {
        n *= 2;
    }
    n /= 2;

    const scale = n / width;
    const scaledheight = height * scale;

    return { width: n, height: scaledheight };
}
