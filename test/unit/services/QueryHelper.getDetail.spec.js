import samples from '../samples';

describe('about QueryHelper.getDetail operation.', () => {
  const validateFormater = (target) => ({
    ...target,
    id: 0,
    updatedAt: new Date(),
    createdAt: new Date(),
  });

  it('getDetail should be success', async () => {
    const input = {
      ...samples.create.User,
    };

    const user = await QueryHelper.create(
      {
        modelName: 'User',
        input,
      },
      {
        formatCb: (e) => e,
        toJSON: true,
      },
    );

    const source = await QueryHelper.getDetail(
      {
        modelName: 'User',
        include: [],
        where: {
          id: user.id,
        },
      },
      {
        // log: true,
      },
    );

    const target = validateFormater({
      ...samples.getDetail.User,
      ageString: 'string',
    });

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

  it('getDetail and use include models should be success', async () => {
    const input = {
      ...samples.create.Group,
      Users: {
        ...samples.create.User,
        Image: samples.create.Image,
      },
    };

    const group = await QueryHelper.create(
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
        Images: [{
          ...validateFormater(samples.create.Image),
        }],
      }],
    };

    const source = await QueryHelper.getDetail(
      {
        modelName: 'Group',
        include: [
          {
            model: User,
            include: [Image],
          },
        ],
        where: {
          id: group.id,
        },
      },
      {
        // log: true,
      },
    );

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

  it('update wrong modelName should be fail', async () => {
    const input = {
      ...samples.destroy.User,
    };

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

    try {
      await QueryHelper.getDetail(
        {
          modelName: 'test',
          input,
          where: {
            id: user.id,
          },
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
