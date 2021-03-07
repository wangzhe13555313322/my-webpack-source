const SingleEntryPlugin = require('./SingleEntryPlugin');



const itemToPlugin = (context, item, name) => {
    // 单入口插件
    return new SingleEntryPlugin(context, item, name);
}

/**
 * 入口的插件
 */
class EntryOptionPlugin {
    apply(complier) {
        complier.hooks.entryOption.tap('EntryOptionPlugin', (context, entry) => {
            itemToPlugin(context, entry, 'main').apply(complier);
        })
    }
}

module.exports = EntryOptionPlugin;