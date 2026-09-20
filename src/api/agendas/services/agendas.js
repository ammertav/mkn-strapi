'use strict';

/**
 * agendas service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::agendas.agendas');
