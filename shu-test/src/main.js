import { PuppeteerCrawler, resolveBaseUrlForEnqueueLinksFiltering } from '@crawlee/puppeteer'; //**1
import { RequestQueue } from 'crawlee'; //**2
import { writeFile, mkdir } from 'fs/promises';

const myRequestQueue = await RequestQueue.open(); // Alternative for RequestQueue is RequestList
const tests = [
    'alpha test', // Not providing selectors should use defaults
    'bravo test', // Testing with incorrect selectors but should fallback to defaults
    'charlie test', // Incorrect selectors and turned off defaults, but findAllSelectors should try find all selectors
    //'delta test',
    //'echo test'
];
const urls = [
    'https://www.saucedemo.com/',
    'https://practicetestautomation.com/practice-test-login/',
    'https://www.chess.com/login_and_go?returnUrl=https://www.chess.com/',
];
const allRequests = [];
let requestId = 1;
for (const url of urls) {
    for (const str of tests) {
        allRequests.push({
            url,
            uniqueKey: `${url}-${str}-${Date.now()}`, // Unique fragment to avoid duplicate URLs
            userData: { testType: str },
        });
    }
}
await myRequestQueue.addRequests(allRequests);
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
            log.info(`Processing URL: ${request.url}`);
            const title = await page.title();
            log.info(`Page title: ${title}`);
            let result;
            
            // credentials based on URL
            let baseLoginConfig;
            if (request.loadedUrl && request.loadedUrl.includes('saucedemo.com')) {
                baseLoginConfig = {
                    username: 'standard_user',
                    password: 'secret_sauce',
                };
            } else if (request.loadedUrl && request.loadedUrl.includes('practice-test-login')) {
                baseLoginConfig = {
                    username: 'student',
                    password: 'Password123',
                };
            }
            //testing
            if (request.userData?.testType === tests[0]) { // Alpha test
                // Not providing selectors should use defaults
                result = await login(baseLoginConfig);
                
            } else if (request.userData?.testType === tests[1]) { // Bravo test
                // Testing with incorrect selectors but should fallback to defaults
                result = await login({
                    ...baseLoginConfig,
                    selectors: {
                        usernameSelector: '[name="wrong"]',
                        passwordSelector: '#wrong',
                        submitButtonSelector: '#wrong',
                    },
                }, { useDefaults: true });
                
            } else if (request.userData?.testType === tests[2]) { // Charlie test
                // Incorrect selector, turned off defaults, but findAllSelectors should try find all selectors
                // Also testing login failure detection
                result = await login({
                    ...baseLoginConfig,
                    selectors: {
                        usernameSelector: '[name="wrong"]',
                        passwordSelector: '[type="password"]', //Correct selector should be returned
                        submitButtonSelector: '#wrong',
                    },
                }, { findAllSelectors: true });
            } else if (request.userData?.testType === 'delta test') {
                // Dunno yet
                result = await login({
                    ...baseLoginConfig // dunno yet
                });
            }
            //
            if (result) {
                log.info(`Completed testing ${request.userData?.testType} on ${title}`);
                log.info(`Login success: ${result.success}, LoginType: ${result.loginType}, Message: ${result.message}`);
                if (result.redirectUrl) {
                    log.info(`URL after login: ${result.redirectUrl}`);
                }
                if (result.selectorsUsed) {
                    log.info(`Selectors used: ${JSON.stringify(result.selectorsUsed)}`);
                }
            } else {
                log.error(`❌ No test logic matched for: ${request.userData?.testType} on ${title}`);
            }
            
            log.debug(`Login result for ${request.url}: ${JSON.stringify(result)}`);
            // Write results and debug to a file
            const safeTitle = title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
            const safeTest = (request.userData?.testType || 'unknown').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
            const dirPath = new URL('./shu-testing', import.meta.url).pathname;
            const filePath = `${dirPath}/${safeTitle}__${safeTest}.log`;
            await mkdir(dirPath, { recursive: true });
            const resultLines = [
                `Request ID: ${request.id}`,
                `Login result for ${request.url}:`,
                `Input: ${JSON.stringify({
                    username: result?.input?.username ?? '',
                    password: result?.input?.password ?? '',
                    selectors: result?.input?.selectors ?? {},
                })}`,
                ...Object.entries(result).map(([key, value]) => `${key}: ${JSON.stringify(value)}`),
            ];
            resultLines.push('Debug messages:');
            if (result.debugLogs && Array.isArray(result.debugLogs)) {
                resultLines.push(...result.debugLogs.map((log) => log));
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
