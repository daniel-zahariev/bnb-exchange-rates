# BNB Exchange Rates

Fetch exchange rates from the Bulgarian National Bank (BNB) and parse them into a structured format.

## Installation

```sh
npm install @bg-apis/bnb-exchange-rates
```

## Usage

Get day exchange rates for the current day:

```ts
import { getDayExchangeRates } from "@bg-apis/bnb-exchange-rates";

const signal = AbortSignal.timeout(10_000);
const { rates, error } = await getDayExchangeRates(new Date(), signal);
console.log(rates, error);
```

Get the exchange rates for selected or all supported currencies for a specific month:

```ts
import { getMonthExchangeRates } from "@bg-apis/bnb-exchange-rates";

const signal = AbortSignal.timeout(10_000);
const { rates, error } = await getMonthExchangeRates(new Date(), signal, ['USD']);
console.log(rates, error);
```
