const instances = require('./instances.json');

module.exports = {
  user: instances.User,
  group: instances.Group,
  image: instances.Image,
  builder: (type, include, target = {}) => ({
    ...type === 'user' ? {
      ...instances.User,
      GroupId: include ? 0 : null,
    } : {},
    ...type === 'group' ? {
      ...instances.Group,
    } : {},
    ...type === 'image' ? {
      ...instances.Image,
      UserId: include ? 0 : null,
    } : {},
    ...target,
    id: 0,
    updatedAt: new Date(),
    createdAt: new Date(),
  }),
};
