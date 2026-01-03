import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socket/index.js';
import { validateEnv } from './utils/validateEnv.js';

dotenv.config();

// Validate environment variables before starting
validateEnv();

const app = express();
const httpServer = createServer(app);

// CORS configuration - use environment variable or localhost for dev
const corsOrigin = process.env.CORS_ORIGIN ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : false);

const io = new Server(httpServer, {
    cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: corsOrigin,
    credentials: true
}));
app.use(express.json());

// API Routes
import apiRoutes from './routes/api.js';
app.use('/api', apiRoutes);

import { exec } from 'child_process';

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Movie Quiz API is running' });
});

// Emergency Migration Endpoint
app.get('/api/migrate-db', (req, res) => {
    // Respond immediately to prevent browser timeout/hanging
    res.json({
        success: true,
        message: 'Migration process triggered in background. Please wait 15-30 seconds, then refresh the game page.'
    });

    console.log('🔄 Triggering manual database migration (background)...');
    exec('npx prisma db push --accept-data-loss --skip-generate', (error, stdout, stderr) => {
        if (error) {
            console.error(`Migration error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`Migration stderr: ${stderr}`);
        }
        console.log(`Migration stdout: ${stdout}`);
    });
});

// Setup Socket.io handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
