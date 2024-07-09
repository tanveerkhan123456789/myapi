const venom = require('venom-bot');
const path = require('path');
const Session = require('./Models/session'); // Import the session model

async function saveSessionToMongoDB(sessionName, sessionToken) {
    await Session.findOneAndUpdate(
        { sessionName },
        { sessionToken },
        { upsert: true }
    );
}

async function loadSessionFromMongoDB(sessionName) {
    const session = await Session.findOne({ sessionName });
    return session ? session.sessionToken : null;
}

async function startVenom() {
    const sessionName = 'sessionName';
    const sessionToken = await loadSessionFromMongoDB(sessionName);

    try {
        const venomClient = await venom.create(
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
                folderNameToken: 'tokens',
                mkdirFolderToken: path.join(__dirname, 'briway-sessions'),
                headless: true, // Use headless: true for production
                multidevice: true,
                puppeteerOptions: {
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    timeout: 60000 // Increase timeout to 60 seconds
                },
                sessionToken: sessionToken // Load session token if available
            }
        );

        // Save session token to MongoDB
        const token = await venomClient.getSessionTokenBrowser();
        await saveSessionToMongoDB(sessionName, token);

        console.log('Venom bot session started successfully');
        return venomClient;
    } catch (err) {
        console.error('Venom encountered an error:', err);
        throw err; // Propagate the error to handle it elsewhere if needed
    }
}

module.exports = startVenom;
