"use strict";

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::pengumuman.pengumuman", {
    config: {
        find: {
            middlewares: ["api::pengumuman.default-pengumuman-populate"],
        },
        findOne: {
            middlewares: ["api::pengumuman.default-pengumuman-populate"],
        },
    },
});