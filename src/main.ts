import { SceneManager } from "./scenemanager";
import { Planet } from "./planet";
import { LangManager } from "./lang";
import { AnimControl } from "./anim";

const sceneManager = new SceneManager("three-canvas");
const planet = new Planet("/image/planet.jpg");
planet.objects.forEach(obj => sceneManager.add(obj));

const langManager = new LangManager("ru");
const anim = new AnimControl(planet, () => langManager.applyLanguage(localStorage.getItem('lang') || 'ru'));

sceneManager.start(() => {
    planet.update();
});
anim.startAnim();