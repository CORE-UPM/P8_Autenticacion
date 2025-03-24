/* eslint-disable no-invalid-this*/
/* eslint-disable no-undef*/
const path = require("path");
const {has_failed,checkFileExists,create_browser,from_env,ROOT,path_assignment, warn_errors, scored} = require("../utils/testutils");
const fs = require("fs");
const net = require('net');
const spawn = require("child_process").spawn;
const util = require('util');
const exec = util.promisify(require("child_process").exec);

const PATH_ASSIGNMENT = path_assignment("blog");
const TIMEOUT =  parseInt(from_env("TIMEOUT", 6000));
const TEST_PORT =  parseInt(from_env("TEST_PORT", "3001"));

let browser = create_browser();

var server;


describe("Tests Práctica 8", function() {
    after(function () {
        warn_errors();
    });

    describe("Prechecks", function () {
	      scored(`Comprobando que existe la carpeta de la entrega: ${PATH_ASSIGNMENT}`,
               -1,
               async function () {
                   this.msg_err = `No se encontró la carpeta '${PATH_ASSIGNMENT}'`;
                   (await checkFileExists(PATH_ASSIGNMENT)).should.be.equal(true);
	             });

        scored(`Comprobar que se han añadido plantillas express-partials`, -1, async function () {
            this.msg_ok = 'Se incluye layout.ejs';
            this.msg_err = 'No se ha encontrado views/layout.ejs';
            fs.existsSync(path.join(PATH_ASSIGNMENT, "views", "layout.ejs")).should.be.equal(true);
        });


        scored(`Comprobar que las plantillas express-partials tienen los componentes adecuados`, -1, async function () {
            this.msg_ok = 'Se incluyen todos los elementos necesarios en la plantilla';
            this.msg_err = 'No se ha encontrado todos los elementos necesarios';
            let checks = {
                "layout.ejs": {
                    true: [/<%- body %>/g, /<header/, /<\/header>/, /<nav/, /<\/nav/, /<main/, /<\/main/, /<footer/, /<\/footer>/]
                },
                "index.ejs": {
                    true: [/<h1/, /<\/h1>/],
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("posts", "index.ejs")]: {
                    true: [/<section/, /<\/section>/, /<article/, /<\/article>/],
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("posts", "show.ejs")]: {
                    true: [/<article/, /<\/article>/],
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("posts", "new.ejs")]: {
                    true: [/<form/, /<\/form>/, /include/, /_form\.ejs/],
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("posts", "edit.ejs")]: {
                    true: [/<form/, /<\/form>/, /include/, /_form\.ejs/],
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("posts", "_form.ejs")]: {
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("attachments", "_attachment.ejs")]: {
                    true: [/<img/, /\/images\/none.png/],
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("users", "index.ejs")]: {
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("users", "show.ejs")]: {
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("users", "new.ejs")]: {
                    true: [/<form/, /<\/form>/, /include/, /_form\.ejs/],
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("users", "edit.ejs")]: {
                    true: [/<form/, /<\/form>/, /include/, /_form\.ejs/],
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("users", "_form.ejs")]: {
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                },
                [path.join("session", "new.ejs")]: {
                    true: [/<form/, /<\/form>/],
                    false: [/<body/, /<\/body>/, /<html/, /<\/html>/, /<nav/, /<\/nav>/]
                }
            }

            for (fpath in checks) {
                this.msg_err = `No se encuentra el fichero ${fpath}`;
                let templ = fs.readFileSync(path.join(PATH_ASSIGNMENT, "views", fpath), "utf8");
                for(status in checks[fpath]) {
                    elements = checks[fpath][status];
                    for(var elem in elements){
                        const shouldbe = (status == 'true');
                        let e = elements[elem];
                        if (shouldbe) {
                            this.msg_err = `${fpath} no incluye ${e}`;
                        } else {
                            this.msg_err = `${fpath} incluye ${e}, pero debería haberse borrado`;
                        }
                        e.test(templ).should.be.equal(shouldbe);
                    }
                }
            }
        });


        scored(`Comprobar que la migración y el seeder para Usuarios existen`, -1, async function () {
            this.msg_ok = 'Se incluye la migración y el seeder';

            this.msg_err = `No se ha encontrado la migración que crea la tabla Posts`;
            let mig = fs.readdirSync(path.join(PATH_ASSIGNMENT, "migrations")).filter(fn => fn.endsWith('-CreatePostsTable.js'));
            (mig.length).should.be.equal(1);

            this.msg_err = `No se ha encontrado la migración que crea la tabla Attachments`;
            mig = fs.readdirSync(path.join(PATH_ASSIGNMENT, "migrations")).filter(fn => fn.endsWith('-CreateAttachmentsTable.js'));
            (mig.length).should.be.equal(1);

            this.msg_err = `No se ha encontrado la migración que crea la tabla Users`;
            mig = fs.readdirSync(path.join(PATH_ASSIGNMENT, "migrations")).filter(fn => fn.endsWith('-CreateUsersTable.js'));
            (mig.length).should.be.equal(1);

            this.msg_err = `La migración no incluye el campo email`;
            debug(mig[0]);
            let templ = fs.readFileSync(path.join(PATH_ASSIGNMENT, "migrations", mig[0]));
            /email/.test(templ).should.be.equal(true);

            let seed = fs.readdirSync(path.join(PATH_ASSIGNMENT, "seeders")).filter(fn => fn.endsWith('-FillUsersTable.js'));
            this.msg_err = 'No se ha encontrado el seeder';
            (seed.length).should.be.equal(1);
            this.msg_err = `El seed no incluye el campo email correctamente`;
            templ = fs.readFileSync(path.join(PATH_ASSIGNMENT, "seeders", seed[0]));
            /email/.test(templ).should.be.equal(true);
            /admin\@core.example/.test(templ).should.be.equal(true);
            /pepe\@core.example/.test(templ).should.be.equal(true);
            // We could use a regex here to check the date
        });

        scored(`Comprobar que existen los módulos con las rutas`, -1, async function () {
            this.msg_ok = 'Si existe el módulo routes/index.js con las rutas raíz';
            this.msg_err = "No existe el módulo routes/index.js con las rutas raíz";
            require(path.resolve(path.join(PATH_ASSIGNMENT, 'routes', 'index'))).all.should.not.be.undefined;

            this.msg_ok = 'Si existe el módulo routes/posts.js con las rutas de los posts';
            this.msg_err = "No existe el módulo routes/posts.js con las rutas de los posts";
            require(path.resolve(path.join(PATH_ASSIGNMENT, 'routes', 'posts'))).all.should.not.be.undefined;

            this.msg_ok = 'Si existe el módulo routes/users.js con las rutas de los users';
            this.msg_err = "No existe el módulo routes/users.js con las rutas de los users";
            require(path.resolve(path.join(PATH_ASSIGNMENT, 'routes', 'users'))).all.should.not.be.undefined;

            this.msg_ok = 'Si existe el módulo routes/login.js con las rutas de autenticación';
            this.msg_err = "No existe el módulo routes/login.js con las rutas de autenticación";
            require(path.resolve(path.join(PATH_ASSIGNMENT, 'routes', 'login'))).all.should.not.be.undefined;
        });

        scored(`Comprobar que los controladores existen`, -1, async function () {
            this.msg_ok = 'Se incluyen los controladores de posts, usuarios y sesiones';

            this.msg_err = "No se incluye el controlador de post";
            await checkFileExists(path.resolve(path.join(PATH_ASSIGNMENT, 'controllers', 'post')));

            let postCtrl = require(path.resolve(path.join(PATH_ASSIGNMENT, 'controllers', 'post')));
            for (let mw of ["load", "index", "show", "new", "create", "edit", "update", "destroy", "attachment" ]) {
                this.msg_err = `Falta el middleware ${mw} en el controlador de los posts`;
                postCtrl[mw].should.not.be.undefined;
            }

            this.msg_err = "No se incluye el controlador de usuarios";
            await checkFileExists(path.resolve(path.join(PATH_ASSIGNMENT, 'controllers', 'user')));

            const userCtrl = require(path.resolve(path.join(PATH_ASSIGNMENT, 'controllers', 'user')));
            for (let mw of ["load", "index", "show", "new", "create", "edit", "update", "destroy"]) {
                this.msg_err = `Falta el middleware ${mw} en el controlador de los usuarios`;
                userCtrl[mw].should.not.be.undefined;
            }

            this.msg_err = "No se incluye el controlador de sesiones";
            await checkFileExists(path.resolve(path.join(PATH_ASSIGNMENT, 'controllers', 'session')));

            const sessionCtrl = require(path.resolve(path.join(PATH_ASSIGNMENT, 'controllers', 'session')));
            for (let mw of ["new", "create", "destroy"]) {
                this.msg_err = `Falta el middleware ${mw} en el controlador de las sesiones`;
                sessionCtrl[mw].should.not.be.undefined;
            }
        });

        scored(`Comprobar que se ha añadido el código para incluir los comandos adecuados (P6)`, -1, async function () {
            let rawdata = fs.readFileSync(path.join(PATH_ASSIGNMENT, 'package.json'));
            let pack = JSON.parse(rawdata);
            this.msg_ok = 'Se incluyen todos los scripts/comandos';
            this.msg_err = 'No se han encontrado todos los scripts';
            scripts = {
                "super": "supervisor ./bin/www",
                "migrate": "sequelize db:migrate --url sqlite://$(pwd)/blog.sqlite",  
                "seed": "sequelize db:seed:all --url sqlite://$(pwd)/blog.sqlite",  
                "migrate_win": "sequelize db:migrate --url sqlite://%cd%/blog.sqlite",  
                "seed_win": "sequelize db:seed:all --url sqlite://%cd%/blog.sqlite"  ,
            };
            for(script in scripts){
                this.msg_err = `Falta el comando para ${script}`;
                pack.scripts[script].should.be.equal(scripts[script]);
            }
        });

    });

    describe("Tests funcionales", function () {
        var server;
        const db_filename = 'blog.sqlite';
        const db_file = path.resolve(path.join(ROOT, db_filename));

        const users = [
            {id: 1, username: "admin", password: "1234", email: "admin@core.example"},
            {id: 2, username: "pepe", password: "5678", email: "pepe@core.example"},
        ];

        const NEW_USER = {id: 3, username: 'usuario_prueba', email:'prueba@core.example', password: 'prueba'};

        before(async function() {
            if(has_failed()){
                return;
            }
            // Crear base de datos nueva y poblarla antes de los tests funcionales. por defecto, el servidor coge post.sqlite del CWD
            try {
                fs.unlinkSync(db_file);
                debug('Previous test db removed. A new one is going to be created.')
            } catch {
                debug('Previous test db does not exist. A new one is going to be created.')
            }
            fs.closeSync(fs.openSync(db_file, 'w'));

            let sequelize_cmd = path.join(PATH_ASSIGNMENT, "node_modules", ".bin", "sequelize")
            let db_url = `sqlite://${db_file}`;
            let db_relative_url = `sqlite://${db_filename}`;
            await exec(`${sequelize_cmd} db:migrate --url "${db_url}" --migrations-path ${path.join(PATH_ASSIGNMENT, "migrations")}`)
            debug('Lanzada la migración');
            await exec(`${sequelize_cmd} db:seed:all --url "${db_url}" --seeders-path ${path.join(PATH_ASSIGNMENT, "seeders")}`)
            debug('Lanzado el seeder');


            let bin_path = path.join(PATH_ASSIGNMENT, "bin", "www");
            server = spawn('node', [bin_path], {env: {PORT: TEST_PORT, DATABASE_URL: db_relative_url, PATH: process.env.PATH}});
            server.stdout.setEncoding('utf-8');
            server.stdout.on('data', function(data) {
                debug('Salida del servidor: ', data);
            })
            server.stderr.on('data', function (data) {
                debug('EL SERVIDOR HA DADO UN ERROR. SALIDA stderr: ' + data);
            });
            console.log(`Lanzado el servidor en el puerto ${TEST_PORT}`);
            await new Promise(resolve => setTimeout(resolve, TIMEOUT));
            browser.site = `http://127.0.0.1:${TEST_PORT}/`;
            try{
                await browser.visit("/");
                browser.assert.status(200);
            }catch(e){
                console.log("No se ha podido contactar con el servidor.");
                throw(e);
            }
        });

        after(async function() {
            // Borrar base de datos

            if(typeof server !== 'undefined') {
                await server.kill();
                function sleep(ms) {
                    return new Promise((resolve) => {
                        setTimeout(resolve, ms);
                    });
                }
                //wait for 1 second for the server to release the sqlite file
                await sleep(1000);
            }

            try {
                fs.unlinkSync(db_file);
            } catch(e){
                console.log("Test db not removed.");
                debug(e);
            }
        });



        scored(`Comprobando las funcionalidades de login y logout`, 2, async function () {

            this.msg_err = 'No se muestra la página principal';
            await browser.visit("/");
            browser.assert.status(200);

            // Comprobando el contenido de la pagina de login:

            this.msg_err = `No se encuentra el botón de login en la pagina principal`;
            browser.assert.element(`a[href="/login"]`);
            browser.assert.text(`a[href="/login"]`, "Login");

            this.msg_err = `El botón de logout no debe aparecer cuando no hay un usuario logueado`;
            browser.html(`a[href="/login?_method=DELETE"]`).should.be.equal("");

            this.msg_err = `Al pulsar el botón de login no aparece la página de loguearse`;
            await browser.click('a[href="/login"]');
            browser.assert.status(200);
            browser.location.href.should.be.equal(`http://127.0.0.1:${TEST_PORT}/login`);

            this.msg_err = `La página de login no implementa correctamente la etiqueta "form"`;
            browser.assert.element('form[method="post"][action="/login"]');

            this.msg_err = `La página de login no muestra correctamente el campo para introducir el nombre`;
            browser.assert.element('form input[type="text"][name="username"]');

            this.msg_err = `La página de login no muestra correctamente el campo para introducir el password`;
            browser.assert.element('form input[type="password"][name="password"]');

            this.msg_err = `La página de login no muestra correctamente el botón de submit`;
            browser.assert.element('form input[type="submit"]');

            // Hacer login con un usuario registrado

            this.msg_err = `No se puede rellenar el formulario de la página de login`;
            // await browser.fill('#username', "pepe");
            // await browser.fill('#password', "5678");
            await browser.fill('form input[type="text"][name="username"]', users[1].username);
            await browser.fill('form input[type="password"][name="password"]', users[1].password);

            this.msg_err = `No se ha rellenado bien el nombre del usuario en la página de login`;
            browser.assert.input('form input[type="text"][name="username"]', users[1].username);

            this.msg_err = `No se ha rellenado bien el password del usuario en la página de login`;
            browser.assert.input('form input[type="password"][name="password"]', users[1].password);

            this.msg_err = `No se puede enviar el formulario de login`;
            // await browser.pressButton('input[name=commit]');
            await browser.pressButton('form input[type="submit"]');
            browser.assert.status(200);
            debug(browser.location.href);

            this.msg_err = `No se muestra la página raíz después de hacer login`;
            browser.location.href.should.be.equal(`http://127.0.0.1:${TEST_PORT}/`);
            //browser.location.href.includes("login").should.be.equal(false);

            // Una vez logueado aparecen los botones de perfil y logout:

            this.msg_err = `No se encuentra el botón de logout en la página principal`;
            browser.assert.element(`a[href="/login?_method=DELETE"]`);
            browser.assert.text(`a[href="/login?_method=DELETE"]`, "Logout");

            this.msg_err = `No se encuentra el botón para ver el perfil del usuario logueado  en la página principal`;
            browser.assert.element(`a[href="/users/${users[1].id}"]`);
            browser.assert.text(`a[href="/users/${users[1].id}"]`, users[1].username);

            this.msg_err = `El botón de login no debe aparecer cuando hay un usuario logueado`;
            browser.html(`a[href="/login"]`).should.be.equal("");

            // Hacer logout:

            this.msg_err = `No puedo hacer logout`;
            await browser.click('a[href="/login?_method=DELETE"]');
            browser.assert.status(200);

            this.msg_err = `Al pulsar el botón de logout no aparece la página de login`;
            browser.location.href.should.be.equal(`http://127.0.0.1:${TEST_PORT}/login`);

            // Intentar hacer login con unas credenciales incorrectas:

            this.msg_err = `No se puede rellenar el formulario de la página de login`;
            await browser.fill('form input[type="text"][name="username"]', "mortadelo");
            await browser.fill('form input[type="password"][name="password"]', "1357");

            this.msg_err = `No se ha rellenado bien el nombre del usuario en la página de login`;
            browser.assert.input('form input[type="text"][name="username"]', "mortadelo");

            this.msg_err = `No se ha rellenado bien el password del usuario en la página de login`;
            browser.assert.input('form input[type="password"][name="password"]', "1357");

            this.msg_err = `No se puede enviar el formulario de login`;
            await browser.pressButton('form input[type="submit"]');
            browser.assert.status(200);
            debug(browser.location.href);

            this.msg_err = `No se muestra otra vez la página de login tras intentar un login fallido`;
            browser.location.href.should.be.equal(`http://127.0.0.1:${TEST_PORT}/login`);
        });


        scored(`Comprobando que en la pagina principal hay un botón para ver el listado de usuarios`, 0.2, async function () {

            this.msg_err = 'No se muestra la página principal';
            await browser.visit("/");
            browser.assert.status(200);

            this.msg_err = `No se encuentra el botón Users en la pagina principal`;
            browser.assert.element(`a[href="/users"]`);
            browser.assert.text(`a[href="/users"]`, "Users");
        });


        scored(`Comprobar el funcionamiento de la petición GET /users`, 1, async function () {

            this.msg_err = "La URL /users no está disponible";
            await browser.visit("/users");
            browser.assert.status(200);

            for (const usuario of users) {
                this.msg_err = `La página /users no muestra al usuario "${usuario.username}"`;
                browser.html().includes(usuario.username).should.be.equal(true);
            }
        });


        scored(`Comprobar el funcionamiento de la petición GET /users/:userId`, 1, async function () {

            // Mostrar los usuarios existentes, y comprobar que se muestra su email

            for (const usuario of users) {
                this.msg_err = `No se encuentra el usuario "${usuario.username}" en los usuarios`;
                await browser.visit(`/users/${usuario.id}`);

                this.msg_err = `La página del usuario "${usuario.username}" (/usuarios/${usuario.id}) no incluye el email correctamente`;
                browser.html().includes(usuario.email).should.be.equal(true);
            }

            // La peticion GET /users/:userId de un usuario inexistente debe devolver un 404:

            this.msg_err = `No puede visitarse la página de un usuario inexistente`;
            try {
                await browser.visit(`/users/999999`);
            } catch (e) {
            }
            browser.assert.status(404);

        });


        scored(`Comprobar la creación de un usuario`, 3, async function () {

            this.msg_err = 'No se muestra la página de creación de un usuario al visitar /users/new';
            await browser.visit("/users/new");
            browser.assert.status(200);

            // Comprobar el contenido de la pagina:

            this.msg_err = `La página /users/new no implementa correctamente la etiqueta "form" para crear un nuevo usuario`;
            browser.assert.element('form[method="post"][action="/users"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para añadir el nombre del usuario en el formulario`;
            browser.assert.element('form input#username[name="username"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para añadir el email del usuario en el formulario`;
            browser.assert.element('form input#email[type="email"][name="email"][pattern=".+@.+"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para añadir el password del usuario en el formulario`;
            browser.assert.element('form input#user_password[type="password"][name="password"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para confirmar el password del usuario en el formulario`;
            browser.assert.element('form input#user_confirm_password[type="password"]');

            this.msg_err = `La página /users/new no muestra correctamente el botón de submit en el formulario`;
            browser.assert.element('form input[type=submit]');

            // Rellenar y enviar el formulario:


            this.msg_err = `No se puede rellenar la página /users/new`;
            await browser.fill('#username', NEW_USER.username);
            await browser.fill('#email', NEW_USER.email);
            await browser.fill('#user_password', NEW_USER.password);
            await browser.fill('#user_confirm_password', NEW_USER.password);

            this.msg_err = `Comprobar que se han rellenado los campos`;
            browser.assert.input('#username', NEW_USER.username);
            browser.assert.input('#email', NEW_USER.email);
            browser.assert.input('#user_password', NEW_USER.password);
            browser.assert.input('#user_confirm_password', NEW_USER.password);

            this.msg_err = `No se puede enviar la página /users/new`;
            // Pressbutton no llama a las funciones que comprueban si el password es valido
            await browser.pressButton('form input[type=submit]');
            browser.assert.status(200);

            this.msg_err = `No se muestra la pagina de login despues de crear un usuario`;
            debug("USER CREADO. URL devuelta: " + browser.location.href);
            browser.location.href.should.be.equal(`http://127.0.0.1:${TEST_PORT}/login`);

            // El usuario creado tiene id=3 (NEW_USER.id). Comprobar que existe y sus datos:

            this.msg_err = `El usuario nuevo no se ha creado`;
            await browser.visit(`/users/${NEW_USER.id}`);

            this.msg_err = `No se guarda correctamente el titulo al crear un nuevo post`;
            browser.html().includes(NEW_USER.username).should.be.equal(true);

            this.msg_err = `No se guarda correctamente el cuerpo al crear un nuevo post`;
            browser.html().includes(NEW_USER.email).should.be.equal(true);

            // Comprobar que puede loguearse:

            this.msg_err = `El usuario creado no puede loguearse.`;
            await browser.visit(`/login?_method=DELETE`);  // PSLM
            await browser.visit(`/login`);
            browser.assert.status(200);
            await browser.fill('#username', NEW_USER.username);
            await browser.fill('#password', NEW_USER.password);
            await browser.pressButton('form input[type="submit"]');

            // Desaparece el boton de login, y aparece el de logout y perfil:

            this.msg_err = `No se encuentra el botón de logout en la página principal`;
            browser.assert.element(`a[href="/login?_method=DELETE"]`);
            browser.assert.text(`a[href="/login?_method=DELETE"]`, "Logout");

            this.msg_err = `No se encuentra el botón para ver el perfil del usuario logueado  en la página principal`;
            browser.assert.element(`a[href="/users/${NEW_USER.id}"]`);
            browser.assert.text(`a[href="/users/${NEW_USER.id}"]`, NEW_USER.username);

            this.msg_err = `El botón de login no debe aparecer cuando hay un usuario logueado`;
            browser.html(`a[href="/login"]`).should.be.equal("");

            // Comprobar que hay que rellenar todos los campos del formulario de creación un usuario

            this.msg_err = 'No se muestra la página de creación de un usuario al visitar /users/new';
            await browser.visit("/users/new");
            browser.assert.status(200);

            this.msg_err = 'No aparece la pagina de crear un usuario (/users/new)';
            browser.location.href.should.be.equal(`http://127.0.0.1:${TEST_PORT}/users/new`);

            this.msg_err = `No se puede rellenar la página /users/new`;
            //await browser.fill('#username', NEW_USER.username);
            //await browser.fill('#email', NEW_USER.email);
            await browser.fill('#user_password', "xx");
            await browser.fill('#user_confirm_password', "xx");

            this.msg_err = `El envio de un formulario debe funcionar`;
            await browser.pressButton('input[type=submit]');
            browser.assert.status(200);

            // Vuevo a renderizar la misma página. La creo la petición HTTP: POST + /users

            this.msg_err = `No se ha realizado la redirección a la página de creación de un usuario`;
            browser.location.href.should.be.equal(`http://127.0.0.1:${TEST_PORT}/users`);   // POST `/users

            // Comprobar el contenido de la pagina:

            this.msg_err = `La página /users/new no implementa correctamente la etiqueta "form" para crear un nuevo usuario`;
            browser.assert.element('form[method="post"][action="/users"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para añadir el nombre del usuario en el formulario`;
            browser.assert.element('form input#username[name="username"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para añadir el email del usuario en el formulario`;
            browser.assert.element('form input#email[type="email"][name="email"][pattern=".+@.+"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para añadir el password del usuario en el formulario`;
            browser.assert.element('form input#user_password[type="password"][name="password"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para confirmar el password del usuario en el formulario`;
            browser.assert.element('form input#user_confirm_password[type="password"]');

            this.msg_err = `La página /users/new no muestra correctamente el botón de submit en el formulario`;
            browser.assert.element('form input[type=submit]');

           // Comprobar que no se pueden crear usuarios con el mismo username

            this.msg_err = 'No se muestra la página de creación de un usuario al visitar /users/new';
            await browser.visit("/users/new");
            browser.assert.status(200);

            this.msg_err = 'No aparece la pagina de crear un usuario (/users/new)';
            browser.location.href.should.be.equal(`http://127.0.0.1:${TEST_PORT}/users/new`);

            this.msg_err = `No se puede rellenar la página /users/new`;
            await browser.fill('#username', NEW_USER.username);
            await browser.fill('#email', "otro@dominio.es");
            await browser.fill('#user_password', "otropw");
            await browser.fill('#user_confirm_password', "otropw");

            this.msg_err = `El envio de un formulario debe funcionar`;
            await browser.pressButton('input[type=submit]');
            browser.assert.status(200);

            // Vuevo a renderizar la misma página. La creo la petición HTTP: POST + /users

            this.msg_err = `No se ha realizado la redirección a la página de creación de un usuario`;
            browser.location.href.should.be.equal(`http://127.0.0.1:${TEST_PORT}/users`);   // POST `/users

            // Comprobar el contenido de la pagina:

            this.msg_err = `La página /users/new no implementa correctamente la etiqueta "form" para crear un nuevo usuario`;
            browser.assert.element('form[method="post"][action="/users"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para añadir el nombre del usuario en el formulario`;
            browser.assert.element('form input#username[name="username"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para añadir el email del usuario en el formulario`;
            browser.assert.element('form input#email[type="email"][name="email"][pattern=".+@.+"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para añadir el password del usuario en el formulario`;
            browser.assert.element('form input#user_password[type="password"][name="password"]');

            this.msg_err = `La página /users/new no muestra correctamente el campo para confirmar el password del usuario en el formulario`;
            browser.assert.element('form input#user_confirm_password[type="password"]');

            this.msg_err = `La página /users/new no muestra correctamente el botón de submit en el formulario`;
            browser.assert.element('form input[type=submit]');
        });


        scored(`Comprobar la edición de los usuarios`, 2, async function () {

            // Probar la edicion del usurio "pepe"
            let user = users[1];

            // Ir a la pagina de edicion del usuario:

            this.msg_err = `No se muestra la página de edición del usuario con id igual a ${user.id}`;
            await browser.visit(`/users/${user.id}/edit`);
            browser.assert.status(200);

            // Comprobar el contenido de la pagina:

            this.msg_err = `La página no implementa correctamente la etiqueta "form" para editar un usuario`;
            browser.assert.element(`form[method="post"][action="/users/${user.id}?_method=PUT"]`);

            this.msg_err = `La página no debe mostrar el campo para editar el nombre del usuario`;
            browser.html('form input#username[name="username"]').should.be.equal("");

            this.msg_err = `La páginano debe mostrar el campo para editar el email del usuario`;
            browser.assert.element('form input#email[type="email"][name="email"][pattern=".+@.+"]');

            this.msg_err = `La página no debe mostrar el campo para editar el password del usuario`;
            browser.assert.element('form input#user_password[type="password"][name="password"]');

            this.msg_err = `La página no debe mostrar el campo para editar el password del usuario`;
            browser.assert.element('form input#user_confirm_password[type="password"]');

            this.msg_err = `La página no muestra correctamente el botón de submit en el formulario`;
            browser.assert.element('form input[type=submit]');

            this.msg_err = `La página de editar el usuario no ha rellenado bien el campo del email`;
            browser.assert.input('#email', user.email);

            // Cambiar el email: Rellenar campo de email con un nuevo email, enviar y comprobar el cambio

            const NEW_EMAIL = "pepe2@dominio2.es";

            this.msg_err = `No se puede rellenar la página /users/new`;
            await browser.fill('#email', NEW_EMAIL);

            this.msg_err = `El envio de un formulario debe funcionar`;
            await browser.pressButton('input[type=submit]');

            this.msg_err = `No se ha realizado la redirección a la página de creación de un usuario`;
            browser.location.href.should.be.equal(`http://127.0.0.1:${TEST_PORT}/users/${user.id}`);

            this.msg_err = `No se ha guardado el nuevo email: La página del usuario editado no muestra el nuevo email`;
            browser.html().includes(NEW_EMAIL).should.be.equal(true);
        });


        scored(`Comprobar el borrado de usuarios`, 0.8, async function () {

            const USER_ID = 3;

            this.msg_err = `La página para mostrar el usuario con id igual a "${USER_ID}" (/users/${USER_ID}) debería existir`;
            await browser.visit(`/users/${USER_ID}`);

            this.msg_err = `La página para borrar el usuario con id igual a "${USER_ID}" no funciona correctamente`;
            await browser.visit(`/users/${USER_ID}?_method=DELETE`);

            this.msg_err = `La página para mostrar un usuario borrado (user.id = ${USER_ID}) debería fallar`;
            try {
                await browser.visit(`/users/${USER_ID}`);
            } catch(e) {
            }
            browser.assert.status(404);

            this.msg_err = `La página para borrar un usuario borrado (user.id = ${USER_ID}) debería fallar`;
            try {
                await browser.visit(`/users/${USER_ID}?_method=DELETE`);
            } catch(err) {
            }
            browser.assert.status(404);
        });

    });

})
