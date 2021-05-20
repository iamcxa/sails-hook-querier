import samples from '../samples';

describe('about QueryHelper.create operation.', () => {
  it('create and use include models should be success', async () => {
    const input = {
      ...samples.user.create.group,
      Users: [
        {
          ...samples.user.create.user,
          Image: samples.user.create.image,
        },
      ],
    };
    const result = await QueryHelper.create(
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
      ...samples.user.create.image,
      id: 0,
      updatedAt: new Date(),
      createdAt: new Date(),
      UserId: 0,
      User: {
        ...samples.user.create.user,
        id: 0,
        updatedAt: new Date(),
        createdAt: new Date(),
        // FIXME: group 因 formatInput 關係未能正常建立
        // GroupId: 0,
        // Group: {
        // ...samples.user.create.group,
        // id: 0,
        // updatedAt: new Date(),
        // createdAt: new Date(),
        // }
      },
    };
    console.log('result=>', result);

    SpecHelper.validateEach(
      {
        source: input,
        target: result,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });
});
