import {gsap} from "gsap";
import { Planet } from "./planet";

export class AnimControl {
    constructor (private planet:Planet, private onLangReveal: () => void) {}

    public startAnim():void {
        const tl = gsap.timeline()
            .to(this.planet.material, {
                opacity: 1, 
                duration: 2,
                onUpdate: () => this.planet.setOpacity(this.planet.material.opacity)
            })
            .to([this.planet.mesh.scale, this.planet.atmosphere.scale], 
                { x: 0.89, y: 0.89, z: 0.89, duration: 2, ease: "power2.inOut" })
            .to(this.planet.material, 
                { opacity: 0.55, durationa: 2, ease: "power2.inOut" }, "<" )
            .to("#dark-overlay", {
                opacity: 1, duration: 1,
                onComplete: this.onLangReveal
            });
    }
}