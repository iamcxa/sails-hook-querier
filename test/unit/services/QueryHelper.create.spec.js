import samples from '../samples';

describe('about QueryHelper.create operation.', () => {
  const validateFormater = (target) => ({
    ...target,
    id: 0,
    updatedAt: new Date(),
    createdAt: new Date(),
  });

  it('create should be success', async () => {
    const input = {
      ...samples.create.User,
    };

    const source = await QueryHelper.create(
      {
        modelName: 'User',
        input,
      },
      {
        formatCb: (e) => e,
        toJSON: true,
      },
    );

    const target = validateFormater(samples.create.User);

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
      ...samples.create.Group,
      Users: {
        ...samples.create.User,
        Image: samples.create.Image,
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
        formatCb: (e) => e,
      },
    );

    const target = {
      ...validateFormater(samples.create.Group),
      Users: [{
        ...validateFormater(samples.create.User),
        Image: {
          ...validateFormater(samples.create.Image),
        },
      }],
    };

    SpecHelper.validateEach(
      {
        // source: source.Users[0],
        // target: target.Users[0],
        source: source,
        target: target,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('create wrong modelName should be fail', async () => {
    const input = {
      ...samples.create.User,
    };

    try {
      await QueryHelper.create(
        {
          modelName: 'test',
          input,
        },
        {
          formatCb: (e) => e,
        },
      );
    } catch (err) {
      err.message.should.equal(
        JSON.stringify({ message: 'BadRequest.Target.Model.Not.Exits', code: 400, extra: { modelName: 'test' } }),
      );
    }
  });
});
