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

    public sanitizeSettings(settings: string, sort?: boolean): string {
        const settingLines = this.getSettingLines(settings);
        
        let initialState;

        const sanitizedLines = settingLines
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
                    // Get initial stated
                    if (i === 0 && !initialState) {
                        initialState = y;
                    }

                    if (y === '' || y === undefined) {
                        y = ReservedChar.WHITE_SPACE;
                    }

                    return y;
                }).join(', ');
            });

        // Sort lines
        if (sort) {
            return sanitizedLines.sort((a, b) => {
                const itemsA = this.getSettingItems(a);
                const itemsB = this.getSettingItems(b);

                // Sort maintaining initial state in the top
                if (a > b && itemsA[0] === initialState) return -1;
                if (a > b || itemsB[0] === initialState) return 1;
                if (b > a && itemsA[0] !== initialState) return -1;
              
                return 0;
            }).join('\n');
        }

        return sanitizedLines.join('\n');
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