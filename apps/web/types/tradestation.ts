// TradeStation API v3 types

export interface TSAccount {
  AccountID: string;
  AccountType: string; // "Cash" | "Margin" | "Futures" | "DVP"
  Alias: string;
  Currency: string;
  Status: string; // "Active" | "Closed"
  AccountDetail?: {
    IsStockLocateEligible: boolean;
    EnrolledInRegTProgram: boolean;
    RequiresBuyingPowerWarning: boolean;
    DayTradingQualified: boolean;
    OptionApprovalLevel: number;
  };
}

export interface TSBalance {
  AccountID: string;
  AccountType: string;
  CashBalance: number;
  Equity: number;
  MarketValue: number;
  TodaysProfitLoss: number;
  UnclearedDeposit: number;
  BuyingPower: number;
  RealizedProfitLoss: number;
  UnrealizedProfitLoss: number;
  Commission: number;
}

export interface TSPosition {
  AccountID: string;
  AveragePrice: number;
  AssetType: string; // "EQ" | "OP" | "FU" | "FX"
  Last: number;
  Symbol: string;
  Description: string;
  LongShort: string; // "Long" | "Short"
  Quantity: number;
  MarketValue: number;
  TotalCost: number;
  UnrealizedProfitLoss: number;
  UnrealizedProfitLossPercent: number;
  UnrealizedProfitLossQty: number;
  Timestamp: string;
  DayTradeRequirement: number;
  InitialRequirement: number;
  MaintenanceRequirement: number;
  ConversionRate: number;
}

export interface TSOrder {
  OrderID: string;
  AccountID: string;
  Symbol: string;
  Quantity: string;
  FilledQuantity: string;
  OrderType: string; // "Market" | "Limit" | "StopMarket" | "StopLimit"
  Status: string; // "OPN" | "FLL" | "FPR" | "OUT" | "REJ" | "CAN" | "EXP" | "BRO" | "ACK"
  StatusDescription: string;
  TimeInForce: { Duration: string }; // "DAY" | "GTC" | "GTD" | "IOC" | "FOK" | "OPG" | "CLO"
  LimitPrice?: string;
  StopPrice?: string;
  TradeAction: string; // "BUY" | "SELL" | "BUYTOCOVER" | "SELLSHORT"
  OpenedDateTime: string;
  ClosedDateTime?: string;
  FilledPrice?: string;
  Legs: TSOrderLeg[];
}

export interface TSOrderLeg {
  Symbol: string;
  Quantity: string;
  TradeAction: string;
  OpenOrClose: string;
  ExecQuantity: string;
  ExecPrice: string;
}

export interface TSTokens {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Serialized portfolio data for the frontend
export interface PortfolioSummary {
  accounts: TSAccount[];
  balances: TSBalance[];
  positions: TSPosition[];
  totalEquity: number;
  totalPnL: number;
  totalUnrealizedPnL: number;
  connected: boolean;
}
