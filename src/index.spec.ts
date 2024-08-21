import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import type { fetchUtils } from 'ra-core';
import restClient from './index';

describe('Data Simple REST Client', () => {
	describe('getList', () => {
		it('should include the `Range` header in request (for Chrome compatibility purpose)', async () => {
			const httpClient = mock.fn<typeof fetchUtils.fetchJson>(() =>
				Promise.resolve({
					status: 200,
					body: '',
					headers: new Headers({
						'content-range': '0/4-8',
					}),
					json: {},
				}),
			);
			const client = restClient('http://localhost:3000', httpClient);

			await client.getList('posts', {
				filter: {},
				pagination: {
					page: 1,
					perPage: 10,
				},
				sort: {
					field: 'title',
					order: 'DESC',
				},
			});

			const call = httpClient.mock.calls[0];
			assert.deepStrictEqual(call.arguments, [
				'http://localhost:3000/posts?filter=%7B%7D&range=%5B0%2C9%5D&sort=%5B%22title%22%2C%22DESC%22%5D',
				{
					headers: new Headers({
						Range: 'posts=0-9',
					}),
				},
			]);
		});

		it('should use a custom http header to retrieve the number of items in the collection', async () => {
			const httpClient = mock.fn<typeof fetchUtils.fetchJson>(() =>
				Promise.resolve({
					headers: new Headers({
						'x-total-count': '42',
					}),
					json: [{ id: 1 }],
					status: 200,
					body: '',
				}),
			);
			const client = restClient(
				'http://localhost:3000',
				httpClient,
				'X-Total-Count',
			);

			const result = await client.getList('posts', {
				filter: {},
				pagination: {
					page: 1,
					perPage: 10,
				},
				sort: {
					field: 'title',
					order: 'DESC',
				},
			});

			assert.strictEqual(result.total, 42);
		});
	});
	describe('delete', () => {
		it('should set the `Content-Type` header to `text/plain`', async () => {
			const httpClient = mock.fn<typeof fetchUtils.fetchJson>(() =>
				Promise.resolve({
					status: 200,
					body: '',
					headers: new Headers(),
					json: { id: 1 },
				}),
			);

			const client = restClient('http://localhost:3000', httpClient);

			await client.delete('posts', {
				id: 1,
				previousData: { id: 1 },
			});

			const call = httpClient.mock.calls[0];
			assert.deepStrictEqual(call.arguments, [
				'http://localhost:3000/posts/1',
				{
					method: 'DELETE',
					headers: new Headers({
						'Content-Type': 'text/plain',
					}),
				},
			]);
		});
	});
	describe('deleteMany', () => {
		it('should set the `Content-Type` header to `text/plain`', async () => {
			const httpClient = mock.fn<typeof fetchUtils.fetchJson>(() =>
				Promise.resolve({
					status: 200,
					body: '',
					headers: new Headers(),
					json: { id: 1 },
				}),
			);

			const client = restClient('http://localhost:3000', httpClient);

			await client.deleteMany('posts', {
				ids: [1, 2],
			});

			const call1 = httpClient.mock.calls[0];
			assert.deepStrictEqual(call1.arguments, [
				'http://localhost:3000/posts/1',
				{
					method: 'DELETE',
					headers: new Headers({
						'Content-Type': 'text/plain',
					}),
				},
			]);

			const call2 = httpClient.mock.calls[1];
			assert.deepStrictEqual(call2.arguments, [
				'http://localhost:3000/posts/2',
				{
					method: 'DELETE',
					headers: new Headers({
						'Content-Type': 'text/plain',
					}),
				},
			]);
		});
	});
});
