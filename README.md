# BNB Exchange Rates

Fetch exchange rates from the Bulgarian National Bank (BNB) and parse them into a structured format.

## Installation

```sh
npm install @bg-apis/bnb-exchange-rates
```

## Usage

```ts
import { getDayExchangeRates } from "@bg-apis/bnb-exchange-rates";

const rates = await getDayExchangeRates();
console.log(rates);
```
