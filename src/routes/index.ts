// Route aggregator — mount all 11 modules under /api/v1
import { Router } from 'express';
import { clientsRouter     } from './clients';
import { paymentsRouter    } from './payments';
import { journalsRouter    } from './journals';
import { reportsRouter     } from './reports';
import { ibRouter          } from './ib';
import { usersRouter       } from './users';
import { eodRouter         } from './eod';
import { tradesRouter      } from './trades';
import { mt5AccountsRouter } from './mt5-accounts';
import { symbolsRouter     } from './symbols';
import { coaRouter         } from './chart-of-accounts';

export const apiRouter = Router();

apiRouter.use('/clients',            clientsRouter);
apiRouter.use('/payments',           paymentsRouter);
apiRouter.use('/journals',           journalsRouter);
apiRouter.use('/reports',            reportsRouter);
apiRouter.use('/ib-commissions',     ibRouter);
apiRouter.use('/users',              usersRouter);
apiRouter.use('/eod',                eodRouter);
apiRouter.use('/trades',             tradesRouter);
apiRouter.use('/mt5-accounts',       mt5AccountsRouter);
apiRouter.use('/symbols',            symbolsRouter);
apiRouter.use('/chart-of-accounts',  coaRouter);
