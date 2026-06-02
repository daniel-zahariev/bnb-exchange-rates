# BNB Exchange Rates

Fetch exchange rates from the Bulgarian National Bank (BNB) and parse them into a structured format.

## Installation

```sh
npm install bnb-exchange-rates
```

## Usage

```ts
import { getDayExchangeRates } from "bnb-exchange-rates";

const rates = await getDayExchangeRates();
console.log(rates);
```
