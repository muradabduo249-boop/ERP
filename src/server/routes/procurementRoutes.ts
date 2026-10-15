import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { requirePermission } from '../middleware/rbac.ts';
import { ProcurementService } from '../services/procurementService.ts';

export const procurementRouter = Router();

// Apply auth to all procurement endpoints
procurementRouter.use(requireAuth);

/**
 * 1. GET /api/procurement/rfqs - List RFQs with quotes
 */
procurementRouter.get(
  '/rfqs',
  requirePermission('procurement:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requestId = req.query.requestId as string | undefined;
      const rfqs = await ProcurementService.listRfqs(requestId);
      res.json({
        success: true,
        data: rfqs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * 2. POST /api/procurement/rfqs - Create RFQ
 */
procurementRouter.post(
  '/rfqs',
  requirePermission('procurement:create_rfq', 'procurement:create_po'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const actor = {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role?.code,
      };
      const rfq = await ProcurementService.createRfq(req.body, actor);
      res.status(201).json({
        success: true,
        data: rfq,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: error.message },
      });
    }
  }
);

/**
 * 3. POST /api/procurement/rfqs/:id/quotes - Add Supplier Quote
 */
procurementRouter.post(
  '/rfqs/:id/quotes',
  requirePermission('procurement:create_rfq', 'procurement:create_po'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const actor = {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role?.code,
      };
      const quote = await ProcurementService.addSupplierQuote(
        {
          ...req.body,
          rfqId: req.params.id,
        },
        actor
      );
      res.status(201).json({
        success: true,
        data: quote,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: error.message },
      });
    }
  }
);

/**
 * 4. POST /api/procurement/quotes/:id/award - Award Quote & Generate PO
 */
procurementRouter.post(
  '/quotes/:id/award',
  requirePermission('procurement:create_po'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const actor = {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role?.code,
      };
      const result = await ProcurementService.awardQuote(req.params.id, actor);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: error.message },
      });
    }
  }
);

/**
 * 5. GET /api/procurement/pos - List Purchase Orders
 */
procurementRouter.get(
  '/pos',
  requirePermission('procurement:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requestId = req.query.requestId as string | undefined;
      const supplierId = req.query.supplierId as string | undefined;
      const pos = await ProcurementService.listPurchaseOrders({ requestId, supplierId });
      res.json({
        success: true,
        data: pos,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * 6. POST /api/procurement/pos - Create Direct Commercial Purchase Order
 */
procurementRouter.post(
  '/pos',
  requirePermission('procurement:create_po'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const actor = {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role?.code,
      };
      const po = await ProcurementService.createPurchaseOrder(req.body, actor);
      res.status(201).json({
        success: true,
        data: po,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: error.message },
      });
    }
  }
);
