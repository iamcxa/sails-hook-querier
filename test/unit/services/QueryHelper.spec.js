import samples from '../samples';

describe('about QueryHelper operation.', () => {
  it('getModelColumnType should be success', async () => {
    const result = QueryHelper.getModelColumnType({
      modelName: 'User',
      columnName: 'name',
    });

    result.toLowerCase().should.be.equal(typeof samples.user.name);
  });
});
