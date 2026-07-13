export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export type PaymentMethodFormValue = Omit<PaymentMethod, 'id'>;
