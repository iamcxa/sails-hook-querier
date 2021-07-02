import samples from '../samples';

describe('about QueryHelper.create operation.', () => {
  it('create should be success', async () => {
    const input = {
      ...samples.user,
    };

    const source = await QueryHelper.create(
      {
        modelName: 'User',
        include: [],
        input,
      },
      {
        toJSON: true,
      },
    );

    const target = samples.builder('user');

    SpecHelper.validateEach(
      {
        source,
        target,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('create and use include models should be success', async () => {
    const input = {
      ...samples.group,
      Users: {
        ...samples.user,
        Image: samples.iamge,
      },
    };

    const source = await QueryHelper.create(
      {
        modelName: 'Group',
        include: [
          {
            model: User,
            include: [Image],
          },
        ],
        input,
      },
      {
        toJSON: true,
      },
    );

    const target = {
      ...samples.builder('group'),
      Users: [{
        ...samples.builder('user', true),
        Image: {
          ...samples.builder('image', true),
        },
      }],
    };

    SpecHelper.validateEach(
      {
        source,
        target,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('create wrong modelName should be fail', async () => {
    const input = {
      ...samples.user,
    };

    try {
      await QueryHelper.create(
        {
          modelName: 'test',
          input,
        },
      );
    } catch (err) {
      err.message.should.equal(
        JSON.stringify({ message: 'BadRequest.Target.Model.Not.Exits', code: 400, extra: { modelName: 'test' } }),
      );
    }
  });
});
