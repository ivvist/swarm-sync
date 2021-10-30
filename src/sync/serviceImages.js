const log = require('../utils/logger');
const { getManagedServices, updateServiceImage } = require('../docker');
const { updateTagCache, getNewestTagFromCache } = require('../registry');

async function checkAndUpdateImages() {
  const managedServices = await getManagedServices();
  if (managedServices.length === 0) {
    log.info('No swarm-sync managed services found in swarm');
    return;
  }
  log.info(`Found ${managedServices.length} swarm-sync managed services`);
  log.debug(managedServices.map(s => s.name).join(', '));

  for (const service of managedServices) {
    if (service.pattern) {
      await updateTagCache(service.current_image_repo, service.pattern);
      log.info(`Service pattern: '${service.pattern}'`)
      log.info(`Service name: '${service.name}'`)
      log.info(`Service id: '${service.id}'`)
      log.info(`Service image tag: '${service.current_image_tag}'`)
      log.info(`Service image repo: '${service.current_image_repo}'`)
      const newestTag = getNewestTagFromCache(
        service.current_image_repo,
        service.pattern
      );

      log.trace(
        `Newest matching tag for '${
          service.name
        }' found is '${newestTag}' (current tag '${service.current_image_tag}')`
      );

      if (newestTag && newestTag !== service.current_image_tag) {
        await updateServiceImage(
          service.id,
          `${service.current_image_repo}:${newestTag}`
        );
      }
    }
  }
}

module.exports = {
  checkAndUpdateImages
};
