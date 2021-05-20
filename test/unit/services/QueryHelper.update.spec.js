import samples from '../samples';

describe('about QueryHelper.update operation.', () => {
  const validateFormater = (target) => {
    return {
      ...target,
      id: 0,
      updatedAt: new Date(),
      createdAt: new Date(),
    }
  }

  it('update should be success', async () => {
    const input = {
      ...samples.create.User,
    }

    const user = await QueryHelper.create(
      {
        modelName: 'User',
        input: {},
      },
      {
        formatCb: (e) => e,
        toJSON: true,
      },
    );

    await QueryHelper.update(
      {
        modelName: 'User',
        input,
        where: {
          id: user.id,
        }
      },
      {
        formatCb: (e) => e,
      },
    );

    const result = await User.findOne(
      {
        where: {
          id: user.id,
        },
        raw: true,
        nest: true,
      }
    );

    // FIXME: getDetail 有錯誤
    const target = {
      ...validateFormater(samples.create.User),
      GroupId: null,
      Image: validateFormater({
        url: null,
        UserId: null,
      }),
    };

    SpecHelper.validateEach(
      {
        source: result,
        target,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('update and use include models should be success', async () => {
  });

  it('update wrong modelName should be fail', async () => {
  });
});
