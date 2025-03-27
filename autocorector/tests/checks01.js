/* eslint-disable no-invalid-this*/
/* eslint-disable no-undef*/
// IMPORTS
const {assert, expect} = require('chai');
const path = require("path");
const fs = require("fs");
const {
    has_failed,
    ROOT,
    path_assignment,
    scored
} = require("../utils/testutils");

const PATH_ASSIGNMENT = path_assignment("blog");

// TESTS
describe("Tests Práctica 10 - Base de Datos", function () {

    let sequelize;

    const db_filename = 'blog.sqlite';
    const db_file = path.resolve(path.join(ROOT, db_filename));
    const db_url = `sqlite://${db_file}`;

    before(async function () {
        if (has_failed()) {
            return;
        }

        // Crear base de datos nueva y poblarla.
        try {
            fs.unlinkSync(db_file);
            debug('Previous test db removed. A new one is going to be created.')
        } catch {
            debug('Previous test db does not exist. A new one is going to be created.')
        }
        fs.closeSync(fs.openSync(db_file, 'w'));

        let sequelize_cmd = path.join(PATH_ASSIGNMENT, "node_modules", ".bin", "sequelize")
        await exec(`${sequelize_cmd} db:migrate --url "${db_url}" --migrations-path ${path.join(PATH_ASSIGNMENT, "migrations")}`);
        debug('Lanzada la migración');
        await exec(`${sequelize_cmd} db:seed:all --url "${db_url}" --seeders-path ${path.join(PATH_ASSIGNMENT, "seeders")}`);
        debug('Lanzado el seeder');
    });

    after(async function () {
        // Borrar base de datos de pruebas:
        try {
            fs.unlinkSync(db_file);
        } catch (e) {
            debug("Test db not removed.");
            debug(e);
        }
    });

    scored("Conectar con la base de datos", -1, async function () {

        this.msg_ok = 'Conexión a la base de datos con éxito';

        this.msg_err = 'Fallo en la conexión a la base de datos';
        const models_path = path.join(PATH_ASSIGNMENT, "models");
        sequelize = require(models_path);
    });


    scored('Comprobando la existencia de las tablas', -1, async function () {

        let tables = await sequelize.getQueryInterface().showAllSchemas();
        let tableNames = tables.map(table => table.name);

        this.msg_err = 'No existe una tabla llamada Posts'
        assert.equal(tableNames.includes('Posts'), true);

        this.msg_err = 'No existe una tabla llamada Attachments'
        assert.equal(tableNames.includes('Attachments'), true);

        this.msg_err = 'No existe una tabla llamada Users'
        assert.equal(tableNames.includes('Users'), true);
    });


    scored('Comprobando que se ha creado bien el modelo Post', -1, async function () {

        this.msg_ok = 'Modelo Post creado satisfactoriamente';

        this.msg_err = 'Modelo Post no inicializado correctamente';
        const Post = sequelize.models.Post;
        Post.should.be.an('function');
        should.exist(Post.rawAttributes);

        this.msg_err = 'La clave primaria del modelo Post debe ser "id"';
        assert.equal(Post.rawAttributes.id?.primaryKey, true);

        this.msg_err = 'El modelo Post debe tener un campo "id" de tipo INTEGER';
        assert.equal(Post.rawAttributes.id?.type.key, 'INTEGER');

        this.msg_err = 'El modelo Post debe tener un campo "title" de tipo STRING';
        assert.equal(Post.rawAttributes.title?.type.key, 'STRING');

        this.msg_err = 'El modelo Post debe tener un campo "body" de tipo TEXT';
        assert.equal(Post.rawAttributes.body?.type.key, 'TEXT');
    });


    scored('Comprobando que se ha creado bien el modelo Attachments', -1, async function () {

        this.msg_ok = 'Modelo Attachment creado satisfactoriamente';

        this.msg_err = 'Modelo Attachment no inicializado correctamente';
        const Attachment = sequelize.models.Attachment;
        Attachment.should.be.an('function');
        should.exist(Attachment.rawAttributes);

        this.msg_err = 'La clave primaria del modelo Attachment debe ser "id"';
        assert.equal(Attachment.rawAttributes.id?.primaryKey, true);

        this.msg_err = 'El modelo Attachment debe tener un campo "id" de tipo INTEGER';
        assert.equal(Attachment.rawAttributes.id?.type.key, 'INTEGER');

        this.msg_err = 'El modelo Attachment debe tener un campo "mime" de tipo STRING';
        assert.equal(Attachment.rawAttributes.mime?.type.key, 'STRING');

        this.msg_err = 'El modelo Attachment debe tener un campo "image" de tipo BLOB';
        assert.equal(Attachment.rawAttributes.image?.type.key, 'BLOB');
    });


    scored('Comprobando que se ha creado bien el modelo User', -1, async function () {

        this.msg_ok = 'Modelo User creado satisfactoriamente';

        this.msg_err = 'Modelo User no inicializado correctamente';
        const User = sequelize.models.User;
        User.should.be.an('function');
        should.exist(User.rawAttributes);

        this.msg_err = 'La clave primaria del modelo User debe ser "id"';
        assert.equal(User.rawAttributes.id?.primaryKey, true);

        this.msg_err = 'El modelo User debe tener un campo "id" de tipo INTEGER';
        assert.equal(User.rawAttributes.id?.type.key, 'INTEGER');

        this.msg_err = 'El modelo User debe tener un campo "username" de tipo STRING';
        assert.equal(User.rawAttributes.username?.type.key, 'STRING');

        this.msg_err = 'El modelo User debe tener un campo "password" de tipo STRING';
        assert.equal(User.rawAttributes.password?.type.key, 'STRING');

        this.msg_err = 'El modelo User debe tener un campo "salt" de tipo STRING';
        assert.equal(User.rawAttributes.salt?.type.key, 'STRING');

        this.msg_err = 'El modelo User debe tener un campo "isAdmin" de tipo BOOLEAN';
        assert.equal(User.rawAttributes.isAdmin?.type.key, 'BOOLEAN');

        this.msg_err = 'El modelo User debe tener un campo "email" de tipo STRING';
        assert.equal(User.rawAttributes.email?.type.key, 'STRING');
    });


    scored('Comprobando la asociación 1-a-1 entre Post y Attachment', -1, async function () {

        this.msg_ok = 'Las asociacion 1-a-1 entre Post y Attachment se ha creado satisfactoriamente';

        this.msg_err = 'El modelo Attachment solo debe tener una clave externa (postId) apuntando a un post.';
        const foreignKeyReferences = await sequelize.getQueryInterface().getForeignKeyReferencesForTable("Attachments");
        assert.equal(foreignKeyReferences.length, 1);

        this.msg_err = 'La clave externa "postId" de la tabla "Attachments" debe apunta al campo "id" de la tabla "Posts"';
        const {tableName, columnName, referencedTableName, referencedColumnName} = foreignKeyReferences[0];
        assert.equal(tableName, "Attachments");
        assert.equal(columnName, "postId");
        assert.equal(referencedTableName, "Posts");
        assert.equal(referencedColumnName, "id");
    });

});