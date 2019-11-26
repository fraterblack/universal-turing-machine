import './styles/app.scss';
import 'bootstrap';

import { ReservedChar, UtmIteration } from './common';
import { Handler } from './handler';
import { Interpreter } from './interpreter';
import { Validator } from './validator';

export class Utm {
    private interpreter: Interpreter;
    private handler: Handler;
    private validator: Validator;
    
    private settingsEditor = document.getElementById('settingsEditor');
    private initialSymbolEditor = document.getElementById('initialSymbol');
    private stopSymbolEditor = document.getElementById('stopSymbol');
    private initialSettingEditor = document.getElementById('initialSetting');
    private delayEditor = document.getElementById('delay');
    private btnImport = document.getElementById('btnImport');
    private btnStart = document.getElementById('btnStart');
    private btnStop = document.getElementById('btnStop');
    private tape = document.getElementById('tape');

    private summary = document.getElementById('summary');
    private summaryState = document.getElementById('summaryState');
    private summaryTotalStates = document.getElementById('summaryTotalStates');
    private summaryTotalIterations = document.getElementById('summaryTotalIterations');

    private autoOrganize = document.getElementById('autoOrganize');

    private initialSymbol = '>';
    private stopSymbol = '!';
    private settings: string;
    private initialSetting: string;
    private delay = 200;
    private activeTimer: any;

    constructor() {
        this.handler = new Handler();
        this.validator = new Validator();
        this.interpreter = new Interpreter();
        
        // Set default values
        this.settingsEditor.textContent = this.settings = `q0, ${this.initialSymbol}`;
        this.initialSymbolEditor.setAttribute('value', this.initialSymbol);
        this.stopSymbolEditor.setAttribute('value', this.stopSymbol);
        this.initialSetting = this.initialSymbol;
        this.initialSettingEditor.setAttribute('value', this.initialSymbol);
        this.delayEditor.setAttribute('placeholder', `${this.delay} ms`);
        this.autoOrganize.setAttribute('checked', 'true');

        // Set event listeners
        this.settingsEditor.addEventListener('change', this.onSettingsChange.bind(this));
        this.settingsEditor.addEventListener('focus', this.onSettingsFocus.bind(this));
        this.settingsEditor.addEventListener('blur', this.onSettingsBlur.bind(this));
        this.initialSymbolEditor.addEventListener('change', this.onInitialSymbolChange.bind(this));
        this.stopSymbolEditor.addEventListener('change', this.onStopSymbolChange.bind(this));
        this.initialSettingEditor.addEventListener('change', this.onInitialSettingChange.bind(this));
        this.delayEditor.addEventListener('change', this.onDelayChange.bind(this));
        this.btnImport.addEventListener('click', this.onBtnImportClick.bind(this));
        this.btnStart.addEventListener('click', this.onBtnStartClick.bind(this));
        this.btnStop.addEventListener('click', this.onBtnStopClick.bind(this));
        this.autoOrganize.addEventListener('change', this.onAutoOrganizeChange.bind(this));

        // Help Text
        document.getElementById('settingsEditorHelpText').innerHTML = `Caracteres reservados:<br>
        <strong>Espaço em Branco:</strong> ${ReservedChar.WHITE_SPACE}<br>               
        <strong>Mover Direita:</strong> ${ReservedChar.LEFT_DIRECTION}<br>          
        <strong>Mover Esquerda:</strong> ${ReservedChar.RIGHT_DIRECTION}`;
        
        this.populateTape(this.initialSetting);
    }

    private onSettingsFocus(event: Event): void {
        this.settingsEditor.removeAttribute('title');
        this.settingsEditor.classList.remove('is-invalid');
    }

    private onSettingsBlur(event: Event): void {
        try {
            // Validate if state is valid
            this.validator.validateSettings(event.currentTarget['value'], this.initialSymbol, this.stopSymbol);
        } catch(err) {
            this.settingsEditor.setAttribute('title', err);
            this.settingsEditor.classList.add('is-invalid');
        }
    }
    
    private onSettingsChange(event: Event): void {
        if (this.autoOrganize['checked']) {
            this.settings = this.settingsEditor['value'] = this.handler.sanitizeSettings(event.currentTarget['value']);
        } else {
            this.settings = this.handler.sanitizeSettings(event.currentTarget['value']);
            this.settingsEditor['value'] = event.currentTarget['value'];
        }
    }

    private onInitialSymbolChange(event: Event): void {
        try {
            // Validate if initial symbol is valid
            this.validator.validateInitialSymbol(event.currentTarget['value'], this.settings, this.initialSymbol);

            const newSettings = this.handler.changeSymbol(this.settings, this.initialSymbol, event.currentTarget['value']);

            this.settingsEditor['value'] = this.settings = newSettings;
            
            this.initialSymbol = event.currentTarget['value'];
        } catch(err) {
            // Rollback value
            this.initialSymbolEditor['value'] = this.initialSymbol;

            this.bubbleError(err);
        }
    }

