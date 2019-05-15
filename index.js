const Hapi = require('@hapi/hapi');
const authBasic = require('@hapi/basic');
const Vision = require('@hapi/vision');
const Blipp = require('blipp');
const Boom = require('boom');
const path = require('path');
const nameValidate = require('./nameValidate');

const validate = (request, username, password) => {
    // Temp DB
    const user = {
        username: 'admin',
        name: 'Administrator',
        email: 'admin@admin.com',
        password: '123456789'
    }

    if (user.username === username && user.password && password) {
        return { credentials: { user }, isValid: true };
    } else {
        return { credentials: { }, isValid: false };
    }
}

const init = async () => {
    const hapiServer = Hapi.Server({
        host: 'localhost',
        port: 3000,
        routes: {
            files: {
                relativeTo: path.join(__dirname,  'public')
            }
        }
    });

    await hapiServer.register(require('@hapi/inert'));
    await hapiServer.register({ plugin: Blipp });
    await hapiServer.register(authBasic);
    await hapiServer.register(Vision);
    hapiServer.auth.strategy('simple', 'basic', { validate });
    
    hapiServer.route({
        method: 'GET',
        path: '/{param*}',
        config: {
            handler: { 
                directory: {
                    path: '.',
                    redirectToSlash: true
                }
            }
        }
    });
    
    hapiServer.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: './templates',
        layoutPath: './templates/layouts',
        layout: true
    });

    hapiServer.route({
        method: 'GET',
        path: '/template',
        config: { 
            description: 'Handle vision API',
            handler: (request, h) => {
                return h.view('home', { name: 'Leonan' });
            }
        }
    })

    hapiServer.route({
        method: 'POST',
        path: '/{name?}',
        config: {
            description: 'Desc for home route',
            // auth: 'simple',
            validate: { payload: nameValidate },
            handler: (request, h) => {
                return 'Hello';
                const name = request.params.name ? request.params.name : '';
                const payload = request.payload;
                if (!name) {
                    return Boom.badRequest('Provide a valid name');
                }
                return h.response({ payload , params: request.params }).code(201);
                
                // const name = request.params.name ? request.params.name : 'No name';
                // const query = request.query;
                // const payload = request.payload;
    
                // console.log(payload);
                // return h.response({ payload , params: request.params }).code(201);
            }
        },
    });

    await hapiServer.start();
    console.log('Hapi Server has been started at http://localhost:3000');
};

init();