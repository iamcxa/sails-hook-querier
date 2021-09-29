const samples = require('../samples');

describe('about QueryHelper select operation.', function () {
  const input = {
    ...samples.group,
    Users: {
      ...samples.user,
      Image: samples.image,
    },
  };
  let createdGroups;
  const baseSize = 10;
  const perPage = 10;
  before('before test QueryHelper select operation.', async function () {
    await Group.destroy({
      where: {},
    });
    createdGroups = await SeedHelper.create({
      size: baseSize * 3,
      model: Group,
      include: [User],
      data: (i) => {
        if (i < 1) {
          return {
            ...input,
            name: 'targetItem',
          };
        }

        if (i < baseSize) {
          return {
            ...input,
            name: input.name + i,
          };
        }

        if (i < baseSize * 2) {
          return {
            ...input,
            name: 'test',
          };
        }
        return input;
      },
    });

    createdGroups.length.should.be.equal(baseSize * 3);
  });

  after('after test QueryHelper select operation.', async function () {
    await Group.destroy({
      where: {},
    });
    await User.destroy({
      where: {},
    });
  });

  it('select should be success', async function () {
    const result1 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRequest({
        name: input.name,
      })
      .useWhere((request) => ({
        name: `${request.name}%`,
      }))
      .useSearchable({
        name: 'like',
      })
      .usePresenter((data) => ({
        name: data.name,
        formatted: true,
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });

    const result2 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRequest({
        name: input.name,
      })
      .useWhere((request) => ({
        name: `${request.name}%`,
      }))
      .useSearchable({
        name: 'like',
      })
      .usePresenter(async (data) => ({
        name: data.name,
        formatted: true,
      }))
      .findAll({});

    result1.items.length.should.equal(perPage);
    result2.items.length.should.equal(baseSize * 2 - 1);
    result1.items[0].formatted.should.equal(true);
    result2.items[0].formatted.should.equal(true);
  });

  it('searchable should be success', async function () {
    const result1 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useWhere(() => ({
        name: undefined,
      }))
      .useSearchable({
        name: {
          operator: '<>',
          condition: 'and',
          defaultValue: 'public',
        },
      })
      .usePresenter((data) => ({
        name: data.name,
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });
    const result2 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useWhere(() => ({
        name: undefined,
      }))
      .useSearchable({
        name: {
          operator: '<>',
          condition: 'and',
          defaultValue: 'public',
        },
      })
      .usePresenter((data) => ({
        name: data.name,
      }))
      .findAll({});

    result1.items.length.should.equal(perPage);
    result2.items.length.should.equal(baseSize * 2);
  });

  it('wong searchable should be fail', async function () {
    try {
      await QueryHelper.select(Group)
        .useScope([])
        .useInclude([
          {
            model: User,
          },
        ])
        .useAttribute(['name'])
        .useRequest({
          name: 'public',
        })
        .useWhere((request) => ({
          name: request.name,
        }))
        .useSearchable({
          name: {
            operator: 'abc',
            condition: 'def',
            defaultValue: 'public',
          },
        })
        .usePresenter((data) => ({
          name: data.name,
        }))
        .getPaging({
          curPage: 1,
          perPage,
        });
      throw Error('unknown');
    } catch (err) {
      err.message.should.be.equal('this operator not supported.');
    }
  });

  it('select useRawWhere should be success', async function () {
    const result1 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRawWhere({
        name: input.name,
      })
      .usePresenter((data) => ({
        name: data.name,
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });

    const result2 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRawWhere({
        name: input.name,
      })
      .usePresenter(async (data) => ({
        name: data.name,
      }))
      .findAll({});

    result1.items.length.should.equal(perPage);
    result1.items.forEach((e) => {
      e.name.should.be.a('string');
      e.name.should.be.equal(input.name);
    });
    result2.items.length.should.equal(baseSize);
    result2.items.forEach((e) => {
      e.name.should.be.a('string');
      e.name.should.be.equal(input.name);
    });
  });

  it('select keyword should be success', async function () {
    const result1 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRequest({
        keyword: 'test',
      })
      .useFullTextSearchByKey('keyword')
      .usePresenter((data) => ({
        name: data.name,
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });

    const result2 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRequest({
        keyword: 'test',
      })
      .useFullTextSearchByKey('keyword')
      .usePresenter(async (data) => ({
        name: data.name,
      }))
      .findAll({});

    result1.items.length.should.equal(perPage);
    result1.items.forEach((e) => {
      e.name.should.be.a('string');
      e.name.should.be.contains('test');
    });
    result2.items.length.should.equal(baseSize);
    result2.items.forEach((e) => {
      e.name.should.be.a('string');
      e.name.should.be.contains('test');
    });
  });

  it('select data should be right', async function () {
    const result1 = await QueryHelper.select(Group)
      .useInclude([
        {
          model: User,
        },
      ])
      .useScope([])
      .getPaging({
        curPage: 1,
        perPage: createdGroups.length,
        toJSON: true,
      });

    const result2 = await QueryHelper.select(Group)
      .useInclude([
        {
          model: User,
        },
      ])
      .useScope([])
      .findAll({
        toJSON: true,
      });

    SpecHelper.validateEach(
      {
        source: createdGroups,
        target: result1.items,
      },
      {
        log: false,
      },
    );

    SpecHelper.validateEach(
      {
        source: createdGroups,
        target: result2.items,
      },
      {
        log: false,
      },
    );
  });

  it('cache data performance', async function () {
    let start = process.hrtime();
    const timer = function (note, display) {
      const precision = 3; // 3 decimal places
      const elapsed = process.hrtime(start)[1] / 1000000;
      if (display) {
        sails.log(`${process.hrtime(start)[0]} s, ${elapsed.toFixed(precision)} ms - ${note}`);
      } else {
        sails.log(`- ${note}`);
      }
      start = process.hrtime();
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const max = 1000;

    timer('no cache query start');
    for (let i = 0; i < max; i++) {
      await QueryHelper.select(Group)
        .useRequest({
          name: 'get',
        })
        .useWhere((request) => ({
          name: `%${request.name}%`,
        }))
        .findAll({
          toJSON: true,
        });
    }
    await sleep(300);
    timer('no cache query done', true);
    await sleep(2000);
    timer('cached query start');
    for (let i = 0; i < max; i++) {
      const result = await QueryHelper.select(Group)
        .useRequest({
          name: 'get',
        })
        .useWhere((request) => ({
          name: `%${request.name}%`,
        }))
        .useCache({
          adapter: 'redis',
          lifetime: 10,
        })
        .findAll({
          toJSON: true,
        });
      sails.log(result);
    }
    timer('cached query done', true);
  });

  it('cache create data performance', async function () {
    let start = process.hrtime();
    const timer = function (note, display) {
      const precision = 3; // 3 decimal places
      const elapsed = process.hrtime(start)[1] / 1000000;
      if (display) {
        sails.log(`${process.hrtime(start)[0]} s, ${elapsed.toFixed(precision)} ms - ${note}`);
      } else {
        sails.log(`- ${note}`);
      }
      start = process.hrtime();
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const name = 'cachetest';
    const max = 10;

    timer('no cache create query start');
    for (let i = 0; i < max; i++) {
      await Group.create({
        ...input,
        name: `no${name}`,
      });

      const result = await QueryHelper.select(Group)
        .useRequest({
          name: `no${name}`,
        })
        .useWhere((request) => ({
          name: `%${request.name}%`,
        }))
        .findAll({
          toJSON: true,
        });
      // sails.log(result);
    }
    timer('no cache create query done', true);
    await sleep(2000);
    timer('cached create query start');
    for (let i = 0; i < max; i++) {
      await QueryHelper.select(Group)
        .useCache({
          adapter: 'redis',
          lifetime: 100,
          key: name,
        })
        .create({
          name: `${name}`,
        });

      const result = await QueryHelper.select(Group)
        .useCache({
          adapter: 'redis',
          lifetime: 100,
          key: name,
        })
        .getCache();
      sails.log(result);
    }
    timer('cached create query done', true);
  });

  it('clean cache should be success', async function () {
    const name = 'cacheclean';
    const max = 10;
    for (let i = 0; i < max; i++) {
      await QueryHelper.select(Group)
        .useCache({
          adapter: 'redis',
          lifetime: 10,
          key: name,
        })
        .create({
          name: `${name}`,
        });

      await QueryHelper.select(Group)
        .useCache({
          adapter: 'redis',
          lifetime: 10,
          ey: name,
        })
        .useRawWhere({
          name: `${name}`,
        })
        .destroy();

      const result = await QueryHelper.select(Group)
        .useRequest({
          name: 'get',
        })
        .useRawWhere({
          name: `${name}`,
        })
        .useCache({
          adapter: 'redis',
          lifetime: 10,
        })
        .findAll({
          toJSON: true,
        });
      should.not.exist(result.cached);
    }
  });
});
