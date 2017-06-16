exports.DATABASE_URL =  process.env.DATABASE_URL ||
                        process.env.MONGODB_URI ||
                        'mongodb://localhost/mad-app';

exports.TEST_DATABASE_URL =  process.env.TEST_DATABASE_URL ||
                            'mongodb://localhost/test-mad-app';

exports.PORT = process.env.PORT || 8080;
