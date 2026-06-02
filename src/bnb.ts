import XMLParser from "@nodable/flexible-xml-parser";

type BnbXmlRow = {
	CODE: string;
	NAME_: string;
	RATE: number;
	REVERSERATE: number;
	CURR_DATE: string;
	RATIO?: number;
};

const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;

const isObject = (v: unknown): v is Record<string, unknown> => {
	return typeof v === "object" && v !== null;
};

const validateBnbXmlRow = (r: Record<string, unknown>): r is BnbXmlRow => {
	return (
		typeof r.CODE === "string" &&
		r.CODE.length === 3 &&
		typeof r.NAME_ === "string" &&
		typeof r.RATE === "number" &&
		typeof r.REVERSERATE === "number" && // this will filter out XAU
		((typeof r.GOLD === "number" && r.GOLD !== 0) ||
			(typeof r.F_ORDER === "number" && r.F_ORDER !== 0)) && // should filter out the header row
		typeof r.CURR_DATE === "string" &&
		dateRegex.test(r.CURR_DATE) && // another check that should filter out the header row
		(typeof r.RATIO === "undefined" || typeof r.RATIO === "number")
	);
};

export type BnbExchangeRate = {
	base: "BGN" | "EUR";
	/**
	 * 1 of `base` currency = `rate` of `currency`
	 * e.g. how much does one unit of the base currency cost in the target currency
	 * fx. 1 EUR = 1.1646 USD
	 */
	rate: number;
	/** 3-letter currency code */
	currency: string;
	/** BNB historically has had a ratio multiplier for some currencies */
	reverse: { rate: number; amount: number };
	/** Date in YYYY-MM-DD format */
	date: string;
};

export const printBnbExchangeRate = (
	r: BnbExchangeRate,
	source: "base" | "target",
): string => {
	if (source === "base") {
		return `1 ${r.base} = ${r.rate} ${r.currency} [${r.date}]`;
	}
	return `${r.reverse.amount} ${r.currency} = ${r.reverse.rate} ${r.base} [${r.date}]`;
};

const transformBnbXmlRow = (row: BnbXmlRow): BnbExchangeRate => {
	const d = row.CURR_DATE.split(".").reverse();
	if (Number.parseInt(d[0] ?? "0") >= 2026) {
		return {
			base: "EUR",
			rate: row.RATE,
			currency: row.CODE,
			reverse: { rate: row.REVERSERATE, amount: 1 },
			date: d.join("-"),
		};
	}
	return {
		base: "BGN",
		rate: row.REVERSERATE,
		currency: row.CODE,
		reverse: { rate: row.RATE, amount: row.RATIO ?? 1 },
		date: d.join("-"),
	};
};

const supportedCurrencies = [
	"USD",
	"JPY",
	"CZK",
	"DKK",
	"GBP",
	"HUF",
	"PLN",
	"RON",
	"SEK",
	"CHF",
	"ISK",
	"NOK",
	"TRY",
	"AUD",
	"BRL",
	"CAD",
	"CNY",
	"HKD",
	"IDR",
	"ILS",
	"INR",
	"KRW",
	"MXN",
	"MYR",
	"NZD",
	"PHP",
	"SGD",
	"THB",
	"ZAR",
];

const BNB_BASE_URL =
	"https://www.bnb.bg/Statistics/StExternalSector/StExchangeRates/StERForeignCurrencies/index.htm";

/**
 * Parses the BNB XML response and extracts exchange rates
 *
 * @param string xml
 * @returns An array of exchange rates parsed from the BNB XML response
 * @throws Error when XML is invalid
 */
const normalizeXmlRows = (row: unknown): unknown[] => {
	if (row == null) {
		return [];
	}
	return Array.isArray(row) ? row : [row];
};

export const parseBnbExchangeRates = (xml: string): BnbExchangeRate[] => {
	if (!xml.includes("<ROWSET>")) {
		throw new Error("INVALID_BNB_XML");
	}

	const parser = new XMLParser();
	const result = parser.parse(xml);
	const rows = normalizeXmlRows(result.ROWSET?.ROW);
	if (rows.length === 0) {
		throw new Error("INVALID_BNB_XML");
	}

	return rows
		.filter((r) => isObject(r) && validateBnbXmlRow(r))
		.map((r) => transformBnbXmlRow(r));
};

/**
 * Fetches exchange rates for a specific day from the BNB website. If no date is provided, it fetches the rates for the current day.
 *
 * @param Date day The date for which to fetch exchange rates. If not provided, defaults to the current day.
 * @returns An array of exchange rates for the specified day, or the current day if no date is provided
 * @throws Error when the specified day is a weekend, as BNB does not publish exchange rates on weekends
 */
export const getDayExchangeRates = async (
	day?: Date,
): Promise<BnbExchangeRate[]> => {
	const d = day ?? new Date();

	if (d.getDay() === 0 || d.getDay() === 6) {
		throw new Error("BNB does not publish exchange rates on weekends");
	}
	const params = new URLSearchParams({
		downloadOper: "true",
		group1: "first",
		firstDays: d.getDate().toString(),
		firstMonths: (d.getMonth() + 1).toString().padStart(2, "0"),
		firstYear: d.getFullYear().toString(),
		search: "true",
		type: "xml",
	});

	const url = new URL(BNB_BASE_URL);
	url.search = params.toString();
	console.log("Fetching BNB exchange rates from URL:", url.toString());

	const res = await fetch(url, {
		headers: { "User-Agent": "curl/0.1.0" },
	});
	if (!res.ok) {
		throw new Error(`BNB request failed: ${res.status}`);
	}
	const text = await res.text();

	return parseBnbExchangeRates(text);
};

/**
 * Fetches exchange rates for a specific month from the BNB website.
 *
 * @param date The date for which to fetch exchange rates. Only the month and year are used; the day is ignored. If not provided, defaults to the current month.
 * @param currencies Defaults to all supported currencies. If provided, only fetches exchange rates for the specified currencies.
 * @returns An array of exchange rates for the specified month
 * @throws Error when the specified date is a weekend, as BNB does not publish exchange rates on weekends
 */
export const getMonthExchangeRates = async (
	date: Date,
	currencies = supportedCurrencies,
): Promise<BnbExchangeRate[]> => {
	const [y, m] = [
		String(date.getFullYear()),
		String(date.getMonth() + 1).padStart(2, "0"),
	];
	const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

	const params = new URLSearchParams({
		download: "xml",
		lang: "BG",
		group1: "second",
		periodStartDays: "1",
		periodStartMonths: m,
		periodStartYear: y,
		periodEndDays: monthEnd.getDate().toString(),
		periodEndMonths: m,
		periodEndYear: y,
	});
	for (const c of currencies) {
		params.append("valutes", c);
	}

	const url = new URL(BNB_BASE_URL);
	url.search = params.toString();
	console.log("Fetching BNB exchange rates from URL:", url.toString());

	const res = await fetch(url.toString(), {
		headers: { "User-Agent": "curl/0.1.0" },
	});
	if (!res.ok) {
		throw new Error(`BNB request failed: ${res.status}`);
	}
	const text = await res.text();

	return parseBnbExchangeRates(text);
};
