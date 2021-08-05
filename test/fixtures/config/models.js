module.exports.models = {
	datastore: `mysql-${process.env.NODE_ENV}`,
	migrate: 'safe',
};
