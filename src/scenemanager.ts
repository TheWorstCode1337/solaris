import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class SceneManager {
    private canvas: HTMLCanvasElement;
    private renderer: THREE.WebGLRenderer;
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    private composer!: EffectComposer;

    constructor(canvasId:string) {
        const el = document.getElementById(canvasId);
        if (!(el instanceof HTMLCanvasElement)) throw new Error('Canvas element with ID {$canvasId} not found');
        this.canvas = el;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: this.canvas});
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000);

        this.scene = new THREE.Scene;
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0,0,12);
        this.initLight();
        this.initComposer();
        
        window.addEventListener("resize", () => this.onResize());
    }
    private initLight():void {
        const lights: [THREE.Light, [number, number, number]][] = [
            [new THREE.DirectionalLight(0xff3333, 2.0), [-200, 100, -300]],
            [new THREE.DirectionalLight(0x4444ff, 1.5), [200, 100, -250]],
            [new THREE.HemisphereLight(0xffccaa, 0x333333, 2.25), [0,0,0]]
        ];
        lights.forEach(([light, pos]) => {
            light.position.set(...pos);
            this.scene.add(light);
        });
    }
    private initComposer():void {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.2, 0.0));
    }
    private onResize():void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    public add(obj:THREE.Object3D):void {
        this.scene.add(obj);
    }
    public render():void {
        this.composer.render();
    }
    public start(loopCallback: () => void):void {
        const animate = () => {
            requestAnimationFrame(animate);
            loopCallback();
            this.render();
        };
        animate();
    }
}