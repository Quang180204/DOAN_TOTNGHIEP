import 'express-session';

declare module 'express-session' {
  interface SessionData {
    discount?: number;
    discountCode?: string;
  }
}