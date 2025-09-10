const possible = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*";

export class LangManager {
    private translations: Record<string, {header?: string, pheader?: string, title?: string}> = {};
    private isReaviling = false;
    private pendLang:string;
    constructor(defaultLang: string = 'ru') {
        this.pendLang = localStorage.getItem('lang') || defaultLang;
        fetch('lang.json')
            .then(res => res.json())
            .then(data => {
                this.translations = data;
                this.applyLanguage(this.pendLang, false);
            });
        document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isReaviling && !btn.disabled) {
                    const newLang = btn.dataset.lang!;
                    localStorage.setItem('lang', newLang);
                    this.applyLanguage(newLang);
                }
            });
        });
    }

    private async scrumbleSymbol(char:string, elementID: string, curText:string, iteration = 7): Promise<string> {
        const textEl = document.getElementById(elementID);
        if (!textEl) return curText;
        for (let i = 0; i < iteration; i++) {
            textEl.textContent = curText + possible[Math.floor(Math.random() * possible.length)];
            await new Promise(r=> setTimeout(r, 30));
        }
        return curText + char;
    }

    private async revealWord(text:string, elementID:string, iteration:number) :Promise<void> {
        const textEl = document.getElementById(elementID);
        if (!textEl) return;

        this.isReaviling = true;
        let revealLocal = "";

        for (let char of text) {
            revealLocal = await this.scrumbleSymbol(char, elementID, revealLocal, iteration);
            textEl.textContent = revealLocal;
        }
        this.isReaviling = false;
    }

    private revealLanguage(lang:string) {
        const t = this.translations[lang];
        if (!t) return;
        if(t.header) {
            this.revealWord(t.header, "header", 7).then(() => {
                if(t.pheader) this.revealWord(t.pheader, "pheader", 3);
            });
        }
    }

    public applyLanguage(lang:string, doReveal:boolean = true) {
        const t = this.translations[lang];
        this.pendLang = lang;

        const header = document.getElementById("header");
        const pheader = document.getElementById("pheader");

        if(header) header.textContent = "";
        if(pheader) pheader.textContent = "";

        if(!t) return;
        if(t.title) document.title = t.title;

        if(doReveal) this.revealLanguage(lang);

        const langSwitch = document.getElementById('lang-switch');
        if(langSwitch) langSwitch.setAttribute('data-archive', lang);

        document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach(btn => {
            btn.disabled = btn.dataset.lang === lang;
            btn.classList.toggle('disabled', btn.disabled);
        });
    }
}