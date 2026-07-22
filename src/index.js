/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import puppeteer from '@cloudflare/puppeteer';

export default {
	async fetch(request, env, ctx) {
		const { searchParams } = new URL(request.url);
		const url = searchParams.get('url');

		if (!url) {
			return new Response('Missing url', { status: 400 });
		}

		let browser;
		let page;

		try {
			browser = await puppeteer.launch(env.MY_BROWSER);
			page = await browser.newPage();

			await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
			await Promise.any([
				page.waitForSelector('article', { timeout: 5000 }),
				page.waitForSelector('main', { timeout: 5000 }),
				page.waitForSelector('.post-content', { timeout: 5000 }),
				page.waitForSelector('.entry-content', { timeout: 5000 }),
				page.waitForSelector('#content', { timeout: 5000 }),
			]).catch(() => {});

			const html = await page.content();

			return new Response(html, {
				headers: {
					'content-type': 'text/html; charset=utf-8',
				},
			});
		} catch (err) {
			console.error(err);
			return new Response(err.stack ?? err.message, { status: 500 });
		} finally {
			if (page) await page.close();
			if (browser) await browser.close();
		}
	},
};
