import samples from '../samples';

describe('about QueryHelper.destroy operation.', () => {
  const validateFormater = (target) => {
    return {
      ...target,
      id: 0,
      updatedAt: new Date(),
      createdAt: new Date(),
    }
  }

  it('destroy should be success', async () => {
  });

  it('destroy and use include models should be success', async () => {
  });

  it('destroy wrong modelName should be fail', async () => {
  });
});
