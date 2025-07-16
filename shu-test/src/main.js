import { PuppeteerCrawler } from '@crawlee/puppeteer'; //**1
import { RequestQueue } from 'crawlee'; //**2

const myRequestQueue = await RequestQueue.open(); // Alternative for RequestQueue is RequestList
//await myRequestQueue.addRequest({ url: 'https://crawlee.dev' });
await myRequestQueue.addRequests([
    { url: 'https://www.google.com' },
    //{ url: 'https://www.elcamino.instructure.com' },
    { url: 'https://www.youtube.com' },
]);

const crawler = new PuppeteerCrawler(
    {
        requestQueue: myRequestQueue, // requestQueue dictates what URLs will be crawled
        maxRequestsPerCrawl: 20,
        // Controls browser launch (in **4)
        launchContext: {
            launchOptions: {
                headless: true,
                args: ['--no-sandbox'],
            },
        },
        //requestHandler(in **4) uses input **5
        requestHandler: async ({ request, page, response, log, crawler, login }) => {
            // Available options **4
            log.info(`Processing URL: ${request.url}`);
            const title = await page.title();
            log.info(`Page title: ${title}`);

            const result1 = await login({
                username: 'user@example.com',
                password: 'password123',
            });
            const result2 = await login({
                username: 'hello',
                password: 'whatever',
                selectors: {
                    usernameSelector: '#username',
                    passwordSelector: '#password',
                    submitButtonSelector: '#submit',
                },
            });
        },
    }, // Can add config here for any crawler **3
);
await crawler.run();

/*
 **1 PuppeteerCrawler class: https://crawlee.dev/js/api/puppeteer-crawler/class/PuppeteerCrawler
 **2 RequestQueue class: https://crawlee.dev/js/api/core/class/RequestQueue
 **3 Config class: https://crawlee.dev/js/api/core/class/Configuration
 **4 PuppeteerCrawlerOptions: https://crawlee.dev/js/api/puppeteer-crawler/interface/PuppeteerCrawlerOptions
 **5 BrowserCrawlingContext: https://crawlee.dev/js/api/browser-crawler/interface/BrowserCrawlingContext
 **
 */

//Important function locations:
// /workspaces/crawlee/packages/basic-crawler/src/internals/basic-crawler.ts
// requestHandler definition: line 148
// Run by _runRequestHandler: line 1250
// _runTaskFunction processes requests: line 1420
// /workspaces/crawlee/packages/puppeteer-crawler/src/internals/puppeteer-crawler.ts
// Puppeteer's runRequestHandler: line 184
// /workspaces/crawlee/packages/core/src/crawlers/crawler_commons.ts
// CrawlingContext interface: line 111
// RestrictedCrawlingContext(Parent of CrawlingContext): line 30
