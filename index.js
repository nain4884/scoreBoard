const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;
const { body, validationResult } = require('express-validator');
const pg = require('pg');

const app = express();
app.use(express.json());

const path = require('path');

const redisClient = createClient({
    host: 'localhost',
    port: 6379,
});
redisClient.connect().catch(console.error);
let redisStore = new RedisStore({
    client: redisClient,
});

const pool = new pg.Pool({
    user: 'fairgame',
    host: 'localhost',
    database: 'scoreboard',
    password: 'root',
    port: 5432,
});

app.use(
    session({
        store: redisStore,
        secret: 'fairGameScore',
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            maxAge: 1000*60*60     // 1000*60*60 = 1 hour
        },
    })
);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        store: redisClient,
        secret: 'fairGame', // Change this to a secure secret key
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Set secure to true in a production environment with HTTPS
    })
);

// Routes and authentication logic go here

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.redirect('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', [
    body('username').notEmpty().trim().escape(),
    body('password').notEmpty().trim().escape(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, password } = req.body;

        pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }

                if (result.rows.length > 0) {
                    req.session.loggedIn = true;
                    req.session.username = username;
                    redisClient.hSet('123', { '12': '34' }).then(d => {
                        console.log("value set in redis", d);
                    }).catch(e => {
                        console.log("error at redis ", e);
                    })
                    res.redirect('home');
                } else {
                    // return res.status(401).send('Invalid credentials');
                    res.redirect('login');
                }
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/home', (req, res) => {
    if (req.session.loggedIn) {
        res.render('home');
    } else {
        res.redirect('login');
    }
});

app.get('/logout', (req, res) => {
    redisClient.hGetAll('123').then(d => {
        console.log("value set in redis", d);
    }).catch(e => {
        console.log("error at redis ", e);
    })
    req.session.destroy(err => {
        if (err) {
            return res.send('Error logging out');
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('login'); // Redirect to the login page
    });
});
