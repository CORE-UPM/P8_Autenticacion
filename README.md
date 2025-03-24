# Práctica 8: Autenticación

Versión: 24 de Marzo de 2025

## Objetivos
* Afianzar los conocimientos obtenidos sobre el uso de Express para desarrollar servidores web.
* Aprender a desarrollar APIs REST para gestionar recursos web.
* Aprender a gestionar sesiones web.

## Descripción de la práctica

En esta práctica 8 se ampliará la *Práctica 7* (Blog) añadiendo gestión de usuarios y la funcionalidad de autenticación.

Se creará una tabla en la BBDD para almacenar los datos de los usuarios, y se implementará un API REST para
crearlos, consultarlos, actualizarlos y borrarlos.

Tambien se crearán los elementos necesarios para añadir la funcionalidad de autenticación. Los usuarios podrán hacer
**login** para crear una sesión de login, y hacer **logout** para cerrarla.

El desarrollo pedido en esta práctica es prácticamente igual al realizado en el mini proyecto **Autenticación** visto 
en las clases teóricas de la asignatura.
En el mini proyecto **Autenticación** se desarrollaron los recursos de los usuarios, y también se añadió la funcionalidad de autenticación.
Este trabajo puede reutilizarse casi directamente.

Hay un detalle que se exige en esta práctica y que difiere del trabajo realizado en el mini proyecto **Autenticación**.

* En el modelo **User** del mini proyecto solo se guardan los campos **username**, **password**, **salt** e **isAdmin**.
En esta práctica también hay que guardar y gestionar un campo llamado **email** con la dirección de correo electrónico del usuario.
Este nuevo campo debe manejarse en todas las vistas de los usuarios.


## Descargar el código del proyecto

