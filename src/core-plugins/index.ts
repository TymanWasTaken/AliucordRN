import Plugin from "../entities/Plugin";
import CommandHandler from "./CommandHandler";
import CoreCommands from "./CoreCommands";
import NoTrack from "./NoTrack";

const plugins: Array<typeof Plugin> = [CommandHandler, CoreCommands, NoTrack];

export function startAll() {
    for (const pluginClass of plugins) {
        const { name } = pluginClass;
        try {
            window.Aliucord.logger.info("Loading CorePlugin " + name);
            const instance = new pluginClass();
            if (!instance.options) { // Check if plugin was setup correctly
                window.Aliucord.logger.error("Failed to start CorePlugin " + name + ", did not set options correctly");
                continue;
            }
            instance.start();
        } catch (e) {
            window.Aliucord.logger.error("Failed to start CorePlugin " + name, e);
        }
    }
}
