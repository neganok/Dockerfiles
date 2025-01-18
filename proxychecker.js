const axios = require('axios');
const fs = require('fs');
const path = require('path');

const PROXY_SOURCES = [
    'https://api.openproxylist.xyz/http.txt',
    'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http',
    'https://api.proxyscrape.com/v2/?request=getproxies&protocol=https',
    'https://proxyspace.pro/http.txt',
    'https://proxyspace.pro/https.txt',
    'https://raw.githubusercontent.com/AGDDoS/AGProxy/master/proxies/http.txt',
    'https://raw.githubusercontent.com/ALIILAPRO/Proxy/main/http.txt',
    'https://raw.githubusercontent.com/andigwandi/free-proxy/main/proxy_list.txt',
    'https://raw.githubusercontent.com/Anonym0usWork1221/Free-Proxies/main/proxy_files/http_proxies.txt',
    'https://raw.githubusercontent.com/Anonym0usWork1221/Free-Proxies/main/proxy_files/https_proxies.txt',
    'https://raw.githubusercontent.com/aslisk/proxyhttps/main/https.txt',
    'https://raw.githubusercontent.com/elliottophellia/yakumo/master/results/http/global/http_checked.txt',
    'https://raw.githubusercontent.com/ErcinDedeoglu/proxies/main/proxies/http.txt',
    'https://raw.githubusercontent.com/ErcinDedeoglu/proxies/main/proxies/https.txt',
    'https://raw.githubusercontent.com/hendrikbgr/Free-Proxy-Repo/master/proxy_list.txt',
    'https://raw.githubusercontent.com/im-razvan/proxy_list/main/http.txt',
    'https://raw.githubusercontent.com/KUTlime/ProxyList/main/ProxyList.txt',
    'https://raw.githubusercontent.com/mmpx12/proxy-list/master/http.txt',
    'https://raw.githubusercontent.com/mmpx12/proxy-list/master/https.txt',
    'https://raw.githubusercontent.com/MrMarble/proxy-list/main/all.txt',
    'https://raw.githubusercontent.com/noarche/proxylist-socks5-sock4-exported-updates/main/http-online.txt',
    'https://raw.githubusercontent.com/ObcbO/getproxy/master/file/http.txt',
    'https://raw.githubusercontent.com/ObcbO/getproxy/master/file/https.txt',
    'https://raw.githubusercontent.com/officialputuid/KangProxy/KangProxy/http/http.txt',
    'https://raw.githubusercontent.com/officialputuid/KangProxy/KangProxy/https/https.txt',
    'https://raw.githubusercontent.com/r00tee/Proxy-List/main/Https.txt',
    'https://raw.githubusercontent.com/roosterkid/openproxylist/main/HTTPS_RAW.txt',
    'https://raw.githubusercontent.com/Sage520/Proxy-List/main/http.txt',
    'https://raw.githubusercontent.com/saisuiu/Lionkings-Http-Proxys-Proxies/main/free.txt',
    'https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/generated/http_proxies.txt',
    'https://raw.githubusercontent.com/themiralay/Proxy-List-World/master/data.txt',
    'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
    'https://raw.githubusercontent.com/Tsprnay/Proxy-lists/master/proxies/http.txt',
    'https://raw.githubusercontent.com/Tsprnay/Proxy-lists/master/proxies/https.txt',
    'https://raw.githubusercontent.com/tuanminpay/live-proxy/master/http.txt',
    'https://raw.githubusercontent.com/vakhov/fresh-proxy-list/master/http.txt',
    'https://raw.githubusercontent.com/vakhov/fresh-proxy-list/master/https.txt',
    'https://raw.githubusercontent.com/Vann-Dev/proxy-list/main/proxies/http.txt',
    'https://raw.githubusercontent.com/Vann-Dev/proxy-list/main/proxies/https.txt',
    'https://raw.githubusercontent.com/Zaeem20/FREE_PROXIES_LIST/master/http.txt',
    'https://raw.githubusercontent.com/Zaeem20/FREE_PROXIES_LIST/master/https.txt',
    'https://raw.githubusercontent.com/zevtyardt/proxy-list/main/http.txt',
    'https://raw.githubusercontent.com/zloi-user/hideip.me/main/http.txt',
    'https://raw.githubusercontent.com/zloi-user/hideip.me/main/https.txt',

];