Instrucciones [aquí](https://github.com/CORE-UPM/Instrucciones_Practicas/blob/main/README.md#descargar-el-c%C3%B3digo-del-proyecto).


## Tareas

### Tarea 1 - Copiar el trabajo ya realizado en la Entrega 7 Posts

En esta práctica hay que continuar y ampliar el desarrollo realizado en la práctica 7.

El alumno debe copiar el directorio **blog** de la **Entrega7_posts** en el directorio **P8_Autenticacion/blog** de
esta práctica 8. Las tareas a realizar en esta práctica 8 de desarrollarán dentro del directorio **P8_Autenticacion/blog**.

Para copiar/duplicar el directorio **Entrega7_posts/blog** en el directorio **P8_Autenticacion/blog**, puede usar un
explorador de archivos. Asegúrese de copiar el directorio y no de moverlo de sitio, para no perder el trabajo original.
También puede ejecutar el siguiente comando en un terminal unix para copiar el directorio y todo su contenido:

    $ cp -r PATH_DE_PRACTICA_7/Entrega7_posts/blog PATH_DE_PRACTICA_8/P8_Autenticacion/.

### Tarea 2 - Instalación de paquetes

Eeta práctica necesita que se instale el paquete npm **express-session** para gestionar las sesiones. 
Hay que realizar los mismos pasos que se hicieros en el mini proyecto de autenticación.

Ejecutar el comando:

    npm install express-session

Importar y configurar el paquete en **app.js**:

    . . .
    var session = require('express-session');
    . . .

    // Configuracion de la session para almacenarla en BBDD Redis.
    app.use(session({secret: "Blog 2025",
                     resave: false,
                     saveUninitialized: true}));
    . . .
    
    // Este middleware nos permite usar loginUser en las vistas (usando locals.loginUser)
    // Debe añadirse antes que el indexRouter
    app.use(function(req, res, next) {

      // To use req.loginUser in the views
      res.locals.loginUser = req.session.loginUser && {
        id: req.session.loginUser.id,
        username: req.session.loginUser.username,
        email: req.session.loginUser.email,
        isAdmin: req.session.loginUser.isAdmin
      };

      next();
    });

En el código anterior se ha registrado un middleware que copia los datos del usuario logueado en una variable local de **res**.
Estos datos se necesitarán en las vistas EJS.

### Tarea 3 - Desarrollar el modelo

Esta tarea consiste en realizar los siguientes pasos:

* Copie la definición del modelo de usuarios **models/user.js** del mini proyecto de autenticación añadiendo el nuevo 
campo para el **email**. 
Use la validación **isEmail** proporcionada por Sequelize para asegurarse de que el formato del email introducido es válido.
Modifique **models/index.js** para importar la definición del modelo **User**.

* Copie directamente el fichero **helpers/crypt.js** que se encarga de cifrar los passwords.

* Copie el fichero de migración **CreateUsersTable** y el fichero seeder **FillUsersTable** del mini proyecto, y 
modifíquelos para añadir el campo **email**. Utilice el nombre del usuario seguido de `@core.example` (p.e., `admin@core.example`).

### Tarea 4 - Definición de rutas

Las definiciones de las rutas para gestionar los usuarios y la session de login hay que añadirlas
a los ficheros **routes/users.js** y **routes/login.js**.

Estos ficheros son iguales que los desarrollados en el mini proyecto de autenticación.

Estos ficheros de rutas son módulos que deben exportar un objeto Router de Express.
Las rutas para manejar los usuarios y los adjuntos se definiran en estos objetos Router.
Estos ficheros deben importarse en **app.js** y registrar los objectos Router obtenidos como middlewares.

### Tarea 5 - Crear los controladores

Hay que crear dos controladores: **controllers/user.js** con los middlewares de los usuarios y **controllers/session.js** con los middlewares de la session de login.

El fichero **controllers/session.js** del mini proyecto es igual al que necesitamos en esta práctica, y puede copiarse directamente.

El fichero **controllers/user.js** del mini proyecto es casi igual al que necesitamos. 
Solo hay que retocar algún middleware para soportar el nuevo campo **email**. 
Copie este fichero, y realice los cambios necesarios para soportar el email de los usuarios.


### Tarea 6 - Crear las vistas

En esta práctica se usarán las mismas vistas que en el mini proyecto de autenticación, con la única diferencia de
que algunas vistas de usuario deben mostrar el nuevo campo **email**.

Siga los siguientes pasos para crear los ficheros de vistas:

* Copie directamente el fichero **views/session/new.ejs** que implementa la vista con el formulario de login. 

* Copie todos los ficheros de vistas de usuario **index.ejs**, **show.ejs**, **new.ejs**, **edit.ejs**, **_form.ejs** 
del directorio, **views/users**.
    - Modifique **show.ejs** para mostrar el email del usuario.
    - Modifique **_form.ejs** para añadir un nuevo campo **input** de tipo **email** para introducir o editar el email del usuario. Este campo debe tener los siguientes atributos: **id="email"**, **name="email"** y **pattern=".+@.+"**.

* Modifique el menú de navegación de **views/layout.ejs** para añadir un nuevo botón con el texto **Users**.
Al pulsar este botón, se enviará la primitiva **GET /users** para navegar a la página que muestra un listado con
los usuarios existentes.

* El código que muestra los botones para hacer login y logout se encuentra en **views/users/index.ejs**.
Elimine este código de este fichero, 
y añadalo al marco de aplicación **views/layout.ejs**.

* El último paso consiste en copiar el helper dinámico que pasa el valor de **req.sesion.loginUser** al objeto **res** 
para que este disponible en las vistas. Este helper está definido en el fichero **app.js** del mini proyecto, y 
hay que copiarlo en el fichero **app.js** de la práctica.

### Tarea 7 - Aplicar migraciones, seeders y probar

LLegados a este punto ya se ha terminado todo el desarrollo de la práctica.

Solo falta aplicar las migraciones y seeders ejecutando:

      # sistemas unix
      npm run migrate
      npm run seed
      # sistemas windows
      npm run migrate_win
      npm run seed_win

y probar el funcionamiento del nuevo servidor.


## Pruebas con el autocorector

Instrucciones [aquí](https://github.com/CORE-UPM/Instrucciones_Practicas/blob/main/README.md#pruebas-con-el-autocorector).

## Pruebas manuales y capturas de pantalla

Instrucciones [aquí](https://github.com/CORE-UPM/Instrucciones_Practicas/blob/main/README.md#pruebas-manuales-y-capturas-de-pantalla).

Capturas a entregar con esta práctica: 

- Captura 1: Captura de la pantalla que muestra el formulario para hacer login. 
  Deben verse los campos del formulario.
<kbd>
<img src="https://user-images.githubusercontent.com/716928/218465892-dbcbaf9e-aed0-4177-99d4-c5435aa7d735.png" alt="captura de pantalla" width="500"/>
</kbd>

- Captura 2: Captura de la pantalla que muestra el listado de todos los usuarios cuando no hay nadie loguedo. 
  Debe verse la cabecera de la página donde se muestra el botón de login.
<kbd>
<img src="https://user-images.githubusercontent.com/716928/218465906-7e19bd0f-b002-4b11-a8bf-a65e729f0a1a.png" alt="captura de pantalla" width="500"/>
</kbd>

- Captura 3: Captura de la pantalla que muestra el listado de todos los usuarios cuando hay un usuario loguedo. 
  Debe verse la cabecera de la página donde se muestra el botón de logout.
<kbd>
<img src="https://user-images.githubusercontent.com/716928/218465920-f11f3b64-b26d-463c-b816-952d24c2d823.png" alt="captura de pantalla" width="500"/>
</kbd>

- Captura 4: Captura de la pantalla que muestra un único usuario. 
  Realice esta captura cuando hay un usuario logueado.
  Deben verse los valores username, isAdmin e email del usuario, y la cabecera de la página con el botón de logout.
<kbd>
<img src="https://user-images.githubusercontent.com/716928/218465933-42acae2e-8593-4534-b6e7-ff40e69f98b0.png" alt="captura de pantalla" width="500"/>
</kbd>

- Captura 5: Captura de la pantalla que muestra el formulario para crear un nuevo usuario. Realice esta captura cuando no hay ningún usuario logueado.
  Deben verse los campos del formulario, y la cabecera de la página con el botón de login.
<kbd>
<img src="https://user-images.githubusercontent.com/716928/218465958-4c68c007-0267-4576-8d50-afdf929031bc.png" alt="captura de pantalla" width="500"/>
</kbd>

## Instrucciones para la Entrega y Evaluación.

Instrucciones [aquí](https://github.com/CORE-UPM/Instrucciones_Practicas/blob/main/README.md#instrucciones-para-la-entrega-y-evaluaci%C3%B3n
).

## Rúbrica

Antes de evaluar la práctica se realizarán un serie de comprobaciones:
- Existe el directorio blog.
- Se ha usado correctamente el marco de aplicación.
- Existen los ficheros pedidos: controladores, migraciones, seeders, ...
- Se han creado los scripts pedidos en package.json.

Una vez superadas las comprobaciones anteriores,
se puntuará la práctica sumando el % indicado a la nota total si la parte indicada es correcta:
- **20%:** Funcionamiento correcto de las operaciones de login y logout.
- **2%:** Creado el botón para ver el listado de todos los usuarios.
- **10%:** Funcionamiento correcto de la página que muestra todos los usuarios.
- **10%:** Funcionamiento correcto de la página que muestra un usuario.
- **30%:** Funcionamiento correcto de la creación de nuevos usuarios.
- **20%:** Funcionamiento correcto de la edición de usuarios.
- **8%:** Funcionamiento correcto del borrado de usuarios.

Si pasa todos los tests se dará la máxima puntuación.
