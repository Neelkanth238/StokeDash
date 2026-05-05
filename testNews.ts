import yahooFinance from 'yahoo-finance2';

let yfInstance = (yahooFinance as any).default || yahooFinance;
if (typeof yfInstance === 'function') {
  yfInstance = new yfInstance();
} else if (yfInstance.YahooFinance && !yfInstance.quote) {
  yfInstance = new yfInstance.YahooFinance();
}
const yf: any = yfInstance;

async function test() {
  try {
    const result = await yf.search('^BSESN', { newsCount: 20 });
    console.log(result?.news?.length || 0);
  } catch (e: any) {
    console.error(e?.message || e);
  }
}

test();
