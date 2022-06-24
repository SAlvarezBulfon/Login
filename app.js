//00 - Módulo nativo: no hay que instalarlo por fuera, ya viene integrado en node.js
const path = require("path"); //path: nos permite administrar rutas de archivos

//1- Invocamos express
const express = require('express');
const app = express();

//2- Seteamos urlencoded para capturar los datos del formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//3- Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'}); //donde van a estar nuestras variables de entorno

//4 - el directorio public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(path.join(__dirname, 'public')));

//5- establecer el motor de plantillas ejs
app.set('view engine', 'ejs');

//6- Invocamos bcryptjs : hacer el hashing de password 
const bcryptjs = require('bcryptjs')

//7- Var. de session
const session = require('express-session');
app.use(session({
    secret:'secret',
    resave:true, //como se van a guardar las sesiones
    saveUninitialized: true
}))

// 8 - Invocamos al módulo de conexión de la BD
const connection = require("./database/db")

//9 - Establecemos rutas
app.get("/login", (req, res) => {  //RUTA LOGIN
    res.render('login.ejs');
});

app.get("/register", (req, res) => {  //RUTA register
    res.render('register.ejs');
});


//10 - Registración
app.post('/register', async (req, res) => {
     const user = req.body.user;
     const name = req.body.name;
     const rol = req.body.rol;
     const pass = req.body.pass;
     let passwordHaash = await bcryptjs.hash(pass,8);
     connection.query('INSERT INTO users SET ?',{
         user:user,
         name:name,
         rol:rol,
         pass:passwordHaash //Guarda el password de forma encriptada en la base de datos
     },
     async (error, results)=>{
         if(error){
             return console.log(error);
         }else{
            return res.render('register',{
                alert: true,
                alertTitle: 'Registration',
                alertMessage: '¡Successful Registration!',
                alertIcon:'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: ''
            });
         }
     });
});



//11 - Autenticación
app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass, 8);
    if(user && pass){
        connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results) =>{
            //Si no coincide o no tiene longitud: usuario o pass incorrecto
            if(results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass))){
                res.render('login.ejs',{
                    alert:true,
                    alertTitle:"Error",
                    alertMessage: "Incorrect username or password",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: false,
                    ruta:'login'
                });
            }else {
                req.session.loggedin = true;
                req.session.name = results[0].name;
                res.render('login.ejs', {
                    alert:true,
                    alertTitle:" Hello!",
                    alertMessage: "You are successfully logged in",
                    alertIcon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                    ruta:''
                });
            }
        })
    }else{
       
        res.render('login.ejs', {
            alert:true,
            alertTitle:" Warning!",
            alertMessage: "Please enter a username and password.",
            alertIcon: "warning",
            showConfirmButton: true,
            timer: false,
            ruta:'login'
        });
    }
})

//12- auth pages
app.get('/', (req, res) => {
    if(req.session.loggedin){
        res.render('index', {
            login: true,
            name: req.session.name
        });
    }else {
        res.render('index.ejs',{
            login:false,
            name: 'You must be logged in'
        });
    }
});

// 13 - Logout

app.get('/logout', (req, res) => {
    req.session.destroy(()=>{
        res.redirect('/');
    });
});

app.listen(4000, (req,res) => {
    console.log('Server running in http://localhost:4000');
});