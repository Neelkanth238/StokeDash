import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const result = await yahooFinance.search('^BSESN', { newsCount: 20 });
    console.log(result.news?.length || 0);
  } catch (e) {
    console.error(e.message);
  }
}

test();
