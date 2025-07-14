import { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const API_KEY = process.env.API_KEY;
  
  if (!API_KEY) {
    console.error('API_KEY is not set in the environment.');
    return res.status(500).json({ 
      statusCode: 500,
      code: 'CONFIG_ERROR',
      message: 'Server configuration error.' 
    });
  }

  const providedKey = req.header('X-API-Key');
  if (providedKey === API_KEY) {
    return next();
  }

  res.status(401).json({ 
    statusCode: 401,
    code: 'UNAUTHORIZED',
    message: 'Unauthorized - Invalid API key' 
  });
};