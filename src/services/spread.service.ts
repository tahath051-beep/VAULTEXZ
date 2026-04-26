// Section 7: Spread Income Formula
// spread_income = markup_spread × volume × pip_value_usd
// markup_spread = broker_spread - lp_spread  (generated column in symbol_config)
// pip_value_usd  = stored per lot in USD in symbol_config
// volume         = lots from MT5 trade

export interface SpreadCalcInput {
  markupSpread: number;  // pips
  lpSpread: number;      // pips
  volume: number;        // lots
  pipValueUsd: number;   // USD per lot per pip
}

export interface SpreadCalcResult {
  spreadIncome: number;  // broker markup earned — always positive
  lpCost: number;        // A-Book only: lp_spread × volume × pip_value_usd
  bbookPnl: number;      // B-Book only: -mt5_profit (broker takes opposite side)
  netBrokerPnl: number;
}

export function calculateSpread(
  input: SpreadCalcInput,
  bookType: 'A' | 'B',
  mt5Profit: number
): SpreadCalcResult {
  const spreadIncome = round6(input.markupSpread * input.volume * input.pipValueUsd);

  if (bookType === 'A') {
    const lpCost = round6(input.lpSpread * input.volume * input.pipValueUsd);
    return {
      spreadIncome,
      lpCost,
      bbookPnl: 0,
      netBrokerPnl: round6(spreadIncome - lpCost),
    };
  }

  // B-Book: broker holds the opposite position
  // bbook_pnl is positive when client loses, negative when client profits
  const bbookPnl = round6(-mt5Profit);
  return {
    spreadIncome,
    lpCost: 0,
    bbookPnl,
    netBrokerPnl: round6(spreadIncome + bbookPnl),
  };
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
