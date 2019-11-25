import { ReservedChar } from './common';

export class Handler {
    public getSettingLines(settings: string): string[] {
        return settings.split('\n');
    }

    public getSettingItems(lineSettings: string): string[] {
        const items = [];

        const re = /\s*,\s*/;
        lineSettings.split(re).forEach(y => items.push(y ? y.trim() : ''));

        return items;
    }

    public sanitizeSettings(settings: string): string {
        const settingLines = this.getSettingLines(settings);

        return settingLines
            .filter(x => {
                const settingItems = this.getSettingItems(x);

                // Remove empty lines
                if (settingItems.length === 0 || settingItems[0] === '') {
                    return false;
                }

                return true;
            })
            .map((x, i) => {
                return this.getSettingItems(x).map(y => {
                    if (y === '' || y === undefined) {
                        y = ReservedChar.WHITE_SPACE;
                    }

                    return y;
                }).join(', ');
            })
            .join('\n')
    }

    public changeSymbol(settings: string, targetSymbol: string, symbol: string): string {
        const lines = this.getSettingLines(settings);

        const mappedLines = lines.map(x => {
            const settingItems = this.getSettingItems(x);

           return settingItems.map((y, i) => {
                // Skip position 0, equivalent to state identifier
                if (i !== 0) {
                    y = y.replace(targetSymbol, symbol);
                }
                
                return y;
            }).join(', ');
        });

        return mappedLines.join('\n');
    }
}