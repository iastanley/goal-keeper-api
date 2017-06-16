exports.DATABASE_URL =  process.env.DATABASE_URL ||
                        process.env.MONGODB_URI ||
                        'mongodb://localhost/goal-keeper-db';

exports.TEST_DATABASE_URL =  process.env.TEST_DATABASE_URL ||
                            'mongodb://localhost/test-goal-keeper';

exports.PORT = process.env.PORT || 8080;
