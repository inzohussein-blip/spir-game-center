// الألعاب ملفات HTML مستقلة (assets/games) تنحمّل بس لما تنفتح — Metro لازم يعاملها كـ assets
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('html');

module.exports = config;
