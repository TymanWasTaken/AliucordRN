import { Theme } from "../entities";
import { Constants, Dialog, ReactNative } from "../metro";

export const themes = {} as Record<string, Theme>;
export let currentTheme: Theme;
export let themeApplied: boolean, themeErrorReason;
let discordConstants: typeof Constants;
enum ThemeType {
    DARK,
    LIGHT,
    AMOLED
}

const { externalStorageDirectory } = window.nativeModuleProxy.AliucordNative;
const SETTINGS_DIRECTORY = externalStorageDirectory + "/AliucordRN/settings/";
const THEMES_DIRECTORY = externalStorageDirectory + "/AliucordRN/themes/";

export function setTheme(theme: Theme) {
    currentTheme = themes[theme.name];
    window.Aliucord.settings.set("theme", theme.name);

    Dialog.show({
        title: "Restart for theme to apply",
        body: "Restart the app for the theme to apply correctly.",
        confirmText: "Restart",
        isDismissable: false,
        onConfirm: ReactNative.NativeModules.BundleUpdaterManager.reload
    });
}

// WARNING: this function is called before the Aliucord loads, meaning we're having limited access.
export function themerInit(constants: typeof Constants) {
    try {
        if (!AliuFS.exists(SETTINGS_DIRECTORY + "Aliucord.json")) return;
        discordConstants = constants;
        AliuHermes.unfreeze(constants.ThemeColorMap);
        AliuHermes.unfreeze(constants.Colors);
        AliuHermes.unfreeze(constants.UNSAFE_Colors);

        const settings = JSON.parse(AliuFS.readFile(SETTINGS_DIRECTORY + "Aliucord.json", "text") as string);

        for (const file of AliuFS.readdir(THEMES_DIRECTORY)) {
            if (!file.name.endsWith(".json")) continue;

            const themeFile = JSON.parse(AliuFS.readFile(THEMES_DIRECTORY + file.name, "text") as string) as Theme;

            if (!themeFile?.name || !themeFile?.theme_color_map || !themeFile?.colors) throw new Error(`Theme file ${file.name} does not contain a name, theme_color_map or colors key.`);
            if (themes[themeFile.name]) throw new Error(`A theme called ${themeFile.name} already exists.`);
            
            themes[themeFile.name] = themeFile;
        }

        if (themes[settings?.theme]) {
            currentTheme = themes[settings.theme];

            applyTheme();
        }
    } catch (e) {
        themeApplied = false;
        themeErrorReason = e;
    }
}

// WARNING: this function is called before Aliucord loads, meaning we're having limited access.
export function applyTheme() {
    try {
        if (currentTheme === undefined) return;
        for (const key in currentTheme.theme_color_map) {
            if (!discordConstants.ThemeColorMap[key]) continue;

            discordConstants.ThemeColorMap[key][ThemeType.AMOLED] = discordConstants.ThemeColorMap[key][ThemeType.DARK];
            if (currentTheme.theme_color_map[key]) {
                discordConstants.ThemeColorMap[key][ThemeType.AMOLED] = currentTheme.theme_color_map[key]?.[ThemeType.DARK];
                discordConstants.ThemeColorMap[key][ThemeType.LIGHT] = currentTheme.theme_color_map[key]?.[ThemeType.LIGHT];
                discordConstants.ThemeColorMap[key][ThemeType.DARK] = currentTheme.theme_color_map[key]?.[ThemeType.DARK];
            }
        }

        // Enmity compat
        if (currentTheme.colors && !currentTheme.colours) {
            for (const key in currentTheme.colors) {
                if (!discordConstants.Colors[key]) continue;

                discordConstants.Colors[key] = currentTheme.colors[key];
            }
        } else {
            for (const key in currentTheme.colours) {
                if (!discordConstants.Colors[key]) continue;

                discordConstants.Colors[key] = currentTheme.colours[key];
            }
        }

        for (const key in currentTheme.unsafe_colors) {
            if (!discordConstants.UNSAFE_Colors[key]) continue;

            discordConstants.UNSAFE_Colors[key] = currentTheme.unsafe_colors[key];
        }

        if (!currentTheme.theme_color_map["CHAT_BACKGROUND"]) {
            discordConstants.ThemeColorMap.CHAT_BACKGROUND[ThemeType.AMOLED] = currentTheme.theme_color_map["BACKGROUND_PRIMARY"][ThemeType.DARK];
            discordConstants.ThemeColorMap.CHAT_BACKGROUND[ThemeType.LIGHT] = currentTheme.theme_color_map["BACKGROUND_PRIMARY"][ThemeType.LIGHT];
            discordConstants.ThemeColorMap.CHAT_BACKGROUND[ThemeType.DARK] = currentTheme.theme_color_map["BACKGROUND_PRIMARY"][ThemeType.DARK];
        }

        themeApplied = true;
    } catch (e) {
        themeApplied = false;
        themeErrorReason = e;
    }
}

export function useDiscordThemes() {
    window.Aliucord.settings.set("theme", "");

    console.info("Using Discord's themes");
    Dialog.show({
        title: "Restart to apply",
        body: "Restart the app for Discord to use its own themes.",
        confirmText: "Restart",
        isDismissable: false,
        onConfirm: ReactNative.NativeModules.BundleUpdaterManager.reload
    });
}