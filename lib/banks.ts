/** Nigerian banks and payment providers (CBN/NIBSS codes). Used when the payout provider's own live list isn't available.
 *  When FLUTTERWAVE_SECRET is set, /api/banks uses the provider's live list instead. Always check codes against your provider. */
export type Bank = { code: string; name: string };
export const NG_BANKS: Bank[] = [
  ["044", "Access Bank"], ["063", "Access Bank (Diamond)"], ["035A", "ALAT by WEMA"], ["401", "ASO Savings and Loans"], ["023", "Citibank Nigeria"], ["559", "Coronation Merchant Bank"], ["050", "Ecobank Nigeria"], ["562", "Ekondo Microfinance Bank"],
  ["070", "Fidelity Bank"], ["011", "First Bank of Nigeria"], ["214", "First City Monument Bank (FCMB)"], ["501", "FSDH Merchant Bank"], ["00103", "Globus Bank"], ["058", "Guaranty Trust Bank (GTBank)"], ["030", "Heritage Bank"], ["301", "Jaiz Bank"],
  ["082", "Keystone Bank"], ["50211", "Kuda Microfinance Bank"], ["90052", "Lagos Building Investment Company"], ["000029", "Lotus Bank"], ["50515", "Moniepoint Microfinance Bank"], ["076", "Polaris Bank"], ["101", "Providus Bank"], ["125", "Rubies Microfinance Bank"],
  ["51310", "Sparkle Microfinance Bank"], ["221", "Stanbic IBTC Bank"], ["068", "Standard Chartered Bank"], ["232", "Sterling Bank"], ["100", "SunTrust Bank"], ["302", "TAJ Bank"], ["000025", "Titan Trust Bank"], ["032", "Union Bank of Nigeria"],
  ["033", "United Bank for Africa (UBA)"], ["215", "Unity Bank"], ["566", "VFD Microfinance Bank"], ["035", "Wema Bank"], ["057", "Zenith Bank"],
  ["999992", "OPay"], ["999991", "PalmPay"], ["565", "Carbon"], ["327", "Paga"], ["104", "Parallex Bank"], ["000031", "PremiumTrust Bank"], ["000036", "Optimus Bank"], ["51269", "Tangerine Money"], ["50126", "Eyowo"], ["51318", "FairMoney Microfinance Bank"],
  ["50746", "Mint (Mint Finex MFB)"], ["50457", "Fina Trust Microfinance Bank"], ["50383", "Ibile Microfinance Bank"], ["50801", "TruAlliance"], ["51251", "Hope PSB"], ["120001", "9mobile 9Payment Service Bank"], ["120002", "HopePSB"], ["120003", "MTN Momo PSB"], ["120004", "Airtel Smartcash PSB"],
].map(([code, name]) => ({ code, name }));
export const searchBanks = (list: Bank[], q: string) => { const s = q.trim().toLowerCase(); return s ? list.filter((b) => b.name.toLowerCase().includes(s) || b.code.includes(s)) : list; };
