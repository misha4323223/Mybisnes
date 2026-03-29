const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  rewriteRequestUrl: (url) => {
    return url.replace(/([?&])lazy=true/g, "$1lazy=false");
  },
};

module.exports = config;
