import { text } from 'stream/consumers';
import * as THREE from 'three';

export class Planet{
    public mesh:THREE.Mesh;
    public atmosphere:THREE.Mesh;
    public material: THREE.MeshStandardMaterial;
    private atmMat: THREE.ShaderMaterial;

    constructor(texturePath: string){
        const loader = new THREE.TextureLoader();
        const tex = loader.load(texturePath);

        this.material = new THREE.MeshStandardMaterial({
            map: tex, roughness: 0.1, metalness: 0.5,
            color: 0x0000FF, opacity: 0, transparent: true
        });

        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 64), this.material);
        this.atmMat = new THREE.ShaderMaterial({
            uniforms: {opacity: {value: 0} },
            vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
            fragmentShader: `
            varying vec3 vNormal;
            uniform float opacity;
            void main() {
                float intensity = pow(0.69 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
                gl_FragColor = vec4(0.1, 0.2, 2.5, opacity) * intensity;
            }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        this.atmosphere = new THREE.Mesh(new THREE.SphereGeometry(5.2, 64, 64), this.atmMat);
    }

    public get objects(): THREE.Object3D[] {
        return [this.mesh, this.atmosphere];
    }

    public setOpacity(v:number):void {
        this.material.opacity = v;
        this.atmMat.uniforms.opacity!.value = v * 0.6;
    }

    public update():void {
        this.mesh.rotation.y += 0.005;
    }
}