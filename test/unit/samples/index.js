import instances from './instances.json';

export default {
  user: instances.User,
  group: instances.Group,
  image: instances.Image,
  builder: (type, target = {}) => ({
    ...type === 'user' ? {
      ...instances.User,
      ageString: 'string',
    } : {},
    ...type === 'group' ? {
      ...instances.Group,
    } : {},
    ...type === 'image' ? {
      ...instances.Image,
    } : {},
    ...target,
    id: 0,
    updatedAt: new Date(),
    createdAt: new Date(),
  }),
};