    private onStopSymbolChange(event: Event): void {
        try {
            // Validate if stop symbol is valid
            this.validator.validateStopSymbol(event.currentTarget['value'], this.settings, this.stopSymbol);

            const newSettings = this.handler.changeSymbol(this.settings, this.stopSymbol, event.currentTarget['value']);

            this.settingsEditor['value'] = this.settings = newSettings;
            
            this.stopSymbol = event.currentTarget['value'];
        } catch(err) {
            // Rollback value
            this.stopSymbolEditor['value'] = this.stopSymbol;

            this.bubbleError(err);
        }
    }

    private onInitialSettingChange(event: Event): void {
        this.populateTape(event.currentTarget['value'] || '');

        this.initialSetting = event.currentTarget['value'];
    }

    private onDelayChange(event: Event): void {
        this.delay = event.currentTarget['value'] || 200;
    }

    private onAutoOrganizeChange(event: Event): void {
        if (this.autoOrganize['checked']) {
            this.settingsEditor['value'] = this.settings;
        }
    }

    private onBtnImportClick(event: Event): void {
        this.openFile(this.setFileContent.bind(this));
    }

    private setFileContent(content: any) {
        try {
            // Validate if state is valid
            this.validator.validateSettings(content, this.initialSymbol, this.stopSymbol);

            this.settings = this.settingsEditor['value'] = this.handler.sanitizeSettings(content);
        } catch(err) {
            this.settings = this.settingsEditor['value'] = content;

            this.bubbleError(err);
        }
    }

    private onBtnStartClick(event: Event): void {
        try {
            // Validations
            this.validator.validateSettings(this.settings, this.initialSymbol, this.stopSymbol);
            this.validator.validateInitialSetting(this.initialSetting, this.initialSymbol);

            // Start interpreter
            const executor = this.interpreter.execute(this.settings, this.initialSetting, this.initialSymbol, this.stopSymbol);
        
            this.runQueue.call(this, executor, this.delay);

            this.disableScreen();

            this.summary.style.display = 'block';
        } catch(err) {
            this.bubbleError(err);
        }
    }

    private runQueue(executor: any, delay: number): void {
        try {
            if (executor.hasNext()) {
                const iteration: UtmIteration = executor.next();
    
                this.summaryState.innerText = iteration.currentState;
                this.summaryTotalStates.innerText = iteration.totalStates.toString();
                this.summaryTotalIterations.innerText = iteration.totalIterations.toString();
    
                this.populateTape(iteration.tape.join(''), iteration.tapePosition);
                
                this.activeTimer = setTimeout(this.runQueue.bind(this, executor, delay), delay);
            } else {
                setTimeout(() => alert('Concluído!'), 500);
    
                this.enableScreen();
            }
        } catch(err) {
            this.enableScreen();
            
            this.bubbleError(err);
        }
    }

    private onBtnStopClick(event: Event): void {
        if (this.activeTimer) {
            clearTimeout(this.activeTimer);
        }

        alert('Interrompido pelo usuário!');

        this.enableScreen();
    }

    private populateTape(initialSetting: string, activeIndex?: number) {
        const symbols = initialSetting.split('');

        this.tape.innerHTML = '';

        let liElements = '';

        symbols.forEach((x, i) => {
            const liClass = activeIndex != undefined && activeIndex === i ? 'utm-active' : '';

            liElements += `<li class="${liClass}">${x === ReservedChar.WHITE_SPACE ? ' ' : x}</li>`;
        });

        this.tape.innerHTML = liElements;
    }

    private bubbleError(message: string) {
        setTimeout(() => {
            alert(message);
        }, 150);
    }

    private disableScreen() {
        this.btnStop.removeAttribute('disabled');

        this.btnStart.setAttribute('disabled', 'true');
        this.btnImport.setAttribute('disabled', 'true');

        this.initialSymbolEditor.setAttribute('readonly', 'true');
        this.stopSymbolEditor.setAttribute('readonly', 'true');
        this.initialSettingEditor.setAttribute('readonly', 'true');
        this.settingsEditor.setAttribute('readonly', 'true');
        this.delayEditor.setAttribute('readonly', 'true');
    }

    private enableScreen() {
        this.btnStop.setAttribute('disabled', 'true');

        this.btnStart.removeAttribute('disabled');
        this.btnImport.removeAttribute('disabled');

        this.initialSymbolEditor.removeAttribute('readonly')
        this.stopSymbolEditor.removeAttribute('readonly');
        this.initialSettingEditor.removeAttribute('readonly');
        this.settingsEditor.removeAttribute('readonly');
        this.delayEditor.removeAttribute('readonly');
    }

    private openFile(func: any) {
        const readFile = (e: any) => {
            var file = e.target.files[0];
            if (!file) {
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                var contents = e.target.result;
                fileInput['func'](contents)
                document.body.removeChild(fileInput)
            }
            reader.readAsText(file)
        };

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        fileInput.onchange = readFile;
        fileInput['func'] = func;
        fileInput.accept = '.txt';
        document.body.appendChild(fileInput);

        this.clickElem(fileInput);
    }

    private clickElem(elem: any) {
        const eventMouse = document.createEvent('MouseEvents');
        eventMouse.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        elem.dispatchEvent(eventMouse);
    }
}

let utm = new Utm();