import { PuppeteerCrawler } from '@crawlee/puppeteer'; //**1
import { RequestQueue } from 'crawlee'; //**2
import { writeFile } from 'fs/promises';
import { basename } from 'path';

const myRequestQueue = await RequestQueue.open(); // Alternative for RequestQueue is RequestList
await myRequestQueue.addRequests([
    { url: 'https://www.saucedemo.com/' },
    { url: 'https://practicetestautomation.com/practice-test-login/' },
    //{ url: 'https://automationexercise.com/login' },
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

            let result;
            if (request.loadedUrl && request.loadedUrl.includes('saucedemo.com')) {
                result = await login({
                    username: 'standard_user',
                    password: 'secret_sauce',
                });
            } else {
                result = await login({
                    username: 'student',
                    password: 'Password123',
                    selectors: {
                        usernameSelector: '#wrong',
                        passwordSelector: '#wrong',
                        submitButtonSelector: '#wrong',
                    },
                });
            }
            log.debug(`Login result for ${request.url}: ${JSON.stringify(result)}`);
            // Write results and debug to a file
            const safeFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filePath = `./${safeFilename}.log`;
            const resultLines = [
                `Login result for ${request.url}:`,
                ...Object.entries(result).map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            ];
            resultLines.push('Debug messages:');
            if (result.debugLogs && Array.isArray(result.debugLogs)) {
                resultLines.push(...result.debugLogs.map(log => log));
            }
            await writeFile(filePath, resultLines.join('\n') + '\n', 'utf8');
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
