import express from 'express';
import cors from 'cors';
import { securityHeaders, errorHandler } from './middleware/security.ts';
import { authRouter } from './routes/authRoutes.ts';
import { foundationRouter } from './routes/foundationRoutes.ts';
import { customerRouter } from './routes/customerRoutes.ts';
import { supplierRouter } from './routes/supplierRoutes.ts';
import { contactRouter, partyDocumentRouter } from './routes/contactRoutes.ts';
import { requestRouter } from './routes/requestRoutes.ts';
import { taskRouter } from './routes/taskRoutes.ts';
import { notificationRouter } from './routes/notificationRoutes.ts';
import { procurementRouter } from './routes/procurementRoutes.ts';
import { financeRouter, productRouter } from './routes/financeRoutes.ts';
import { config } from './config.ts';

export const app = express();

// Security and parse middlewares
app.use(securityHeaders);
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Sahla ERP API Foundation',
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/customers', customerRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/party-documents', partyDocumentRouter);
app.use('/api/requests', requestRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/procurement', procurementRouter);
app.use('/api/finance', financeRouter);
app.use('/api/products', productRouter);
app.use('/api', foundationRouter);

// Central Error Handler
app.use(errorHandler);
