// MT5 deal enums and bridge response types

export enum MT5DealType {
  BUY          = 0,
  SELL         = 1,
  BALANCE      = 2,   // deposit / withdrawal
  CREDIT       = 3,
  CHARGE       = 4,
  CORRECTION   = 5,
  BONUS        = 6,
  COMMISSION   = 7,
  COMM_DAILY   = 8,
  COMM_MONTHLY = 9,
}

export enum MT5DealEntry {
  IN     = 0,   // position open
  OUT    = 1,   // position close
  INOUT  = 2,   // reversal
  OUT_BY = 3,   // close by opposite
}

export interface MT5Deal {
  ticket:     number;
  positionId: number;
  login:      number;
  symbol:     string;
  type:       MT5DealType;
  entry:      MT5DealEntry;
  volume:     number;       // lots
  price:      number;       // close price
  profit:     number;       // in account currency
  swap:       number;
  commission: number;
  time:       number;       // Unix seconds — close time
  openTime:   number;       // Unix seconds — open time
  openPrice:  number;
  comment:    string;
}

export interface MT5FxRate {
  symbol: string;   // e.g. 'EURUSD'
  bid:    number;
  ask:    number;
}

export interface MT5AccountEquity {
  login:    number;
  equity:   number;
  currency: string;
}

// Emitted by WebSocket stream for real-time balance changes
export interface MT5BalanceEvent {
  ticket:  number;
  login:   number;
  amount:  number;   // positive = deposit, negative = withdrawal
  comment: string;
  time:    number;   // Unix seconds
}
