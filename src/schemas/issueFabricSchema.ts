import { z } from 'zod';

export const issueFabricSchema = z.object({
  lengthIssued: z.number().min(0.001, 'Length issued must be greater than 0'),
  widthIssued: z.number().min(0.001, 'Width issued must be greater than 0'),
  purpose: z.string().min(1, 'Purpose is required'),
});

export type IssueFabricInput = z.infer<typeof issueFabricSchema>;
