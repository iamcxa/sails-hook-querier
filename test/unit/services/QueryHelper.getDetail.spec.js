import samples from '../samples';

describe('about QueryHelper.getDetail operation.', function () {
  it('getDetail should be success', async function () {
    const input = {
      ...samples.user,
    };

    const user = await User.create(input, {
      include: [],
    });

    const target = await QueryHelper.getDetail(
      {
        modelName: 'User',
        include: [],
        where: {
          id: user.id,
        },
      },
      {
        raw: true,
      },
    );

    const source = {
      ...samples.builder('user'),
      Image: null,
    };

    SpecHelper.validateEach(
      {
        target,
        source,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('getDetail and use include models should be success', async function () {
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

    const target = await QueryHelper.getDetail(
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
        raw: true,
      },
    );

    const source = {
      ...samples.builder('group'),
      Users: {
        ...samples.builder('user', true),
        Image: {
          ...samples.builder('image', true),
        },
      },
    };

    SpecHelper.validateEach(
      {
        target,
        source,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('getDetail wrong modelName should be fail', async function () {
    const input = {
      ...samples.user,
    };

    const user = await User.create(input, {
      include: [],
    });

    try {
      await QueryHelper.getDetail({
        modelName: 'test',
        input,
        where: {
          id: user.id,
        },
      });
    } catch (err) {
      err.message.should.equal(
        JSON.stringify({
          message: 'BadRequest.Target.Model.Not.Exits',
          code: 400,
          extra: { modelName: 'test' },
        }),
      );
    }
  });

  it('getDetail with options should be success', async function () {
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

    const target = await QueryHelper.getDetail(
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
        raw: true,
        view: true,
        log: true,
      },
    );

    const source = {
      ...samples.builder('group'),
      Users: {
        ...samples.builder('user', true),
        Image: {
          ...samples.builder('image', true),
        },
      },
      _fields: [
        {
          values: null,
          name: 'name',
          limit: 254,
          type: 'string',
          label: 'model.Group.name',
          required: true,
          readonly: false,
        },
      ],
      _associations: ['Users'],
    };

    SpecHelper.validateEach(
      {
        target,
        source,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });
});
