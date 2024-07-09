const venom = require('venom-bot');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const express = require('express');
const multer = require('multer');
const { Online_db_connection, local_db_connection } = require('./database/index');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = "./public/uploads";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

// Multer setup
const upload = multer({ storage });
const as=0;
// Venom-bot setup with persistent session
let venomClient;
async function startVenom() {
    const sessionName = 'sessionName';
    const sessionFolder = path.join(__dirname, 'briway-sessions', sessionName);

    // Check if session is stored
    const isSessionStored = fs.existsSync(sessionFolder) && fs.readdirSync(sessionFolder).length > 0;

    try {
        venomClient = await venom.create(
            sessionName,
            (base64Qr, asciiQR, attempts, urlCode) => {
                console.log('QR Code:');
                console.log(asciiQR); // Display QR code when needed
            },
            (statusSession, session) => {
                console.log('Status Session:', statusSession);
                console.log('Session name:', session);
            },
            {
                folderNameToken: 'tokens', //folder name when saving tokens
                mkdirFolderToken: './node_modules', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
                headless: false, // Headless chrome
                devtools: false, // Open devtools by default
                useChrome: true, // If false will use Chromium instance
                debug: false, // Opens a debug session
                logQR: true, // Logs QR automatically in terminal
                browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'], // Parameters to be added into the chrome browser instance
                disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
                disableWelcome: true, // Will disable the welcoming message which appears in the beginning
                updates: true, // Logs info updates automatically in terminal
                autoClose: 60000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
              }

        );

        console.log('Venom bot session started successfully');
    } catch (err) {
        console.error('Venom encountered an error:', err);
        throw err; // Propagate the error to handle it elsewhere if needed
    }
}

// Create Express app
const app = express();
const port = 3000; // Example port
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Explicitly set the views directory

// Set up EJS templating engine

// Serve static files from the public directory
app.use('/public', express.static('public'));

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Route for the homepage with the form
app.get('/', (req, res) => {
    res.render('index'); // Assuming 'index.ejs' is your template file
});

// Route to handle form submissions
app.post('/send', upload.single('image'), async (req, res) => {
    const number = req.body.number;
    const message = req.body.message;
    const imageUrl = req.file ? req.file.filename : null; // Get image path if uploaded
    const logs = [];

    try {
        // Check if venomClient is already initialized
        if (!venomClient) {
            logs.push('Starting Venom bot session...');
            await startVenom();
            logs.push('Venom bot session started.');
        }

        const chatId = `${number}@c.us`;

        // Send text message
        const textResult = await venomClient.sendText(chatId, message);
        logs.push(`Message sent to ${number}: ${JSON.stringify(textResult)}`);

        // Send image if uploaded
        let imageResult;
        if (imageUrl) {
            const imagePath = path.join(__dirname, 'public/uploads', imageUrl);
            imageResult = await venomClient.sendImage(chatId, imagePath, 'Image from website');
            logs.push(`Image sent to ${number}: ${JSON.stringify(imageResult)}`);
        }

        // Save message details to MongoDB
        const messageDetails = {
            phoneNumber: number,
            textMessage: {
                content: message,
                status: textResult.error ? 'failed' : 'sent',
                result: textResult
            },
            imageMessage: {
                url: imageUrl,
                caption: 'Image from website',
                status: imageResult ? (imageResult.error ? 'failed' : 'sent') : 'not sent',
                result: imageResult
            }
        };

        await mongoose.connection.collection('messages').insertOne(messageDetails);

        res.json({
            success: true,
            logs
        });
    } catch (err) {
        console.error('Error sending message:', err);
        logs.push(`Error sending message: ${err.message}`);
        res.status(500).json({
            success: false,
            logs
        });
    }
});

// Start the server and connect to the database
Online_db_connection().then(async () => {
    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1); // Exit process if server startup fails
});
