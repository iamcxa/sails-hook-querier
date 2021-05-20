import samples from '../samples';

describe('about QueryHelper.getDetail operation.', () => {
  const validateFormater = (target) => {
    return {
      ...target,
      id: 0,
      updatedAt: new Date(),
      createdAt: new Date(),
    }
  }

  it('getDetail should be success', async () => {
  });

  it('getDetail and use include models should be success', async () => {
  });

  it('update wrong modelName should be fail', async () => {
  });
});
