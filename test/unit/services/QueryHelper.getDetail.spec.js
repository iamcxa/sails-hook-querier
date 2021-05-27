import samples from '../samples';

describe('about QueryHelper.getDetail operation.', () => {
  it('getDetail should be success', async () => {
    const input = {
      ...samples.user,
    };

    const user = await User.create(input, {
      include: [],
    });

    const source = await QueryHelper.getDetail(
      {
        modelName: 'User',
        include: [],
        where: {
          id: user.id,
        },
      },
      {
        toJSON: true,
      },
    );

    const target = {
      ...samples.builder('user'),
      GroupId: null,
      Image: null,
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

  it('getDetail and use include models should be success', async () => {
    const input = {
      ...samples.group,
      Users: {
        ...samples.user,
        Image: samples.image,
      },
    };

    const group = await Group.create(input, {
      include: [
        {
          model: User,
          include: [Image],
        },
      ],
    });

    const result = await QueryHelper.getDetail(
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
        toJSON: true,
      },
    );

    const source = {
      ...result,
      Users: {
        ...result.Users[0],
        Image: {
          ...result.Users[0].Image,
        },
      },
    };

    const target = {
      ...samples.builder('group'),
      Users: {
        ...samples.builder('user'),
        Image: {
          ...samples.builder('Image'),
        },
      },
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

  it('getDetail wrong modelName should be fail', async () => {
    const input = {
      ...samples.user,
    };

    const user = await User.create(input, {
      include: [],
    });

    try {
      await QueryHelper.getDetail(
        {
          modelName: 'test',
          input,
          where: {
            id: user.id,
          },
        },
      );
    } catch (err) {
      err.message.should.equal(
        JSON.stringify({ message: 'BadRequest.Target.Model.Not.Exits', code: 400, extra: { modelName: 'test' } }),
      );
    }
  });

  it('getDetail with options should be success', async () => {
    const input = {
      ...samples.group,
      Users: {
        ...samples.user,
        Image: samples.image,
      },
    };

    const group = await Group.create(input, {
      include: [
        {
          model: User,
          include: [Image],
        },
      ],
    });

    const result = await QueryHelper.getDetail(
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
        attributes: ['name'],
      },
      {
        view: true,
        toJSON: true,
        log: true,
      },
    );

    const source = {
      ...result,
      Users: {
        ...result.Users[0],
        Image: {
          ...result.Users[0].Image,
        },
      },
    };

    const target = {
      name: 'string',
      Users: {
        ...samples.builder('user'),
        Image: {
          ...samples.builder('Image'),
        },
      },
      _fields: [],
      _associations: [],
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
});
