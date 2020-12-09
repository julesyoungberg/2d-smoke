/**
 * Get simulation dimensions as the nearest power of 2
 * of screen width and apropriately scaled height
 * @param width
 */
export default function getSimulationSize(width: number) {
    let n = 1;
    while (n < width) {
        n *= 2;
    }
    n /= 2;
    return n;
}
