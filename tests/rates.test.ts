import { describe, expect, it } from "vitest";
import {
	type BnbExchangeRate,
	getDayExchangeRates,
	parseBnbExchangeRates,
	printBnbExchangeRate,
} from "../src/bnb.js";

describe("BNB Exchange Rates", () => {
	it("should fetch and parse exchange rates correctly", async () => {
		const xml = `<?xml version="1.0"?>
<ROWSET>
<ROW>
  <F_ORDER>1</F_ORDER>
  <NAME_>Бразилски реал</NAME_>
  <CODE>BRL</CODE>
  <REVERSERATE>0.1709</REVERSERATE>
  <RATE>5.8515</RATE>
  <CURR_DATE>01.06.2026</CURR_DATE>
  <ORDER_CODE>15</ORDER_CODE>
 </ROW>
 <ROW>
  <GOLD>1</GOLD>
  <CURR_DATE>10.01.2025</CURR_DATE>
  <NAME_>Бразилски реал</NAME_>
  <CODE>BRL</CODE>
  <RATIO>10</RATIO>
  <REVERSERATE>3.19031</REVERSERATE>
  <RATE>3.13449</RATE>
  <S2_CURR_DATE>10-JAN-25</S2_CURR_DATE>
 </ROW>
 </ROWSET>`;

		const result = await parseBnbExchangeRates(xml);
		expect(result.rates).toMatchInlineSnapshot(`
			[
			  {
			    "base": "EUR",
			    "currency": "BRL",
			    "date": "2026-06-01",
			    "rate": 5.8515,
			    "reverse": {
			      "amount": 1,
			      "rate": 0.1709,
			    },
			  },
			  {
			    "base": "BGN",
			    "currency": "BRL",
			    "date": "2025-01-10",
			    "rate": 3.19031,
			    "reverse": {
			      "amount": 10,
			      "rate": 3.13449,
			    },
			  },
			]
		`);

		expect(
			printBnbExchangeRate(result.rates[0] as BnbExchangeRate, "base"),
		).toBe("1 EUR = 5.8515 BRL [2026-06-01]");
		expect(
			printBnbExchangeRate(result.rates[0] as BnbExchangeRate, "target"),
		).toBe("1 BRL = 0.1709 EUR [2026-06-01]");
		expect(
			printBnbExchangeRate(result.rates[1] as BnbExchangeRate, "base"),
		).toBe("1 BGN = 3.19031 BRL [2025-01-10]");
		expect(
			printBnbExchangeRate(result.rates[1] as BnbExchangeRate, "target"),
		).toBe("10 BRL = 3.13449 BGN [2025-01-10]");
	});

	it("should return an error when the XML is invalid", async () => {
		const { rates, error } = parseBnbExchangeRates("invalid XML");
		expect(rates).toHaveLength(0);
		expect(error).toBe("INVALID_BNB_XML");
	});

	it("should return an error when BNB hasn't published rates for the given date", async () => {
		const tomorrow = new Date(Date.now() + 86400000);
		const { rates, error } = await getDayExchangeRates(tomorrow);
		expect(rates).toHaveLength(0);
		expect(error).toBe("INVALID_BNB_XML");
	});
});
