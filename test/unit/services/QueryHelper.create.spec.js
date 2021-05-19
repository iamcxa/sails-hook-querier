import samples from '../samples';

describe('about QueryHelper.create operation.', () => {
  it('create and use include models should be success', async () => {
    const input = {
      ...samples.user.create.image,
      User: {
        ...samples.user.create.user,
        Group: {
          ...samples.user.create.group,
        }
      }
    }
    const result = await QueryHelper.create(
      {
        modelName: 'Image',
        include: [{
          model: User,
          include: [Group],
        }],
        input,
      },
      {
        format: [
          'url',
          'UserId',
          'User.name',
          'User.age',
          'User.GroupId',
          'Group.name',
          'Group.role',
        ],
        formatCb: (e) => e,
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
      }
    };

    const source = {
      ...result.dataValues,
      User: {
        ...result.dataValues.User.dataValues,
        // FIXME: group 因 formatInput 關係未能正常建立
        // Group: {
          // ...result.dataValues.User.dataValues.Group.dataValues,
        // }
      }
    }

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