const AWS_ASNS = [16509, 14618, 7224];
const GOOGLE_URL = 'http://google.com'; // Use only Google for checking
const API_KEY = '0238e679e664710f'; // Replace with your actual API key
const OUTPUT_PATH = path.join('/var/www/html', 'proxy.txt');

let totalFetched = 0;
let totalValid = 0;
let totalSkippedAWS = 0;
let totalDeadProxies = 0;

// Check for debug argument
const isDebugMode = process.argv.includes('-debug');

async function fetchProxies() {
    const proxies = [];
    const fetchPromises = PROXY_SOURCES.map(async (source) => {
        try {
            const response = await axios.get(source);
            const proxyList = response.data.split('\n').filter(Boolean);
            proxies.push(...proxyList);
            totalFetched += proxyList.length;
        } catch (error) {
            console.error(`Error fetching from ${source}: ${error.message}`);
        }
    });

    await Promise.all(fetchPromises);
    return proxies;
}

async function checkProxy(proxy) {
    const [ip, port] = proxy.split(':');

    try {
        const response = await axios.get(GOOGLE_URL, {
            proxy: {
                host: ip,
                port: parseInt(port),
            },
            timeout: 10000,
        });

        if (response.status === 200) {
            const geoResponse = await axios.get(`https://api.ipapi.is/?q=${ip}&key=${API_KEY}`);
            const asn = geoResponse.data.asn.asn;

            if (!AWS_ASNS.includes(asn)) {
                totalValid++;
                return proxy; // Return valid proxy
            } else {
                totalSkippedAWS++;
                console.log(`\x1b[31mAWS DETECTED: ${proxy}\x1b[0m`);
            }
        } else {
            totalDeadProxies++;
            if (isDebugMode) {
                console.log(`Proxy ${proxy} failed with status: ${response.status}`);
            }
        }
    } catch (error) {
        totalDeadProxies++;
        if (isDebugMode) {
            console.log(`Proxy ${proxy} error: ${error.message}`);
        }
        try {
            const geoResponse = await axios.get(`https://api.ipapi.is/?q=${ip}&key=${API_KEY}`);
            const asn = geoResponse.data.asn.asn;

            if (AWS_ASNS.includes(asn)) {
                console.log(`\x1b[31mAWS DETECTED: ${proxy}\x1b[0m`);
            } else if (isDebugMode) {
                console.log(`Proxy ${proxy} is dead, ASN: ${asn}`);
            }
        } catch (geoError) {
            totalDeadProxies++;
            if (isDebugMode) {
                console.log(`Failed to fetch ASN for proxy ${proxy}: ${geoError.message}`);
            }
        }
    }

    return null; // Return null for invalid proxies
}

async function saveProxies(validProxies) {
    const output = validProxies.join('\n');
    fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
    fs.writeFileSync('proxy.txt', output, 'utf8');
}

async function main() {
    const proxies = await fetchProxies();
    const validProxies = [];

    const maxConcurrentChecks = 10000;
    const checkPromises = [];

    for (const proxy of proxies) {
        checkPromises.push(checkProxy(proxy).then(validProxy => {
            if (validProxy) {
                validProxies.push(validProxy);
            }
            console.log(`Total fetched: ${totalFetched}, Valid proxies: ${totalValid}, AWS skipped: ${totalSkippedAWS}, Dead proxies: ${totalDeadProxies}`);
        }));

        if (checkPromises.length >= maxConcurrentChecks) {
            await Promise.all(checkPromises);
            checkPromises.length = 0;
        }
    }

    await Promise.all(checkPromises);
    await saveProxies(validProxies);
    console.log('Proxy collection completed.');
}

// Run the main function every 24 hours (86400000 ms)
setInterval(() => {
    main().catch(error => console.error(`Error: ${error.message}`));
}, 86400000);


// Initial run
main().catch(error => console.error(`Error: ${error.message}`));