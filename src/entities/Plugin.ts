import { Commands } from "../api/Commands";
import { Patcher } from "../api/PatcherApi";
import { Settings } from "../api/SettingsAPI";
import { Logger } from "../utils/Logger";

/**
 * Plugin class
 * You may pass a Settings Schema to have calls to
 * this.settings.get and this.settings.set validated and typed strongly
 */
export default class Plugin<SettingsSchema = any> {
    public readonly commands!: Commands;
    public readonly logger!: Logger;
    public readonly patcher!: Patcher;
    public readonly options!: IPluginOptions;

    public constructor(public readonly settings: Settings<SettingsSchema>) { }

    public get name() {
        return this.options?.name ?? this.constructor.name;
    }

    /**
     * The start method is called when your plugin is started
     */
    public start() {
        // nop
    }

    /**
     * The stop method is called when your plugin is stopped.
     * By default, this unregisters all commands and patches, so unless
     * you need to do more cleanup than that, there is no need to overwrite this.
     */
    public stop() {
        this.commands.unregisterAll();
        this.patcher.unpatchAll();
    }
}

export interface IPluginOptions {
    /**
     * The name of the plugin, if it is different than the name of the class
     */
    name?: string;
    /**
     * A short description of what this plugin does
     */
    description?: string;
    /**
     * A version number to differentiate this version of the plugin with older ones
     */
    version?: string;
}

export function PluginOptions(options: IPluginOptions) {
    return function (target: typeof Plugin) {
        Object.assign(target.prototype, {
            options,
            patcher: new Patcher(options.name ?? target.prototype.constructor.name),
            logger: new Logger(options.name ?? target.prototype.constructor.name),
            commands: new Commands(options.name ?? target.prototype.constructor.name)
        });
    };
}
